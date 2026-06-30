import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateStockCheckPayload,
  StockCheckOrderDetail,
  StockCheckListItem,
  StockCheckStatus,
  StockCheckDetailItem,
  UpdateStockCheckPayload,
  WarehouseStockStatus,
} from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface StockCheckOrderRow extends RowDataPacket {
  id: number;
  check_no: string;
  status: StockCheckStatus;
  operator_id: number | null;
  remark: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  detail_count: number;
  total_items: number;
  pending_items: number;
}

interface StockCheckDetailRow extends RowDataPacket {
  id: number;
  stock_check_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  batch_id: number;
  batch_code: string;
  stock_status: WarehouseStockStatus;
  system_quantity: string;
  actual_quantity: string;
  difference_quantity: string;
  result: '盘盈' | '盘亏' | '一致';
  adjusted: number;
  remark: string | null;
  created_at: Date;
}

interface BatchStockRow extends RowDataPacket {
  batch_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  batch_code: string;
  stock_status?: string;
  available_quantity: string | number;
  pending_quantity: string | number;
  frozen_quantity: string | number;
  defective_quantity: string | number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const CHECK_STATUSES = new Set<StockCheckStatus>(['待盘点', '盘点中', '已完成', '已取消']);
const STOCK_STATUSES = new Set<WarehouseStockStatus>(['可用', '待检', '冻结', '不良']);

@Injectable()
export class StockCheckRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /** 查询盘点单列表，读取 stock_check_order 并汇总明细状态。 */
  async listStockChecks(filters: StockCheckFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM stock_check_order sco
      WHERE ${where}
    `,
      params,
    );

    const rows = await this.database.query<StockCheckOrderRow[]>(
      `
      SELECT
        sco.id,
        sco.check_no,
        sco.status,
        sco.operator_id,
        sco.remark,
        sco.created_at,
        sco.started_at,
        sco.completed_at,
        (
          SELECT COUNT(*)
          FROM stock_check_detail scd
          WHERE scd.stock_check_id = sco.id
        ) AS detail_count,
        (
          SELECT COUNT(*)
          FROM stock_check_detail scd
          WHERE scd.stock_check_id = sco.id
        ) AS total_items,
        (
          SELECT COUNT(*)
          FROM stock_check_detail scd
          WHERE scd.stock_check_id = sco.id
            AND scd.result <> '一致'
        ) AS pending_items
      FROM stock_check_order sco
      WHERE ${where}
      ORDER BY sco.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapStockCheckOrder), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询盘点单详情，包含盘点明细。 */
  async getStockCheck(id: number): Promise<StockCheckOrderDetail> {
    const order = await this.getOrderRow(id);
    const details = await this.getDetailRows(id);

    return {
      ...mapStockCheckOrder(order),
      details: details.map(mapStockCheckDetail),
    };
  }

  /**
   * 创建盘点单，保存盘点范围和账面数量快照。
   * 不传明细时创建空盘点单；传明细时按指定库存对象和批次记录账面数量。
   */
  async createStockCheck(payload: CreateStockCheckPayload) {
    const checkNo = payload.checkNo?.trim() ?? (await this.generateCheckNo());
    const operatorId = nullablePositiveId(payload.operatorId, 'Invalid operator');
    const remark = normalizeOptionalString(payload.remark);

    await this.assertCheckNoAvailable(checkNo);

    const orderId = await this.database.transaction(async (connection) => {
      await this.assertOptionalReferenceExists(connection, 'users', operatorId, 'Operator not found');

      const result = await execute(
        connection,
        `
        INSERT INTO stock_check_order (
          check_no, status, operator_id, remark, created_at
        )
        VALUES (?, '待盘点', ?, ?, NOW())
      `,
        [checkNo, operatorId, remark],
      );
      const createdOrderId = (result as ResultSetHeader).insertId;

      const details = payload.details;
      if (Array.isArray(details) && details.length > 0) {
        for (const detail of details) {
          const itemId = readPositiveId(detail.itemId, 'Missing item');
          const batchId = readPositiveId(detail.batchId, 'Missing batch');
          const stockStatus = readStockStatus(detail.stockStatus);

          const snapshot = await this.getBatchStockSnapshot(connection, itemId, batchId, stockStatus);

          await execute(
            connection,
            `
            INSERT INTO stock_check_detail (
              stock_check_id, item_id, batch_id, stock_status, system_quantity,
              actual_quantity, difference_quantity, result, remark, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 0, '一致', ?, NOW())
          `,
            [createdOrderId, itemId, batchId, stockStatus, snapshot.systemQuantity, snapshot.systemQuantity, detail.remark ?? null],
          );
        }
      }

      return createdOrderId;
    });

    return this.getStockCheck(orderId);
  }

  /** 编辑盘点单，更新实盘数量并重新计算差异。 */
  async updateStockCheck(id: number, payload: UpdateStockCheckPayload) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status === '已完成' || order.status === '已取消') {
        throw new BadRequestException('Cannot update completed or canceled stock check');
      }

      const details = payload.details;
      if (!Array.isArray(details) || details.length === 0) {
        throw new BadRequestException('Missing stock check details');
      }

      for (const detail of details) {
        const itemId = readPositiveId(detail.itemId, 'Missing item');
        const batchId = readPositiveId(detail.batchId, 'Missing batch');
        const stockStatus = readStockStatus(detail.stockStatus);
        const actualQuantity = readNonNegativeDecimal(detail.actualQuantity, 'Invalid actual quantity');

        const existing = await this.getDetailByItemBatch(connection, id, itemId, batchId, stockStatus);
        if (!existing) {
          throw new BadRequestException(`Detail not found for item ${itemId} batch ${batchId}`);
        }

        const systemQuantity = Number(existing.system_quantity);
        const difference = Number(actualQuantity) - systemQuantity;
        let result: '盘盈' | '盘亏' | '一致';
        if (difference > 0) {
          result = '盘盈';
        } else if (difference < 0) {
          result = '盘亏';
        } else {
          result = '一致';
        }

        await execute(
          connection,
          `
          UPDATE stock_check_detail
          SET actual_quantity = ?,
            difference_quantity = ?,
            result = ?,
            remark = ?
          WHERE id = ?
        `,
          [actualQuantity, Math.abs(difference).toFixed(4), result, detail.remark ?? null, existing.id],
        );
      }

      if (order.status === '待盘点') {
        await execute(
          connection,
          `
          UPDATE stock_check_order
          SET status = '盘点中',
            started_at = NOW()
          WHERE id = ?
        `,
          [id],
        );
      }
    });

    return this.getStockCheck(id);
  }

  /** 完成盘点，锁定明细数据。 */
  async completeStockCheck(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status === '已完成' || order.status === '已取消') {
        throw new BadRequestException('Stock check already completed or canceled');
      }

      await execute(
        connection,
        `
        UPDATE stock_check_order
        SET status = '已完成',
          completed_at = NOW()
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getStockCheck(id);
  }

  /**
   * 生成盘点调整流水。
   * 遍历所有盘盈/盘亏的明细，按每条差异生成 inventory_transaction。
   * 只生成调整流水，不直接修改批次数量。
   */
  async adjustStockCheck(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '已完成') {
        throw new BadRequestException('Only completed stock check can be adjusted');
      }

      const details = await this.getUnadjustedDetailRows(id, connection);
      if (details.length === 0) {
        throw new BadRequestException('No unadjusted items in stock check');
      }

      for (const detail of details) {
        const diffQuantity = Number(detail.difference_quantity);
        if (diffQuantity === 0) {
          continue;
        }

        // 盘盈 = 正数，盘亏 = 负数
        const transactionQuantity = diffQuantity > 0
          ? diffQuantity.toFixed(4)
          : diffQuantity.toFixed(4);

        await execute(
          connection,
          `
          INSERT INTO inventory_transaction (
            item_id, batch_id, transaction_type, quantity, stock_status,
            reference_type, reference_detail_id, idempotency_key, remark, created_at
          )
          VALUES (?, ?, '盘点调整', ?, ?, 'STOCK_CHECK_DETAIL', ?, ?, ?, NOW())
        `,
          [
            detail.item_id,
            detail.batch_id,
            transactionQuantity,
            detail.stock_status,
            detail.id,
            `STOCK_CHECK_DETAIL:${detail.id}`,
            detail.remark,
          ],
        );

        await execute(
          connection,
          `
          UPDATE stock_check_detail
          SET adjusted = 1
          WHERE id = ?
        `,
          [detail.id],
        );
      }
    });

    return this.getStockCheck(id);
  }

  /** 取消盘点单，仅允许未完成的盘点单取消。 */
  async cancelStockCheck(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status === '已完成' || order.status === '已取消') {
        throw new BadRequestException('Cannot cancel completed or already canceled stock check');
      }

      await execute(
        connection,
        `
        UPDATE stock_check_order
        SET status = '已取消'
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getStockCheck(id);
  }

  private buildListFilters(filters: StockCheckFilters) {
    const clauses: string[] = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('sco.check_no LIKE ?');
      params.push(`%${filters.keyword.trim()}%`);
    }

    if (filters.status?.trim()) {
      clauses.push('sco.status = ?');
      params.push(readCheckStatus(filters.status));
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getOrderRow(id: number, executor: DbExecutor = this.database, lock = false) {
    const rows = await query<StockCheckOrderRow[]>(
      executor,
      `
      SELECT
        sco.id,
        sco.check_no,
        sco.status,
        sco.operator_id,
        sco.remark,
        sco.created_at,
        sco.started_at,
        sco.completed_at,
        (
          SELECT COUNT(*)
          FROM stock_check_detail scd
          WHERE scd.stock_check_id = sco.id
        ) AS detail_count,
        (
          SELECT COUNT(*)
          FROM stock_check_detail scd
          WHERE scd.stock_check_id = sco.id
        ) AS total_items,
        (
          SELECT COUNT(*)
          FROM stock_check_detail scd
          WHERE scd.stock_check_id = sco.id
            AND scd.result <> '一致'
        ) AS pending_items
      FROM stock_check_order sco
      WHERE sco.id = ?
      ${lock ? 'FOR UPDATE' : ''}
    `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Stock check order not found');
    }

    return row;
  }

  private async getDetailRows(id: number, executor: DbExecutor = this.database) {
    return query<StockCheckDetailRow[]>(
      executor,
      `
      SELECT
        scd.id,
        scd.stock_check_id,
        scd.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        scd.batch_id,
        ib.batch_code,
        scd.stock_status,
        scd.system_quantity,
        scd.actual_quantity,
        scd.difference_quantity,
        scd.result,
        scd.adjusted,
        scd.remark,
        scd.created_at
      FROM stock_check_detail scd
      INNER JOIN products p ON p.id = scd.item_id
      INNER JOIN item_batch ib ON ib.id = scd.batch_id AND ib.item_id = scd.item_id
      WHERE scd.stock_check_id = ?
      ORDER BY scd.id ASC
    `,
      [id],
    );
  }

  private async getUnadjustedDetailRows(id: number, executor: DbExecutor = this.database) {
    return query<StockCheckDetailRow[]>(
      executor,
      `
      SELECT
        scd.id,
        scd.stock_check_id,
        scd.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        scd.batch_id,
        ib.batch_code,
        scd.stock_status,
        scd.system_quantity,
        scd.actual_quantity,
        scd.difference_quantity,
        scd.result,
        scd.adjusted,
        scd.remark,
        scd.created_at
      FROM stock_check_detail scd
      INNER JOIN products p ON p.id = scd.item_id
      INNER JOIN item_batch ib ON ib.id = scd.batch_id AND ib.item_id = scd.item_id
      WHERE scd.stock_check_id = ?
        AND scd.adjusted = 0
        AND scd.result <> '一致'
      ORDER BY scd.id ASC
    `,
      [id],
    );
  }

  private async getDetailByItemBatch(
    executor: DbExecutor,
    stockCheckId: number,
    itemId: number,
    batchId: number,
    stockStatus: WarehouseStockStatus,
  ) {
    const [row] = await query<StockCheckDetailRow[]>(
      executor,
      `
      SELECT id, system_quantity
      FROM stock_check_detail
      WHERE stock_check_id = ? AND item_id = ? AND batch_id = ? AND stock_status = ?
      LIMIT 1
    `,
      [stockCheckId, itemId, batchId, stockStatus],
    );

    return row ?? null;
  }

  private async getBatchStockSnapshot(
    executor: DbExecutor,
    itemId: number,
    batchId: number,
    stockStatus: WarehouseStockStatus,
  ) {
    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT COALESCE(SUM(CASE WHEN trx.stock_status = ? THEN trx.quantity ELSE 0 END), 0) AS quantity
      FROM inventory_transaction trx
      WHERE trx.item_id = ? AND trx.batch_id = ?
    `,
      [stockStatus, itemId, batchId],
    );

    return {
      systemQuantity: String(row?.quantity ?? '0.0000'),
    };
  }

  private async assertCheckNoAvailable(checkNo: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM stock_check_order
      WHERE check_no = ?
      LIMIT 1
    `,
      [checkNo],
    );

    if (row) {
      throw new ConflictException('Stock check no already exists');
    }
  }

  private async assertOptionalReferenceExists(
    executor: DbExecutor,
    table: 'users',
    id: number | null,
    message: string,
  ) {
    if (id === null) {
      return;
    }

    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT id
      FROM ${table}
      WHERE id = ?
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new BadRequestException(message);
    }
  }

  private async generateCheckNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `CHK${datePart}`;
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT check_no
      FROM stock_check_order
      WHERE check_no LIKE ?
      ORDER BY check_no DESC
      LIMIT 1
    `,
      [`${prefix}%`],
    );
    const lastNo = typeof row?.check_no === 'string' ? row.check_no : '';
    const lastSequence = lastNo.startsWith(prefix) ? Number(lastNo.slice(prefix.length)) : 0;
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }
}

export interface StockCheckFilters {
  keyword?: string;
  status?: string;
}

const mapStockCheckOrder = (row: StockCheckOrderRow): StockCheckListItem => ({
  id: String(row.id),
  checkNo: row.check_no,
  status: row.status,
  operatorId: row.operator_id === null ? null : String(row.operator_id),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  startedAt: row.started_at?.toISOString() ?? null,
  completedAt: row.completed_at?.toISOString() ?? null,
  detailCount: Number(row.detail_count),
  totalItems: Number(row.total_items),
  pendingItems: Number(row.pending_items),
});

const mapStockCheckDetail = (row: StockCheckDetailRow): StockCheckDetailItem => ({
  id: String(row.id),
  stockCheckId: String(row.stock_check_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  batchId: String(row.batch_id),
  batchCode: row.batch_code,
  stockStatus: row.stock_status as WarehouseStockStatus,
  systemQuantity: String(row.system_quantity),
  actualQuantity: String(row.actual_quantity),
  differenceQuantity: String(row.difference_quantity),
  result: row.result,
  adjusted: row.adjusted === 1,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
});

const readCheckStatus = (value: string) => {
  if (!CHECK_STATUSES.has(value as StockCheckStatus)) {
    throw new BadRequestException('Invalid stock check status');
  }

  return value as StockCheckStatus;
};

const readStockStatus = (value: string) => {
  if (!STOCK_STATUSES.has(value as WarehouseStockStatus)) {
    throw new BadRequestException('Invalid stock status');
  }

  return value as WarehouseStockStatus;
};

const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const readPositiveId = (value: string | number | null | undefined, message: string) => {
  if (value === null || value === undefined || value === '') {
    throw new BadRequestException(message);
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

const nullablePositiveId = (value: string | number | null | undefined, message: string) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return readPositiveId(value, message);
};

const readNonNegativeDecimal = (value: string | number, message: string) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new BadRequestException(message);
  }

  return numberValue.toFixed(4);
};
