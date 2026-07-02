import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {  RowDataPacket } from 'mysql2/promise';
import type {
  AdjustInventoryStocktakePayload,
  CreateInventoryStocktakePayload,
  InventoryStocktakeDifferenceType,
  InventoryStocktakeInventoryType,
  InventoryStocktakeListItem,
  InventoryStocktakeTargetOption,
  MaterialBatchStatus,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

export interface InventoryStocktakeFilters {
  keyword?: string;
  inventoryType?: string;
  /** 库存批次 ID：用于从库存管理页查看某一条库存的盘点历史。 */
  inventoryBatchId?: string;
  status?: string;
  differenceType?: string;
}

interface StocktakeRow extends RowDataPacket {
  id: number;
  stocktake_no: string | null;
  inventory_type: InventoryStocktakeInventoryType;
  inventory_batch_id: number;
  batch_no_snapshot: string | null;
  product_id_snapshot: number | null;
  product_model: string | null;
  product_name: string | null;
  object_type: string | null;
  before_quantity: string | number;
  counted_quantity: string | number;
  difference_quantity: string | number;
  difference_type: InventoryStocktakeDifferenceType;
  reason_type: string | null;
  status: 'draft' | 'confirmed' | 'adjusted' | 'voided';
  after_quantity: string | number | null;
  operator_name: string | null;
  operated_at: Date;
  adjusted_by_name: string | null;
  adjusted_at: Date | null;
  file_url: string | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date | null;
}

interface StocktakeTargetRow extends RowDataPacket {
  id: number;
  inventory_type: InventoryStocktakeInventoryType;
  batch_no: string;
  product_id: number;
  product_model: string;
  product_name: string;
  object_type: string | null;
  quantity: string | number;
  unit: string | null;
  location: string | null;
}

interface LockedInventoryRow extends RowDataPacket {
  id: number;
  product_id: number;
  batch_no: string | null;
  object_type: string | null;
  quantity: string | number;
  unit: string | null;
  location: string | null;
  reserved_quantity: string | number;
  used_quantity: string | number;
}

@Injectable()
export class InventoryStocktakeRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  async list(filters: InventoryStocktakeFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildFilters(filters);
    const source = this.stocktakeSource();
    const [totalRow] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM (${source}) stocktake WHERE ${where}`,
      params,
    );
    const rows = await this.database.query<StocktakeRow[]>(
      `
      SELECT *
      FROM (${source}) stocktake
      WHERE ${where}
      ORDER BY stocktake.operated_at DESC, stocktake.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapStocktake), Number(totalRow?.total ?? 0), pagination);
  }

  async get(id: number) {
    const [row] = await this.database.query<StocktakeRow[]>(
      `
      SELECT *
      FROM (${this.stocktakeSource()}) stocktake
      WHERE stocktake.id = ?
      LIMIT 1
      `,
      [id],
    );
    if (!row) {
      throw new NotFoundException('库存盘点记录不存在');
    }
    return mapStocktake(row);
  }

  async listTargets(inventoryType?: string, keyword?: string): Promise<InventoryStocktakeTargetOption[]> {
    const type = readInventoryType(inventoryType || 'material');
    const params: QueryParam[] = [type];
    const clauses = ['target.inventory_type = ?'];
    if (keyword?.trim()) {
      clauses.push(`(
        target.batch_no LIKE ?
        OR target.product_model LIKE ?
        OR target.product_name LIKE ?
        OR target.object_type LIKE ?
      )`);
      const like = `%${keyword.trim()}%`;
      params.push(like, like, like, like);
    }

    const rows = await this.database.query<StocktakeTargetRow[]>(
      `
      SELECT *
      FROM (${this.targetSource()}) target
      WHERE ${clauses.join(' AND ')}
      ORDER BY target.inventory_type ASC, target.id DESC
      LIMIT 100
      `,
      params,
    );
    return rows.map(mapTarget);
  }

  async create(payload: CreateInventoryStocktakePayload, userId: number) {
    const result = await this.createRecord(this.database, payload, userId);
    return this.get(result.insertId);
  }

  async adjust(id: number, payload: AdjustInventoryStocktakePayload, userId: number) {
    await this.database.transaction(async (connection) => {
      // 盘点调账必须锁定台账和库存批次，避免多人同时调账导致库存覆盖。
      const stocktake = await this.lockStocktake(connection, id);
      if (stocktake.status === 'adjusted') {
        throw new BadRequestException('该盘点记录已完成调账');
      }
      if (stocktake.status !== 'confirmed') {
        throw new BadRequestException('只有已登记的盘点记录可以确认调账');
      }

      this.auditContext.setBeforeData(stocktake);
      const inventory = await this.lockInventory(connection, stocktake.inventory_type, stocktake.inventory_batch_id);
      if (stocktake.inventory_type === 'material') {
        await this.adjustMaterialInventory(connection, stocktake, inventory, payload, userId);
      } else {
        await this.adjustProductInventory(connection, stocktake, inventory, payload, userId);
      }
    });

    const adjusted = await this.get(id);
    this.auditContext.setAfterData(adjusted);
    return adjusted;
  }

  async createAndAdjust(payload: CreateInventoryStocktakePayload, userId: number) {
    let stocktakeId = 0;
    await this.database.transaction(async (connection) => {
      const result = await this.createRecord(connection, payload, userId);
      stocktakeId = result.insertId;
      const stocktake = await this.lockStocktake(connection, stocktakeId);
      const inventory = await this.lockInventory(connection, stocktake.inventory_type, stocktake.inventory_batch_id);
      if (stocktake.inventory_type === 'material') {
        await this.adjustMaterialInventory(connection, stocktake, inventory, { remark: payload.remark }, userId);
      } else {
        await this.adjustProductInventory(connection, stocktake, inventory, { remark: payload.remark }, userId);
      }
    });
    return this.get(stocktakeId);
  }

  private async createRecord(executor: DbExecutor, payload: CreateInventoryStocktakePayload, userId: number) {
    const inventoryType = readInventoryType(payload.inventoryType);
    const inventoryBatchId = readPositiveId(payload.inventoryBatchId, '请选择库存批次');
    const countedQuantity = readStockQuantity(payload.countedQuantity, '盘点数量不能小于 0');
    const inventory = await this.lockInventory(executor, inventoryType, inventoryBatchId);
    if (inventoryType === 'product' && !Number.isInteger(Number(countedQuantity))) {
      throw new BadRequestException('成品或半成品盘点数量必须是整数');
    }

    const beforeQuantity = decimalNumber(inventory.quantity);
    const counted = decimalNumber(countedQuantity);
    const difference = counted - beforeQuantity;
    const differenceType = readDifferenceType(difference);

    // 盘点台账只记录盘点事实，调账动作由 adjust 接口完成，保证事实记录和库存调整可以追溯。
    return execute(
      executor,
      `
      INSERT INTO inventory_stocktakes (
        stocktake_no, inventory_type, inventory_batch_id, batch_no_snapshot,
        product_id_snapshot, before_quantity, counted_quantity, difference_quantity,
        difference_type, reason_type, status, operator_id, operated_at, file_url,
        remark, created_by, created_at, updated_by, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, COALESCE(?, NOW()), ?, ?, ?, NOW(), ?, NOW())
      `,
      [
        makeStocktakeNo(),
        inventoryType,
        inventoryBatchId,
        inventory.batch_no,
        inventory.product_id,
        beforeQuantity.toFixed(4),
        counted.toFixed(4),
        difference.toFixed(4),
        differenceType,
        optional(payload.reasonType),
        userId,
        normalizeDateTime(payload.operatedAt),
        optional(payload.fileUrl),
        optional(payload.remark),
        userId,
        userId,
      ],
    );
  }

  private async adjustMaterialInventory(
    executor: DbExecutor,
    stocktake: StocktakeRow,
    inventory: LockedInventoryRow,
    payload: AdjustInventoryStocktakePayload,
    userId: number,
  ) {
    const countedQuantity = decimal(stocktake.counted_quantity);
    const nextStatus = deriveMaterialStatus(countedQuantity, inventory.reserved_quantity, inventory.used_quantity);
    // 物料库存没有单独调整流水表，盘点台账即为调账依据，库存表保存调整后的当前数量。
    await execute(
      executor,
      `
      UPDATE material_batches
      SET quantity = ?,
        status = ?,
        remark = COALESCE(?, remark),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
      `,
      [countedQuantity.toFixed(4), nextStatus, optional(payload.remark), userId, stocktake.inventory_batch_id],
    );
    await this.markAdjusted(executor, stocktake, userId, payload.remark);
  }

  private async adjustProductInventory(
    executor: DbExecutor,
    stocktake: StocktakeRow,
    inventory: LockedInventoryRow,
    payload: AdjustInventoryStocktakePayload,
    userId: number,
  ) {
    const beforeQuantity = decimal(stocktake.before_quantity);
    const countedQuantity = decimal(stocktake.counted_quantity);
    const difference = Math.abs(countedQuantity - beforeQuantity);
    // 产品库存调整需要同时写 product_flow_records，保留成品/半成品库存变动流水。
    await execute(
      executor,
      `
      UPDATE product_inventory_batches
      SET quantity = ?,
        remark = COALESCE(?, remark),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
      `,
      [Math.trunc(countedQuantity), optional(payload.remark), userId, stocktake.inventory_batch_id],
    );
    if (difference > 0) {
      await execute(
        executor,
        `
        INSERT INTO product_flow_records (
          flow_no, inventory_id, batch_id, product_id, object_type, flow_type,
          flow_reason, quantity, related_stocktake_id, operator_id, flow_date,
          remark, created_by, created_at, updated_by, updated_at
        )
        VALUES (?, ?, NULL, ?, ?, 'adjustment', ?, ?, ?, ?, CURRENT_DATE(), ?, ?, NOW(), ?, NOW())
        `,
        [
          makeAdjustmentNo(),
          stocktake.inventory_batch_id,
          stocktake.product_id_snapshot,
          inventory.object_type,
          stocktake.difference_type === 'surplus' ? '盘盈调增' : '盘亏调减',
          Math.trunc(difference),
          stocktake.id,
          userId,
          optional(payload.remark),
          userId,
          userId,
        ],
      );
    }
    await this.markAdjusted(executor, stocktake, userId, payload.remark);
  }

  private async markAdjusted(
    executor: DbExecutor,
    stocktake: StocktakeRow,
    userId: number,
    remark?: string | null,
  ) {
    await execute(
      executor,
      `
      UPDATE inventory_stocktakes
      SET status = 'adjusted',
        after_quantity = counted_quantity,
        adjusted_by = ?,
        adjusted_at = NOW(),
        remark = COALESCE(?, remark),
        updated_by = ?,
        updated_at = NOW()
      WHERE id = ? AND status = 'confirmed' AND is_deleted = 0
      `,
      [userId, optional(remark), userId, stocktake.id],
    );
  }

  private async lockStocktake(executor: DbExecutor, id: number) {
    const [row] = await query<StocktakeRow[]>(
      executor,
      `
      SELECT
        stocktake.id,
        stocktake.stocktake_no,
        stocktake.inventory_type,
        stocktake.inventory_batch_id,
        stocktake.batch_no_snapshot,
        stocktake.product_id_snapshot,
        NULL AS product_model,
        NULL AS product_name,
        NULL AS object_type,
        stocktake.before_quantity,
        stocktake.counted_quantity,
        stocktake.difference_quantity,
        stocktake.difference_type,
        stocktake.reason_type,
        stocktake.status,
        stocktake.after_quantity,
        NULL AS operator_name,
        stocktake.operated_at,
        NULL AS adjusted_by_name,
        stocktake.adjusted_at,
        stocktake.file_url,
        stocktake.remark,
        stocktake.created_at,
        stocktake.updated_at
      FROM inventory_stocktakes stocktake
      WHERE stocktake.id = ?
        AND stocktake.status <> 'voided'
        AND stocktake.is_deleted = 0
      FOR UPDATE
      `,
      [id],
    );
    if (!row) {
      throw new NotFoundException('库存盘点记录不存在');
    }
    return row;
  }

  private async lockInventory(
    executor: DbExecutor,
    inventoryType: InventoryStocktakeInventoryType,
    inventoryBatchId: number,
  ) {
    const sql =
      inventoryType === 'material'
        ? `
          SELECT
            mb.id,
            mb.product_id,
            mb.material_batch_no AS batch_no,
            NULL AS object_type,
            mb.quantity,
            p.unit,
            NULL AS location,
            COALESCE(available.reserved_not_used_quantity, 0) AS reserved_quantity,
            COALESCE(available.used_quantity, 0) AS used_quantity
          FROM material_batches mb
          INNER JOIN products p
            ON p.id = mb.product_id
            AND p.is_deleted = 0
          LEFT JOIN v_material_batch_available available
            ON available.material_batch_id = mb.id
          WHERE mb.id = ? AND mb.is_deleted = 0
          FOR UPDATE
        `
        : `
          SELECT
            inventory.id,
            inventory.product_id,
            inventory.inventory_batch_no AS batch_no,
            inventory.object_type,
            inventory.quantity,
            inventory.unit,
            inventory.location,
            0 AS reserved_quantity,
            0 AS used_quantity
          FROM product_inventory_batches inventory
          WHERE inventory.id = ? AND inventory.is_deleted = 0
          FOR UPDATE
        `;
    const [row] = await query<LockedInventoryRow[]>(executor, sql, [inventoryBatchId]);
    if (!row) {
      throw new NotFoundException('库存批次不存在');
    }
    return row;
  }

  private buildFilters(filters: InventoryStocktakeFilters) {
    const clauses = ['stocktake.is_deleted = 0'];
    const params: QueryParam[] = [];
    if (filters.keyword?.trim()) {
      clauses.push(`(
        stocktake.stocktake_no LIKE ?
        OR stocktake.batch_no_snapshot LIKE ?
        OR stocktake.product_model LIKE ?
        OR stocktake.product_name LIKE ?
        OR stocktake.reason_type LIKE ?
        OR stocktake.remark LIKE ?
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }
    if (filters.inventoryType?.trim()) {
      clauses.push('stocktake.inventory_type = ?');
      params.push(readInventoryType(filters.inventoryType));
    }
    if (filters.inventoryBatchId?.trim()) {
      // 按库存批次精确过滤，避免库存页查看历史时混入同物料其他批次的盘点记录。
      clauses.push('stocktake.inventory_batch_id = ?');
      params.push(readPositiveId(filters.inventoryBatchId, '库存批次不正确'));
    }
    if (filters.status?.trim()) {
      clauses.push('stocktake.status = ?');
      params.push(readStatus(filters.status));
    }
    if (filters.differenceType?.trim()) {
      clauses.push('stocktake.difference_type = ?');
      params.push(readDifference(filters.differenceType));
    }
    return { where: clauses.join(' AND '), params };
  }

  private stocktakeSource() {
    return `
      SELECT
        stocktake.id,
        stocktake.stocktake_no,
        stocktake.inventory_type,
        stocktake.inventory_batch_id,
        stocktake.batch_no_snapshot,
        stocktake.product_id_snapshot,
        p.product_model,
        p.product_name,
        CASE
          WHEN stocktake.inventory_type = 'product' THEN product_inventory.object_type
          ELSE category.product_type
        END AS object_type,
        stocktake.before_quantity,
        stocktake.counted_quantity,
        stocktake.difference_quantity,
        stocktake.difference_type,
        stocktake.reason_type,
        stocktake.status,
        stocktake.after_quantity,
        operator.display_name AS operator_name,
        stocktake.operated_at,
        adjuster.display_name AS adjusted_by_name,
        stocktake.adjusted_at,
        stocktake.file_url,
        stocktake.remark,
        stocktake.created_at,
        stocktake.updated_at,
        stocktake.is_deleted
      FROM inventory_stocktakes stocktake
      LEFT JOIN products p
        ON p.id = stocktake.product_id_snapshot
        AND p.is_deleted = 0
      LEFT JOIN product_categories category
        ON category.id = p.category_id
        AND category.is_deleted = 0
      LEFT JOIN product_inventory_batches product_inventory
        ON product_inventory.id = stocktake.inventory_batch_id
        AND stocktake.inventory_type = 'product'
        AND product_inventory.is_deleted = 0
      LEFT JOIN users operator ON operator.id = stocktake.operator_id
      LEFT JOIN users adjuster ON adjuster.id = stocktake.adjusted_by
    `;
  }

  private targetSource() {
    return `
      SELECT
        mb.id,
        'material' AS inventory_type,
        mb.material_batch_no AS batch_no,
        mb.product_id,
        p.product_model,
        p.product_name,
        category.product_type AS object_type,
        mb.quantity,
        p.unit AS unit,
        NULL AS location
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories category ON category.id = p.category_id AND category.is_deleted = 0
      WHERE mb.is_deleted = 0
      UNION ALL
      SELECT
        inventory.id,
        'product' AS inventory_type,
        inventory.inventory_batch_no AS batch_no,
        inventory.product_id,
        p.product_model,
        p.product_name,
        inventory.object_type,
        inventory.quantity,
        COALESCE(inventory.unit, p.unit) AS unit,
        inventory.location
      FROM product_inventory_batches inventory
      INNER JOIN products p ON p.id = inventory.product_id AND p.is_deleted = 0
      WHERE inventory.is_deleted = 0
    `;
  }
}

const mapStocktake = (row: StocktakeRow): InventoryStocktakeListItem => ({
  id: String(row.id),
  stocktakeNo: row.stocktake_no,
  inventoryType: row.inventory_type,
  inventoryBatchId: String(row.inventory_batch_id),
  batchNoSnapshot: row.batch_no_snapshot,
  productIdSnapshot: row.product_id_snapshot === null ? null : String(row.product_id_snapshot),
  productModel: row.product_model,
  productName: row.product_name,
  objectType: row.object_type,
  beforeQuantity: decimal(row.before_quantity).toFixed(4),
  countedQuantity: decimal(row.counted_quantity).toFixed(4),
  differenceQuantity: decimal(row.difference_quantity).toFixed(4),
  differenceType: row.difference_type,
  reasonType: row.reason_type,
  status: row.status,
  afterQuantity: row.after_quantity === null ? null : decimal(row.after_quantity).toFixed(4),
  operatorName: row.operator_name,
  operatedAt: row.operated_at.toISOString(),
  adjustedByName: row.adjusted_by_name,
  adjustedAt: row.adjusted_at ? row.adjusted_at.toISOString() : null,
  fileUrl: row.file_url,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
});

const mapTarget = (row: StocktakeTargetRow): InventoryStocktakeTargetOption => ({
  id: String(row.id),
  inventoryType: row.inventory_type,
  batchNo: row.batch_no,
  productId: String(row.product_id),
  productModel: row.product_model,
  productName: row.product_name,
  objectType: row.object_type,
  quantity: decimal(row.quantity).toFixed(4),
  unit: row.unit,
  location: row.location,
});

const readInventoryType = (value: string): InventoryStocktakeInventoryType => {
  if (value !== 'material' && value !== 'product') {
    throw new BadRequestException('盘点对象类型不正确');
  }
  return value;
};

const readStatus = (value: string) => {
  if (!['draft', 'confirmed', 'adjusted', 'voided'].includes(value)) {
    throw new BadRequestException('盘点状态不正确');
  }
  return value;
};

const readDifference = (value: string) => {
  if (!['surplus', 'shortage', 'equal'].includes(value)) {
    throw new BadRequestException('盘点差异类型不正确');
  }
  return value;
};

const readPositiveId = (value: string | number | null | undefined, message: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException(message);
  }
  return id;
};

const readStockQuantity = (value: string | number | null | undefined, message: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException(message);
  }
  return amount.toFixed(4);
};

const readDifferenceType = (difference: number): InventoryStocktakeDifferenceType => {
  if (difference > 0) return 'surplus';
  if (difference < 0) return 'shortage';
  return 'equal';
};

const optional = (value: string | null | undefined) => value?.trim() || null;

const normalizeDateTime = (value: string | null | undefined) => {
  const normalized = value?.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(normalized)) {
    throw new BadRequestException('盘点时间格式不正确');
  }
  return normalized.length === 10 ? `${normalized} 00:00:00` : normalized;
};

const decimalNumber = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

const decimal = (value: string | number | null | undefined) => decimalNumber(value);

const deriveMaterialStatus = (
  quantityValue: number,
  reservedQuantityValue: string | number,
  usedQuantityValue: string | number,
): MaterialBatchStatus => {
  const reservedQuantity = decimalNumber(reservedQuantityValue);
  const usedQuantity = decimalNumber(usedQuantityValue);
  if (quantityValue - reservedQuantity <= 0) return 'used_up';
  if (reservedQuantity > 0 || usedQuantity > 0) return 'partial_used';
  return 'available';
};

const makeStocktakeNo = () => `PD${formatTimestamp()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const makeAdjustmentNo = () => `TZ${formatTimestamp()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

const formatTimestamp = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};
