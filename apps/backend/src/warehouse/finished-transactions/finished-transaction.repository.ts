import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  FinishedInboundPayload,
  FinishedInventoryObjectType,
  FinishedInventoryOption,
  FinishedInventorySourceType,
  FinishedOutboundPayload,
  FinishedTransactionListItem,
  FinishedTransactionType,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import { execute, query } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface FinishedTransactionFilters {
  keyword?: string;
  transactionType?: string;
  inventoryBatchNo?: string;
  productionBatchNo?: string;
  objectType?: string;
}

interface FinishedInventoryOptionFilters {
  keyword?: string;
  objectType?: string;
}

interface FinishedTransactionRow extends RowDataPacket {
  id: number;
  flow_no: string | null;
  inventory_id: number;
  inventory_batch_no: string;
  batch_id: number | null;
  batch_no: string | null;
  product_id: number;
  product_model: string;
  product_name: string;
  object_type: FinishedInventoryObjectType;
  flow_type: FinishedTransactionType;
  flow_reason: string | null;
  quantity: number;
  unit: string | null;
  recorded_by_name: string | null;
  flow_date: Date;
  remark: string | null;
}

interface FinishedInventoryOptionRow extends RowDataPacket {
  id: number;
  inventory_batch_no: string;
  batch_id: number | null;
  batch_no: string | null;
  product_id: number;
  product_model: string;
  product_name: string;
  object_type: FinishedInventoryObjectType;
  quantity: number;
  unit: string | null;
}

interface ProductSnapshot extends RowDataPacket {
  id: number;
  product_model: string;
  product_name: string;
  unit: string | null;
}

interface ProductionBatchSnapshot extends ProductSnapshot {
  batch_id: number;
  batch_no: string;
  status: string;
}

interface InventoryRow extends RowDataPacket {
  id: number;
  inventory_batch_no: string;
  batch_id: number | null;
  product_id: number;
  object_type: FinishedInventoryObjectType;
  quantity: number;
  unit: string | null;
}

const SOURCE_TYPES = new Set<FinishedInventorySourceType>([
  'production',
  'purchase',
  'outsourcing',
  'stocktake',
  'other',
]);

const OBJECT_TYPES = new Set<FinishedInventoryObjectType>(['semi_finished', 'finished']);

const FLOW_TYPES = new Set<FinishedTransactionType>(['inbound', 'outbound', 'adjustment']);

@Injectable()
export class FinishedTransactionRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  async list(filters: FinishedTransactionFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildFilters(filters);
    const [count] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `
      SELECT COUNT(*) AS total
      FROM product_flow_records flow
      INNER JOIN product_inventory_batches inventory
        ON inventory.id = flow.inventory_id
        AND inventory.is_deleted = 0
      INNER JOIN products product ON product.id = flow.product_id AND product.is_deleted = 0
      LEFT JOIN production_batches batch ON batch.id = flow.batch_id AND batch.is_deleted = 0
      LEFT JOIN users operator_user ON operator_user.id = flow.operator_id
      WHERE flow.is_deleted = 0 AND ${where}
      `,
      params,
    );

    const rows = await this.database.query<FinishedTransactionRow[]>(
      `
      SELECT
        flow.id,
        flow.flow_no,
        flow.inventory_id,
        inventory.inventory_batch_no,
        flow.batch_id,
        batch.batch_no,
        flow.product_id,
        product.product_model,
        product.product_name,
        flow.object_type,
        flow.flow_type,
        flow.flow_reason,
        flow.quantity,
        inventory.unit,
        operator_user.display_name AS recorded_by_name,
        flow.flow_date,
        flow.remark
      FROM product_flow_records flow
      INNER JOIN product_inventory_batches inventory
        ON inventory.id = flow.inventory_id
        AND inventory.is_deleted = 0
      INNER JOIN products product ON product.id = flow.product_id AND product.is_deleted = 0
      LEFT JOIN production_batches batch ON batch.id = flow.batch_id AND batch.is_deleted = 0
      LEFT JOIN users operator_user ON operator_user.id = flow.operator_id
      WHERE flow.is_deleted = 0 AND ${where}
      ORDER BY flow.flow_date DESC, flow.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapTransaction), Number(count?.total ?? 0), pagination);
  }

  async listInventoryOptions(filters: FinishedInventoryOptionFilters) {
    const { where, params } = this.buildInventoryOptionFilters(filters);
    const rows = await this.database.query<FinishedInventoryOptionRow[]>(
      `
      SELECT
        inventory.id,
        inventory.inventory_batch_no,
        inventory.batch_id,
        batch.batch_no,
        inventory.product_id,
        product.product_model,
        product.product_name,
        inventory.object_type,
        inventory.quantity,
        inventory.unit
      FROM product_inventory_batches inventory
      INNER JOIN products product ON product.id = inventory.product_id AND product.is_deleted = 0
      LEFT JOIN production_batches batch ON batch.id = inventory.batch_id AND batch.is_deleted = 0
      WHERE inventory.is_deleted = 0
        AND inventory.quantity > 0
        AND ${where}
      ORDER BY inventory.id DESC
      LIMIT 200
      `,
      params,
    );

    return rows.map(mapInventoryOption);
  }

  /**
   * 成/半成品入库
   * 1. production 来源锁定已完成生产批次并带出产品
   * 2. 非 production 来源校验产品可用，生产批次允许为空
   * 3. 同一事务内新增/累加库存批次
   * 4. 同步写入 product_flow_records 入库流水
   */
  async inbound(payload: FinishedInboundPayload, userId: number) {
    const sourceType = readSourceType(payload.sourceType);
    const objectType = readObjectType(payload.objectType);
    const quantity = readPositiveInteger(payload.quantity, '入库数量必须为大于 0 的整数');
    const flowDate = today();

    const resolved =
      sourceType === 'production'
        ? await this.resolveProductionInbound(payload.productionBatchId)
        : await this.resolveProductInbound(payload.productId);

    const result = await this.database.transaction(async (connection) => {
      const batchNo = optional(payload.inventoryBatchNo) ?? (await this.generateInventoryBatchNo(connection));
      const existing =
        sourceType === 'production'
          ? await this.lockInventoryByProduction(
              connection,
              resolved.batchId,
              resolved.productId,
              objectType,
            )
          : await this.lockInventoryByBatchNo(connection, batchNo);

      if (existing && (existing.product_id !== resolved.productId || existing.object_type !== objectType)) {
        throw new ConflictException('该产品库存批次号已被其他产品或对象类型使用');
      }

      const inventoryId = existing
        ? await this.increaseInventory(connection, existing.id, quantity, userId, optional(payload.remark))
        : await this.createInventory(connection, {
            inventoryBatchNo: batchNo,
            batchId: resolved.batchId,
            productId: resolved.productId,
            sourceType,
            objectType,
            quantity,
            unit: resolved.unit,
            flowDate,
            remark: optional(payload.remark),
            userId,
          });

      // 入库流水与库存变更在同一事务完成，确保追溯链路不会出现库存有变更但无流水的状态。
      const flowId = await this.createFlow(connection, {
        inventoryId,
        batchId: resolved.batchId,
        productId: resolved.productId,
        objectType,
        flowType: 'inbound',
        flowReason: sourceType,
        quantity,
        flowDate,
        remark: optional(payload.remark),
        userId,
      });

      return { inventoryId, flowId };
    });

    this.auditContext.setAfterData(await this.getInventoryAuditSnapshot(result.inventoryId));
    return { inventoryId: String(result.inventoryId), flowId: String(result.flowId) };
  }

  /**
   * 成/半成品出库
   * 1. FOR UPDATE 锁定库存批次，防止并发超出库
   * 2. 校验本次出库数量不能超过当前库存数量
   * 3. 扣减 product_inventory_batches.quantity
   * 4. 写入 product_flow_records 出库流水
   */
  async outbound(payload: FinishedOutboundPayload, userId: number) {
    const inventoryId = positiveId(payload.inventoryId, '请选择产品库存批次');
    const quantity = readPositiveInteger(payload.quantity, '出库数量必须为大于 0 的整数');
    const flowDate = today();

    const result = await this.database.transaction(async (connection) => {
      const inventory = await this.lockInventoryById(connection, inventoryId);
      this.auditContext.setBeforeData(inventory);
      if (quantity > Number(inventory.quantity)) {
        throw new BadRequestException('出库数量不能超过当前库存数量');
      }

      await execute(
        connection,
        `
        UPDATE product_inventory_batches
        SET quantity = quantity - ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
        `,
        [quantity, userId, inventoryId],
      );

      const flowId = await this.createFlow(connection, {
        inventoryId,
        batchId: inventory.batch_id,
        productId: inventory.product_id,
        objectType: inventory.object_type,
        flowType: 'outbound',
        flowReason: 'outbound',
        quantity,
        flowDate,
        remark: optional(payload.remark),
        userId,
      });

      return { flowId };
    });

    this.auditContext.setAfterData(await this.getInventoryAuditSnapshot(inventoryId));
    return { success: true, flowId: String(result.flowId) };
  }

  private async resolveProductionInbound(batchIdValue: string | number | null | undefined) {
    const batchId = positiveId(batchIdValue, '请选择已完成生产批次');
    const [row] = await this.database.query<ProductionBatchSnapshot[]>(
      `
      SELECT
        batch.id AS batch_id,
        batch.batch_no,
        batch.status,
        product.id,
        product.product_model,
        product.product_name,
        product.unit
      FROM production_batches batch
      INNER JOIN work_orders work_order ON work_order.id = batch.work_order_id AND work_order.is_deleted = 0
      INNER JOIN products product ON product.id = work_order.product_id AND product.is_deleted = 0
      WHERE batch.id = ? AND batch.is_deleted = 0
      LIMIT 1
      `,
      [batchId],
    );

    if (!row) {
      throw new NotFoundException('生产批次不存在');
    }
    if (row.status !== 'completed') {
      throw new BadRequestException('只有已完成生产批次可以办理入库');
    }

    return {
      batchId: row.batch_id,
      productId: row.id,
      unit: row.unit,
    };
  }

  private async resolveProductInbound(productIdValue: string | number | null | undefined) {
    const productId = positiveId(productIdValue, '请选择产品');
    const [row] = await this.database.query<ProductSnapshot[]>(
      `
      SELECT id, product_model, product_name, unit
      FROM products
      WHERE id = ? AND status = 1 AND is_deleted = 0
      LIMIT 1
      `,
      [productId],
    );

    if (!row) {
      throw new NotFoundException('产品不存在或已停用');
    }

    return {
      batchId: null,
      productId: row.id,
      unit: row.unit,
    };
  }

  private async lockInventoryByProduction(
    connection: PoolConnection,
    batchId: number | null,
    productId: number,
    objectType: FinishedInventoryObjectType,
  ) {
    const [row] = await query<InventoryRow[]>(
      connection,
      `
      SELECT id, inventory_batch_no, batch_id, product_id, object_type, quantity, unit
      FROM product_inventory_batches
      WHERE batch_id = ?
        AND product_id = ?
        AND object_type = ?
        AND is_deleted = 0
      LIMIT 1
      FOR UPDATE
      `,
      [batchId, productId, objectType],
    );

    return row ?? null;
  }

  private async lockInventoryByBatchNo(connection: PoolConnection, inventoryBatchNo: string) {
    const [row] = await query<InventoryRow[]>(
      connection,
      `
      SELECT id, inventory_batch_no, batch_id, product_id, object_type, quantity, unit
      FROM product_inventory_batches
      WHERE inventory_batch_no = ? AND is_deleted = 0
      LIMIT 1
      FOR UPDATE
      `,
      [inventoryBatchNo],
    );

    return row ?? null;
  }

  private async lockInventoryById(connection: PoolConnection, inventoryId: number) {
    const [row] = await query<InventoryRow[]>(
      connection,
      `
      SELECT id, inventory_batch_no, batch_id, product_id, object_type, quantity, unit
      FROM product_inventory_batches
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
      FOR UPDATE
      `,
      [inventoryId],
    );

    if (!row) {
      throw new NotFoundException('产品库存批次不存在');
    }

    return row;
  }

  private async createInventory(
    connection: PoolConnection,
    payload: {
      inventoryBatchNo: string;
      batchId: number | null;
      productId: number;
      sourceType: FinishedInventorySourceType;
      objectType: FinishedInventoryObjectType;
      quantity: number;
      unit: string | null;
      flowDate: string;
      remark: string | null;
      userId: number;
    },
  ) {
    const result = (await execute(
      connection,
      `
      INSERT INTO product_inventory_batches (
        inventory_batch_no, batch_id, product_id, source_type, object_type,
        quantity, unit, received_date, remark, created_by, created_at, updated_by, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
      `,
      [
        payload.inventoryBatchNo,
        payload.batchId,
        payload.productId,
        payload.sourceType,
        payload.objectType,
        payload.quantity,
        payload.unit,
        payload.flowDate,
        payload.remark,
        payload.userId,
        payload.userId,
      ],
    )) as ResultSetHeader;

    return result.insertId;
  }

  private async increaseInventory(
    connection: PoolConnection,
    inventoryId: number,
    quantity: number,
    userId: number,
    remark: string | null,
  ) {
    await execute(
      connection,
      `
      UPDATE product_inventory_batches
      SET quantity = quantity + ?,
        remark = COALESCE(?, remark),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
      `,
      [quantity, remark, userId, inventoryId],
    );

    return inventoryId;
  }

  private async createFlow(
    connection: PoolConnection,
    payload: {
      inventoryId: number;
      batchId: number | null;
      productId: number;
      objectType: FinishedInventoryObjectType;
      flowType: FinishedTransactionType;
      flowReason: string;
      quantity: number;
      flowDate: string;
      remark: string | null;
      userId: number;
    },
  ) {
    const flowNo = await this.generateFlowNo(connection);
    const result = (await execute(
      connection,
      `
      INSERT INTO product_flow_records (
        flow_no, inventory_id, batch_id, product_id, object_type,
        flow_type, flow_reason, quantity, operator_id, flow_date,
        remark, created_by, created_at, updated_by, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW())
      `,
      [
        flowNo,
        payload.inventoryId,
        payload.batchId,
        payload.productId,
        payload.objectType,
        payload.flowType,
        payload.flowReason,
        payload.quantity,
        payload.userId,
        payload.flowDate,
        payload.remark,
        payload.userId,
        payload.userId,
      ],
    )) as ResultSetHeader;

    return result.insertId;
  }

  private async generateInventoryBatchNo(connection: PoolConnection) {
    const dateText = compactDate();
    const [row] = await query<(RowDataPacket & { total: number })[]>(
      connection,
      `
      SELECT COUNT(*) AS total
      FROM product_inventory_batches
      WHERE inventory_batch_no LIKE ? AND is_deleted = 0
      `,
      [`PIB-${dateText}-%`],
    );

    return `PIB-${dateText}-${String(Number(row?.total ?? 0) + 1).padStart(3, '0')}`;
  }

  private async generateFlowNo(connection: PoolConnection) {
    const dateText = compactDate();
    const [row] = await query<(RowDataPacket & { total: number })[]>(
      connection,
      `
      SELECT COUNT(*) AS total
      FROM product_flow_records
      WHERE flow_no LIKE ? AND is_deleted = 0
      `,
      [`PFR-${dateText}-%`],
    );

    return `PFR-${dateText}-${String(Number(row?.total ?? 0) + 1).padStart(3, '0')}`;
  }

  private async getInventoryAuditSnapshot(inventoryId: number) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT
        id, inventory_batch_no, batch_id, product_id, source_type, object_type,
        quantity, unit, received_date, location, remark, updated_by, updated_at
      FROM product_inventory_batches
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
      `,
      [inventoryId],
    );
    return row ?? null;
  }

  private buildFilters(filters: FinishedTransactionFilters) {
    const clauses: string[] = ['1 = 1'];
    const params: QueryParam[] = [];
    if (filters.keyword?.trim()) {
      clauses.push(`(
        product.product_model LIKE ?
        OR product.product_name LIKE ?
        OR inventory.inventory_batch_no LIKE ?
        OR batch.batch_no LIKE ?
        OR flow.flow_no LIKE ?
        OR flow.remark LIKE ?
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }
    if (FLOW_TYPES.has(filters.transactionType as FinishedTransactionType)) {
      clauses.push('flow.flow_type = ?');
      params.push(filters.transactionType as string);
    }
    if (OBJECT_TYPES.has(filters.objectType as FinishedInventoryObjectType)) {
      clauses.push('flow.object_type = ?');
      params.push(filters.objectType as string);
    }
    if (filters.inventoryBatchNo?.trim()) {
      clauses.push('inventory.inventory_batch_no LIKE ?');
      params.push(`%${filters.inventoryBatchNo.trim()}%`);
    }
    if (filters.productionBatchNo?.trim()) {
      clauses.push('batch.batch_no LIKE ?');
      params.push(`%${filters.productionBatchNo.trim()}%`);
    }

    return { where: clauses.join(' AND '), params };
  }

  private buildInventoryOptionFilters(filters: FinishedInventoryOptionFilters) {
    const clauses: string[] = ['1 = 1'];
    const params: QueryParam[] = [];
    if (filters.keyword?.trim()) {
      clauses.push(`(
        product.product_model LIKE ?
        OR product.product_name LIKE ?
        OR inventory.inventory_batch_no LIKE ?
        OR batch.batch_no LIKE ?
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }
    if (OBJECT_TYPES.has(filters.objectType as FinishedInventoryObjectType)) {
      clauses.push('inventory.object_type = ?');
      params.push(filters.objectType as string);
    }

    return { where: clauses.join(' AND '), params };
  }
}

const mapTransaction = (row: FinishedTransactionRow): FinishedTransactionListItem => ({
  id: String(row.id),
  flowNo: row.flow_no,
  transactionType: row.flow_type,
  inventoryId: String(row.inventory_id),
  inventoryBatchNo: row.inventory_batch_no,
  productionBatchId: row.batch_id === null ? null : String(row.batch_id),
  productionBatchNo: row.batch_no,
  productId: String(row.product_id),
  productModel: row.product_model,
  productName: row.product_name,
  objectType: row.object_type,
  flowReason: row.flow_reason,
  quantity: String(row.quantity),
  unit: row.unit,
  recordedByName: row.recorded_by_name,
  recordedAt: formatDate(row.flow_date),
  remark: row.remark,
});

const mapInventoryOption = (row: FinishedInventoryOptionRow): FinishedInventoryOption => ({
  id: String(row.id),
  inventoryBatchNo: row.inventory_batch_no,
  productionBatchId: row.batch_id === null ? null : String(row.batch_id),
  productionBatchNo: row.batch_no,
  productId: String(row.product_id),
  productModel: row.product_model,
  productName: row.product_name,
  objectType: row.object_type,
  quantity: String(row.quantity),
  unit: row.unit,
});

const readSourceType = (value: string | null | undefined) => {
  if (!SOURCE_TYPES.has(value as FinishedInventorySourceType)) {
    throw new BadRequestException('请选择正确的入库类型');
  }

  return value as FinishedInventorySourceType;
};

const readObjectType = (value: string | null | undefined) => {
  if (!OBJECT_TYPES.has(value as FinishedInventoryObjectType)) {
    throw new BadRequestException('请选择正确的产品类型');
  }

  return value as FinishedInventoryObjectType;
};

const positiveId = (value: string | number | null | undefined, message: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(message);
  }

  return id;
};

const readPositiveInteger = (value: string | number | null | undefined, message: string) => {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new BadRequestException(message);
  }

  return amount;
};

const optional = (value: string | null | undefined) => value?.trim() || null;

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const compactDate = () => today().replace(/-/g, '');

const formatDate = (value: Date) => value.toISOString().slice(0, 10);
