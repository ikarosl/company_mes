import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ItemBatchStockListItem, WarehouseItemKind, WarehouseSourceType, WarehouseBatchStatus } from '@company/api-contract';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface ItemBatchStockRow extends RowDataPacket {
  batch_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  item_kind: WarehouseItemKind;
  batch_code: string;
  source_type: WarehouseSourceType;
  provider: string | null;
  source_work_order_id: number | null;
  source_production_batch_id: number | null;
  batch_status: WarehouseBatchStatus;
  available_quantity: string | number | null;
  pending_quantity: string | number | null;
  frozen_quantity: string | number | null;
  defective_quantity: string | number | null;
  total_quantity: string | number | null;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface InventoryFilters {
  keyword?: string;
  itemKind?: string;
  stockStatus?: string;
  batchStatus?: string;
}

@Injectable()
export class InventoryRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /**
   * 查询库存批次现存量。
   * 账面数量来自 v_item_batch_stock，避免继续读取旧 material_batches.quantity。
   */
  async listBatchStock(filters: InventoryFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildStockFilters(filters, 'stock');
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM v_item_batch_stock stock
      INNER JOIN item_info ii ON ii.id = stock.item_id
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ItemBatchStockRow[]>(
      `
      SELECT
        stock.batch_id,
        stock.item_id,
        ii.item_code,
        stock.item_name,
        stock.item_kind,
        stock.batch_code,
        stock.source_type,
        stock.provider,
        stock.source_work_order_id,
        stock.source_production_batch_id,
        stock.batch_status,
        stock.available_quantity,
        stock.pending_quantity,
        stock.frozen_quantity,
        stock.defective_quantity,
        stock.total_quantity
      FROM v_item_batch_stock stock
      INNER JOIN item_info ii ON ii.id = stock.item_id
      WHERE ${where}
      ORDER BY stock.batch_id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapItemBatchStock), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询单个库存批次现存量详情。 */
  async getBatchStock(batchId: number) {
    const [row] = await this.database.query<ItemBatchStockRow[]>(
      `
      SELECT
        stock.batch_id,
        stock.item_id,
        ii.item_code,
        stock.item_name,
        stock.item_kind,
        stock.batch_code,
        stock.source_type,
        stock.provider,
        stock.source_work_order_id,
        stock.source_production_batch_id,
        stock.batch_status,
        stock.available_quantity,
        stock.pending_quantity,
        stock.frozen_quantity,
        stock.defective_quantity,
        stock.total_quantity
      FROM v_item_batch_stock stock
      INNER JOIN item_info ii ON ii.id = stock.item_id
      WHERE stock.batch_id = ?
      LIMIT 1
    `,
      [batchId],
    );

    if (!row) {
      throw new NotFoundException('Inventory batch not found');
    }

    return mapItemBatchStock(row);
  }

  /**
   * 查询可分配库存批次。
   * 可分配数量 = 账面可用库存 - 有效分配未释放占用数量。
   */
  async listAvailableToAllocate(filters: InventoryFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildStockFilters(filters, 'available_stock');
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM v_item_batch_available_to_allocate available_stock
      INNER JOIN item_info ii ON ii.id = available_stock.item_id
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<
      Array<
        RowDataPacket & {
          batch_id: number;
          item_id: number;
          item_code: string;
          item_name: string;
          item_kind: WarehouseItemKind;
          batch_code: string;
          on_hand_available_quantity: string | number | null;
          reserved_quantity: string | number | null;
          available_to_allocate_quantity: string | number | null;
        }
      >
    >(
      `
      SELECT
        available_stock.batch_id,
        available_stock.item_id,
        ii.item_code,
        available_stock.item_name,
        available_stock.item_kind,
        available_stock.batch_code,
        available_stock.on_hand_available_quantity,
        available_stock.reserved_quantity,
        available_stock.available_to_allocate_quantity
      FROM v_item_batch_available_to_allocate available_stock
      INNER JOIN item_info ii ON ii.id = available_stock.item_id
      WHERE ${where}
      ORDER BY available_stock.batch_id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(
      rows.map((row) => ({
        batchId: String(row.batch_id),
        itemId: String(row.item_id),
        itemCode: row.item_code,
        itemName: row.item_name,
        itemKind: row.item_kind,
        batchCode: row.batch_code,
        onHandAvailableQuantity: decimalString(row.on_hand_available_quantity),
        reservedQuantity: decimalString(row.reserved_quantity),
        availableToAllocateQuantity: decimalString(row.available_to_allocate_quantity),
      })),
      Number(totalRow?.total ?? 0),
      pagination,
    );
  }

  private buildStockFilters(filters: InventoryFilters, alias: string) {
    const clauses = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push(`(${alias}.batch_code LIKE ? OR ${alias}.item_name LIKE ? OR ii.item_code LIKE ?)`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (filters.itemKind?.trim()) {
      clauses.push(`${alias}.item_kind = ?`);
      params.push(filters.itemKind.trim());
    }

    if (filters.batchStatus?.trim() && alias === 'stock') {
      clauses.push(`${alias}.batch_status = ?`);
      params.push(filters.batchStatus.trim());
    }

    if (filters.stockStatus?.trim() && alias === 'stock') {
      const quantityColumn = stockStatusQuantityColumn(filters.stockStatus.trim());
      clauses.push(`${alias}.${quantityColumn} > 0`);
    }

    return { where: clauses.join(' AND '), params };
  }
}

const mapItemBatchStock = (row: ItemBatchStockRow): ItemBatchStockListItem => ({
  batchId: String(row.batch_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  itemKind: row.item_kind,
  batchCode: row.batch_code,
  sourceType: row.source_type,
  provider: row.provider,
  sourceWorkOrderId: row.source_work_order_id === null ? null : String(row.source_work_order_id),
  sourceProductionBatchId: row.source_production_batch_id === null ? null : String(row.source_production_batch_id),
  batchStatus: row.batch_status,
  availableQuantity: decimalString(row.available_quantity),
  pendingQuantity: decimalString(row.pending_quantity),
  frozenQuantity: decimalString(row.frozen_quantity),
  defectiveQuantity: decimalString(row.defective_quantity),
  totalQuantity: decimalString(row.total_quantity),
});

const decimalString = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(4) : '0.0000';
};

const stockStatusQuantityColumn = (stockStatus: string) => {
  const mapping: Record<string, string> = {
    可用: 'available_quantity',
    待检: 'pending_quantity',
    冻结: 'frozen_quantity',
    不良: 'defective_quantity',
  };
  const column = mapping[stockStatus];

  if (!column) {
    return 'total_quantity';
  }

  return column;
};
