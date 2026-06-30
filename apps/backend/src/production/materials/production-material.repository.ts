import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateAllocationPayload, ProductionItemDemandSummaryItem, ProductionItemAllocationSummaryItem, ItemBatchAvailableToAllocateItem, ProductionBatchItemSummaryItem, ProductionBatchOutputSummaryItem } from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';

interface DemandRow extends RowDataPacket {
  demand_id: number;
  production_batch_id: number;
  bom_id: number | null;
  item_id: number;
  item_code: string;
  item_name: string;
  need_number: string;
  demand_type: number;
  parent_demand_id: number | null;
  source_scrap_id: number | null;
  business_status: string;
  allocated_quantity: string;
  unallocated_quantity: string;
  outbound_quantity: string;
  not_outbound_quantity: string;
  returned_quantity: string;
  stock_scrapped_quantity: string;
  production_scrapped_quantity: string;
  available_outbound_quantity: string;
  is_shortage: number;
  is_quantity_abnormal: number;
  progress_status: string;
}

interface AllocationRow extends RowDataPacket {
  allocation_id: number;
  demand_id: number;
  production_batch_id: number;
  item_id: number;
  batch_id: number;
  batch_code: string;
  assigned_number: string;
  outbound_quantity: string;
  returned_quantity: string;
  returned_available_quantity: string;
  released_return_quantity: string;
  stock_scrapped_quantity: string;
  production_scrapped_quantity: string;
  available_outbound_quantity: string;
  is_quantity_abnormal: number;
}

interface AvailableBatchRow extends RowDataPacket {
  batch_id: number;
  item_id: number;
  item_name: string;
  item_kind: string;
  batch_code: string;
  on_hand_available_quantity: string;
  reserved_quantity: string;
  available_to_allocate_quantity: string;
}

interface BatchItemSummaryRow extends RowDataPacket {
  production_batch_id: number;
  item_id: number;
  item_name: string;
  total_need_number: string;
  total_allocated_quantity: string;
  total_unallocated_quantity: string;
  total_outbound_quantity: string;
  total_returned_quantity: string;
  actual_consumed_quantity: string;
  total_stock_scrapped_quantity: string;
  total_production_scrapped_quantity: string;
  is_shortage: number;
  is_quantity_abnormal: number;
}

interface BatchOutputSummaryRow extends RowDataPacket {
  production_batch_id: number;
  work_order_id: number;
  item_id: number;
  item_name: string;
  item_kind: string;
  batch_id: number;
  batch_code: string;
  inbound_quantity: string;
  stock_status: string;
  source_stage: string | null;
}

@Injectable()
export class ProductionMaterialRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /** 查询生产批次的需求汇总，数据来自 v_production_item_demand_summary。 */
  async listDemandsByBatch(productionBatchId: number) {
    const rows = await this.database.query<DemandRow[]>(
      `
      SELECT
        pids.demand_id,
        pids.production_batch_id,
        pids.bom_id,
        pids.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        pids.need_number,
        pids.demand_type,
        pids.parent_demand_id,
        pids.source_scrap_id,
        pids.business_status,
        pids.allocated_quantity,
        pids.unallocated_quantity,
        pids.outbound_quantity,
        pids.not_outbound_quantity,
        pids.returned_quantity,
        pids.stock_scrapped_quantity,
        pids.production_scrapped_quantity,
        pids.available_outbound_quantity,
        pids.is_shortage,
        pids.is_quantity_abnormal,
        pids.progress_status
      FROM v_production_item_demand_summary pids
      INNER JOIN products p ON p.id = pids.item_id
      WHERE pids.production_batch_id = ?
      ORDER BY pids.demand_id ASC
    `,
      [productionBatchId],
    );

    return rows.map(mapDemandRow);
  }

  /** 查询生产批次的分配汇总，数据来自 v_production_item_allocation_summary。 */
  async listAllocationsByBatch(productionBatchId: number) {
    const rows = await this.database.query<AllocationRow[]>(
      `
      SELECT
        pias.allocation_id,
        pias.demand_id,
        pias.production_batch_id,
        pias.item_id,
        pias.batch_id,
        ib.batch_code,
        pias.assigned_number,
        pias.outbound_quantity,
        pias.returned_quantity,
        pias.returned_available_quantity,
        pias.released_return_quantity,
        pias.stock_scrapped_quantity,
        pias.production_scrapped_quantity,
        pias.available_outbound_quantity,
        pias.is_quantity_abnormal
      FROM v_production_item_allocation_summary pias
      INNER JOIN item_batch ib ON ib.id = pias.batch_id AND ib.item_id = pias.item_id
      WHERE pias.production_batch_id = ?
      ORDER BY pias.allocation_id ASC
    `,
      [productionBatchId],
    );

    return rows.map(mapAllocationRow);
  }

  /** 查询可分配库存批次列表，数据来自 v_item_batch_available_to_allocate。 */
  async listAvailableBatches(itemId?: number) {
    const params: QueryParam[] = [];
    const itemFilter = itemId ? ' WHERE stock.item_id = ?' : '';

    if (itemId) {
      params.push(itemId);
    }

    const rows = await this.database.query<AvailableBatchRow[]>(
      `
      SELECT
        stock.batch_id,
        stock.item_id,
        stock.item_name,
        stock.item_kind,
        stock.batch_code,
        stock.on_hand_available_quantity,
        stock.reserved_quantity,
        stock.available_to_allocate_quantity
      FROM v_item_batch_available_to_allocate stock
      ${itemFilter}
      ORDER BY stock.batch_id ASC
    `,
      params,
    );

    return rows.map(mapAvailableBatchRow).filter((row) => Number(row.availableToAllocateQuantity) > 0);
  }

  /** 查询生产批次投入汇总，数据来自 v_production_batch_item_summary。 */
  async listBatchItemSummary(productionBatchId: number) {
    const rows = await this.database.query<BatchItemSummaryRow[]>(
      `
      SELECT
        pbis.production_batch_id,
        pbis.item_id,
        pbis.item_name,
        pbis.total_need_number,
        pbis.total_allocated_quantity,
        pbis.total_unallocated_quantity,
        pbis.total_outbound_quantity,
        pbis.total_returned_quantity,
        pbis.actual_consumed_quantity,
        pbis.total_stock_scrapped_quantity,
        pbis.total_production_scrapped_quantity,
        pbis.is_shortage,
        pbis.is_quantity_abnormal
      FROM v_production_batch_item_summary pbis
      WHERE pbis.production_batch_id = ?
      ORDER BY pbis.item_id ASC
    `,
      [productionBatchId],
    );

    return rows.map(mapBatchItemSummaryRow);
  }

  /** 查询生产批次产出汇总，数据来自 v_production_batch_output_summary。 */
  async listBatchOutputSummary(productionBatchId: number) {
    const rows = await this.database.query<BatchOutputSummaryRow[]>(
      `
      SELECT
        pbos.production_batch_id,
        pbos.work_order_id,
        pbos.item_id,
        pbos.item_name,
        pbos.item_kind,
        pbos.batch_id,
        pbos.batch_code,
        pbos.inbound_quantity,
        pbos.stock_status,
        pbos.source_stage
      FROM v_production_batch_output_summary pbos
      WHERE pbos.production_batch_id = ?
      ORDER BY pbos.item_id ASC
    `,
      [productionBatchId],
    );

    return rows.map(mapBatchOutputSummaryRow);
  }

  /**
   * 生成生产投入需求。
   * 根据 production_batch 关联的 product_id 读取 product_bom，
   * 为每个 BOM 行生成 production_item_demand。
   */
  async generateDemand(productionBatchId: number) {
    const batch = await this.getProductionBatch(productionBatchId);

    const count = await this.database.transaction(async (connection) => {
      const existing = await query<RowDataPacket[]>(
        connection,
        `
        SELECT COUNT(*) AS cnt
        FROM production_item_demand
        WHERE production_batch_id = ?
      `,
        [productionBatchId],
      );

      if (Number(existing[0]?.cnt ?? 0) > 0) {
        throw new BadRequestException('Demand already generated for this production batch');
      }

      const result = await execute(
        connection,
        `
        INSERT INTO production_item_demand (
          production_batch_id, bom_id, item_id, need_number, demand_type,
          business_status, remark, created_at, updated_at
        )
        SELECT
          ?, pb.id, pb.item_id, pb.per_unit * ?, 0,
          '正常', pb.remark, NOW(), NOW()
        FROM product_bom pb
        INNER JOIN products p ON p.id = pb.item_id AND p.status = '启用'
        WHERE pb.product_id = ? AND pb.bom_status = '启用'
      `,
        [productionBatchId, batch.plannedQuantity, batch.productId],
      );

      return (result as ResultSetHeader).affectedRows;
    });

    return {
      batchId: String(productionBatchId),
      generatedCount: count,
    };
  }

  /** 创建分配（production_item_allocation），从指定批次预留库存。 */
  async createAllocation(payload: CreateAllocationPayload) {
    const productionBatchId = readPositiveId(payload.productionBatchId);
    const demandId = readPositiveId(payload.demandId);
    const itemId = readPositiveId(payload.itemId);
    const batchId = readPositiveId(payload.batchId);
    const assignedNumber = readPositiveDecimal(payload.assignedNumber);
    const remark = normalizeOptionalString(payload.remark);

    const allocationId = await this.database.transaction(async (connection) => {
      const demand = await this.getDemandRow(connection, demandId);
      if (Number(demand.production_batch_id) !== productionBatchId) {
        throw new BadRequestException('Demand does not match production batch');
      }

      const available = await this.getAvailableQuantity(connection, itemId, batchId);
      if (Number(available.available_to_allocate_quantity) < Number(assignedNumber)) {
        throw new BadRequestException('Insufficient available quantity to allocate');
      }

      const result = await execute(
        connection,
        `
        INSERT INTO production_item_allocation (
          demand_id, production_batch_id, item_id, batch_id, assigned_number,
          allocation_status, version, remark, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, '正常', 0, ?, NOW(), NOW())
      `,
        [demandId, productionBatchId, itemId, batchId, assignedNumber, remark],
      );

      return (result as ResultSetHeader).insertId;
    });

    return { allocationId: String(allocationId) };
  }

  /** 取消分配。 */
  async cancelAllocation(allocationId: number) {
    await this.database.transaction(async (connection) => {
      const [row] = await query<RowDataPacket[]>(
        connection,
        `
        SELECT id, allocation_status
        FROM production_item_allocation
        WHERE id = ? FOR UPDATE
      `,
        [allocationId],
      );

      if (!row) {
        throw new NotFoundException('Allocation not found');
      }
      if (row.allocation_status !== '正常') {
        throw new BadRequestException('Allocation is not in normal status');
      }

      await execute(
        connection,
        `
        UPDATE production_item_allocation
        SET allocation_status = '已取消',
          version = version + 1,
          updated_at = NOW()
        WHERE id = ?
      `,
        [allocationId],
      );
    });

    return { allocationId: String(allocationId) };
  }

  /** 获取生产批次详情（新版，包含物料汇总）。 */
  async getProductionMaterialDetail(productionBatchId: number) {
    const [demands, allocations, batchItemSummary, outputSummary] = await Promise.all([
      this.listDemandsByBatch(productionBatchId),
      this.listAllocationsByBatch(productionBatchId),
      this.listBatchItemSummary(productionBatchId),
      this.listBatchOutputSummary(productionBatchId),
    ]);

    return {
      demands,
      allocations,
      batchItemSummary,
      outputSummary,
    };
  }

  private async getProductionBatch(batchId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & { product_id: number; planned_quantity: string | number })[]
    >(
      `
      SELECT wo.product_id, b.planned_quantity
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      WHERE b.id = ? AND b.is_deleted = 0
      LIMIT 1
    `,
      [batchId],
    );

    if (!row) {
      throw new NotFoundException('Production batch not found');
    }

    return {
      productId: row.product_id,
      plannedQuantity: Number(row.planned_quantity),
    };
  }

  private async getDemandRow(executor: DbExecutor, demandId: number) {
    const [row] = await query<
      (RowDataPacket & { production_batch_id: number; item_id: number; business_status: string })[]
    >(
      executor,
      `
      SELECT production_batch_id, item_id, business_status
      FROM production_item_demand
      WHERE id = ? AND business_status NOT IN ('已取消', '已关闭')
      LIMIT 1
    `,
      [demandId],
    );

    if (!row) {
      throw new BadRequestException('Demand not found or closed');
    }

    return row;
  }

  private async getAvailableQuantity(executor: DbExecutor, itemId: number, batchId: number) {
    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT available_to_allocate_quantity
      FROM v_item_batch_available_to_allocate
      WHERE item_id = ? AND batch_id = ?
      LIMIT 1
    `,
      [itemId, batchId],
    );

    if (!row) {
      return { available_to_allocate_quantity: '0' };
    }

    return row;
  }
}

const mapDemandRow = (row: DemandRow): ProductionItemDemandSummaryItem => ({
  demandId: String(row.demand_id),
  productionBatchId: String(row.production_batch_id),
  bomId: row.bom_id === null ? null : String(row.bom_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  needNumber: String(row.need_number),
  demandType: row.demand_type,
  parentDemandId: row.parent_demand_id === null ? null : String(row.parent_demand_id),
  sourceScrapId: row.source_scrap_id === null ? null : String(row.source_scrap_id),
  businessStatus: row.business_status,
  allocatedQuantity: String(row.allocated_quantity),
  unallocatedQuantity: String(row.unallocated_quantity),
  outboundQuantity: String(row.outbound_quantity),
  notOutboundQuantity: String(row.not_outbound_quantity),
  returnedQuantity: String(row.returned_quantity),
  stockScrappedQuantity: String(row.stock_scrapped_quantity),
  productionScrappedQuantity: String(row.production_scrapped_quantity),
  availableOutboundQuantity: String(row.available_outbound_quantity),
  isShortage: row.is_shortage === 1,
  isQuantityAbnormal: row.is_quantity_abnormal === 1,
  progressStatus: row.progress_status,
});

const mapAllocationRow = (row: AllocationRow): ProductionItemAllocationSummaryItem => ({
  allocationId: String(row.allocation_id),
  demandId: String(row.demand_id),
  productionBatchId: String(row.production_batch_id),
  itemId: String(row.item_id),
  batchId: String(row.batch_id),
  batchCode: row.batch_code,
  assignedNumber: String(row.assigned_number),
  outboundQuantity: String(row.outbound_quantity),
  returnedQuantity: String(row.returned_quantity),
  returnedAvailableQuantity: String(row.returned_available_quantity),
  releasedReturnQuantity: String(row.released_return_quantity),
  stockScrappedQuantity: String(row.stock_scrapped_quantity),
  productionScrappedQuantity: String(row.production_scrapped_quantity),
  availableOutboundQuantity: String(row.available_outbound_quantity),
  isQuantityAbnormal: row.is_quantity_abnormal === 1,
});

const mapAvailableBatchRow = (row: AvailableBatchRow): ItemBatchAvailableToAllocateItem => ({
  batchId: String(row.batch_id),
  itemId: String(row.item_id),
  itemName: row.item_name,
  itemKind: row.item_kind,
  batchCode: row.batch_code,
  onHandAvailableQuantity: String(row.on_hand_available_quantity),
  reservedQuantity: String(row.reserved_quantity),
  availableToAllocateQuantity: String(row.available_to_allocate_quantity),
});

const mapBatchItemSummaryRow = (row: BatchItemSummaryRow): ProductionBatchItemSummaryItem => ({
  productionBatchId: String(row.production_batch_id),
  itemId: String(row.item_id),
  itemName: row.item_name,
  totalNeedNumber: String(row.total_need_number),
  totalAllocatedQuantity: String(row.total_allocated_quantity),
  totalUnallocatedQuantity: String(row.total_unallocated_quantity),
  totalOutboundQuantity: String(row.total_outbound_quantity),
  totalReturnedQuantity: String(row.total_returned_quantity),
  actualConsumedQuantity: String(row.actual_consumed_quantity),
  totalStockScrappedQuantity: String(row.total_stock_scrapped_quantity),
  totalProductionScrappedQuantity: String(row.total_production_scrapped_quantity),
  isShortage: row.is_shortage === 1,
  isQuantityAbnormal: row.is_quantity_abnormal === 1,
});

const mapBatchOutputSummaryRow = (row: BatchOutputSummaryRow): ProductionBatchOutputSummaryItem => ({
  productionBatchId: String(row.production_batch_id),
  workOrderId: String(row.work_order_id),
  itemId: String(row.item_id),
  itemName: row.item_name,
  itemKind: row.item_kind,
  batchId: String(row.batch_id),
  batchCode: row.batch_code,
  inboundQuantity: String(row.inbound_quantity),
  stockStatus: row.stock_status,
  sourceStage: row.source_stage,
});

const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const readPositiveId = (value: string | number) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

const readPositiveDecimal = (value: string | number) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new BadRequestException('Invalid positive number');
  }

  return numberValue.toFixed(4);
};
