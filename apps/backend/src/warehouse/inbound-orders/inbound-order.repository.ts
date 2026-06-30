import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateInboundOrderPayload,
  InboundOrderDetail,
  InboundOrderListItem,
  InboundOrderStatus,
  InventoryTransactionType,
  StockOrderBusinessType,
  WarehouseSourceType,
  WarehouseStockStatus,
} from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface InboundOrderRow extends RowDataPacket {
  id: number;
  order_no: string;
  business_type: StockOrderBusinessType;
  provider: string | null;
  work_order_id: number | null;
  production_batch_id: number | null;
  status: InboundOrderStatus;
  operated_at: Date | null;
  operator_id: number | null;
  version: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
  detail_count: number;
  total_inbound_number: string;
}

interface InboundDetailRow extends RowDataPacket {
  id: number;
  order_id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  batch_id: number;
  batch_code: string;
  quantity: string;
  stock_status: WarehouseStockStatus;
  source_stage: string | null;
  remark: string | null;
  created_at: Date;
}

interface BatchRow extends RowDataPacket {
  id: number;
  item_id: number;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface InboundOrderFilters {
  keyword?: string;
  sourceType?: string;
  status?: string;
}

const SOURCE_TYPES = new Set<WarehouseSourceType>(['自产', '外购', '委外', '退货入库', '盘点生成', '其他']);
const STOCK_STATUSES = new Set<WarehouseStockStatus>(['可用', '待检', '冻结', '不良']);
const INBOUND_STATUSES = new Set<InboundOrderStatus>(['待确认', '已完成', '已取消']);

@Injectable()
export class InboundOrderRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /** 查询统一库存单据中的入库主单，并汇总明细数量，供入库管理表格展示。 */
  async listInboundOrders(filters: InboundOrderFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM stock_order io
      WHERE ${where}
    `,
      params,
    );

    const rows = await this.database.query<InboundOrderRow[]>(
      `
      SELECT
        io.id,
        io.order_no,
        io.business_type,
        io.provider,
        io.work_order_id,
        io.production_batch_id,
        io.status,
        io.operated_at,
        io.operator_id,
        io.version,
        io.remark,
        io.created_at,
        io.updated_at,
        (
          SELECT COUNT(*)
          FROM stock_order_detail idt
          WHERE idt.order_id = io.id
        ) AS detail_count,
        (
          SELECT COALESCE(SUM(idt.quantity), 0)
          FROM stock_order_detail idt
          WHERE idt.order_id = io.id
        ) AS total_inbound_number
      FROM stock_order io
      WHERE ${where}
      ORDER BY io.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapInboundOrder), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询入库单详情，包含入库对象、批次和明细数量。 */
  async getInboundOrder(id: number): Promise<InboundOrderDetail> {
    const order = await this.getOrderRow(id);
    const details = await this.getDetailRows(id);

    return {
      ...mapInboundOrder(order),
      details: details.map(mapInboundDetail),
    };
  }

  /**
   * 创建待确认入库单。
   * 明细传入已有 batchId 时直接使用该批次；否则按 itemId + batchCode 创建或复用库存批次。
   */
  async createInboundOrder(payload: CreateInboundOrderPayload) {
    const sourceType = readSourceType(payload.sourceType);
    const businessType = toInboundBusinessType(sourceType);
    const details = readDetails(payload.details);
    const inboundNo = normalizeOptionalString(payload.inboundNo) ?? (await this.generateInboundNo());
    const provider = normalizeOptionalString(payload.provider);
    const workOrderId = nullablePositiveId(payload.workOrderId, 'Invalid work order');
    const productionBatchId = nullablePositiveId(payload.productionBatchId, 'Invalid production batch');
    const operatorId = nullablePositiveId(payload.operatorId, 'Invalid operator');
    const remark = normalizeOptionalString(payload.remark);

    await this.assertInboundNoAvailable(inboundNo);

    const orderId = await this.database.transaction(async (connection) => {
      await this.assertOptionalReferenceExists(connection, 'work_orders', workOrderId, 'Work order not found');
      await this.assertOptionalReferenceExists(connection, 'production_batches', productionBatchId, 'Production batch not found');
      await this.assertOptionalReferenceExists(connection, 'users', operatorId, 'Operator not found');

      const orderResult = await execute(
        connection,
        `
        INSERT INTO stock_order (
          order_no, order_direction, business_type, provider, work_order_id, production_batch_id,
          status, operator_id, remark, created_at, updated_at
        )
        VALUES (?, '入库', ?, ?, ?, ?, '待确认', ?, ?, NOW(), NOW())
      `,
        [inboundNo, businessType, provider, workOrderId, productionBatchId, operatorId, remark],
      );

      const createdOrderId = (orderResult as ResultSetHeader).insertId;
      const seenDetails = new Set<string>();

      for (const detail of details) {
        await this.assertItemExists(connection, detail.itemId);
        const batchId = await this.resolveBatchId(connection, detail, {
          sourceType,
          provider,
          workOrderId,
          productionBatchId,
        });
        const detailKey = `${detail.itemId}:${batchId}`;

        if (seenDetails.has(detailKey)) {
          throw new ConflictException('Duplicate inbound detail batch');
        }
        seenDetails.add(detailKey);

        await execute(
          connection,
          `
          INSERT INTO stock_order_detail (
            order_id, item_id, batch_id, quantity, stock_status, source_stage, remark, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `,
          [
            createdOrderId,
            detail.itemId,
            batchId,
            detail.inboundNumber,
            detail.stockStatus,
            detail.sourceStage,
            detail.remark,
          ],
        );
      }

      return createdOrderId;
    });

    return this.getInboundOrder(orderId);
  }

  /** 确认入库时只追加库存流水，不回写批次数量，库存统一由 inventory_transaction 汇总。 */
  async confirmInboundOrder(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '待确认') {
        throw new BadRequestException('Only pending inbound order can be confirmed');
      }

      const details = await this.getDetailRows(id, connection);
      if (details.length === 0) {
        throw new BadRequestException('Inbound order has no details');
      }

      const transactionType = toInventoryTransactionType(order.business_type);
      for (const detail of details) {
        await execute(
          connection,
          `
          INSERT INTO inventory_transaction (
            item_id, batch_id, stock_order_id, stock_order_detail_id, transaction_type, quantity, stock_status,
            reference_type, reference_detail_id, idempotency_key, remark, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'STOCK_ORDER_DETAIL', ?, ?, ?, NOW())
        `,
          [
            detail.item_id,
            detail.batch_id,
            order.id,
            detail.id,
            transactionType,
            detail.quantity,
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

    return this.getInboundOrder(id);
  }

  /** 取消仅允许待确认入库主单，已经确认的库存事实必须通过后续反向业务处理。 */
  async cancelInboundOrder(id: number) {
    await this.database.transaction(async (connection) => {
      const order = await this.getOrderRow(id, connection, true);
      if (order.status !== '待确认') {
        throw new BadRequestException('Only pending inbound order can be canceled');
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

    return this.getInboundOrder(id);
  }

  private buildListFilters(filters: InboundOrderFilters) {
    const clauses = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(io.order_no LIKE ? OR io.provider LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword);
    }

    if (filters.sourceType?.trim()) {
      clauses.push('io.business_type = ?');
      params.push(toInboundBusinessType(readSourceType(filters.sourceType)));
    }

    if (filters.status?.trim()) {
      clauses.push('io.status = ?');
      params.push(readInboundStatus(filters.status));
    }

    clauses.push("io.order_direction = '入库'");

    return { where: clauses.join(' AND '), params };
  }

  private async getOrderRow(id: number, executor: DbExecutor = this.database, lock = false) {
    const rows = await query<InboundOrderRow[]>(
      executor,
      `
      SELECT
        io.id,
        io.order_no,
        io.business_type,
        io.provider,
        io.work_order_id,
        io.production_batch_id,
        io.status,
        io.operated_at,
        io.operator_id,
        io.version,
        io.remark,
        io.created_at,
        io.updated_at,
        (
          SELECT COUNT(*)
          FROM stock_order_detail idt
          WHERE idt.order_id = io.id
        ) AS detail_count,
        (
          SELECT COALESCE(SUM(idt.quantity), 0)
          FROM stock_order_detail idt
          WHERE idt.order_id = io.id
        ) AS total_inbound_number
      FROM stock_order io
      WHERE io.id = ? AND io.order_direction = '入库'
      ${lock ? 'FOR UPDATE' : ''}
    `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Inbound order not found');
    }

    return row;
  }

  private async getDetailRows(id: number, executor: DbExecutor = this.database) {
    return query<InboundDetailRow[]>(
      executor,
      `
      SELECT
        idt.id,
        idt.order_id,
        idt.item_id,
        ii.item_code,
        ii.item_name,
        idt.batch_id,
        ib.batch_code,
        idt.quantity,
        idt.stock_status,
        idt.source_stage,
        idt.remark,
        idt.created_at
      FROM stock_order_detail idt
      INNER JOIN item_info ii ON ii.id = idt.item_id
      INNER JOIN item_batch ib ON ib.id = idt.batch_id AND ib.item_id = idt.item_id
      WHERE idt.order_id = ?
      ORDER BY idt.id ASC
    `,
      [id],
    );
  }

  private async resolveBatchId(
    executor: DbExecutor,
    detail: NormalizedInboundDetail,
    context: {
      sourceType: WarehouseSourceType;
      provider: string | null;
      workOrderId: number | null;
      productionBatchId: number | null;
    },
  ) {
    if (detail.batchId !== null) {
      const [batch] = await query<BatchRow[]>(
        executor,
        `
        SELECT id, item_id
        FROM item_batch
        WHERE id = ?
        LIMIT 1
      `,
        [detail.batchId],
      );

      if (!batch) {
        throw new BadRequestException('Inbound batch not found');
      }
      if (Number(batch.item_id) !== detail.itemId) {
        throw new BadRequestException('Inbound batch does not match item');
      }

      return detail.batchId;
    }

    if (!detail.batchCode) {
      throw new BadRequestException('Missing batch code');
    }

    const [existing] = await query<BatchRow[]>(
      executor,
      `
      SELECT id, item_id
      FROM item_batch
      WHERE item_id = ? AND batch_code = ?
      LIMIT 1
    `,
      [detail.itemId, detail.batchCode],
    );

    if (existing) {
      return Number(existing.id);
    }

    const result = await execute(
      executor,
      `
      INSERT INTO item_batch (
        item_id, batch_code, source_type, provider, source_work_order_id,
        source_production_batch_id, production_date, batch_status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, '可用', ?, NOW(), NOW())
    `,
      [
        detail.itemId,
        detail.batchCode,
        context.sourceType,
        context.provider,
        context.workOrderId,
        context.productionBatchId,
        detail.productionDate,
        detail.remark,
      ],
    );

    return (result as ResultSetHeader).insertId;
  }

  private async assertInboundNoAvailable(inboundNo: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM stock_order
      WHERE order_no = ?
      LIMIT 1
    `,
      [inboundNo],
    );

    if (row) {
      throw new ConflictException('Inbound order no already exists');
    }
  }

  private async assertItemExists(executor: DbExecutor, itemId: number) {
    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT id
      FROM item_info
      WHERE id = ? AND status = '启用'
      LIMIT 1
    `,
      [itemId],
    );

    if (!row) {
      throw new BadRequestException('Warehouse item not found or disabled');
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

  private async generateInboundNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate(),
    ).padStart(2, '0')}`;
    const prefix = `IN${datePart}`;
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

interface NormalizedInboundDetail {
  itemId: number;
  batchId: number | null;
  batchCode: string | null;
  productionDate: string | null;
  inboundNumber: string;
  stockStatus: WarehouseStockStatus;
  sourceStage: string | null;
  remark: string | null;
}

const mapInboundOrder = (row: InboundOrderRow): InboundOrderListItem => ({
  id: String(row.id),
  inboundNo: row.order_no,
  sourceType: toSourceType(row.business_type),
  businessType: row.business_type,
  provider: row.provider,
  workOrderId: row.work_order_id === null ? null : String(row.work_order_id),
  productionBatchId: row.production_batch_id === null ? null : String(row.production_batch_id),
  status: row.status,
  inboundAt: row.operated_at?.toISOString() ?? null,
  operatorId: row.operator_id === null ? null : String(row.operator_id),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  detailCount: Number(row.detail_count),
  totalInboundNumber: String(row.total_inbound_number),
});

const mapInboundDetail = (row: InboundDetailRow) => ({
  id: String(row.id),
  inboundId: String(row.order_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  batchId: String(row.batch_id),
  batchCode: row.batch_code,
  inboundNumber: String(row.quantity),
  stockStatus: row.stock_status,
  sourceStage: row.source_stage,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
});

const readDetails = (details: CreateInboundOrderPayload['details']): NormalizedInboundDetail[] => {
  if (!Array.isArray(details) || details.length === 0) {
    throw new BadRequestException('Missing inbound details');
  }

  return details.map((detail, index) => ({
    itemId: readPositiveId(detail.itemId, `Missing item at row ${index + 1}`),
    batchId: nullablePositiveId(detail.batchId, `Invalid batch at row ${index + 1}`),
    batchCode: normalizeOptionalString(detail.batchCode),
    productionDate: normalizeOptionalDate(detail.productionDate),
    inboundNumber: readPositiveDecimal(detail.inboundNumber, `Invalid inbound number at row ${index + 1}`),
    stockStatus: readStockStatus(detail.stockStatus ?? '可用'),
    sourceStage: normalizeOptionalString(detail.sourceStage),
    remark: normalizeOptionalString(detail.remark),
  }));
};

const toInboundBusinessType = (sourceType: WarehouseSourceType): StockOrderBusinessType => {
  if (sourceType === '自产') {
    return '生产入库';
  }
  if (sourceType === '委外') {
    return '委外入库';
  }
  if (sourceType === '退货入库') {
    return '退货入库';
  }
  if (sourceType === '盘点生成') {
    return '盘点生成';
  }
  if (sourceType === '其他') {
    return '其他入库';
  }

  return '采购入库';
};

const toSourceType = (businessType: StockOrderBusinessType): WarehouseSourceType => {
  if (businessType === '生产入库') {
    return '自产';
  }
  if (businessType === '委外入库') {
    return '委外';
  }
  if (businessType === '退货入库') {
    return '退货入库';
  }
  if (businessType === '盘点生成') {
    return '盘点生成';
  }
  if (businessType === '其他入库') {
    return '其他';
  }

  return '外购';
};

const toInventoryTransactionType = (businessType: StockOrderBusinessType): InventoryTransactionType => {
  if (businessType === '盘点生成') {
    return '盘点调整';
  }
  if (businessType === '其他入库') {
    return '采购入库';
  }

  return businessType as InventoryTransactionType;
};

const readSourceType = (value: string) => {
  if (!SOURCE_TYPES.has(value as WarehouseSourceType)) {
    throw new BadRequestException('Invalid source type');
  }

  return value as WarehouseSourceType;
};

const readStockStatus = (value: string) => {
  if (!STOCK_STATUSES.has(value as WarehouseStockStatus)) {
    throw new BadRequestException('Invalid stock status');
  }

  return value as WarehouseStockStatus;
};

const readInboundStatus = (value: string) => {
  if (!INBOUND_STATUSES.has(value as InboundOrderStatus)) {
    throw new BadRequestException('Invalid inbound status');
  }

  return value as InboundOrderStatus;
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

const normalizeOptionalDate = (value: string | null | undefined) => {
  const normalized = normalizeOptionalString(value);
  if (normalized === null) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00`))) {
    throw new BadRequestException('Invalid production date');
  }

  return normalized;
};
