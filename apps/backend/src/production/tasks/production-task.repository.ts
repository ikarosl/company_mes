import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  BatchStepStatus,
  CreateProductionTaskPayload,
  DispatchTaskPayload,
  UpdateBatchStepRecordPayload,
  UpdateProductionBatchPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import { execute, query } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  BatchStepRecordListRow,
  CountRow,
  ProductionTaskListRow,
  TaskMaterialRequirementRow,
  WorkerTaskListRow,
} from '../production.types.js';
import {
  decimalNumber,
  decimalString,
  formatDate,
  mapBatchStepRecord,
  mapProductionBatch,
  mapTaskMaterialRequirement,
  mapWorkerTask,
  normalizeDate,
  normalizeDateTime,
  normalizeOptionalString,
  nullableId,
  readDecimal,
  readNullableDecimal,
  readPositiveId,
} from '../production.utils.js';

export interface ProductionTaskFilters {
  keyword?: string;
  productId?: string;
  status?: string;
  ownerId?: string;
}

const STEP_STATUSES = new Set<BatchStepStatus>([
  'pending',
  'doing',
  'completed',
  'abnormal',
  'skipped',
]);

@Injectable()
export class ProductionTaskRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  async listTasks(filters: ProductionTaskFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      WHERE ${where}
    `,
      params,
    );
    // 同一查询汇总工序派工、物料需求、预留和领用数量，供任务列表独立展示状态。
    const rows = await this.database.query<ProductionTaskListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        wo.order_no,
        b.batch_no,
        wo.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT sr.id) AS step_count,
        -- 异常报工是提醒型终态：合格数量继续流转，因此进度统计与完工状态同口径。
        SUM(CASE WHEN sr.status IN ('completed', 'abnormal') THEN 1 ELSE 0 END) AS finished_step_count,
        COUNT(DISTINCT CASE WHEN sr.responsible_user_id IS NOT NULL THEN sr.id END) AS assigned_step_count,
        (
          SELECT COUNT(*) FROM batch_material_requirement requirement
          WHERE requirement.batch_id = b.id AND requirement.is_deleted = 0
        ) AS material_requirement_count,
        (
          SELECT COUNT(*) FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = b.id AND allocation.reserved_quantity > 0
        ) AS assigned_material_count,
        (
          SELECT COUNT(*) FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = b.id AND allocation.used_quantity >= allocation.required_quantity
        ) AS used_material_count
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      LEFT JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      WHERE ${where}
      GROUP BY b.id, b.work_order_id, wo.order_no, b.batch_no, wo.product_id, p.product_model, p.product_name,
        b.route_id, r.route_name, b.planned_quantity, b.status, b.owner_id, u.display_name, b.plan_start_date,
        b.plan_end_date, b.remark, b.created_at, b.updated_at
      ORDER BY b.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProductionBatch), Number(totalRow?.total ?? 0), pagination);
  }

  async getTask(id: number) {
    const task = await this.getTaskListItem(id);
    return {
      ...task,
      steps: await this.listStepRecords(id),
      materialRequirements: await this.listMaterialRequirements(id),
    };
  }

  async listExecutionRecords(
    filters: Pick<ProductionTaskFilters, 'keyword' | 'status'>,
    pagination: PaginationOptions,
  ) {
    const page = await this.listTasks(filters, pagination);
    const items = await Promise.all(page.items.map((task) => this.getTask(Number(task.id))));

    return {
      ...page,
      items,
    };
  }

  async listTasksForWorker(
    userId: string,
    filters: ProductionTaskFilters,
    pagination: PaginationOptions,
  ) {
    const { where, params } = this.buildListFilters({ ...filters, status: undefined });
    const userIdNumber = Number(userId);
    const stepStatus = filters.status?.trim();

    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      INNER JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      WHERE ${where}
        AND b.status = 'doing'
        AND sr.responsible_user_id = ?
        ${stepStatus ? 'AND sr.status = ?' : ''}
    `,
      stepStatus ? [...params, userIdNumber, stepStatus] : [...params, userIdNumber],
    );

    const rows = await this.database.query<WorkerTaskListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        wo.order_no,
        b.batch_no,
        wo.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT all_sr.id) AS step_count,
        -- 异常只保留风险提醒，不阻断合格数量进入后续工序。
        SUM(CASE WHEN all_sr.status IN ('completed', 'abnormal') THEN 1 ELSE 0 END) AS finished_step_count,
        sr.id AS step_record_id,
        sr.process_route_steps_id,
        prs.step_order,
        ps.step_name,
        sr.status AS step_status,
        CASE
          WHEN sr.status <> 'pending' THEN 0
          WHEN prs.step_order = 1 THEN 1
          WHEN (
            SELECT previous_sr.status
            FROM batch_step_records previous_sr
            INNER JOIN process_route_steps previous_prs
              ON previous_prs.id = previous_sr.process_route_steps_id
              AND previous_prs.is_deleted = 0
            WHERE previous_sr.batch_id = b.id
              AND previous_sr.is_deleted = 0
              AND previous_prs.step_order < prs.step_order
            ORDER BY previous_prs.step_order DESC, previous_sr.id DESC
            LIMIT 1
          ) IN ('completed', 'abnormal') THEN 1
          ELSE 0
        END AS can_start,
        sr.started_at AS step_started_at,
        sr.completed_at AS step_completed_at,
        sr.output_quantity,
        sr.return_quantity,
        sr.abnormal_quantity,
        sr.responsible_user_id,
        ru.display_name AS responsible_user_name
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      INNER JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      INNER JOIN process_route_steps prs ON prs.id = sr.process_route_steps_id AND prs.is_deleted = 0
      INNER JOIN process_steps ps ON ps.id = prs.process_step_id AND ps.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      LEFT JOIN users ru ON ru.id = sr.responsible_user_id
      LEFT JOIN batch_step_records all_sr ON all_sr.batch_id = b.id AND all_sr.is_deleted = 0
      WHERE ${where}
        AND b.status = 'doing'
        AND sr.responsible_user_id = ?
        ${stepStatus ? 'AND sr.status = ?' : ''}
      GROUP BY b.id, b.work_order_id, wo.order_no, b.batch_no, wo.product_id, p.product_model, p.product_name,
        b.route_id, r.route_name, b.planned_quantity, b.status, b.owner_id, u.display_name, b.plan_start_date,
        b.plan_end_date, b.remark, b.created_at, b.updated_at, sr.id, sr.process_route_steps_id, prs.step_order,
        ps.step_name, sr.status, sr.started_at, sr.completed_at, sr.output_quantity, sr.return_quantity,
        sr.abnormal_quantity, sr.responsible_user_id, ru.display_name
      ORDER BY b.id DESC, prs.step_order ASC
      LIMIT ? OFFSET ?
    `,
      stepStatus
        ? [...params, userIdNumber, stepStatus, pagination.pageSize, pagination.offset]
        : [...params, userIdNumber, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapWorkerTask), Number(totalRow?.total ?? 0), pagination);
  }

  async getTaskForWorker(id: number, userId: string) {
    await this.assertWorkerTaskAccessible(id, userId);
    return this.getTask(id);
  }

  async startTaskForWorker(id: number, userId: string) {
    await this.assertWorkerTaskAccessible(id, userId);
    return this.startTask(id);
  }

  async finishTaskForWorker(id: number, userId: string) {
    await this.assertWorkerTaskAccessible(id, userId);
    return this.finishTask(id);
  }

  async updateStepRecordForWorker(
    taskId: number,
    recordId: number,
    payload: UpdateBatchStepRecordPayload,
    userId: string,
  ) {
    const task = await this.getTaskRowForWorker(taskId, userId);
    const current = await this.getStepRecordRow(taskId, recordId);

    if (
      current.responsible_user_id !== null &&
      current.responsible_user_id !== Number(userId) &&
      task.owner_id !== Number(userId)
    ) {
      throw new BadRequestException('You are not allowed to update this step record');
    }

    return this.updateStepRecord(taskId, recordId, payload);
  }

  async createTask(payload: CreateProductionTaskPayload) {
    const orderId = readPositiveId(payload.workOrderId, 'Missing work order');
    const order = await this.getWorkOrderRow(orderId);

    if (!['released', 'doing'].includes(order.status)) {
      throw new BadRequestException('Only released or doing work orders can create tasks');
    }

    const plannedQuantity = readDecimal(payload.plannedQuantity, 'Invalid task quantity');
    const ownerId = payload.ownerId === undefined ? order.owner_id : nullableId(payload.ownerId);
    const routeId = payload.routeId === undefined ? order.route_id : nullableId(payload.routeId);
    const batchNo = normalizeOptionalString(payload.batchNo) ?? (await this.generateBatchNo());

    await this.assertUserAvailable(ownerId);
    await this.assertRouteAvailable(routeId, order.product_id);
    await this.assertBatchNoAvailable(batchNo);
    await this.assertTaskQuantityWithinOrder(orderId, decimalNumber(plannedQuantity));

    const result = await this.database.transaction(async (connection) => {
      const insertResult = (await execute(
        connection,
        `
        INSERT INTO production_batches (
          work_order_id, batch_no, route_id, planned_quantity, owner_id,
          plan_start_date, plan_end_date, remark, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
        [
          orderId,
          batchNo,
          routeId,
          plannedQuantity,
          ownerId,
          normalizeDate(payload.planStartDate) ?? formatDate(order.plan_start_date),
          normalizeDate(payload.planEndDate) ?? formatDate(order.plan_end_date),
          normalizeOptionalString(payload.remark),
        ],
      )) as ResultSetHeader;

      if (routeId !== null) {
        const routeSteps = await this.listRouteSteps(routeId);
        const assignmentMap = new Map(
          (payload.steps ?? []).map((step) => [
            Number(step.processRouteStepsId),
            {
              responsibleUserId: nullableId(step.responsibleUserId),
              sopFileId: nullableId(step.sopFileId),
            },
          ]),
        );

        for (const step of routeSteps) {
          const assignment = assignmentMap.get(step.id);
          const responsibleUserId = assignmentMap.has(step.id)
            ? (assignment?.responsibleUserId ?? null)
            : step.default_owner_id;
          const sopFileId = assignmentMap.has(step.id)
            ? (assignment?.sopFileId ?? null)
            : step.sop_file_id;
          await this.assertUserAvailable(responsibleUserId);
          await this.assertTechnicalFileAvailable(sopFileId);
          await execute(
            connection,
            `
            INSERT INTO batch_step_records (
              batch_id, process_route_steps_id,
              responsible_user_id, status, created_at, updated_at
            )
            VALUES (?, ?, ?, 'pending', NOW(), NOW())
          `,
            [insertResult.insertId, step.id, responsibleUserId],
          );
        }
      }

      return insertResult;
    });

    await this.refreshWorkOrderStatusByTasks(orderId);
    return this.getTask(result.insertId);
  }

  async previewCreateTask(
    workOrderId: number,
    routeId: number | null,
    plannedQuantity: string | number | null | undefined,
  ) {
    const order = await this.getWorkOrderRow(workOrderId);
    const resolvedRouteId = routeId ?? order.route_id;
    const previewQuantity = readDecimal(
      plannedQuantity ?? order.planned_quantity,
      'Invalid task quantity',
    );

    if (resolvedRouteId === null) {
      return {
        steps: [],
        materialRequirements: [],
      };
    }

    await this.assertRouteAvailable(resolvedRouteId, order.product_id);
    const routeSteps = await this.listRouteSteps(resolvedRouteId);
    const steps = routeSteps.map((step) =>
      mapBatchStepRecord({
        id: step.id,
        batch_id: 0,
        process_route_steps_id: step.id,
        step_order: step.step_order,
        step_name: step.process_name,
        sop_file_id: step.sop_file_id,
        responsible_user_id: step.default_owner_id,
        responsible_user_name: step.default_owner_name,
        status: 'pending',
        started_at: null,
        completed_at: null,
        output_quantity: null,
        return_quantity: null,
        abnormal_quantity: null,
        remark: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as BatchStepRecordListRow),
    );

    return {
      steps,
      materialRequirements: await this.listMaterialRequirementsByProduct(
        order.product_id,
        undefined,
        previewQuantity,
      ),
    };
  }

  async updateTask(id: number, payload: UpdateProductionBatchPayload) {
    const current = await this.getTaskRow(id);
    this.auditContext.setBeforeData(current);
    this.assertTaskConfigurable(current.status);
    const routeId = payload.routeId === undefined ? current.route_id : nullableId(payload.routeId);
    const ownerId = payload.ownerId === undefined ? current.owner_id : nullableId(payload.ownerId);
    const plannedQuantity =
      payload.plannedQuantity === undefined
        ? decimalString(current.planned_quantity)
        : readDecimal(payload.plannedQuantity, 'Invalid planned quantity');

    await this.assertRouteAvailable(routeId, current.product_id);
    await this.assertUserAvailable(ownerId);

    await this.database.transaction(async (connection) => {
      await execute(
        connection,
        `
        UPDATE production_batches
        SET route_id = ?,
          owner_id = ?,
          planned_quantity = ?,
          plan_start_date = ?,
          plan_end_date = ?,
          remark = ?,
          updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
      `,
        [
          routeId,
          ownerId,
          plannedQuantity,
          payload.planStartDate === undefined
            ? formatDate(current.plan_start_date)
            : normalizeDate(payload.planStartDate),
          payload.planEndDate === undefined
            ? formatDate(current.plan_end_date)
            : normalizeDate(payload.planEndDate),
          payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
          id,
        ],
      );

      if (routeId !== null && payload.steps !== undefined) {
        const routeSteps = await this.listRouteSteps(routeId);
        const assignmentMap = new Map(
          payload.steps.map((step) => [
            Number(step.processRouteStepsId),
            {
              responsibleUserId: nullableId(step.responsibleUserId),
              sopFileId: nullableId(step.sopFileId),
            },
          ]),
        );

        await execute(
          connection,
          'UPDATE batch_step_records SET is_deleted = 1, deleted_at = NOW() WHERE batch_id = ? AND is_deleted = 0',
          [id],
        );

        for (const step of routeSteps) {
          const assignment = assignmentMap.get(step.id);
          const responsibleUserId = assignmentMap.has(step.id)
            ? (assignment?.responsibleUserId ?? null)
            : step.default_owner_id;
          const sopFileId = assignmentMap.has(step.id)
            ? (assignment?.sopFileId ?? null)
            : step.sop_file_id;
          await this.assertUserAvailable(responsibleUserId);
          await this.assertTechnicalFileAvailable(sopFileId);
          await execute(
            connection,
            `
            INSERT INTO batch_step_records (
              batch_id, process_route_steps_id,
              responsible_user_id, status, created_at, updated_at
            )
            VALUES (?, ?, ?, 'pending', NOW(), NOW())
          `,
            [id, step.id, responsibleUserId],
          );
        }
      }

      const materialCount = await this.countBatchMaterialUsages(connection, id);
      if (materialCount > 0) {
        await this.syncBatchMaterialUsages(connection, id, current.product_id);
      }
      await execute(
        connection,
        `
        UPDATE production_batches
        SET status = CASE
            WHEN status IN ('doing', 'completed', 'cancelled') THEN status
            WHEN ? > 0 THEN 'material_pending'
            ELSE 'pending'
          END,
          updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
      `,
        [materialCount, id],
      );
    });

    const updated = await this.getTask(id);
    this.auditContext.setAfterData(updated);
    return updated;
  }

  async generateMaterialDemand(id: number) {
    const task = await this.getTaskRow(id);
    this.assertTaskConfigurable(task.status);
    await this.assertProductMaterialsConfigured(task.product_id);
    // 生成操作必须幂等：每个“生产批次 + BOM 项”只维护一条有效需求记录。
    await this.database.transaction(async (connection) => {
      await this.syncBatchMaterialUsages(connection, id, task.product_id);
    });
    const materials = await this.listMaterialRequirements(id);
    const nextStatus = materials.length ? 'material_pending' : 'pending';

    await this.database.execute(
      `
      UPDATE production_batches
      SET status = CASE WHEN status NOT IN ('doing', 'completed', 'cancelled') THEN ? ELSE status END,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [nextStatus, id],
    );

    return {
      task: await this.getTask(id),
      materials,
    };
  }

  async previewMaterialDemand(id: number) {
    const task = await this.getTaskRow(id);
    await this.assertProductMaterialsConfigured(task.product_id);
    return this.listMaterialRequirementsByProduct(
      task.product_id,
      undefined,
      task.planned_quantity,
    );
  }

  async previewDispatch(id: number) {
    const task = await this.assertTaskHasRoute(id);
    const existingRecords = await this.listStepRecords(id);

    if (existingRecords.length) {
      return existingRecords;
    }

    // 预览只读取路线工序，不写入 batch_step_records，避免用户打开弹窗即产生业务记录。
    const routeSteps = await this.listRouteSteps(task.route_id);
    return routeSteps.map((step) => {
      const row = {
        id: step.id,
        batch_id: id,
        process_route_steps_id: step.id,
        step_order: step.step_order,
        step_name: step.process_name,
        sop_file_id: step.sop_file_id,
        responsible_user_id: step.default_owner_id,
        responsible_user_name: step.default_owner_name,
        status: 'pending',
        started_at: null,
        completed_at: null,
        output_quantity: null,
        return_quantity: null,
        abnormal_quantity: null,
        remark: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as BatchStepRecordListRow;

      return mapBatchStepRecord(row);
    });
  }

  async dispatchTask(id: number, payload: DispatchTaskPayload) {
    const task = await this.assertTaskHasRoute(id);
    this.auditContext.setBeforeData(await this.getTask(id));
    this.assertTaskConfigurable(task.status);
    const routeSteps = await this.listRouteSteps(task.route_id);
    const assignmentMap = new Map(
      (payload.steps ?? []).map((step) => [
        Number(step.processRouteStepsId),
        {
          responsibleUserId: nullableId(step.responsibleUserId),
          sopFileId: nullableId(step.sopFileId),
        },
      ]),
    );

    // 派工以路线步骤为模板重建批次工序记录，确保每道工序只有一个当前负责人。
    await this.database.transaction(async (connection) => {
      // 派工以工艺路线工序为源头生成执行记录，实际负责人记录在 batch_step_records。
      await execute(
        connection,
        'UPDATE batch_step_records SET is_deleted = 1, deleted_at = NOW() WHERE batch_id = ? AND is_deleted = 0',
        [id],
      );

      for (const step of routeSteps) {
        const assignment = assignmentMap.get(step.id);
        const responsibleUserId = assignmentMap.has(step.id)
          ? (assignment?.responsibleUserId ?? null)
          : step.default_owner_id;
        const sopFileId = assignmentMap.has(step.id)
          ? (assignment?.sopFileId ?? null)
          : step.sop_file_id;
        await this.assertUserAvailable(responsibleUserId);
        await this.assertTechnicalFileAvailable(sopFileId);
        await execute(
          connection,
          `
          INSERT INTO batch_step_records (
            batch_id, process_route_steps_id,
            responsible_user_id, status, created_at, updated_at
          )
          VALUES (?, ?, ?, 'pending', NOW(), NOW())
        `,
          [id, step.id, responsibleUserId],
        );
      }

      await execute(
        connection,
        'UPDATE production_batches SET updated_at = NOW() WHERE id = ? AND is_deleted = 0',
        [id],
      );
    });

    const updated = await this.getTask(id);
    this.auditContext.setAfterData(updated);
    return updated;
  }

  async startTask(id: number) {
    this.auditContext.setBeforeData(await this.getTask(id));
    const check = await this.previewStartTask(id);
    if (!check.canStart) {
      throw new BadRequestException(check.blockers.join('；'));
    }
    await this.database.execute(
      `
      UPDATE production_batches
      SET status = 'doing',
        actual_start_at = COALESCE(actual_start_at, NOW()),
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0 AND status <> 'cancelled'
    `,
      [id],
    );

    const updated = await this.getTask(id);
    this.auditContext.setAfterData(updated);
    return updated;
  }

  async previewStartTask(id: number) {
    const task = await this.getTaskRow(id);
    // 开始生产的硬条件是“已生成需求 + 所有工序已派工”；物料未分配仅作为警告。
    const [summary] = await this.database.query<
      (RowDataPacket & {
        material_requirement_count: number;
        unallocated_material_count: number;
        partial_material_count: number;
        critical_unallocated_count: number;
        step_count: number;
        unassigned_step_count: number;
      })[]
    >(
      `
      SELECT
        (SELECT COUNT(*) FROM batch_material_requirement requirement
          WHERE requirement.batch_id = ? AND requirement.is_deleted = 0) AS material_requirement_count,
        (SELECT COUNT(*) FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = ? AND allocation.reserved_quantity = 0) AS unallocated_material_count,
        (SELECT COUNT(*) FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = ?
            AND allocation.reserved_quantity > 0
            AND allocation.reserved_quantity < allocation.required_quantity) AS partial_material_count,
        (SELECT COUNT(*)
          FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = ?
            AND allocation.is_key_material = 1
            AND allocation.reserved_quantity < allocation.required_quantity) AS critical_unallocated_count,
        (SELECT COUNT(*) FROM batch_step_records sr
          WHERE sr.batch_id = ? AND sr.is_deleted = 0) AS step_count,
        (SELECT COUNT(*) FROM batch_step_records sr
          WHERE sr.batch_id = ? AND sr.is_deleted = 0 AND sr.responsible_user_id IS NULL) AS unassigned_step_count
      `,
      [id, id, id, id, id, id],
    );
    const materialRequirementCount = Number(summary?.material_requirement_count ?? 0);
    const unallocatedMaterialCount = Number(summary?.unallocated_material_count ?? 0);
    const partialMaterialCount = Number(summary?.partial_material_count ?? 0);
    const criticalUnallocatedCount = Number(summary?.critical_unallocated_count ?? 0);
    const stepCount = Number(summary?.step_count ?? 0);
    const unassignedStepCount = Number(summary?.unassigned_step_count ?? 0);
    const blockers: string[] = [];
    const warnings: string[] = [];

    if (!['pending', 'material_pending', 'material_assigned'].includes(task.status)) {
      blockers.push(task.status === 'doing' ? '任务已经开始生产' : '当前任务状态不允许开始生产');
    }
    if (materialRequirementCount === 0) {
      blockers.push('请先生成物料需求');
    }
    if (stepCount === 0) {
      blockers.push('请先根据工艺路线完成派工');
    } else if (unassignedStepCount > 0) {
      blockers.push(`还有 ${unassignedStepCount} 道工序未指定负责人`);
    }
    if (unallocatedMaterialCount > 0) {
      warnings.push(`还有 ${unallocatedMaterialCount} 项物料未分配`);
    }
    if (partialMaterialCount > 0) {
      warnings.push(`还有 ${partialMaterialCount} 项物料仅部分分配`);
    }
    if (criticalUnallocatedCount > 0) {
      warnings.push(`其中 ${criticalUnallocatedCount} 项关键物料尚未完全分配`);
    }

    return {
      canStart: blockers.length === 0,
      blockers,
      warnings,
      materialRequirementCount,
      unallocatedMaterialCount,
      partialMaterialCount,
      criticalUnallocatedCount,
      stepCount,
      unassignedStepCount,
    };
  }

  async finishTask(id: number) {
    this.auditContext.setBeforeData(await this.getTask(id));
    await this.assertTaskStepsClosable(id);
    await this.database.execute(
      `
      UPDATE production_batches
      SET status = 'completed',
        actual_end_at = NOW(),
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0 AND status <> 'cancelled'
    `,
      [id],
    );

    const updated = await this.getTask(id);
    this.auditContext.setAfterData(updated);
    return updated;
  }

  async updateStepRecord(taskId: number, recordId: number, payload: UpdateBatchStepRecordPayload) {
    await this.getTaskRow(taskId);
    const current = await this.getStepRecordRow(taskId, recordId);
    this.auditContext.setBeforeData(current);
    const responsibleUserId =
      payload.responsibleUserId === undefined
        ? current.responsible_user_id
        : nullableId(payload.responsibleUserId);
    const sopFileId =
      payload.sopFileId === undefined ? current.sop_file_id : nullableId(payload.sopFileId);
    const status =
      payload.status === undefined
        ? readStepStatus(current.status)
        : readStepStatus(payload.status);
    /** 本次保存后的完成数量与异常数量：未提交的字段沿用数据库当前值。 */
    const outputQuantity = readNonNegativeDecimal(
      payload.outputQuantity === undefined ? current.output_quantity : payload.outputQuantity,
      '完成数量不能小于 0',
    );
    const abnormalQuantity = readNonNegativeDecimal(
      payload.abnormalQuantity === undefined ? current.abnormal_quantity : payload.abnormalQuantity,
      '异常数量不能小于 0',
    );

    assertStepStatusTransition(current.status, status);
    if (current.status === 'pending' && status === 'doing') {
      await this.assertPreviousStepCompleted(taskId, current.step_order);
    }
    await this.assertUserAvailable(responsibleUserId);
    await this.assertTechnicalFileAvailable(sopFileId);
    await this.assertStepQuantitiesWithinFlow(
      taskId,
      current.step_order,
      Number(outputQuantity),
      Number(abnormalQuantity),
    );

    await this.database.execute(
      `
      UPDATE batch_step_records
      SET responsible_user_id = ?,
        status = ?,
        started_at = ?,
        completed_at = ?,
        output_quantity = ?,
        return_quantity = ?,
        abnormal_quantity = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND batch_id = ? AND is_deleted = 0
    `,
      [
        responsibleUserId,
        status,
        payload.startedAt === undefined ? current.started_at : normalizeDateTime(payload.startedAt),
        payload.completedAt === undefined
          ? current.completed_at
          : normalizeDateTime(payload.completedAt),
        payload.outputQuantity === undefined
          ? current.output_quantity
          : outputQuantity,
        payload.returnQuantity === undefined
          ? current.return_quantity
          : readNullableDecimal(payload.returnQuantity, 'Invalid return quantity'),
        payload.abnormalQuantity === undefined
          ? current.abnormal_quantity
          : abnormalQuantity,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        recordId,
        taskId,
      ],
    );

    if (payload.sopFileId !== undefined && sopFileId !== current.sop_file_id) {
      await this.database.execute(
        `
        UPDATE process_route_steps
        SET sop_file_id = ?, updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
      `,
        [sopFileId, current.process_route_steps_id],
      );
    }

    const updatedStep = await this.getStepRecordRow(taskId, recordId);
    this.auditContext.setAfterData(updatedStep);
    return this.getTask(taskId);
  }

  async uploadStepSop(
    taskId: number,
    recordId: number,
    payload: { sopFileName: string; sopFileUrl?: string | null },
  ) {
    await this.getStepRecordRow(taskId, recordId);
    const sopFileName = normalizeOptionalString(payload.sopFileName);
    const sopFileUrl = normalizeOptionalString(payload.sopFileUrl);

    if (!sopFileName) {
      throw new BadRequestException('Missing SOP file name');
    }

    const result = (await this.database.execute(
      `
      INSERT INTO technical_files (
        file_code, file_name, file_url, file_type, version, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, 'batch_step_sop', 'V1.0', 1, '生产批次工序实际使用文件', NOW(), NOW())
    `,
      [`STEP-SOP-${Date.now()}`, sopFileName, sopFileUrl],
    )) as ResultSetHeader;

    const current = await this.getStepRecordRow(taskId, recordId);
    await this.database.execute(
      `
      UPDATE process_route_steps
      SET sop_file_id = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [result.insertId, current.process_route_steps_id],
    );

    return this.getTask(taskId);
  }

  private buildListFilters(filters: ProductionTaskFilters) {
    const clauses = ['b.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push(`(
        b.batch_no LIKE ?
        OR wo.order_no LIKE ?
        OR wo.customer_order_no LIKE ?
        OR wo.customer_name LIKE ?
        OR p.product_model LIKE ?
        OR p.product_name LIKE ?
        OR b.remark LIKE ?
        OR EXISTS (
          SELECT 1 FROM users keyword_owner
          WHERE keyword_owner.id = b.owner_id
            AND keyword_owner.deleted_at IS NULL
            AND (keyword_owner.username LIKE ? OR keyword_owner.display_name LIKE ?)
        )
        OR EXISTS (
          SELECT 1 FROM process_routes keyword_route
          WHERE keyword_route.id = b.route_id
            AND keyword_route.is_deleted = 0
            AND (keyword_route.route_code LIKE ? OR keyword_route.route_name LIKE ?)
        )
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.productId?.trim()) {
      clauses.push('wo.product_id = ?');
      params.push(Number(filters.productId));
    }

    if (filters.ownerId?.trim()) {
      clauses.push('b.owner_id = ?');
      params.push(Number(filters.ownerId));
    }

    if (filters.status?.trim()) {
      clauses.push('b.status = ?');
      params.push(filters.status.trim());
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getTaskRow(id: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        product_id: number;
        route_id: number | null;
        planned_quantity: string | number;
        owner_id: number | null;
        status: string;
        plan_start_date: Date | null;
        plan_end_date: Date | null;
        remark: string | null;
      })[]
    >(
      `
      SELECT b.id, wo.product_id, b.route_id, b.planned_quantity, b.owner_id, b.status,
        b.plan_start_date, b.plan_end_date, b.remark
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      WHERE b.id = ? AND b.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Production task not found');
    }

    return row;
  }

  private async getTaskRowForWorker(id: number, userId: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT b.owner_id
      FROM production_batches b
      WHERE b.id = ?
        AND b.is_deleted = 0
        AND (
          b.owner_id = ?
          OR EXISTS (
            SELECT 1 FROM batch_step_records sr WHERE sr.batch_id = b.id AND sr.responsible_user_id = ? AND sr.is_deleted = 0
          )
        )
      LIMIT 1
    `,
      [id, Number(userId), Number(userId)],
    );

    if (!row) {
      throw new NotFoundException('Production task not found');
    }

    return row;
  }

  private async assertWorkerTaskAccessible(id: number, userId: string) {
    await this.getTaskRowForWorker(id, userId);
  }

  private async getWorkOrderRow(id: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        product_id: number;
        route_id: number | null;
        planned_quantity: string | number;
        owner_id: number | null;
        status: string;
        plan_start_date: Date | null;
        plan_end_date: Date | null;
      })[]
    >(
      `
      SELECT wo.id, wo.product_id, p.default_route_id AS route_id, wo.planned_quantity, wo.owner_id,
        wo.status, wo.plan_start_date, wo.plan_end_date
      FROM work_orders wo
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      WHERE wo.id = ? AND wo.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Work order not found');
    }

    return row;
  }

  private async getTaskListItem(id: number) {
    const [row] = await this.database.query<ProductionTaskListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        wo.order_no,
        b.batch_no,
        wo.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT sr.id) AS step_count,
        -- completed 与 abnormal 都表示本工序已经报工结束，区别仅在于是否存在待处置数量。
        SUM(CASE WHEN sr.status IN ('completed', 'abnormal') THEN 1 ELSE 0 END) AS finished_step_count,
        COUNT(DISTINCT CASE WHEN sr.responsible_user_id IS NOT NULL THEN sr.id END) AS assigned_step_count,
        (
          SELECT COUNT(*) FROM batch_material_requirement requirement
          WHERE requirement.batch_id = b.id AND requirement.is_deleted = 0
        ) AS material_requirement_count,
        (
          SELECT COUNT(*) FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = b.id AND allocation.reserved_quantity > 0
        ) AS assigned_material_count,
        (
          SELECT COUNT(*) FROM v_batch_material_allocation allocation
          WHERE allocation.batch_id = b.id AND allocation.used_quantity >= allocation.required_quantity
        ) AS used_material_count
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      LEFT JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      WHERE b.id = ? AND b.is_deleted = 0
      GROUP BY b.id, b.work_order_id, wo.order_no, b.batch_no, wo.product_id, p.product_model, p.product_name,
        b.route_id, r.route_name, b.planned_quantity, b.status, b.owner_id, u.display_name, b.plan_start_date,
        b.plan_end_date, b.remark, b.created_at, b.updated_at
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Production task not found');
    }

    return mapProductionBatch(row);
  }

  private async listStepRecords(batchId: number) {
    const rows = await this.database.query<BatchStepRecordListRow[]>(
      `
      SELECT
        sr.id,
        sr.batch_id,
        sr.process_route_steps_id,
        prs.step_order,
        ps.step_name,
        COALESCE(prs.sop_file_id, ps.sop_file_id) AS sop_file_id,
        sr.responsible_user_id,
        ru.display_name AS responsible_user_name,
        sr.status,
        sr.started_at,
        sr.completed_at,
        sr.output_quantity,
        sr.return_quantity,
        sr.abnormal_quantity,
        sr.remark,
        sr.created_at,
        sr.updated_at
      FROM batch_step_records sr
      INNER JOIN process_route_steps prs ON prs.id = sr.process_route_steps_id AND prs.is_deleted = 0
      INNER JOIN process_steps ps ON ps.id = prs.process_step_id AND ps.is_deleted = 0
      LEFT JOIN users ru ON ru.id = sr.responsible_user_id
      WHERE sr.batch_id = ? AND sr.is_deleted = 0
      ORDER BY prs.step_order ASC, sr.id ASC
    `,
      [batchId],
    );

    return rows.map(mapBatchStepRecord);
  }

  private async listMaterialRequirements(batchId: number) {
    const [task] = await this.database.query<(RowDataPacket & { product_id: number })[]>(
      `
      SELECT wo.product_id, b.planned_quantity
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      WHERE b.id = ? AND b.is_deleted = 0
      LIMIT 1
      `,
      [batchId],
    );

    if (!task) {
      return [];
    }

    return this.listMaterialRequirementsByProduct(task.product_id, batchId, task.planned_quantity);
  }

  private async listMaterialRequirementsByProduct(
    productId: number,
    batchId?: number,
    plannedQuantity?: string | number,
  ) {
    const quantity = readNonNegativeDecimal(plannedQuantity ?? 0, 'Invalid planned quantity');
    const rows = await this.database.query<TaskMaterialRequirementRow[]>(
      `
      SELECT
        COALESCE(CAST(requirement.id AS CHAR), CAST(pm.id AS CHAR)) AS id,
        requirement.id AS usage_id,
        pm.id AS product_material_id,
        pm.material_product_id,
        mp.product_model AS material_model,
        mp.product_name AS material_name,
        pm.quantity_per_unit,
        COALESCE(requirement.plan_quantity, pm.quantity_per_unit * ?) AS plan_quantity,
        COALESCE(allocation.used_quantity, 0) AS used_quantity,
        pm.unit,
        pm.is_key_material,
        pm.need_batch_record
      FROM product_materials pm
      INNER JOIN products mp ON mp.id = pm.material_product_id AND mp.is_deleted = 0
      LEFT JOIN batch_material_requirement requirement
        ON requirement.product_materials_id = pm.id
        AND requirement.batch_id = ?
        AND requirement.is_deleted = 0
      LEFT JOIN v_batch_material_allocation allocation
        ON allocation.requirement_id = requirement.id
      WHERE pm.product_id = ? AND pm.is_deleted = 0
      ORDER BY pm.id ASC
    `,
      [quantity, batchId ?? 0, productId],
    );

    return rows.map(mapTaskMaterialRequirement);
  }

  private async syncBatchMaterialUsages(
    connection: PoolConnection,
    batchId: number,
    productId: number,
  ) {
    // 需求数量 = BOM 单件用量 × 批次计划数量；流水存在后保留需求快照，避免改写历史。
    await execute(
      connection,
      `
      INSERT INTO batch_material_requirement (
        batch_id, product_materials_id, material_product_id, plan_quantity, unit, demand_type, status,
        created_at, updated_at, is_deleted, deleted_by, deleted_at
      )
      SELECT
        b.id,
        pm.id,
        pm.material_product_id,
        pm.quantity_per_unit * b.planned_quantity,
        pm.unit,
        'normal',
        'normal',
        NOW(),
        NOW(),
        0,
        NULL,
        NULL
      FROM production_batches b
      INNER JOIN product_materials pm ON pm.product_id = ? AND pm.is_deleted = 0
      WHERE b.id = ? AND b.is_deleted = 0
      ON DUPLICATE KEY UPDATE
        batch_material_requirement.plan_quantity = IF(
          NOT EXISTS (
            SELECT 1 FROM batch_material_usages operation
            WHERE operation.batch_id = b.id
              AND operation.product_materials_id = pm.id
              AND operation.is_deleted = 0
          ),
          pm.quantity_per_unit * b.planned_quantity,
          batch_material_requirement.plan_quantity
        ),
        batch_material_requirement.unit = IF(
          NOT EXISTS (
            SELECT 1 FROM batch_material_usages operation
            WHERE operation.batch_id = b.id
              AND operation.product_materials_id = pm.id
              AND operation.is_deleted = 0
          ),
          pm.unit,
          batch_material_requirement.unit
        ),
        batch_material_requirement.is_deleted = 0,
        batch_material_requirement.status = 'normal',
        batch_material_requirement.deleted_by = NULL,
        batch_material_requirement.deleted_at = NULL,
        batch_material_requirement.updated_at = NOW()
    `,
      [productId, batchId],
    );

    await execute(
      connection,
      `
      UPDATE batch_material_requirement requirement
      LEFT JOIN product_materials pm
        ON pm.id = requirement.product_materials_id
        AND pm.product_id = ?
        AND pm.is_deleted = 0
      SET requirement.is_deleted = 1,
        requirement.deleted_at = NOW(),
        requirement.updated_at = NOW()
      WHERE requirement.batch_id = ?
        AND requirement.is_deleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM batch_material_usages operation
          WHERE operation.batch_id = requirement.batch_id
            AND operation.product_materials_id = requirement.product_materials_id
            AND operation.is_deleted = 0
        )
        AND pm.id IS NULL
    `,
      [productId, batchId],
    );

    const [summary] = await query<(RowDataPacket & { total: number })[]>(
      connection,
      `
      SELECT COUNT(*) AS total
      FROM batch_material_requirement
      WHERE batch_id = ? AND is_deleted = 0
    `,
      [batchId],
    );

    return Number(summary?.total ?? 0);
  }

  private async countBatchMaterialUsages(connection: PoolConnection, batchId: number) {
    const [row] = await query<(RowDataPacket & { total: number })[]>(
      connection,
      'SELECT COUNT(*) AS total FROM batch_material_requirement WHERE batch_id = ? AND is_deleted = 0',
      [batchId],
    );
    return Number(row?.total ?? 0);
  }

  private assertTaskConfigurable(status: string) {
    if (['doing', 'completed', 'cancelled'].includes(status)) {
      throw new BadRequestException('执行中、已完成或已取消的任务不能修改派工或重新生成物料需求');
    }
  }

  private async assertTaskHasRoute(id: number) {
    const task = await this.getTaskRow(id);
    if (task.route_id === null) {
      throw new BadRequestException('Please select route before this operation');
    }

    return task as typeof task & { route_id: number };
  }

  private async listRouteSteps(routeId: number) {
    const rows = await this.database.query<
      (RowDataPacket & {
        id: number;
        step_order: number;
        process_code: string;
        process_name: string;
        sop_file_id: number | null;
        default_owner_id: number | null;
        default_owner_name: string | null;
      })[]
    >(
      `
      SELECT
        prs.id,
        prs.step_order,
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        COALESCE(prs.sop_file_id, ps.sop_file_id) AS sop_file_id,
        prs.default_owner_id,
        u.display_name AS default_owner_name
      FROM process_route_steps prs
      INNER JOIN process_steps ps ON ps.id = prs.process_step_id AND ps.is_deleted = 0
      LEFT JOIN users u ON u.id = prs.default_owner_id
      WHERE prs.route_id = ? AND prs.status = 1 AND prs.is_deleted = 0
      ORDER BY prs.step_order ASC, prs.id ASC
    `,
      [routeId],
    );

    if (!rows.length) {
      throw new BadRequestException('Route has no enabled steps');
    }

    return rows;
  }

  private async getStepRecordRow(batchId: number, recordId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        process_route_steps_id: number;
        step_order: number;
        responsible_user_id: number | null;
        sop_file_id: number | null;
        status: string;
        started_at: Date | null;
        completed_at: Date | null;
        output_quantity: string | number | null;
        return_quantity: string | number | null;
        abnormal_quantity: string | number | null;
        remark: string | null;
      })[]
    >(
      `
      SELECT
        sr.id,
        sr.process_route_steps_id,
        prs.step_order,
        sr.responsible_user_id,
        COALESCE(prs.sop_file_id, ps.sop_file_id) AS sop_file_id,
        sr.status,
        sr.started_at,
        sr.completed_at,
        sr.output_quantity,
        sr.return_quantity,
        sr.abnormal_quantity,
        sr.remark
      FROM batch_step_records sr
      INNER JOIN process_route_steps prs ON prs.id = sr.process_route_steps_id AND prs.is_deleted = 0
      INNER JOIN process_steps ps ON ps.id = prs.process_step_id AND ps.is_deleted = 0
      WHERE sr.id = ? AND sr.batch_id = ? AND sr.is_deleted = 0
      LIMIT 1
    `,
      [recordId, batchId],
    );

    if (!row) {
      throw new NotFoundException('Batch step record not found');
    }

    return row;
  }

  private async assertPreviousStepCompleted(batchId: number, stepOrder: number) {
    if (stepOrder === 1) {
      return;
    }

    const [previousStep] = await this.database.query<(RowDataPacket & { status: string })[]>(
      `
      SELECT previous_sr.status
      FROM batch_step_records previous_sr
      INNER JOIN process_route_steps previous_prs
        ON previous_prs.id = previous_sr.process_route_steps_id
        AND previous_prs.is_deleted = 0
      WHERE previous_sr.batch_id = ?
        AND previous_sr.is_deleted = 0
        AND previous_prs.step_order < ?
      ORDER BY previous_prs.step_order DESC, previous_sr.id DESC
      LIMIT 1
    `,
      [batchId, stepOrder],
    );

    // 异常报工仅用于提醒待处置数量；其合格数量仍可流转，所以 abnormal 也视为前序已结束。
    if (!previousStep || !['completed', 'abnormal'].includes(previousStep.status)) {
      throw new BadRequestException('前一道工序尚未报工结束，当前工序不能开始');
    }
  }

  /**
   * 校验工序数量沿工艺路线只能持平或减少。
   * 1. 当前工序合格数量 = 完成数量 - 异常数量。
   * 2. 首道工序完成数量不能超过生产批次计划数量。
   * 3. 后续工序完成数量不能超过上一工序合格数量。
   * 4. 修正历史报工时，当前合格数量不能低于下一工序已经报工的完成数量。
   */
  private async assertStepQuantitiesWithinFlow(
    batchId: number,
    stepOrder: number,
    outputQuantity: number,
    abnormalQuantity: number,
  ) {
    if (abnormalQuantity > outputQuantity) {
      throw new BadRequestException('异常数量不能超过完成数量');
    }

    const [batch] = await this.database.query<
      (RowDataPacket & { planned_quantity: string | number })[]
    >(
      'SELECT planned_quantity FROM production_batches WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [batchId],
    );
    if (!batch) {
      throw new NotFoundException('Production task not found');
    }

    const adjacentSteps = await this.database.query<
      (RowDataPacket & {
        step_order: number;
        output_quantity: string | number | null;
        abnormal_quantity: string | number | null;
      })[]
    >(
      `
      SELECT prs.step_order, sr.output_quantity, sr.abnormal_quantity
      FROM batch_step_records sr
      INNER JOIN process_route_steps prs
        ON prs.id = sr.process_route_steps_id AND prs.is_deleted = 0
      WHERE sr.batch_id = ?
        AND sr.is_deleted = 0
        AND prs.step_order <> ?
      ORDER BY prs.step_order ASC
      `,
      [batchId, stepOrder],
    );
    // 工序顺序允许不连续，因此分别取当前顺序之前的最后一道和之后的第一道。
    const previousStep = adjacentSteps.filter((step) => step.step_order < stepOrder).at(-1);
    const nextStep = adjacentSteps.find((step) => step.step_order > stepOrder);
    // 数量上限：首道取批次计划数量，后续工序取上一工序的合格数量。
    const inputLimit = previousStep
      ? decimalNumber(previousStep.output_quantity) - decimalNumber(previousStep.abnormal_quantity)
      : decimalNumber(batch.planned_quantity);
    if (outputQuantity > inputLimit + 0.00005) {
      throw new BadRequestException(`完成数量不能超过本工序可流转数量 ${inputLimit.toFixed(4)}`);
    }

    const qualifiedQuantity = outputQuantity - abnormalQuantity;
    if (nextStep && decimalNumber(nextStep.output_quantity) > qualifiedQuantity + 0.00005) {
      throw new BadRequestException(
        `当前合格数量不能低于下一工序已报工数量 ${decimalNumber(nextStep.output_quantity).toFixed(4)}`,
      );
    }
  }

  private async assertTaskStepsClosable(batchId: number) {
    const [row] = await this.database.query<(RowDataPacket & { blocking_count: number })[]>(
      `
      SELECT COUNT(*) AS blocking_count
      FROM batch_step_records
      WHERE batch_id = ?
        AND is_deleted = 0
        AND status IN ('pending', 'doing')
    `,
      [batchId],
    );

    // 批次完工前必须确保所有工序已脱离未开工/进行中状态，避免任务提前关闭导致报工断链。
    if (Number(row?.blocking_count ?? 0) > 0) {
      throw new BadRequestException('仍有未开工或进行中的工序，不能完成生产任务');
    }
  }

  private async assertRouteAvailable(routeId: number | null, productId: number) {
    if (routeId === null) {
      return;
    }

    const [product] = await this.database.query<(RowDataPacket & { category_id: number | null })[]>(
      'SELECT category_id FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [productId],
    );
    const [route] = await this.database.query<
      (RowDataPacket & { product_category_id: number | null })[]
    >(
      'SELECT product_category_id FROM process_routes WHERE id = ? AND status = 1 AND is_deleted = 0 LIMIT 1',
      [routeId],
    );

    if (!route) {
      throw new BadRequestException('Route not found or disabled');
    }

    if (
      route.product_category_id !== null &&
      product?.category_id !== null &&
      route.product_category_id !== product?.category_id
    ) {
      throw new BadRequestException('Route product type does not match task product');
    }
  }

  private async assertUserAvailable(userId: number | null) {
    if (userId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ? AND status = 1 AND deleted_at IS NULL LIMIT 1',
      [userId],
    );

    if (!row) {
      throw new BadRequestException('Owner not found or disabled');
    }
  }

  private async assertTechnicalFileAvailable(fileId: number | null) {
    if (fileId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      'SELECT id FROM technical_files WHERE id = ? AND status = 1 AND is_deleted = 0 LIMIT 1',
      [fileId],
    );

    if (!row) {
      throw new BadRequestException('Technical file not found or disabled');
    }
  }

  private async assertProductMaterialAvailable(productMaterialId: number, productId: number) {
    const [row] = await this.database.query<RowDataPacket[]>(
      'SELECT id FROM product_materials WHERE id = ? AND product_id = ? AND is_deleted = 0 LIMIT 1',
      [productMaterialId, productId],
    );

    if (!row) {
      throw new BadRequestException('Material is not in current product BOM');
    }
  }

  private async assertProductMaterialsConfigured(productId: number) {
    const [row] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `
      SELECT COUNT(*) AS total
      FROM product_materials
      WHERE product_id = ? AND is_deleted = 0
    `,
      [productId],
    );

    if (Number(row?.total ?? 0) === 0) {
      throw new BadRequestException('当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求');
    }
  }

  private async assertBatchNoAvailable(batchNo: string, ignoredBatchId?: number) {
    const params: QueryParam[] = [batchNo];
    const ignoredClause = ignoredBatchId ? ' AND id <> ?' : '';

    if (ignoredBatchId) {
      params.push(ignoredBatchId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `SELECT id FROM production_batches WHERE batch_no = ? AND is_deleted = 0${ignoredClause} LIMIT 1`,
      params,
    );

    if (row) {
      throw new BadRequestException('Task batch no already exists');
    }
  }

  private async assertTaskQuantityWithinOrder(
    orderId: number,
    newQuantity: number,
    ignoredTaskId?: number,
  ) {
    const order = await this.getWorkOrderRow(orderId);
    const params: QueryParam[] = [orderId];
    const ignoredClause = ignoredTaskId ? ' AND id <> ?' : '';

    if (ignoredTaskId) {
      params.push(ignoredTaskId);
    }

    const [row] = await this.database.query<
      (RowDataPacket & { assigned_quantity: string | number | null })[]
    >(
      `
      SELECT COALESCE(SUM(planned_quantity), 0) AS assigned_quantity
      FROM production_batches
      WHERE work_order_id = ? AND is_deleted = 0 AND status <> 'cancelled'${ignoredClause}
    `,
      params,
    );

    if (
      decimalNumber(row?.assigned_quantity) + newQuantity >
      decimalNumber(order.planned_quantity)
    ) {
      throw new BadRequestException('Task quantity exceeds work order planned quantity');
    }
  }

  private async refreshWorkOrderStatusByTasks(orderId: number) {
    const order = await this.getWorkOrderRow(orderId);
    if (!['released', 'doing'].includes(order.status)) {
      return;
    }

    const [row] = await this.database.query<
      (RowDataPacket & { doing_count: number; completed_count: number })[]
    >(
      `
      SELECT
        SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END) AS doing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
      FROM production_batches
      WHERE work_order_id = ? AND is_deleted = 0 AND status <> 'cancelled'
    `,
      [orderId],
    );
    const nextStatus =
      Number(row?.doing_count ?? 0) > 0 || Number(row?.completed_count ?? 0) > 0
        ? 'doing'
        : 'released';

    await this.database.execute(
      'UPDATE work_orders SET status = ?, updated_at = NOW() WHERE id = ? AND is_deleted = 0',
      [nextStatus, orderId],
    );
  }

  private async generateBatchNo() {
    const today = new Date();
    const dateText = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const [row] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `
      SELECT COUNT(*) AS total
      FROM production_batches
      WHERE batch_no LIKE ? AND is_deleted = 0
    `,
      [`PB${dateText}%`],
    );

    return `PB${dateText}${String(Number(row?.total ?? 0) + 1).padStart(3, '0')}`;
  }
}

const readStepStatus = (value: string) => {
  if (!STEP_STATUSES.has(value as BatchStepStatus)) {
    throw new BadRequestException('Invalid step status');
  }

  return value as BatchStepStatus;
};

const STEP_STATUS_TRANSITIONS: Record<BatchStepStatus, BatchStepStatus[]> = {
  pending: ['pending', 'doing', 'skipped'],
  doing: ['doing', 'completed', 'abnormal'],
  completed: ['completed'],
  abnormal: ['abnormal', 'doing'],
  skipped: ['skipped'],
};

const assertStepStatusTransition = (current: string, next: BatchStepStatus) => {
  const currentStatus = readStepStatus(current);
  if (!STEP_STATUS_TRANSITIONS[currentStatus].includes(next)) {
    throw new BadRequestException('Invalid step status transition');
  }
};

const readNonNegativeDecimal = (value: string | number | null | undefined, message: string) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException(message);
  }

  return amount.toFixed(4);
};
