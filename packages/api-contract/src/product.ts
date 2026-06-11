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
  version: string | null;
  status: number;
  remark: string | null;
  stepCount: number;
  processSummary: string;
  productCount: number;
  productIds: string[];
  productNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessRouteDetail extends ProcessRouteListItem {
  steps: ProcessRouteStepItem[];
}

export interface CreateProcessRoutePayload {
  routeCode: string;
  routeName: string;
  version?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface UpdateProcessRoutePayload {
  routeCode?: string;
  routeName?: string;
  version?: string | null;
  status?: number | boolean;
  remark?: string | null;
}

export interface ConfigureProcessRouteStepsPayload {
  steps: ProcessRouteStepPayload[];
}

export interface ConfigureProcessRouteProductsPayload {
  productIds: string[];
}
