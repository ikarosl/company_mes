import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateReturnOrderPayload,
  ReturnOrderDetail,
  ReturnOrderListItem,
  ReturnOrderStatus,
  WarehouseStockStatus,
} from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface ReturnOrderRow extends RowDataPacket {
  id: number;
  return_no: string;
  production_batch_id: number;
  work_order_id: number | null;
  status: ReturnOrderStatus;
  operator_id: number | null;
  version: number;
  remark: string | null;
  created_at: Date;
  return_at: Date | null;
  detail_count: number;
  total_return_number: string;
}

interface ReturnDetailRow extends RowDataPacket {
  id: number;
  return_id: number;
  production_batch_id: number;
  demand_id: number;
  allocation_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  batch_id: number;
  batch_code: string;
  return_number: string;
  return_stock_status: WarehouseStockStatus;
  release_after_return: number;
  remark: string | null;
  created_at: Date;
}

interface AllocationRow extends RowDataPacket {
  allocation_id: number;
  demand_id: number;
  production_batch_id: number;
  item_id: number;
  batch_id: number;
  assigned_number: string;
  available_outbound_quantity: string;
  outbound_quantity: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const RETURN_STATUSES = new Set<ReturnOrderStatus>(['待处理', '已入库', '已报废', '已取消']);
const STOCK_STATUSES = new Set<WarehouseStockStatus>(['可用', '待检', '冻结', '不良']);

@Injectable()
export class ReturnOrderRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /** 查询退料单列表，读取 return_order 并汇总明细数量。 */
  async listReturnOrders(filters: ReturnOrderFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM return_order ro
      WHERE ${where}
    `,
      params,
    );

    const rows = await this.database.query<ReturnOrderRow[]>(
      `
      SELECT
        ro.id,
        ro.return_no,
        ro.production_batch_id,
        ro.work_order_id,
        ro.status,
        ro.operator_id,
        ro.version,
        ro.remark,
        ro.created_at,
        ro.return_at,
        (
          SELECT COUNT(*)
          FROM return_detail rd
          WHERE rd.return_id = ro.id
        ) AS detail_count,
        (
          SELECT COALESCE(SUM(rd.return_number), 0)
          FROM return_detail rd
          WHERE rd.return_id = ro.id
        ) AS total_return_number
      FROM return_order ro
      WHERE ${where}
      ORDER BY ro.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapReturnOrder), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询退料单详情，包含退料明细。 */
  async getReturnOrder(id: number): Promise<ReturnOrderDetail> {
    const order = await this.getOrderRow(id);
    const details = await this.getDetailRows(id);

    return {
      ...mapReturnOrder(order),
      details: details.map(mapReturnDetail),
    };
  }

  /**
   * 创建退料单。
   * 明细需关联已分配的 allocation，退料数量不能超过该 allocation 的已出库数量。
   * releaseAfterReturn 控制退料后是否释放给公共库存。
   */
  async createReturnOrder(payload: CreateReturnOrderPayload) {
    const productionBatchId = readPositiveId(payload.productionBatchId, 'Missing production batch');
    const workOrderId = nullablePositiveId(payload.workOrderId, 'Invalid work order');
    const operatorId = nullablePositiveId(payload.operatorId, 'Invalid operator');
    const details = readDetails(payload.details);
    const returnNo = normalizeOptionalString(payload.returnNo) ?? (await this.generateReturnNo());
    const remark = normalizeOptionalString(payload.remark);

    await this.assertReturnNoAvailable(returnNo);

    const orderId = await this.database.transaction(async (connection) => {
      await this.assertOptionalReferenceExists(connection, 'work_orders', workOrderId, 'Work order not found');
      await this.assertOptionalReferenceExists(connection, 'production_batches', productionBatchId, 'Production batch not found');
      await this.assertOptionalReferenceExists(connection, 'users', operatorId, 'Operator not found');

      const orderResult = await execute(
        connection,
        `
        INSERT INTO return_order (
          return_no, production_batch_id, work_order_id, status, operator_id, remark, created_at
        )
        VALUES (?, ?, ?, '待处理', ?, ?, NOW())
      `,
        [returnNo, productionBatchId, workOrderId, operatorId, remark],
      );
      const createdOrderId = (orderResult as ResultSetHeader).insertId;
      const seenAllocations = new Set<number>();

      for (const detail of details) {
        if (seenAllocations.has(detail.allocationId)) {
          throw new ConflictException('Duplicate return detail allocation');
        }
        seenAllocations.add(detail.allocationId);

        const allocation = await this.getAllocationRow(connection, detail.allocationId);
        if (Number(allocation.production_batch_id) !== productionBatchId) {
          throw new BadRequestException('Allocation does not match production batch');
        }
        if (Number(allocation.outbound_quantity) < Number(detail.returnNumber)) {
          throw new BadRequestException('Return number exceeds outbound quantity for this allocation');
        }

        await execute(
          connection,
          `
          INSERT INTO return_detail (
            return_id, production_batch_id, demand_id, allocation_id, item_id, batch_id,
            return_number, return_stock_status, release_after_return, remark, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
          [
            createdOrderId,
            productionBatchId,
            allocation.demand_id,
            detail.allocationId,
            detail.itemId,
            detail.batchId,
            detail.returnNumber,
            detail.returnStockStatus,
            detail.releaseAfterReturn ? 1 : 0,
            detail.remark,
          ],
        );
      }

      return createdOrderId;
    });

    return this.getReturnOrder(orderId);
  }

  /** 确认退料入库，生成正数 inventory_transaction（退料入库类型）。 */
  async confirmReturnInbound(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '待处理') {
        throw new BadRequestException('Only pending return order can be confirmed for inbound');
      }

      const details = await this.getDetailRows(id, connection);
      if (details.length === 0) {
        throw new BadRequestException('Return order has no details');
      }

      for (const detail of details) {
        await execute(
          connection,
          `
          INSERT INTO inventory_transaction (
            item_id, batch_id, transaction_type, quantity, stock_status,
            reference_type, reference_detail_id, idempotency_key, remark, created_at
          )
          VALUES (?, ?, '退料入库', ?, ?, 'RETURN_DETAIL', ?, ?, ?, NOW())
        `,
          [
            detail.item_id,
            detail.batch_id,
            detail.return_number,
            detail.return_stock_status,
            detail.id,
            `RETURN_DETAIL:${detail.id}`,
            detail.remark,
          ],
        );
      }

      await execute(
        connection,
        `
        UPDATE return_order
        SET status = '已入库',
          return_at = NOW(),
          version = version + 1
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getReturnOrder(id);
  }

  /** 确认退料报废，创建 item_scrap 记录并变更退料单状态。 */
  async confirmReturnScrap(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '待处理') {
        throw new BadRequestException('Only pending return order can be confirmed for scrap');
      }

      const details = await this.getDetailRows(id, connection);
      if (details.length === 0) {
        throw new BadRequestException('Return order has no details');
      }

      for (const detail of details) {
        const scrapNo = await this.generateScrapNo(connection);
        await execute(
          connection,
          `
          INSERT INTO item_scrap (
            scrap_no, production_batch_id, demand_id, allocation_id, item_id, batch_id,
            scrap_scene, scrap_number, status, reason, remark, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, 'RETURN_AFTER_OUTBOUND', ?, '已确认', ?, ?, NOW())
        `,
          [
            scrapNo,
            order.production_batch_id,
            detail.demand_id,
            detail.allocation_id,
            detail.item_id,
            detail.batch_id,
            detail.return_number,
            detail.remark,
            detail.remark,
          ],
        );
      }

      await execute(
        connection,
        `
        UPDATE return_order
        SET status = '已报废',
          return_at = NOW(),
          version = version + 1
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getReturnOrder(id);
  }

  /** 取消退料单，仅允许待处理状态的退料单取消。 */
  async cancelReturnOrder(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '待处理') {
        throw new BadRequestException('Only pending return order can be canceled');
      }

      await execute(
        connection,
        `
        UPDATE return_order
        SET status = '已取消',
          version = version + 1
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getReturnOrder(id);
  }

  private buildListFilters(filters: ReturnOrderFilters) {
    const clauses: string[] = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('ro.return_no LIKE ?');
      params.push(`%${filters.keyword.trim()}%`);
    }

    if (filters.status?.trim()) {
      clauses.push('ro.status = ?');
      params.push(readReturnStatus(filters.status));
    }

    if (filters.productionBatchId?.trim()) {
      clauses.push('ro.production_batch_id = ?');
      params.push(readPositiveId(filters.productionBatchId, 'Invalid production batch'));
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getOrderRow(id: number, executor: DbExecutor = this.database, lock = false) {
    const rows = await query<ReturnOrderRow[]>(
      executor,
      `
      SELECT
        ro.id,
        ro.return_no,
        ro.production_batch_id,
        ro.work_order_id,
        ro.status,
        ro.operator_id,
        ro.version,
        ro.remark,
        ro.created_at,
        ro.return_at,
        (
          SELECT COUNT(*)
          FROM return_detail rd
          WHERE rd.return_id = ro.id
        ) AS detail_count,
        (
          SELECT COALESCE(SUM(rd.return_number), 0)
          FROM return_detail rd
          WHERE rd.return_id = ro.id
        ) AS total_return_number
      FROM return_order ro
      WHERE ro.id = ?
      ${lock ? 'FOR UPDATE' : ''}
    `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Return order not found');
    }

    return row;
  }

  private async getDetailRows(id: number, executor: DbExecutor = this.database) {
    return query<ReturnDetailRow[]>(
      executor,
      `
      SELECT
        rd.id,
        rd.return_id,
        rd.production_batch_id,
        rd.demand_id,
        rd.allocation_id,
        rd.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        rd.batch_id,
        ib.batch_code,
        rd.return_number,
        rd.return_stock_status,
        rd.release_after_return,
        rd.remark,
        rd.created_at
      FROM return_detail rd
      INNER JOIN products p ON p.id = rd.item_id
      INNER JOIN item_batch ib ON ib.id = rd.batch_id AND ib.item_id = rd.item_id
      WHERE rd.return_id = ?
      ORDER BY rd.id ASC
    `,
      [id],
    );
  }

  private async getAllocationRow(executor: DbExecutor, allocationId: number) {
    const [row] = await query<AllocationRow[]>(
      executor,
      `
      SELECT
        pias.allocation_id,
        pias.demand_id,
        pias.production_batch_id,
        pias.item_id,
        pias.batch_id,
        pias.assigned_number,
        pias.available_outbound_quantity,
        COALESCE(pias.outbound_quantity, 0) AS outbound_quantity
      FROM v_production_item_allocation_summary pias
      WHERE pias.allocation_id = ?
      LIMIT 1
    `,
      [allocationId],
    );

    if (!row) {
      throw new BadRequestException('Allocation not found');
    }

    return row;
  }

  private async assertReturnNoAvailable(returnNo: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM return_order
      WHERE return_no = ?
      LIMIT 1
    `,
      [returnNo],
    );

    if (row) {
      throw new ConflictException('Return order no already exists');
    }
  }

  private async assertOptionalReferenceExists(
    executor: DbExecutor,
    table: 'work_orders' | 'production_batches' | 'users',
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

  private async generateReturnNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `RTN${datePart}`;
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT return_no
      FROM return_order
      WHERE return_no LIKE ?
      ORDER BY return_no DESC
      LIMIT 1
    `,
      [`${prefix}%`],
    );
    const lastNo = typeof row?.return_no === 'string' ? row.return_no : '';
    const lastSequence = lastNo.startsWith(prefix) ? Number(lastNo.slice(prefix.length)) : 0;
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }

  private async generateScrapNo(executor: DbExecutor) {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `SCR${datePart}`;
    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT scrap_no
      FROM item_scrap
      WHERE scrap_no LIKE ?
      ORDER BY scrap_no DESC
      LIMIT 1
    `,
      [`${prefix}%`],
    );
    const lastNo = typeof row?.scrap_no === 'string' ? row.scrap_no : '';
    const lastSequence = lastNo.startsWith(prefix) ? Number(lastNo.slice(prefix.length)) : 0;
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }
}

export interface ReturnOrderFilters {
  keyword?: string;
  status?: string;
  productionBatchId?: string;
}

interface NormalizedReturnDetail {
  allocationId: number;
  itemId: number;
  batchId: number;
  returnNumber: string;
  returnStockStatus: WarehouseStockStatus;
  releaseAfterReturn: boolean;
  remark: string | null;
}

const mapReturnOrder = (row: ReturnOrderRow): ReturnOrderListItem => ({
  id: String(row.id),
  returnNo: row.return_no,
  productionBatchId: String(row.production_batch_id),
  workOrderId: row.work_order_id === null ? null : String(row.work_order_id),
  status: row.status,
  operatorId: row.operator_id === null ? null : String(row.operator_id),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  returnAt: row.return_at?.toISOString() ?? null,
  detailCount: Number(row.detail_count),
  totalReturnNumber: String(row.total_return_number),
});

const mapReturnDetail = (row: ReturnDetailRow) => ({
  id: String(row.id),
  returnId: String(row.return_id),
  productionBatchId: String(row.production_batch_id),
  demandId: String(row.demand_id),
  allocationId: String(row.allocation_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  batchId: String(row.batch_id),
  batchCode: row.batch_code,
  returnNumber: String(row.return_number),
  returnStockStatus: row.return_stock_status as WarehouseStockStatus,
  releaseAfterReturn: row.release_after_return === 1,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
});

const readDetails = (details: CreateReturnOrderPayload['details']): NormalizedReturnDetail[] => {
  if (!Array.isArray(details) || details.length === 0) {
    throw new BadRequestException('Missing return details');
  }

  return details.map((detail, index) => ({
    allocationId: readPositiveId(detail.allocationId, `Missing allocation at row ${index + 1}`),
    itemId: readPositiveId(detail.itemId, `Missing item at row ${index + 1}`),
    batchId: readPositiveId(detail.batchId, `Missing batch at row ${index + 1}`),
    returnNumber: readPositiveDecimal(detail.returnNumber, `Invalid return number at row ${index + 1}`),
    returnStockStatus: readStockStatus(detail.returnStockStatus ?? '可用'),
    releaseAfterReturn: detail.releaseAfterReturn ?? false,
    remark: normalizeOptionalString(detail.remark),
  }));
};

const readReturnStatus = (value: string) => {
  if (!RETURN_STATUSES.has(value as ReturnOrderStatus)) {
    throw new BadRequestException('Invalid return status');
  }

  return value as ReturnOrderStatus;
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

const readPositiveDecimal = (value: string | number, message: string) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new BadRequestException(message);
  }

  return numberValue.toFixed(4);
};
