import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateOutboundOrderPayload,
  OutboundOrderDetail,
  OutboundOrderListItem,
  OutboundOrderStatus,
  WarehouseStockStatus,
} from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface OutboundOrderRow extends RowDataPacket {
  id: number;
  order_no: string;
  work_order_id: number | null;
  production_batch_id: number | null;
  status: OutboundOrderStatus;
  operated_at: Date | null;
  operator_id: number | null;
  version: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
  detail_count: number;
  total_outbound_number: string;
}

interface OutboundDetailRow extends RowDataPacket {
  id: number;
  order_id: number;
  production_batch_id: number;
  demand_id: number;
  allocation_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  batch_id: number;
  batch_code: string;
  quantity: string;
  stock_status: WarehouseStockStatus;
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
  allocation_status: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface OutboundOrderFilters {
  keyword?: string;
  status?: string;
  productionBatchId?: string;
}

const OUTBOUND_STATUSES = new Set<OutboundOrderStatus>(['待确认', '已拣货', '已完成', '已取消']);
const STOCK_STATUSES = new Set<WarehouseStockStatus>(['可用', '待检', '冻结', '不良']);

@Injectable()
export class OutboundOrderRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /** 查询统一库存单据中的生产领料出库主单，并汇总明细数量。 */
  async listOutboundOrders(filters: OutboundOrderFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM stock_order so
      WHERE ${where}
    `,
      params,
    );

    const rows = await this.database.query<OutboundOrderRow[]>(
      `
      SELECT
        so.id,
        so.order_no,
        so.work_order_id,
        so.production_batch_id,
        so.status,
        so.operated_at,
        so.operator_id,
        so.version,
        so.remark,
        so.created_at,
        so.updated_at,
        (
          SELECT COUNT(*)
          FROM stock_order_detail sod
          WHERE sod.order_id = so.id
        ) AS detail_count,
        (
          SELECT COALESCE(SUM(sod.quantity), 0)
          FROM stock_order_detail sod
          WHERE sod.order_id = so.id
        ) AS total_outbound_number
      FROM stock_order so
      WHERE ${where}
      ORDER BY so.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapOutboundOrder), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询出库单详情，包含分配行、库存对象和库存批次信息。 */
  async getOutboundOrder(id: number): Promise<OutboundOrderDetail> {
    const order = await this.getOrderRow(id);
    const details = await this.getDetailRows(id);

    return {
      ...mapOutboundOrder(order),
      details: details.map(mapOutboundDetail),
    };
  }

  /**
   * 创建生产领料出库单。
   * 前端只提交分配行和本次出库数量，库存对象、批次和需求从 production_item_allocation 反查，避免追溯关系被绕开。
   */
  async createOutboundOrder(payload: CreateOutboundOrderPayload) {
    const productionBatchId = readPositiveId(payload.productionBatchId, 'Missing production batch');
    const workOrderId = nullablePositiveId(payload.workOrderId, 'Invalid work order');
    const operatorId = nullablePositiveId(payload.operatorId, 'Invalid operator');
    const details = readDetails(payload.details);
    const outboundNo = normalizeOptionalString(payload.outboundNo) ?? (await this.generateOutboundNo());
    const remark = normalizeOptionalString(payload.remark);

    await this.assertOrderNoAvailable(outboundNo);

    const orderId = await this.database.transaction(async (connection) => {
      await this.assertOptionalReferenceExists(connection, 'work_orders', workOrderId, 'Work order not found');
      await this.assertOptionalReferenceExists(connection, 'production_batches', productionBatchId, 'Production batch not found');
      await this.assertOptionalReferenceExists(connection, 'users', operatorId, 'Operator not found');

      const orderResult = await execute(
        connection,
        `
        INSERT INTO stock_order (
          order_no, order_direction, business_type, work_order_id, production_batch_id,
          status, operator_id, remark, created_at, updated_at
        )
        VALUES (?, '出库', '生产领料出库', ?, ?, '待确认', ?, ?, NOW(), NOW())
      `,
        [outboundNo, workOrderId, productionBatchId, operatorId, remark],
      );
      const createdOrderId = (orderResult as ResultSetHeader).insertId;
      const seenAllocations = new Set<number>();

      for (const detail of details) {
        if (seenAllocations.has(detail.allocationId)) {
          throw new ConflictException('Duplicate outbound allocation');
        }
        seenAllocations.add(detail.allocationId);

        const allocation = await this.getAllocationRow(connection, detail.allocationId);
        if (Number(allocation.production_batch_id) !== productionBatchId) {
          throw new BadRequestException('Allocation does not match production batch');
        }
        if (allocation.allocation_status !== '正常') {
          throw new BadRequestException('Allocation is not available for outbound');
        }
        if (Number(allocation.available_outbound_quantity) < Number(detail.outboundNumber)) {
          throw new BadRequestException('Outbound number exceeds available allocation quantity');
        }

        await execute(
          connection,
          `
          INSERT INTO stock_order_detail (
            order_id, item_id, batch_id, quantity, stock_status, production_batch_id,
            demand_id, allocation_id, remark, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `,
          [
            createdOrderId,
            allocation.item_id,
            allocation.batch_id,
            detail.outboundNumber,
            detail.stockStatus,
            productionBatchId,
            allocation.demand_id,
            allocation.allocation_id,
            detail.remark,
          ],
        );
      }

      return createdOrderId;
    });

    return this.getOutboundOrder(orderId);
  }

  /** 拣货只流转业务状态，不改变库存数量。 */
  async pickOutboundOrder(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '待确认') {
        throw new BadRequestException('Only pending outbound order can be picked');
      }

      await execute(
        connection,
        `
        UPDATE stock_order
        SET status = '已拣货',
          version = version + 1,
          updated_at = NOW()
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getOutboundOrder(id);
  }

  /** 确认出库时追加负数库存流水，不回写库存批次数量。 */
  async confirmOutboundOrder(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (!['待确认', '已拣货'].includes(order.status)) {
        throw new BadRequestException('Only pending or picked outbound order can be confirmed');
      }

      const details = await this.getDetailRows(id, connection);
      if (details.length === 0) {
        throw new BadRequestException('Outbound order has no details');
      }

      for (const detail of details) {
        const allocation = await this.getAllocationRow(connection, detail.allocation_id);
        if (Number(allocation.available_outbound_quantity) < Number(detail.quantity)) {
          throw new BadRequestException('Outbound number exceeds available allocation quantity');
        }

        await execute(
          connection,
          `
          INSERT INTO inventory_transaction (
            item_id, batch_id, stock_order_id, stock_order_detail_id, transaction_type, quantity, stock_status,
            reference_type, reference_detail_id, idempotency_key, remark, created_at
          )
          VALUES (?, ?, ?, ?, '生产领料出库', ?, ?, 'STOCK_ORDER_DETAIL', ?, ?, ?, NOW())
        `,
          [
            detail.item_id,
            detail.batch_id,
            order.id,
            detail.id,
            negativeDecimal(detail.quantity),
            detail.stock_status,
            detail.id,
            `STOCK_ORDER_DETAIL:${detail.id}`,
            detail.remark,
          ],
        );
      }

      await execute(
        connection,
        `
        UPDATE stock_order
        SET status = '已完成',
          operated_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getOutboundOrder(id);
  }

  /** 取消仅允许未完成的出库单，已经确认的库存事实必须通过后续反向业务处理。 */
  async cancelOutboundOrder(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status === '已完成') {
        throw new BadRequestException('Completed outbound order cannot be canceled');
      }
      if (order.status === '已取消') {
        throw new BadRequestException('Outbound order already canceled');
      }

      await execute(
        connection,
        `
        UPDATE stock_order
        SET status = '已取消',
          version = version + 1,
          updated_at = NOW()
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getOutboundOrder(id);
  }

  private buildListFilters(filters: OutboundOrderFilters) {
    const clauses = ["so.order_direction = '出库'", "so.business_type = '生产领料出库'"];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('so.order_no LIKE ?');
      params.push(`%${filters.keyword.trim()}%`);
    }

    if (filters.status?.trim()) {
      clauses.push('so.status = ?');
      params.push(readOutboundStatus(filters.status));
    }

    if (filters.productionBatchId?.trim()) {
      clauses.push('so.production_batch_id = ?');
      params.push(readPositiveId(filters.productionBatchId, 'Invalid production batch'));
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getOrderRow(id: number, executor: DbExecutor = this.database, lock = false) {
    const rows = await query<OutboundOrderRow[]>(
      executor,
      `
      SELECT
        so.id,
        so.order_no,
        so.work_order_id,
        so.production_batch_id,
        so.status,
        so.operated_at,
        so.operator_id,
        so.version,
        so.remark,
        so.created_at,
        so.updated_at,
        (
          SELECT COUNT(*)
          FROM stock_order_detail sod
          WHERE sod.order_id = so.id
        ) AS detail_count,
        (
          SELECT COALESCE(SUM(sod.quantity), 0)
          FROM stock_order_detail sod
          WHERE sod.order_id = so.id
        ) AS total_outbound_number
      FROM stock_order so
      WHERE so.id = ? AND so.order_direction = '出库' AND so.business_type = '生产领料出库'
      ${lock ? 'FOR UPDATE' : ''}
    `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Outbound order not found');
    }

    return row;
  }

  private async getDetailRows(id: number, executor: DbExecutor = this.database) {
    return query<OutboundDetailRow[]>(
      executor,
      `
      SELECT
        sod.id,
        sod.order_id,
        sod.production_batch_id,
        sod.demand_id,
        sod.allocation_id,
        sod.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        sod.batch_id,
        ib.batch_code,
        sod.quantity,
        sod.stock_status,
        sod.remark,
        sod.created_at
      FROM stock_order_detail sod
      INNER JOIN products p ON p.id = sod.item_id
      INNER JOIN item_batch ib ON ib.id = sod.batch_id AND ib.item_id = sod.item_id
      WHERE sod.order_id = ?
      ORDER BY sod.id ASC
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
        pia.allocation_status
      FROM v_production_item_allocation_summary pias
      INNER JOIN production_item_allocation pia ON pia.id = pias.allocation_id
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

  private async assertOrderNoAvailable(orderNo: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM stock_order
      WHERE order_no = ?
      LIMIT 1
    `,
      [orderNo],
    );

    if (row) {
      throw new ConflictException('Outbound order no already exists');
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

  private async generateOutboundNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const prefix = `OUT${datePart}`;
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT order_no
      FROM stock_order
      WHERE order_no LIKE ?
      ORDER BY order_no DESC
      LIMIT 1
    `,
      [`${prefix}%`],
    );
    const lastNo = typeof row?.order_no === 'string' ? row.order_no : '';
    const lastSequence = lastNo.startsWith(prefix) ? Number(lastNo.slice(prefix.length)) : 0;
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }
}

interface NormalizedOutboundDetail {
  allocationId: number;
  outboundNumber: string;
  stockStatus: WarehouseStockStatus;
  remark: string | null;
}

const mapOutboundOrder = (row: OutboundOrderRow): OutboundOrderListItem => ({
  id: String(row.id),
  outboundNo: row.order_no,
  businessType: '生产领料出库',
  workOrderId: row.work_order_id === null ? null : String(row.work_order_id),
  productionBatchId: row.production_batch_id === null ? null : String(row.production_batch_id),
  status: row.status,
  outboundAt: row.operated_at?.toISOString() ?? null,
  operatorId: row.operator_id === null ? null : String(row.operator_id),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  detailCount: Number(row.detail_count),
  totalOutboundNumber: String(row.total_outbound_number),
});

const mapOutboundDetail = (row: OutboundDetailRow) => ({
  id: String(row.id),
  outboundId: String(row.order_id),
  demandId: String(row.demand_id),
  allocationId: String(row.allocation_id),
  productionBatchId: String(row.production_batch_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  batchId: String(row.batch_id),
  batchCode: row.batch_code,
  outboundNumber: String(row.quantity),
  stockStatus: row.stock_status,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
});

const readDetails = (details: CreateOutboundOrderPayload['details']): NormalizedOutboundDetail[] => {
  if (!Array.isArray(details) || details.length === 0) {
    throw new BadRequestException('Missing outbound details');
  }

  return details.map((detail, index) => ({
    allocationId: readPositiveId(detail.allocationId, `Missing allocation at row ${index + 1}`),
    outboundNumber: readPositiveDecimal(detail.outboundNumber, `Invalid outbound number at row ${index + 1}`),
    stockStatus: readStockStatus(detail.stockStatus ?? '可用'),
    remark: normalizeOptionalString(detail.remark),
  }));
};

const readOutboundStatus = (value: string) => {
  if (!OUTBOUND_STATUSES.has(value as OutboundOrderStatus)) {
    throw new BadRequestException('Invalid outbound status');
  }

  return value as OutboundOrderStatus;
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

const negativeDecimal = (value: string | number) => (-Number(value)).toFixed(4);
