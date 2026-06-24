import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ResultSetHeader } from 'mysql2';
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
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<MaterialBatchListRow[]>(
      `
      SELECT
        mb.id,
        mb.product_id,
        p.product_model,
        p.product_name,
        c.product_attribute,
        c.product_type,
        mb.material_batch_no,
        mb.supplier_name,
        mb.protocol_code,
        mb.received_date,
        mb.quantity,
        COALESCE(u.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(u.used_quantity, 0) AS used_quantity,
        mb.status,
        mb.remark,
        mb.created_at,
        mb.updated_at
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT
          material_batch_id,
          SUM(GREATEST(reserved_quantity - used_quantity, 0)) AS reserved_quantity,
          SUM(used_quantity) AS used_quantity
        FROM batch_material_usages
        WHERE is_deleted = 0 AND material_batch_id IS NOT NULL
        GROUP BY material_batch_id
      ) u ON u.material_batch_id = mb.id
      WHERE ${where}
      ORDER BY mb.id DESC
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
        .filter((row) => decimalNumber(row.reserved_quantity) > decimalNumber(row.used_quantity))
        .map(mapUsage),
      usages: usages.filter((row) => decimalNumber(row.used_quantity) > 0).map(mapUsage),
    };
  }

  async createMaterialBatch(payload: CreateMaterialBatchPayload) {
    const productId = readPositiveId(payload.productId, 'Missing material product');
    const materialBatchNo = readRequiredString(payload.materialBatchNo, 'Missing material batch no');
    const quantity = readDecimal(payload.quantity ?? 0, 'Invalid quantity');
    const status = readMaterialBatchStatus(payload.status ?? this.deriveStatus(quantity, 0, 0));

    await this.assertProductAvailable(productId);
    await this.assertBatchNoAvailable(materialBatchNo);

    const result = (await this.database.execute(
      `
      INSERT INTO material_batches (
        product_id, material_batch_no, supplier_name, protocol_code, received_date, quantity,
        status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        productId,
        materialBatchNo,
        normalizeOptionalString(payload.supplierName),
        normalizeOptionalString(payload.protocolCode),
        normalizeDate(payload.receivedDate),
        quantity,
        status,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    return this.getMaterialBatch(result.insertId);
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
      SELECT
        COALESCE(SUM(GREATEST(reserved_quantity - used_quantity, 0)), 0) AS reserved_quantity,
        COALESCE(SUM(used_quantity), 0) AS used_quantity
      FROM batch_material_usages
      WHERE material_batch_id = ? AND is_deleted = 0
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
    const clauses = ['mb.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(p.product_model LIKE ? OR p.product_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword);
    }

    if (filters.materialBatchNo?.trim()) {
      clauses.push('mb.material_batch_no LIKE ?');
      params.push(`%${filters.materialBatchNo.trim()}%`);
    }

    if (filters.supplierName?.trim()) {
      clauses.push('mb.supplier_name LIKE ?');
      params.push(`%${filters.supplierName.trim()}%`);
    }

    if (filters.status?.trim()) {
      clauses.push('mb.status = ?');
      params.push(readMaterialBatchStatus(filters.status.trim()));
    }

    return {
      where: clauses.join(' AND '),
      params,
    };
  }

  private async getMaterialBatchRow(id: number) {
    const [row] = await this.database.query<MaterialBatchRow[]>(
      `
      SELECT id, product_id, material_batch_no, supplier_name, protocol_code, received_date, quantity, status, remark
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
        mb.product_id,
        p.product_model,
        p.product_name,
        c.product_attribute,
        c.product_type,
        mb.material_batch_no,
        mb.supplier_name,
        mb.protocol_code,
        mb.received_date,
        mb.quantity,
        COALESCE(u.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(u.used_quantity, 0) AS used_quantity,
        mb.status,
        mb.remark,
        mb.created_at,
        mb.updated_at
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT
          material_batch_id,
          SUM(GREATEST(reserved_quantity - used_quantity, 0)) AS reserved_quantity,
          SUM(used_quantity) AS used_quantity
        FROM batch_material_usages
        WHERE is_deleted = 0 AND material_batch_id IS NOT NULL
        GROUP BY material_batch_id
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
        bmu.id,
        bmu.batch_id,
        bmu.plan_quantity AS reserved_quantity,
        bmu.used_quantity,
        CASE
          WHEN bmu.used_quantity >= bmu.plan_quantity THEN 'used'
          WHEN bmu.used_quantity > 0 THEN 'part_used'
          ELSE 'reserved'
        END AS status,
        bmu.recorded_by,
        u.display_name AS recorded_by_name,
        bmu.recorded_at,
        bmu.remark
      FROM batch_material_usages bmu
      LEFT JOIN users u ON u.id = bmu.recorded_by
      WHERE bmu.material_batch_id = ? AND bmu.is_deleted = 0
      ORDER BY bmu.id DESC
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
    const availableQuantity = quantity - reservedQuantity;

    return {
      id: String(row.id),
      productId: String(row.product_id),
      productModel: row.product_model,
      productName: row.product_name,
      productAttribute: row.product_attribute,
      productType: row.product_type,
      materialBatchNo: row.material_batch_no,
      supplierName: row.supplier_name,
      protocolCode: row.protocol_code,
      receivedDate: formatDate(row.received_date),
      quantity: formatDecimal(quantity),
      reservedQuantity: formatDecimal(reservedQuantity),
      usedQuantity: formatDecimal(usedQuantity),
      availableQuantity: formatDecimal(availableQuantity),
      status:
        row.status === 'disabled'
          ? 'disabled'
          : this.deriveStatus(quantity, reservedQuantity, usedQuantity),
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
  reservedQuantity: decimalString(row.reserved_quantity),
  usedQuantity: decimalString(row.used_quantity),
  status: row.status,
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
