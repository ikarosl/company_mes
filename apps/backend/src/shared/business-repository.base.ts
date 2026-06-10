import { PERMISSIONS } from '@company/constants';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PoolConnection } from 'mysql2/promise';
import type {
  BatchStepRecordListItem,
  InspectionRecordPayload,
  ReworkRecordPayload,
  StorageShipmentRecordPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../database/database.service.js';
import { type DbExecutor, execute, nullableId, query } from './repository.helpers.js';
import {
  mapBatchMaterialUsage,
  mapBatchStepRecord,
  mapProcessStepTemplate,
  mapProductionBatch,
  mapProductionTask,
  mapTraceMaterialUsage,
} from './business.mappers.js';
import type {
  BatchMaterialUsageRow,
  BatchStatusRow,
  BatchStepRecordRow,
  BatchStockRow,
  ProcessStepTemplateRow,
  ProcessTemplateRow,
  ProductionBatchRow,
  ProductionTaskRow,
  TraceMaterialUsageRow,
} from './business.types.js';
export abstract class SharedBusinessRepositoryBase {
  constructor(protected readonly database: DatabaseService) {}
  protected async ensureProcessTemplate(id: number) {
    const [row] = await this.database.query<ProcessTemplateRow[]>(
      `
      SELECT *
      FROM process_templates
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Process template not found');
    }
  }

  protected async listProcessTemplateSteps(templateId: number) {
    const rows = await this.database.query<ProcessStepTemplateRow[]>(
      `
      SELECT *
      FROM process_step_templates
      WHERE template_id = ? AND deleted_at IS NULL
      ORDER BY step_order, id
    `,
      [templateId],
    );

    return rows.map(mapProcessStepTemplate);
  }

  protected async getProcessTemplateStep(id: number) {
    const [row] = await this.database.query<ProcessStepTemplateRow[]>(
      `
      SELECT *
      FROM process_step_templates
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Process step template not found');
    }

    return mapProcessStepTemplate(row);
  }

  protected async listBatchSteps(batchId: number) {
    const rows = await this.database.query<BatchStepRecordRow[]>(
      `
      SELECT *
      FROM batch_step_records
      WHERE batch_id = ?
      ORDER BY step_order, id
    `,
      [batchId],
    );

    return rows.map(mapBatchStepRecord);
  }

  protected async advanceBatchCurrentStep(connection: PoolConnection, batchId: number) {
    const [nextStep] = await query<BatchStepRecordRow[]>(
      connection,
      `
      SELECT *
      FROM batch_step_records
      WHERE batch_id = ? AND status NOT IN ('completed', 'closed', 'skipped')
      ORDER BY step_order, id
      LIMIT 1
    `,
      [batchId],
    );

    await execute(
      connection,
      `
      UPDATE production_batches
      SET current_step_record_id = ?,
        status = ?,
        completed_at = CASE WHEN ? IS NULL THEN NOW() ELSE completed_at END,
        updated_at = NOW()
      WHERE id = ?
    `,
      [
        nextStep ? nextStep.id : null,
        nextStep ? 'doing' : 'completed',
        nextStep ? nextStep.id : null,
        batchId,
      ],
    );
  }

  protected async assertBatchWritable(batchId: number) {
    const [batch] = await this.database.query<BatchStatusRow[]>(
      `
      SELECT id, status
      FROM production_batches
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [batchId],
    );

    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    if (batch.status === 'closed') {
      throw new BadRequestException('Closed production batches cannot be modified');
    }
  }

  protected assertStepCanBeOperatedBy(
    step: BatchStepRecordListItem,
    userId: string,
    permissions: string[],
  ) {
    const canManageStep =
      permissions.includes(PERMISSIONS.batchStepRecords.manage) ||
      permissions.includes(PERMISSIONS.productionBatches.write);
    const isAssigned = step.assignedUserIds.includes(userId);
    const isCurrentOperator = step.actualOperatorId === userId;

    if (!canManageStep && !isAssigned && !isCurrentOperator) {
      throw new ForbiddenException('Only assigned users or step managers can operate this step');
    }
  }

  protected async assertInspectionStepMatchesBatch(payload: InspectionRecordPayload) {
    if (!payload.batchStepId) {
      return;
    }

    const [step] = await this.database.query<BatchStepRecordRow[]>(
      `
      SELECT *
      FROM batch_step_records
      WHERE id = ?
      LIMIT 1
    `,
      [Number(payload.batchStepId)],
    );

    if (!step) {
      throw new NotFoundException('Batch step record not found');
    }

    if (String(step.batch_id) !== payload.batchId) {
      throw new BadRequestException('Inspection step does not belong to the selected batch');
    }
  }

  protected assertPositiveOptionalQuantity(value: number | null | undefined, message: string) {
    if (value !== null && value !== undefined && value <= 0) {
      throw new BadRequestException(message);
    }
  }

  protected async assertStorageShipmentWritable(
    payload: StorageShipmentRecordPayload,
    excludedRecordId?: number,
  ) {
    await this.assertBatchWritable(Number(payload.batchId));

    if (payload.quantity <= 0) {
      throw new BadRequestException('Storage shipment quantity must be positive');
    }

    if (!['outbound', 'shipment'].includes(payload.recordType)) {
      return;
    }

    const stockQuantity = await this.getBatchStockQuantity(
      Number(payload.batchId),
      excludedRecordId,
    );
    if (stockQuantity - payload.quantity < 0) {
      throw new BadRequestException('Storage shipment would make inventory negative');
    }
  }

  protected async getBatchStockQuantity(batchId: number, excludedRecordId?: number) {
    const params: QueryParam[] = [batchId];
    const excludedClause = excludedRecordId ? ' AND id <> ?' : '';

    if (excludedRecordId) {
      params.push(excludedRecordId);
    }

    const [row] = await this.database.query<BatchStockRow[]>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN record_type = 'inbound' THEN quantity ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN record_type IN ('outbound', 'shipment') THEN quantity ELSE 0 END), 0)
          AS stock_quantity
      FROM storage_shipment_records
      WHERE batch_id = ?${excludedClause}
    `,
      params,
    );

    return Number(row?.stock_quantity ?? 0);
  }

  protected async insertReworkRecord(executor: DbExecutor, payload: ReworkRecordPayload) {
    return execute(
      executor,
      `
      INSERT INTO rework_records (
        rework_no, batch_id, sub_batch_id, source_step_id, source_inspection_id,
        return_step_id, rework_quantity, reason, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
    `,
      [
        payload.reworkNo || `RW-${Date.now()}`,
        Number(payload.batchId),
        nullableId(payload.subBatchId),
        nullableId(payload.sourceStepId),
        nullableId(payload.sourceInspectionId),
        nullableId(payload.returnStepId),
        payload.reworkQuantity ?? null,
        payload.reason,
        payload.remark ?? null,
      ],
    );
  }

  protected async findProductionBatchListItem(id: number) {
    const [row] = await this.database.query<ProductionBatchRow[]>(
      `
      SELECT
        b.*,
        t.task_no,
        pt.template_name
      FROM production_batches b
      LEFT JOIN production_tasks t ON t.id = b.task_id AND t.deleted_at IS NULL
      LEFT JOIN process_templates pt ON pt.id = b.template_id AND pt.deleted_at IS NULL
      WHERE b.id = ? AND b.deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    return row ? mapProductionBatch(row) : null;
  }

  protected async findProductionTaskListItem(id: number) {
    const [row] = await this.database.query<ProductionTaskRow[]>(
      `
      SELECT *
      FROM production_tasks
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    return row ? mapProductionTask(row) : null;
  }

  protected async resolveBatchId(filters: { batchId?: string; batchNo?: string }) {
    if (filters.batchId) {
      return Number(filters.batchId);
    }

    if (!filters.batchNo) {
      return null;
    }

    const [row] = await this.database.query<ProductionBatchRow[]>(
      `
      SELECT *
      FROM production_batches
      WHERE batch_no = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [filters.batchNo],
    );

    return row?.id ?? null;
  }

  protected async ensureProductionBatch(id: number) {
    const batch = await this.findProductionBatchListItem(id);
    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }
  }
  protected async getBatchMaterialUsage(id: number) {
    const [row] = await this.database.query<BatchMaterialUsageRow[]>(
      `
      SELECT
        bmu.*,
        pb.batch_no,
        mb.material_batch_no,
        mb.material_name
      FROM batch_material_usages bmu
      INNER JOIN production_batches pb ON pb.id = bmu.batch_id AND pb.deleted_at IS NULL
      INNER JOIN material_batches mb ON mb.id = bmu.material_batch_id AND mb.deleted_at IS NULL
      WHERE bmu.id = ?
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Batch material usage not found');
    }

    return mapBatchMaterialUsage(row);
  }

  protected async listTraceMaterialUsagesByBatch(batchId: number) {
    const rows = await this.database.query<TraceMaterialUsageRow[]>(
      `
      SELECT
        bmu.*,
        pb.batch_no,
        mb.material_batch_no,
        mb.material_name
      FROM batch_material_usages bmu
      INNER JOIN production_batches pb ON pb.id = bmu.batch_id AND pb.deleted_at IS NULL
      INNER JOIN material_batches mb ON mb.id = bmu.material_batch_id AND mb.deleted_at IS NULL
      WHERE bmu.batch_id = ?
      ORDER BY bmu.id DESC
    `,
      [batchId],
    );

    return rows.map(mapTraceMaterialUsage);
  }
}
