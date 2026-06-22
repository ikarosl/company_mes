import { BadRequestException } from '@nestjs/common';
import type {
  ProductAcquireMethod,
  ProductCategoryListItem,
  ProductListItem,
  ProductMaterialItem,
  ProductSpecValue,
  ProcessOption,
  ProcessListItem,
  ProcessRouteListItem,
  ProcessRouteStepItem,
} from '@company/api-contract';
import type {
  ProcessOptionRow,
  ProcessListRow,
  ProcessRouteListRow,
  ProcessRouteStepListRow,
  ProductCategoryListRow,
  ProductListRow,
  ProductMaterialListRow,
} from './product.types.js';

export const PRODUCT_ACQUIRE_METHODS = new Set(['self_made', 'outsourced', 'purchased']);

export const mapProductCategory = (row: ProductCategoryListRow): ProductCategoryListItem => ({
  id: String(row.id),
  productAttribute: row.product_attribute,
  productType: row.product_type,
  status: row.status,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapProduct = (row: ProductListRow): ProductListItem => ({
  id: String(row.id),
  productModel: row.product_model,
  productName: row.product_name,
  categoryId: row.category_id === null ? null : String(row.category_id),
  productAttribute: row.product_attribute,
  productType: row.product_type,
  unit: row.unit,
  acquireMethod: row.acquire_method as ProductAcquireMethod,
  specValues: parseSpecValues(row.spec_values),
  materialCount: Number(row.material_count ?? 0),
  status: row.status,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapProductMaterial = (row: ProductMaterialListRow): ProductMaterialItem => ({
  id: String(row.id),
  productId: String(row.product_id),
  materialProductId: String(row.material_product_id),
  materialModel: row.material_model,
  materialName: row.material_name,
  materialUnit: row.material_unit,
  quantityPerUnit: decimalString(row.quantity_per_unit),
  unit: row.unit,
  isKeyMaterial: Boolean(row.is_key_material),
  needBatchRecord: Boolean(row.need_batch_record),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapProcess = (row: ProcessListRow): ProcessListItem => ({
  id: String(row.id),
  processCode: row.process_code,
  processName: row.process_name,
  description: row.description,
  sopFileId: row.sop_file_id === null ? null : String(row.sop_file_id),
  sopFileName: row.sop_file_name,
  sopFileUrl: row.sop_file_url,
  status: row.status,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapProcessOption = (row: ProcessOptionRow): ProcessOption => ({
  id: String(row.id),
  processCode: row.process_code,
  processName: row.process_name,
  description: row.description,
  sopFileId: row.sop_file_id === null ? null : String(row.sop_file_id),
  sopFileName: row.sop_file_name,
  sopFileUrl: row.sop_file_url,
});

export const mapProcessRouteStep = (row: ProcessRouteStepListRow): ProcessRouteStepItem => ({
  id: String(row.id),
  routeId: String(row.route_id),
  processId: String(row.process_step_id),
  stepOrder: row.step_order,
  processCode: row.process_code,
  processName: row.process_name,
  description: row.description,
  defaultOwnerId: row.default_owner_id === null ? null : String(row.default_owner_id),
  defaultOwnerName: row.default_owner_name,
  needInspection: row.need_inspection === 1,
  needRecord: row.need_record === 1,
  sopFileId: row.sop_file_id === null ? null : String(row.sop_file_id),
  sopFileName: row.sop_file_name,
  sopFileUrl: row.sop_file_url,
  status: row.status,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const mapProcessRoute = (row: ProcessRouteListRow): ProcessRouteListItem => ({
  id: String(row.id),
  routeCode: row.route_code,
  routeName: row.route_name,
  productCategoryId: row.product_category_id === null ? null : String(row.product_category_id),
  productAttribute: row.product_attribute,
  productType: row.product_type,
  version: row.version,
  status: row.status,
  remark: row.remark,
  stepCount: Number(row.step_count),
  processSummary: row.process_summary ?? '',
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const readRequiredString = (value: string | undefined, message: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
};

export const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const readTinyStatus = (value: number | boolean) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value !== 0 && value !== 1) {
    throw new BadRequestException('Invalid status');
  }

  return value;
};

export const readAcquireMethod = (value: string | undefined): ProductAcquireMethod => {
  const normalized = readRequiredString(value, 'Missing acquire method');
  if (!PRODUCT_ACQUIRE_METHODS.has(normalized)) {
    throw new BadRequestException('Invalid acquire method');
  }

  return normalized as ProductAcquireMethod;
};

export const nullableId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

export const readPositiveId = (value: string | number | null | undefined, message: string) => {
  const id = nullableId(value);
  if (id === null) {
    throw new BadRequestException(message);
  }

  return id;
};

export const readPositiveDecimal = (value: string | number | null | undefined, message: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException(message);
  }

  return amount.toFixed(4);
};

export const decimalString = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(4) : '0.0000';
};

export const parseSpecValues = (value: string | null): ProductSpecValue[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return normalizeSpecValues(parsed);
  } catch {
    return [];
  }
};

export const normalizeSpecValues = (value: unknown): ProductSpecValue[] => {
  if (!Array.isArray(value)) {
    throw new BadRequestException('Invalid spec values');
  }

  const keys = new Set<string>();

  return value.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new BadRequestException('Invalid spec value');
    }

    const record = item as Record<string, unknown>;
    const key = readSpecString(record.key, `Missing spec value key at ${index + 1}`);
    const rawValue = record.value;
    const unit = typeof record.unit === 'string' && record.unit.trim() ? record.unit.trim() : null;

    if (keys.has(key)) {
      throw new BadRequestException('Duplicate spec value key');
    }

    keys.add(key);

    if (
      rawValue !== null &&
      rawValue !== undefined &&
      typeof rawValue !== 'string' &&
      typeof rawValue !== 'number' &&
      typeof rawValue !== 'boolean'
    ) {
      throw new BadRequestException('Invalid spec value');
    }

    const normalizedValue =
      rawValue === null || rawValue === undefined || rawValue === '' ? null : String(rawValue).trim();

    return {
      key,
      value: normalizedValue || null,
      unit,
    };
  });
};

const readSpecString = (value: unknown, message: string) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
};
