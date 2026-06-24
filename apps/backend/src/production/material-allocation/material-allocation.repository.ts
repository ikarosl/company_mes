import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type {
  AllocateMaterialPayload,
  MaterialAllocationAvailableBatchItem,
  MaterialAllocationBatchItem,
  MaterialAllocationRequirementItem,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type { CountRow, ProductionBatchListRow } from '../production.types.js';
import {
  decimalNumber,
  decimalString,
  formatDate,
  mapProductionBatch,
  normalizeOptionalString,
  readDecimal,
  readPositiveId,
} from '../production.utils.js';

export interface MaterialAllocationFilters {
  keyword?: string;
  productId?: string;
  materialKeyword?: string;
  materialStatus?: string;
  shortage?: string;
  keyMaterial?: string;
}

interface RequirementRow extends RowDataPacket {
  usage_id: number;
  batch_id: number;
  product_material_id: number;
  material_product_id: number;
  material_model: string;
  material_name: string;
  quantity_per_unit: string | number;
  plan_quantity: string | number;
  reserved_quantity: string | number;
  used_quantity: string | number;
  unit: string | null;
  is_key_material: number;
  need_batch_record: number;
  material_batch_id: number | null;
  material_batch_no: string | null;
  status: string;
  remark: string | null;
}

interface AvailableBatchRow extends RowDataPacket {
  id: number;
  material_batch_no: string;
  supplier_name: string | null;
  received_date: Date | string | null;
  quantity: string | number;
  reserved_quantity: string | number;
  used_quantity: string | number;
  available_quantity: string | number;
  status: string;
}

@Injectable()
export class MaterialAllocationRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listAllocations(filters: MaterialAllocationFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildBatchFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM v_production_batch_overview b
      WHERE ${where}
    `,
      params,
    );
    const batches = await this.database.query<ProductionBatchListRow[]>(
      `
      SELECT
        b.batch_id AS id,
        b.work_order_id,
        b.order_no,
        b.batch_no,
        b.product_id,
        b.product_model,
        b.product_name,
        b.route_id,
        b.route_name,
        b.planned_quantity,
        b.batch_status AS status,
        b.owner_id,
        b.owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at
      FROM v_production_batch_overview b
      WHERE ${where}
      ORDER BY b.batch_id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    const batchIds = batches.map((batch) => batch.id);
    const requirements = batchIds.length ? await this.listRequirementRows(batchIds, filters) : [];
    const requirementsByBatchId = new Map<number, RequirementRow[]>();
    for (const row of requirements) {
      const rows = requirementsByBatchId.get(row.batch_id) ?? [];
      rows.push(row);
      requirementsByBatchId.set(row.batch_id, rows);
    }

    const items = batches.map((batch) => this.mapAllocationBatch(batch, requirementsByBatchId.get(batch.id) ?? []));
    return toPageResult(items, Number(totalRow?.total ?? 0), pagination);
  }

  async listAvailableBatches(productMaterialId: number) {
    const materialProductId = await this.getMaterialProductId(productMaterialId);
    const rows = await this.database.query<AvailableBatchRow[]>(
      `
      SELECT
        material_batch_id AS id,
        material_batch_no,
        supplier_name,
        received_date,
        stock_quantity AS quantity,
        reserved_not_used_quantity AS reserved_quantity,
        used_quantity,
        available_quantity,
        material_batch_status AS status
      FROM v_material_batch_available
      WHERE material_product_id = ? AND material_batch_status <> 'disabled'
      ORDER BY received_date ASC, material_batch_id ASC
    `,
      [materialProductId],
    );

    return rows.map((row) => this.mapAvailableBatch(row));
  }

  async allocateMaterial(batchId: number, payload: AllocateMaterialPayload) {
    const productMaterialId = readPositiveId(payload.productMaterialId, 'Missing product material');
    const materialBatchId = readPositiveId(payload.materialBatchId, 'Missing material batch');
    const reservedQuantity = readDecimal(payload.reservedQuantity, 'Invalid reserved quantity');
    const usage = await this.getDemandUsage(batchId, productMaterialId);
    const materialBatch = await this.getAvailableMaterialBatch(materialBatchId, productMaterialId);
    const currentReserved = usage.material_batch_id === materialBatchId ? decimalNumber(usage.reserved_quantity) : 0;
    const availableQuantity = decimalNumber(materialBatch.available_quantity) + currentReserved;
    const planQuantity = decimalNumber(usage.plan_quantity);

    if (decimalNumber(reservedQuantity) > planQuantity) {
      throw new BadRequestException('预留数量不能超过需求数量');
    }

    if (decimalNumber(reservedQuantity) > availableQuantity) {
      throw new BadRequestException('预留数量不能超过物料批次可用量');
    }

    await this.database.execute(
      `
      UPDATE batch_material_usages
      SET material_batch_id = ?,
        reserved_quantity = ?,
        status = 'reserved',
        recorded_at = NOW(),
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND batch_id = ? AND is_deleted = 0
    `,
      [
        materialBatchId,
        reservedQuantity,
        normalizeOptionalString(payload.remark),
        usage.id,
        batchId,
      ],
    );

    await this.refreshBatchMaterialStatus(batchId);
    return this.getAllocationBatch(batchId);
  }

  async clearAllocation(batchId: number, productMaterialId: number) {
    const usage = await this.getDemandUsage(batchId, productMaterialId);

    if (decimalNumber(usage.used_quantity) > 0) {
      throw new BadRequestException('该物料已有领用数量，不能清除分配');
    }

    await this.database.execute(
      `
      UPDATE batch_material_usages
      SET material_batch_id = NULL,
        reserved_quantity = 0,
        status = 'reserved',
        recorded_at = NULL,
        remark = NULL,
        updated_at = NOW()
      WHERE id = ? AND batch_id = ? AND is_deleted = 0
    `,
      [usage.id, batchId],
    );

    await this.refreshBatchMaterialStatus(batchId);
    return this.getAllocationBatch(batchId);
  }

  private async getAllocationBatch(batchId: number) {
    const rows = await this.database.query<ProductionBatchListRow[]>(
      `
      SELECT
        b.batch_id AS id,
        b.work_order_id,
        b.order_no,
        b.batch_no,
        b.product_id,
        b.product_model,
        b.product_name,
        b.route_id,
        b.route_name,
        b.planned_quantity,
        b.batch_status AS status,
        b.owner_id,
        b.owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at
      FROM v_production_batch_overview b
      WHERE b.batch_id = ?
      LIMIT 1
    `,
      [batchId],
    );
    const batch = rows[0];
    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    return this.mapAllocationBatch(batch, await this.listRequirementRows([batchId], {}));
  }

  private async listRequirementRows(batchIds: number[], filters: Pick<MaterialAllocationFilters, 'materialKeyword' | 'keyMaterial'>) {
    const placeholders = batchIds.map(() => '?').join(',');
    const clauses = [`allocation.batch_id IN (${placeholders})`];
    const params: QueryParam[] = [...batchIds];

    if (filters.materialKeyword?.trim()) {
      clauses.push('(allocation.material_model LIKE ? OR allocation.material_name LIKE ?)');
      const keyword = `%${filters.materialKeyword.trim()}%`;
      params.push(keyword, keyword);
    }

    if (filters.keyMaterial === '1') {
      clauses.push('allocation.is_key_material = 1');
    } else if (filters.keyMaterial === '0') {
      clauses.push('allocation.is_key_material = 0');
    }

    return this.database.query<RequirementRow[]>(
      `
      SELECT
        allocation.usage_id,
        allocation.batch_id,
        allocation.product_material_id,
        allocation.material_product_id,
        allocation.material_model,
        allocation.material_name,
        allocation.quantity_per_unit,
        allocation.required_quantity AS plan_quantity,
        allocation.reserved_quantity,
        allocation.used_quantity,
        allocation.unit,
        allocation.is_key_material,
        allocation.need_batch_record,
        allocation.material_batch_id,
        allocation.material_batch_no,
        allocation.usage_status AS status,
        allocation.remark
      FROM v_batch_material_allocation allocation
      WHERE ${clauses.join(' AND ')}
      ORDER BY allocation.batch_id DESC, allocation.is_key_material DESC, allocation.material_model ASC
    `,
      params,
    );
  }

  private mapAllocationBatch(batch: ProductionBatchListRow, rows: RequirementRow[]): MaterialAllocationBatchItem {
    const requirements = rows.map((row) => this.mapRequirement(row));
    const shortageCount = requirements.filter((item) => decimalNumber(item.unmetQuantity) > 0).length;
    const allocatedCount = requirements.filter((item) => decimalNumber(item.reservedQuantity) >= decimalNumber(item.planQuantity)).length;
    const usedCount = requirements.filter((item) => decimalNumber(item.usedQuantity) >= decimalNumber(item.planQuantity)).length;
    const materialStatus = requirements.length === 0
      ? 'missing_demand'
      : usedCount === requirements.length
        ? 'used'
        : shortageCount === 0
          ? 'allocated'
          : allocatedCount > 0
            ? 'partial'
            : 'unallocated';

    return {
      ...mapProductionBatch(batch),
      materialStatus,
      requirementCount: requirements.length,
      allocatedCount,
      shortageCount,
      requirements,
    };
  }

  private mapRequirement(row: RequirementRow): MaterialAllocationRequirementItem {
    const planQuantity = decimalNumber(row.plan_quantity);
    const reservedQuantity = decimalNumber(row.reserved_quantity);
    const usedQuantity = decimalNumber(row.used_quantity);
    const unmetQuantity = Math.max(planQuantity - reservedQuantity, 0);
    const allocationStatus = usedQuantity >= planQuantity
      ? 'used'
      : reservedQuantity >= planQuantity
        ? 'allocated'
        : reservedQuantity > 0
          ? 'partial'
          : row.status === 'cancelled'
            ? 'cancelled'
            : 'unallocated';

    return {
      id: String(row.usage_id),
      usageId: String(row.usage_id),
      batchMaterialUsageId: String(row.usage_id),
      productMaterialId: String(row.product_material_id),
      materialProductId: String(row.material_product_id),
      materialModel: row.material_model,
      materialName: row.material_name,
      quantityPerUnit: decimalString(row.quantity_per_unit),
      planQuantity: decimalString(row.plan_quantity),
      reservedQuantity: decimalString(row.reserved_quantity),
      usedQuantity: decimalString(row.used_quantity),
      unmetQuantity: unmetQuantity.toFixed(4),
      unit: row.unit,
      isKeyMaterial: row.is_key_material === 1,
      needBatchRecord: row.need_batch_record === 1,
      materialBatchId: row.material_batch_id === null ? null : String(row.material_batch_id),
      materialBatchNo: row.material_batch_no,
      availableBatchCount: 0,
      allocationStatus,
    };
  }

  private mapAvailableBatch(row: AvailableBatchRow): MaterialAllocationAvailableBatchItem {
    return {
      id: String(row.id),
      materialBatchNo: row.material_batch_no,
      supplierName: row.supplier_name,
      receivedDate: formatDate(row.received_date),
      quantity: decimalString(row.quantity),
      reservedQuantity: decimalString(row.reserved_quantity),
      usedQuantity: decimalString(row.used_quantity),
      availableQuantity: decimalString(row.available_quantity),
      status: row.status,
    };
  }

  private buildBatchFilters(filters: MaterialAllocationFilters) {
    const clauses = ["b.batch_status <> 'cancelled'"];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(b.batch_no LIKE ? OR b.order_no LIKE ? OR b.product_model LIKE ? OR b.product_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    if (filters.productId?.trim()) {
      clauses.push('b.product_id = ?');
      params.push(readPositiveId(filters.productId, 'Invalid product'));
    }

    if (filters.materialKeyword?.trim() || filters.keyMaterial === '1' || filters.keyMaterial === '0') {
      const demandClauses = ['allocation.batch_id = b.batch_id'];
      if (filters.materialKeyword?.trim()) {
        demandClauses.push('(allocation.material_model LIKE ? OR allocation.material_name LIKE ?)');
        const keyword = `%${filters.materialKeyword.trim()}%`;
        params.push(keyword, keyword);
      }
      if (filters.keyMaterial === '1') {
        demandClauses.push('allocation.is_key_material = 1');
      } else if (filters.keyMaterial === '0') {
        demandClauses.push('allocation.is_key_material = 0');
      }
      clauses.push(`
        EXISTS (
          SELECT 1
          FROM v_batch_material_allocation allocation
          WHERE ${demandClauses.join(' AND ')}
        )
      `);
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getMaterialProductId(productMaterialId: number) {
    const rows = await this.database.query<(RowDataPacket & { material_product_id: number })[]>(
      'SELECT material_product_id FROM product_materials WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [productMaterialId],
    );

    if (!rows[0]) {
      throw new NotFoundException('Product material not found');
    }

    return rows[0].material_product_id;
  }

  private async getDemandUsage(batchId: number, productMaterialId: number) {
    const rows = await this.database.query<(RequirementRow & { id: number })[]>(
      `
      SELECT
        allocation.usage_id AS id,
        allocation.usage_id,
        allocation.batch_id,
        allocation.product_material_id,
        allocation.material_product_id,
        allocation.material_model,
        allocation.material_name,
        allocation.quantity_per_unit,
        allocation.required_quantity AS plan_quantity,
        allocation.reserved_quantity,
        allocation.used_quantity,
        allocation.unit,
        allocation.is_key_material,
        allocation.need_batch_record,
        allocation.material_batch_id,
        allocation.material_batch_no,
        allocation.usage_status AS status,
        allocation.remark
      FROM v_batch_material_allocation allocation
      WHERE allocation.batch_id = ? AND allocation.product_material_id = ?
      LIMIT 1
    `,
      [batchId, productMaterialId],
    );

    if (!rows[0]) {
      throw new NotFoundException('Material demand not found');
    }

    if (decimalNumber(rows[0].used_quantity) > 0) {
      throw new BadRequestException('该物料已有领用数量，不能重新分配');
    }

    return rows[0];
  }

  private async getAvailableMaterialBatch(materialBatchId: number, productMaterialId: number) {
    const materialProductId = await this.getMaterialProductId(productMaterialId);
    const rows = await this.database.query<AvailableBatchRow[]>(
      `
      SELECT
        material_batch_id AS id,
        material_batch_no,
        supplier_name,
        received_date,
        stock_quantity AS quantity,
        reserved_not_used_quantity AS reserved_quantity,
        used_quantity,
        available_quantity,
        material_batch_status AS status
      FROM v_material_batch_available
      WHERE material_batch_id = ?
        AND material_product_id = ?
        AND material_batch_status <> 'disabled'
      LIMIT 1
    `,
      [materialBatchId, materialProductId],
    );

    if (!rows[0]) {
      throw new NotFoundException('Material batch not found');
    }

    return rows[0];
  }

  private async refreshBatchMaterialStatus(batchId: number) {
    const rows = await this.database.query<(RowDataPacket & {
      total: number;
      allocated_count: number;
    })[]>(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN reserved_quantity >= plan_quantity THEN 1 ELSE 0 END) AS allocated_count
      FROM batch_material_usages
      WHERE batch_id = ? AND is_deleted = 0
    `,
      [batchId],
    );
    const summary = rows[0];
    const total = Number(summary?.total ?? 0);
    const allocatedCount = Number(summary?.allocated_count ?? 0);
    const nextStatus = total > 0 && allocatedCount === total ? 'material_assigned' : 'material_pending';

    await this.database.execute(
      `
      UPDATE production_batches
      SET status = CASE
          WHEN status IN ('doing', 'completed', 'cancelled') THEN status
          ELSE ?
        END,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [nextStatus, batchId],
    );
  }
}
