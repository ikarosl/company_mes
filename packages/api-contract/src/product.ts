export interface ProductCategoryListItem {
  id: string;
  productAttribute: string;
  productType: string;
  status: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryQuery {
  productAttribute?: string;
  productType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProductCategoryPayload {
  productAttribute: string;
  productType: string;
  status?: number | boolean;
  remark?: string | null;
}

export interface UpdateProductCategoryPayload {
  productAttribute?: string;
  productType?: string;
  status?: number | boolean;
  remark?: string | null;
}

export type ProductAcquireMethod = 'self_made' | 'outsourced' | 'purchased';

export interface ProductSpecValue {
  key: string;
  value: string | null;
  unit?: string | null;
}

export interface ProductListItem {
  id: string;
  productModel: string;
  productName: string;
  categoryId: string | null;
  productAttribute: string | null;
  productType: string | null;
  unit: string;
  acquireMethod: ProductAcquireMethod;
  specValues: ProductSpecValue[];
  materialCount: number;
  status: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuery {
  keyword?: string;
  categoryId?: string;
  acquireMethod?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProductPayload {
  productModel: string;
  productName: string;
  categoryId?: string | null;
  unit: string;
  acquireMethod: ProductAcquireMethod;
  specValues?: ProductSpecValue[];
  status?: number | boolean;
  remark?: string | null;
}

export interface UpdateProductPayload {
  productModel?: string;
  productName?: string;
  categoryId?: string | null;
  unit?: string;
  acquireMethod?: ProductAcquireMethod;
  specValues?: ProductSpecValue[];
  status?: number | boolean;
  remark?: string | null;
}

export interface ProductMaterialItem {
  id: string;
  productId: string;
  materialProductId: string;
  materialModel: string;
  materialName: string;
  materialUnit: string;
  quantityPerUnit: string;
  unit: string | null;
  isKeyMaterial: boolean;
  needBatchRecord: boolean;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductMaterialPayload {
  id?: string;
  materialProductId: string;
  quantityPerUnit: string | number;
  unit?: string | null;
  isKeyMaterial?: boolean;
  needBatchRecord?: boolean;
  remark?: string | null;
}

export interface ConfigureProductMaterialsPayload {
  materials: ProductMaterialPayload[];
}

export interface ProcessListItem {
  id: string;
  processCode: string;
  processName: string;
  description: string | null;
  sopFileId: string | null;
  sopFileName: string | null;
  sopFileUrl: string | null;
  status: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessQuery {
  keyword?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProcessPayload {
  processCode: string;
  processName: string;
  description?: string | null;
  sopFileId?: string | null;
  sopFileName?: string | null;
  sopFileUrl?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface UpdateProcessPayload {
  processCode?: string;
  processName?: string;
  description?: string | null;
  sopFileId?: string | null;
  sopFileName?: string | null;
  sopFileUrl?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface UploadProcessSopPayload {
  sopFileName: string;
  sopFileUrl?: string | null;
}

export interface ProcessOption {
  id: string;
  processCode: string;
  processName: string;
  description: string | null;
  sopFileId: string | null;
  sopFileName: string | null;
  sopFileUrl: string | null;
}

export interface ProcessRouteOption {
  id: string;
  routeCode: string;
  routeName: string;
  version: string | null;
}

export interface ProcessRouteStepPayload {
  id?: string;
  processId: string;
  stepOrder: number;
  defaultOwnerId?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface ProcessRouteStepItem extends ProcessRouteStepPayload {
  id: string;
  routeId: string;
  processCode: string;
  processName: string;
  description: string | null;
  defaultOwnerId: string | null;
  defaultOwnerName: string | null;
  sopFileId: string | null;
  sopFileName: string | null;
  sopFileUrl: string | null;
  status: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessRouteListItem {
  id: string;
  routeCode: string;
  routeName: string;
  productCategoryId: string | null;
  productAttribute: string | null;
  productType: string | null;
  version: string | null;
  status: number;
  remark: string | null;
  stepCount: number;
  processSummary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessRouteDetail extends ProcessRouteListItem {
  steps: ProcessRouteStepItem[];
}

export interface CreateProcessRoutePayload {
  routeCode: string;
  routeName: string;
  productCategoryId?: string | null;
  version?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface UpdateProcessRoutePayload {
  routeCode?: string;
  routeName?: string;
  productCategoryId?: string | null;
  version?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface ConfigureProcessRouteStepsPayload {
  steps: ProcessRouteStepPayload[];
}

export type MaterialBatchStatus = 'available' | 'partial_used' | 'used_up' | 'disabled';

export interface MaterialBatchListItem {
  id: string;
  productId: string;
  productModel: string;
  productName: string;
  productAttribute: string | null;
  productType: string | null;
  materialBatchNo: string;
  supplierName: string | null;
  receivedDate: string | null;
  quantity: string;
  reservedQuantity: string;
  usedQuantity: string;
  availableQuantity: string;
  status: MaterialBatchStatus;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialBatchUsageItem {
  id: string;
  batchId: string | null;
  reservedQuantity: string;
  usedQuantity: string;
  status: string | null;
  recordedBy: string | null;
  recordedByName: string | null;
  recordedAt: string | null;
  remark: string | null;
}

export interface MaterialBatchDetail extends MaterialBatchListItem {
  reservations: MaterialBatchUsageItem[];
  usages: MaterialBatchUsageItem[];
}

export interface CreateMaterialBatchPayload {
  productId: string;
  materialBatchNo: string;
  supplierName?: string | null;
  receivedDate?: string | null;
  quantity?: string | number | null;
  status?: MaterialBatchStatus;
  remark?: string | null;
}

export interface UpdateMaterialBatchPayload {
  productId?: string;
  materialBatchNo?: string;
  supplierName?: string | null;
  receivedDate?: string | null;
  quantity?: string | number | null;
  status?: MaterialBatchStatus;
  remark?: string | null;
}

export interface StocktakeMaterialBatchPayload {
  quantity: string | number;
  remark?: string | null;
}
