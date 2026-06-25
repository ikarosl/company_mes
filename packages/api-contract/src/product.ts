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
  keyword?: string;
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
  /** 模糊匹配规格参数的名称、值或单位。 */
  specKeyword?: string;
  /** 产品属性集合，使用英文逗号分隔，例如 finished,semi_finished。 */
  productAttributes?: string;
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
  quantityPerUnit?: string | number | null;
  unit?: string | null;
  isKeyMaterial?: boolean;
  needBatchRecord?: boolean;
  remark?: string | null;
}

export interface ConfigureProductMaterialsPayload {
  materials: ProductMaterialPayload[];
}

/** 产品库存详情，数量汇总口径与物料库存管理保持一致。 */
export interface ProductInventoryDetail {
  productId: string;
  totalQuantity: string;
  reservedQuantity: string;
  usedQuantity: string;
  availableQuantity: string;
  batches: MaterialBatchListItem[];
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
  needInspection?: boolean;
  needRecord?: boolean;
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
  needInspection: boolean;
  needRecord: boolean;
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

/** 产品可用工艺路线，默认路线由 products.default_route_id 标识。 */
export interface ProductRouteItem extends ProcessRouteListItem {
  isDefault: boolean;
}

export interface ProductRouteDetail {
  productId: string;
  defaultRouteId: string | null;
  routes: ProductRouteItem[];
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

/** 物料批次库存状态。 */
export type MaterialBatchStatus = 'available' | 'partial_used' | 'used_up' | 'disabled';

/** 物料批次库存列表项，protocolCode 是该入库批次的检测依据编码。 */
export interface MaterialBatchListItem {
  id: string;
  productId: string;
  productModel: string;
  productName: string;
  productAttribute: string | null;
  productType: string | null;
  materialBatchNo: string;
  supplierName: string | null;
  protocolCode: string | null;
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

/** 新增物料批次或物料入库的公共请求参数。 */
export interface CreateMaterialBatchPayload {
  productId: string;
  materialBatchNo: string;
  supplierName?: string | null;
  protocolCode?: string | null;
  receivedDate?: string | null;
  quantity?: string | number | null;
  status?: MaterialBatchStatus;
  remark?: string | null;
}

export interface UpdateMaterialBatchPayload {
  productId?: string;
  materialBatchNo?: string;
  supplierName?: string | null;
  protocolCode?: string | null;
  receivedDate?: string | null;
  quantity?: string | number | null;
  status?: MaterialBatchStatus;
  remark?: string | null;
}

export interface StocktakeMaterialBatchPayload {
  quantity: string | number;
  remark?: string | null;
}

/** 物料出入库整合列表的记录类型。 */
export type MaterialTransactionType = 'inbound' | 'outbound';

/** 入库批次和累计生产出库记录的统一展示结构。 */
export interface MaterialTransactionListItem {
  id: string;
  transactionType: MaterialTransactionType;
  materialBatchId: string;
  materialBatchNo: string;
  materialProductId: string;
  materialModel: string;
  materialName: string;
  supplierName: string | null;
  protocolCode: string | null;
  quantity: string;
  unit: string | null;
  productionBatchId: string | null;
  productionBatchNo: string | null;
  workOrderNo: string | null;
  recordedByName: string | null;
  recordedAt: string;
  remark: string | null;
}

/** 生产领料下拉项：定位唯一需求及其已分配物料批次。 */
export interface MaterialTransactionDemandOption {
  usageId: string;
  productionBatchId: string;
  productionBatchNo: string;
  workOrderNo: string;
  productMaterialId: string;
  materialProductId: string;
  materialModel: string;
  materialName: string;
  materialBatchId: string;
  materialBatchNo: string;
  reservedQuantity: string;
  usedQuantity: string;
  remainingQuantity: string;
  unit: string | null;
}

export interface MaterialInboundPayload extends CreateMaterialBatchPayload {}

/** 生产领料出库请求。 */
export interface MaterialOutboundPayload {
  usageId: string;
  quantity: string | number;
  remark?: string | null;
}

/** 生产退料请求，原因用于审计和后续追溯。 */
export interface MaterialReturnPayload {
  usageId: string;
  quantity: string | number;
  reason: string;
  remark?: string | null;
}
