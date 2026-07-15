import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type {
  CreateMaterialBatchPayload,
  MaterialBatchStatus,
  StocktakeMaterialBatchPayload,
  UpdateMaterialBatchPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  CountRow,
  MaterialBatchListRow,
  MaterialBatchRow,
  MaterialBatchUsageRow,
} from '../warehouse.types.js';

export interface MaterialInventoryFilters {
  keyword?: string;
  inventoryType?: string;
  materialBatchNo?: string;
  supplierName?: string;
  status?: string;
}

const MATERIAL_BATCH_STATUSES = new Set<MaterialBatchStatus>([
  'available',
  'partial_used',
  'used_up',
  'disabled',
]);

@Injectable()
export class MaterialInventoryRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listMaterialBatches(filters: MaterialInventoryFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM (${this.buildInventoryUnionSql()}) inventory
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<MaterialBatchListRow[]>(
      `
      SELECT
        inventory.*
      FROM (${this.buildInventoryUnionSql()}) inventory
      WHERE ${where}
      ORDER BY inventory.created_at DESC, inventory.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map((row) => this.mapMaterialBatch(row)), Number(totalRow?.total ?? 0), pagination);
  }

  async getMaterialBatch(id: number) {
    const item = await this.getMaterialBatchListItem(id);
    const usages = await this.listUsageRows(id);

    return {
      ...item,
      reservations: usages
        .filter((row) => row.operation_type === 'reserve')
        .map(mapUsage),
      usages: usages.filter((row) => row.operation_type !== 'reserve').map(mapUsage),
    };
  }

  async createMaterialBatch(payload: CreateMaterialBatchPayload) {
    // 物料正库存必须由“来料检验 + 入库”事务产生，禁止库存台账接口绕过检验直接建批次。
    void payload;
    throw new BadRequestException('请通过物料出入库页面办理来料检验和物料入库');
  }

  async updateMaterialBatch(id: number, payload: UpdateMaterialBatchPayload) {
    const current = await this.getMaterialBatchRow(id);
    const productId =
      payload.productId === undefined ? current.product_id : readPositiveId(payload.productId, 'Missing material product');
    const materialBatchNo =
      payload.materialBatchNo === undefined
        ? current.material_batch_no
        : readRequiredString(payload.materialBatchNo, 'Missing material batch no');
    const quantity =
      payload.quantity === undefined ? decimalString(current.quantity) : readDecimal(payload.quantity, 'Invalid quantity');
    const status =
      payload.status === undefined ? current.status : readMaterialBatchStatus(payload.status);

    await this.assertProductAvailable(productId);
    await this.assertBatchNoAvailable(materialBatchNo, id);
    // 库存数量只能通过领退料或盘点事务变化，编辑基础资料不能直接改账。
    if (decimalNumber(quantity) !== decimalNumber(current.quantity)) {
      throw new BadRequestException('库存数量不能直接编辑，请通过库存盘点调整');
    }

    await this.database.execute(
      `
      UPDATE material_batches
      SET product_id = ?,
        material_batch_no = ?,
        supplier_name = ?,
        protocol_code = ?,
        received_date = ?,
        quantity = ?,
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        productId,
        materialBatchNo,
        payload.supplierName === undefined
          ? current.supplier_name
          : normalizeOptionalString(payload.supplierName),
        payload.protocolCode === undefined
          ? current.protocol_code
          : normalizeOptionalString(payload.protocolCode),
        payload.receivedDate === undefined
          ? formatDate(current.received_date)
          : normalizeDate(payload.receivedDate),
        quantity,
        status,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getMaterialBatch(id);
  }

  async stocktakeMaterialBatch(id: number, payload: StocktakeMaterialBatchPayload) {
    await this.getMaterialBatchRow(id);
    const quantity = readDecimal(payload.quantity, 'Invalid stocktake quantity');
    const [summary] = await this.database.query<RowDataPacket[]>(
      `
      SELECT reserved_not_used_quantity AS reserved_quantity, used_quantity
      FROM v_material_batch_available
      WHERE material_batch_id = ?
    `,
      [id],
    );
    const reservedQuantity = decimalNumber(summary?.reserved_quantity);
    const usedQuantity = decimalNumber(summary?.used_quantity);

    await this.database.execute(
      `
      UPDATE material_batches
      SET quantity = ?,
        status = ?,
        remark = COALESCE(?, remark),
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        quantity,
        this.deriveStatus(quantity, reservedQuantity, usedQuantity),
        normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getMaterialBatch(id);
  }

  async changeMaterialBatchStatus(id: number, disabled: boolean) {
    const current = await this.getMaterialBatch(id);
    const nextStatus = disabled
      ? 'disabled'
      : this.deriveStatus(current.quantity, current.reservedQuantity, current.usedQuantity);

    await this.database.execute(
      `
      UPDATE material_batches
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [nextStatus, id],
    );

    return this.getMaterialBatch(id);
  }

  private buildListFilters(filters: MaterialInventoryFilters) {
    const clauses = ['inventory.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.inventoryType?.trim()) {
      clauses.push('inventory.inventory_type = ?');
      params.push(readInventoryType(filters.inventoryType.trim()));
    }

    if (filters.keyword?.trim()) {
      clauses.push(`(
        inventory.product_model LIKE ?
        OR inventory.product_name LIKE ?
        OR inventory.product_attribute LIKE ?
        OR inventory.product_type LIKE ?
        OR inventory.material_batch_no LIKE ?
        OR inventory.supplier_name LIKE ?
        OR inventory.protocol_code LIKE ?
        OR inventory.object_type LIKE ?
        OR inventory.source_type LIKE ?
        OR inventory.location LIKE ?
        OR inventory.remark LIKE ?
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.materialBatchNo?.trim()) {
      clauses.push('inventory.material_batch_no LIKE ?');
      params.push(`%${filters.materialBatchNo.trim()}%`);
    }

    if (filters.supplierName?.trim()) {
      clauses.push('inventory.supplier_name LIKE ?');
      params.push(`%${filters.supplierName.trim()}%`);
    }

    if (filters.status?.trim()) {
      clauses.push('inventory.status = ?');
      params.push(readMaterialBatchStatus(filters.status.trim()));
    }

    return {
      where: clauses.join(' AND '),
      params,
    };
  }

  private buildInventoryUnionSql() {
    /**
     * 库存管理页统一展示口径：
     * 1. material_batches 负责物料批次当前库存，预留/已用数量来自可用量视图
     * 2. product_inventory_batches 负责成品/半成品库存批次，暂无预留口径，直接以数量作为可用量
     * 3. 两类库存保留 inventory_type，前端据此决定是否展示物料专属操作
     */
    return `
      SELECT
        mb.id,
        'material' AS inventory_type,
        mb.product_id,
        p.product_model,
        p.product_name,
        c.product_attribute,
        c.product_type,
        NULL AS object_type,
        NULL AS source_type,
        mb.material_batch_no,
        mb.supplier_name,
        mb.protocol_code,
        mb.received_date,
        mb.initial_quantity,
        mb.quantity,
        COALESCE(u.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(u.used_quantity, 0) AS used_quantity,
        COALESCE(u.available_quantity, 0) AS available_quantity,
        mb.status,
        mb.quality_status,
        p.unit,
        NULL AS location,
        mb.remark,
        mb.created_at,
        mb.updated_at,
        mb.is_deleted
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT material_batch_id, reserved_not_used_quantity AS reserved_quantity,
          used_quantity, available_quantity
        FROM v_material_batch_available
      ) u ON u.material_batch_id = mb.id
      UNION ALL
      SELECT
        pib.id,
        'product' AS inventory_type,
        pib.product_id,
        p.product_model,
        p.product_name,
        c.product_attribute,
        c.product_type,
        pib.object_type,
        pib.source_type,
        pib.inventory_batch_no AS material_batch_no,
        NULL AS supplier_name,
        NULL AS protocol_code,
        pib.received_date,
        NULL AS initial_quantity,
        pib.quantity,
        0 AS reserved_quantity,
        0 AS used_quantity,
        pib.quantity AS available_quantity,
        CASE WHEN pib.quantity <= 0 THEN 'used_up' ELSE 'available' END AS status,
        NULL AS quality_status,
        COALESCE(pib.unit, p.unit) AS unit,
        pib.location,
        pib.remark,
        pib.created_at,
        pib.updated_at,
        pib.is_deleted
      FROM product_inventory_batches pib
      INNER JOIN products p ON p.id = pib.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
    `;
  }

  private async getMaterialBatchRow(id: number) {
    const [row] = await this.database.query<MaterialBatchRow[]>(
      `
      SELECT id, product_id, material_batch_no, supplier_name, protocol_code, received_date,
        initial_quantity, quantity, status, quality_status, remark
      FROM material_batches
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Material batch not found');
    }

    return row;
  }

  private async getMaterialBatchListItem(id: number) {
    const [row] = await this.database.query<MaterialBatchListRow[]>(
      `
      SELECT
        mb.id,
        'material' AS inventory_type,
        mb.product_id,
        p.product_model,
        p.product_name,
        c.product_attribute,
        c.product_type,
        NULL AS object_type,
        NULL AS source_type,
        mb.material_batch_no,
        mb.supplier_name,
        mb.protocol_code,
        mb.received_date,
        mb.initial_quantity,
        mb.quantity,
        COALESCE(u.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(u.used_quantity, 0) AS used_quantity,
        COALESCE(u.available_quantity, 0) AS available_quantity,
        mb.status,
        mb.quality_status,
        p.unit,
        NULL AS location,
        mb.remark,
        mb.created_at,
        mb.updated_at
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT material_batch_id, reserved_not_used_quantity AS reserved_quantity,
          used_quantity, available_quantity
        FROM v_material_batch_available
      ) u ON u.material_batch_id = mb.id
      WHERE mb.id = ? AND mb.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Material batch not found');
    }

    return this.mapMaterialBatch(row);
  }

  private async listUsageRows(materialBatchId: number) {
    return this.database.query<MaterialBatchUsageRow[]>(
      `
      SELECT
        operation.id,
        operation.batch_id,
        operation.operation_quantity,
        operation.reserved_quantity,
        operation.used_quantity,
        operation.operation_type,
        operation.recorded_by,
        u.display_name AS recorded_by_name,
        operation.recorded_at,
        operation.remark
      FROM batch_material_usages operation
      LEFT JOIN users u ON u.id = operation.recorded_by
      WHERE operation.material_batch_id = ? AND operation.is_deleted = 0
      ORDER BY operation.id DESC
    `,
      [materialBatchId],
    );
  }

  private async assertProductAvailable(productId: number) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM products
      WHERE id = ? AND status = 1 AND is_deleted = 0
      LIMIT 1
    `,
      [productId],
    );

    if (!row) {
      throw new BadRequestException('Material product not found or disabled');
    }
  }

  private async assertBatchNoAvailable(materialBatchNo: string, ignoredId?: number) {
    const params: QueryParam[] = [materialBatchNo];
    const ignoredClause = ignoredId ? ' AND id <> ?' : '';

    if (ignoredId) {
      params.push(ignoredId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM material_batches
      WHERE material_batch_no = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Material batch no already exists');
    }
  }

  private mapMaterialBatch(row: MaterialBatchListRow) {
    const quantity = decimalNumber(row.quantity);
    const reservedQuantity = decimalNumber(row.reserved_quantity);
    const usedQuantity = decimalNumber(row.used_quantity);
    // 可用数量以后端视图口径为准，避免页面层重复计算库存预留。
    const availableQuantity = decimalNumber(row.available_quantity);

    return {
      id: String(row.id),
      inventoryType: row.inventory_type,
      productId: String(row.product_id),
      productModel: row.product_model,
      productName: row.product_name,
      productAttribute: row.product_attribute,
      productType: row.product_type,
      objectType: row.object_type,
      sourceType: row.source_type,
      materialBatchNo: row.material_batch_no,
      supplierName: row.supplier_name,
      protocolCode: row.protocol_code,
      receivedDate: formatDate(row.received_date),
      initialQuantity: row.initial_quantity === null ? null : decimalString(row.initial_quantity),
      quantity: formatDecimal(quantity),
      reservedQuantity: formatDecimal(reservedQuantity),
      usedQuantity: formatDecimal(usedQuantity),
      availableQuantity: formatDecimal(availableQuantity),
      status:
        row.status === 'disabled'
          ? 'disabled'
          : this.deriveStatus(quantity, reservedQuantity, usedQuantity),
      qualityStatus: row.quality_status,
      unit: row.unit,
      location: row.location,
      remark: row.remark,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  private deriveStatus(
    quantityValue: string | number,
    reservedQuantityValue: string | number,
    usedQuantityValue: string | number,
  ): MaterialBatchStatus {
    const quantity = decimalNumber(quantityValue);
    const reservedQuantity = decimalNumber(reservedQuantityValue);
    const usedQuantity = decimalNumber(usedQuantityValue);

    if (quantity - reservedQuantity <= 0) {
      return 'used_up';
    }

    if (reservedQuantity > 0 || usedQuantity > 0) {
      return 'partial_used';
    }

    return 'available';
  }
}

const mapUsage = (row: MaterialBatchUsageRow) => ({
  id: String(row.id),
  batchId: row.batch_id === null ? null : String(row.batch_id),
  operationQuantity: decimalString(row.operation_quantity),
  reservedQuantity: decimalString(row.reserved_quantity),
  usedQuantity: decimalString(row.used_quantity),
  operationType: row.operation_type,
  recordedBy: row.recorded_by === null ? null : String(row.recorded_by),
  recordedByName: row.recorded_by_name,
  recordedAt: row.recorded_at ? row.recorded_at.toISOString() : null,
  remark: row.remark,
});

const readRequiredString = (value: string | undefined, message: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
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

const readMaterialBatchStatus = (value: string) => {
  if (!MATERIAL_BATCH_STATUSES.has(value as MaterialBatchStatus)) {
    throw new BadRequestException('Invalid material batch status');
  }

  return value as MaterialBatchStatus;
};

const readInventoryType = (value: string) => {
  if (value !== 'material' && value !== 'product') {
    throw new BadRequestException('Invalid inventory type');
  }

  return value;
};

const readDecimal = (value: string | number | null | undefined, message: string) => {
  if (value === null || value === undefined || value === '') {
    return '0.0000';
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException(message);
  }

  return amount.toFixed(4);
};

const decimalNumber = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

const decimalString = (value: string | number | null | undefined) => formatDecimal(decimalNumber(value));

const formatDecimal = (value: number) => value.toFixed(4);

const normalizeDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new BadRequestException('Invalid received date');
  }

  return normalized;
};

const formatDate = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};
