import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type {
  AllocateMaterialPayload,
  MaterialAllocationAvailableBatchItem,
  MaterialAllocationBatchItem,
  MaterialAllocationRecordItem,
  MaterialAllocationRequirementItem,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
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

/** 单次预留流水，并附带同一需求、同一物料批次的领退料汇总。 */
interface AllocationRecordRow extends RowDataPacket {
  id: number;
  batch_id: number;
  product_material_id: number;
  material_batch_id: number;
  material_batch_no: string;
  reserved_quantity: string | number;
  issued_quantity: string | number;
  returned_quantity: string | number;
  used_quantity: string | number;
  recorded_by_name: string | null;
  recorded_at: Date;
  remark: string | null;
}

@Injectable()
export class MaterialAllocationRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

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
    const allocationRecords = batchIds.length ? await this.listAllocationRecords(batchIds) : [];
    const allocationsByRequirement = this.groupAllocationsByRequirement(allocationRecords);
    const requirementsByBatchId = new Map<number, RequirementRow[]>();
    for (const row of requirements) {
      const rows = requirementsByBatchId.get(row.batch_id) ?? [];
      rows.push(row);
      requirementsByBatchId.set(row.batch_id, rows);
    }

    const items = batches.map((batch) =>
      this.mapAllocationBatch(
        batch,
        requirementsByBatchId.get(batch.id) ?? [],
        allocationsByRequirement,
      ),
    );
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
    this.auditContext.setBeforeData(usage);
    const materialBatch = await this.getAvailableMaterialBatch(materialBatchId, productMaterialId);
    const availableQuantity = decimalNumber(materialBatch.available_quantity);
    const planQuantity = decimalNumber(usage.plan_quantity);
    const totalReserved = decimalNumber(usage.reserved_quantity);

    if (totalReserved + decimalNumber(reservedQuantity) > planQuantity) {
      throw new BadRequestException('累计预留数量不能超过需求数量');
    }

    if (decimalNumber(reservedQuantity) > availableQuantity) {
      throw new BadRequestException('预留数量不能超过物料批次可用量');
    }

    // 每次分配新增 reserve 流水；既有预留保持不变，从而支持多物料批次共同满足一个需求。
    await this.database.execute(
      `
      INSERT INTO batch_material_usages (
        batch_id, require_id, material_batch_id, reserved_quantity, product_materials_id,
        operation_type, operation_quantity, used_quantity, unit, recorded_at, remark,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'reserve', ?, 0, ?, NOW(), ?, NOW(), NOW())
      `,
      [
        batchId,
        usage.usage_id,
        materialBatchId,
        reservedQuantity,
        productMaterialId,
        reservedQuantity,
        usage.unit,
        normalizeOptionalString(payload.remark),
      ],
    );

    await this.refreshBatchMaterialStatus(batchId);
    this.auditContext.setAfterData(await this.getDemandUsage(batchId, productMaterialId));
    return this.getAllocationBatch(batchId);
  }

  async clearAllocation(batchId: number, allocationId: number) {
    const allocation = await this.getAllocationRecord(batchId, allocationId);
    this.auditContext.setBeforeData(allocation);
    if (decimalNumber(allocation.net_used_quantity) > 0) {
      throw new BadRequestException('该预留已被领料使用，不能取消');
    }

    if (decimalNumber(allocation.remaining_reserved_quantity) <= 0) {
      throw new BadRequestException('该预留已取消，无需重复取消');
    }

    // 取消分配不删除原预留记录，而是追加 unreserve 流水，保证预留与取消预留都有事实留痕。
    await this.database.execute(
      `
      INSERT INTO batch_material_usages (
        batch_id, require_id, material_batch_id, reserved_quantity, product_materials_id,
        operation_type, operation_quantity, used_quantity, unit, related_usage_id,
        recorded_at, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, 0, ?, 'unreserve', ?, 0, ?, ?, NOW(), ?, NOW(), NOW())
    `,
      [
        allocation.batch_id,
        allocation.require_id,
        allocation.material_batch_id,
        allocation.product_materials_id,
        allocation.remaining_reserved_quantity,
        allocation.unit,
        allocation.id,
        '取消物料预留',
      ],
    );

    await this.refreshBatchMaterialStatus(batchId);
    this.auditContext.setAfterData(
      await this.getDemandUsage(batchId, allocation.product_materials_id),
    );
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

    const requirementRows = await this.listRequirementRows([batchId], {});
    const allocationRows = await this.listAllocationRecords([batchId]);
    return this.mapAllocationBatch(
      batch,
      requirementRows,
      this.groupAllocationsByRequirement(allocationRows),
    );
  }

  private async listRequirementRows(
    batchIds: number[],
    filters: Pick<MaterialAllocationFilters, 'materialKeyword' | 'keyMaterial'>,
  ) {
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
        allocation.material_status AS status,
        allocation.remark
      FROM v_batch_material_allocation allocation
      WHERE ${clauses.join(' AND ')}
      ORDER BY allocation.batch_id DESC, allocation.is_key_material DESC, allocation.material_model ASC
    `,
      params,
    );
  }

  private mapAllocationBatch(
    batch: ProductionBatchListRow,
    rows: RequirementRow[],
    allocationsByRequirement: Map<string, MaterialAllocationRecordItem[]>,
  ): MaterialAllocationBatchItem {
    const requirements = rows.map((row) =>
      this.mapRequirement(
        row,
        allocationsByRequirement.get(this.requirementKey(row.batch_id, row.product_material_id)) ?? [],
      ),
    );
    const shortageCount = requirements.filter(
      (item) => decimalNumber(item.unmetQuantity) > 0,
    ).length;
    const allocatedCount = requirements.filter(
      (item) => decimalNumber(item.reservedQuantity) >= decimalNumber(item.planQuantity),
    ).length;
    const usedCount = requirements.filter(
      (item) => decimalNumber(item.usedQuantity) >= decimalNumber(item.planQuantity),
    ).length;
    const materialStatus =
      requirements.length === 0
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

  private mapRequirement(
    row: RequirementRow,
    allocations: MaterialAllocationRecordItem[],
  ): MaterialAllocationRequirementItem {
    const planQuantity = decimalNumber(row.plan_quantity);
    const reservedQuantity = decimalNumber(row.reserved_quantity);
    const usedQuantity = decimalNumber(row.used_quantity);
    const unmetQuantity = Math.max(planQuantity - reservedQuantity, 0);
    const allocationStatus =
      usedQuantity >= planQuantity
        ? 'used'
        : reservedQuantity >= planQuantity
          ? 'allocated'
          : reservedQuantity > 0
            ? 'partial'
            : 'unallocated';

    return {
      id: String(row.usage_id),
      usageId: String(row.usage_id),
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
      availableBatchCount: 0,
      allocationStatus,
      allocations,
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
      clauses.push(`(
        b.batch_no LIKE ?
        OR b.order_no LIKE ?
        OR b.product_model LIKE ?
        OR b.product_name LIKE ?
        OR b.route_name LIKE ?
        OR b.owner_name LIKE ?
        OR b.remark LIKE ?
        OR EXISTS (
          SELECT 1 FROM v_batch_material_allocation keyword_allocation
          WHERE keyword_allocation.batch_id = b.batch_id
            AND (
              keyword_allocation.material_model LIKE ?
              OR keyword_allocation.material_name LIKE ?
              OR keyword_allocation.material_batch_no LIKE ?
            )
        )
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.productId?.trim()) {
      clauses.push('b.product_id = ?');
      params.push(readPositiveId(filters.productId, 'Invalid product'));
    }

    if (
      filters.materialKeyword?.trim() ||
      filters.keyMaterial === '1' ||
      filters.keyMaterial === '0'
    ) {
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
        allocation.material_status AS status,
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

    return rows[0];
  }

  /** 查询每条 reserve 流水，供页面展示多批次分配明细并按记录清除。 */
  private async listAllocationRecords(batchIds: number[]) {
    const placeholders = batchIds.map(() => '?').join(',');
    return this.database.query<AllocationRecordRow[]>(
      `
      SELECT
        reserve.id,
        reserve.batch_id,
        reserve.product_materials_id AS product_material_id,
        reserve.material_batch_id,
        mb.material_batch_no,
        COALESCE(NULLIF(reserve.operation_quantity, 0), reserve.reserved_quantity, 0)
          - COALESCE(unreserve.unreserved_quantity, 0) AS reserved_quantity,
        COALESCE(flow.issued_quantity, 0) AS issued_quantity,
        COALESCE(flow.returned_quantity, 0) AS returned_quantity,
        COALESCE(flow.issued_quantity, 0) - COALESCE(flow.returned_quantity, 0) AS used_quantity,
        recorder.display_name AS recorded_by_name,
        reserve.recorded_at,
        reserve.remark
      FROM batch_material_usages reserve
      INNER JOIN material_batches mb
        ON mb.id = reserve.material_batch_id
        AND mb.is_deleted = 0
      LEFT JOIN users recorder ON recorder.id = reserve.recorded_by
      LEFT JOIN (
        SELECT
          related_usage_id,
          SUM(COALESCE(NULLIF(operation_quantity, 0), reserved_quantity, 0)) AS unreserved_quantity
        FROM batch_material_usages
        WHERE is_deleted = 0
          AND operation_type = 'unreserve'
          AND related_usage_id IS NOT NULL
        GROUP BY related_usage_id
      ) unreserve
        ON unreserve.related_usage_id = reserve.id
      LEFT JOIN (
        SELECT
          batch_id,
          COALESCE(require_id, product_materials_id) AS demand_key,
          material_batch_id,
          SUM(CASE WHEN operation_type = 'issue' THEN COALESCE(NULLIF(operation_quantity, 0), used_quantity, 0) ELSE 0 END)
            AS issued_quantity,
          SUM(CASE WHEN operation_type = 'return' THEN COALESCE(NULLIF(operation_quantity, 0), used_quantity, 0) ELSE 0 END)
            AS returned_quantity
        FROM batch_material_usages
        WHERE is_deleted = 0 AND operation_type IN ('issue','return')
        GROUP BY batch_id, COALESCE(require_id, product_materials_id), material_batch_id
      ) flow
        ON flow.batch_id = reserve.batch_id
        AND flow.demand_key = COALESCE(reserve.require_id, reserve.product_materials_id)
        AND flow.material_batch_id = reserve.material_batch_id
      WHERE reserve.batch_id IN (${placeholders})
        AND reserve.operation_type = 'reserve'
        AND reserve.is_deleted = 0
        AND COALESCE(NULLIF(reserve.operation_quantity, 0), reserve.reserved_quantity, 0)
          - COALESCE(unreserve.unreserved_quantity, 0) > 0
      ORDER BY reserve.batch_id DESC, reserve.product_materials_id, reserve.id ASC
      `,
      batchIds,
    );
  }

  private groupAllocationsByRequirement(rows: AllocationRecordRow[]) {
    const grouped = new Map<string, MaterialAllocationRecordItem[]>();
    for (const row of rows) {
      const key = this.requirementKey(row.batch_id, row.product_material_id);
      const allocations = grouped.get(key) ?? [];
      const usedQuantity = decimalNumber(row.used_quantity);
      const reservedQuantity = decimalNumber(row.reserved_quantity);
      allocations.push({
        id: String(row.id),
        materialBatchId: String(row.material_batch_id),
        materialBatchNo: row.material_batch_no,
        reservedQuantity: decimalString(row.reserved_quantity),
        issuedQuantity: decimalString(row.issued_quantity),
        returnedQuantity: decimalString(row.returned_quantity),
        usedQuantity: decimalString(row.used_quantity),
        remainingQuantity: Math.max(reservedQuantity - usedQuantity, 0).toFixed(4),
        recordedByName: row.recorded_by_name,
        recordedAt: row.recorded_at.toISOString(),
        remark: row.remark,
        canClear: usedQuantity <= 0,
      });
      grouped.set(key, allocations);
    }
    return grouped;
  }

  private requirementKey(batchId: number, productMaterialId: number) {
    return `${batchId}:${productMaterialId}`;
  }

  /** 锁定待清除预留并汇总同物料批次净领用，防止清除后出现领用量超过预留量。 */
  private async getAllocationRecord(batchId: number, allocationId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        batch_id: number;
        require_id: number | null;
        material_batch_id: number;
        product_materials_id: number;
        unit: string | null;
        reserved_quantity: string | number;
        remaining_reserved_quantity: string | number;
        total_reserved_quantity: string | number;
        net_used_quantity: string | number;
      })[]
    >(
      `
      SELECT
        reserve.id,
        reserve.batch_id,
        reserve.require_id,
        reserve.material_batch_id,
        reserve.product_materials_id,
        reserve.unit,
        COALESCE(NULLIF(reserve.operation_quantity, 0), reserve.reserved_quantity, 0)
          AS reserved_quantity,
        COALESCE(NULLIF(reserve.operation_quantity, 0), reserve.reserved_quantity, 0)
          - (
            SELECT COALESCE(SUM(COALESCE(NULLIF(cancel_operation.operation_quantity, 0), cancel_operation.reserved_quantity, 0)), 0)
            FROM batch_material_usages cancel_operation
            WHERE cancel_operation.related_usage_id = reserve.id
              AND cancel_operation.operation_type = 'unreserve'
              AND cancel_operation.is_deleted = 0
          ) AS remaining_reserved_quantity,
        (
          SELECT COALESCE(SUM(COALESCE(NULLIF(other_reserve.operation_quantity, 0), other_reserve.reserved_quantity, 0)), 0)
          FROM batch_material_usages other_reserve
          WHERE other_reserve.batch_id = reserve.batch_id
            AND COALESCE(other_reserve.require_id, other_reserve.product_materials_id) =
              COALESCE(reserve.require_id, reserve.product_materials_id)
            AND other_reserve.material_batch_id = reserve.material_batch_id
            AND other_reserve.operation_type = 'reserve'
            AND other_reserve.is_deleted = 0
        ) AS total_reserved_quantity,
        (
          SELECT
            COALESCE(SUM(CASE WHEN flow.operation_type = 'issue' THEN COALESCE(NULLIF(flow.operation_quantity, 0), flow.used_quantity, 0) ELSE 0 END), 0)
            - COALESCE(SUM(CASE WHEN flow.operation_type = 'return' THEN COALESCE(NULLIF(flow.operation_quantity, 0), flow.used_quantity, 0) ELSE 0 END), 0)
          FROM batch_material_usages flow
          WHERE flow.batch_id = reserve.batch_id
            AND COALESCE(flow.require_id, flow.product_materials_id) =
              COALESCE(reserve.require_id, reserve.product_materials_id)
            AND flow.material_batch_id = reserve.material_batch_id
            AND flow.operation_type IN ('issue','return')
            AND flow.is_deleted = 0
        ) AS net_used_quantity
      FROM batch_material_usages reserve
      WHERE reserve.id = ?
        AND reserve.batch_id = ?
        AND reserve.operation_type = 'reserve'
        AND reserve.is_deleted = 0
      LIMIT 1
      `,
      [allocationId, batchId],
    );
    if (!row) {
      throw new NotFoundException('物料预留记录不存在');
    }
    return row;
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
    const rows = await this.database.query<
      (RowDataPacket & {
        total: number;
        allocated_count: number;
      })[]
    >(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN reserved_quantity >= required_quantity THEN 1 ELSE 0 END) AS allocated_count
      FROM v_batch_material_allocation
      WHERE batch_id = ?
    `,
      [batchId],
    );
    const summary = rows[0];
    const total = Number(summary?.total ?? 0);
    const allocatedCount = Number(summary?.allocated_count ?? 0);
    const nextStatus =
      total > 0 && allocatedCount === total ? 'material_assigned' : 'material_pending';

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
