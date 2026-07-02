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
  /** 初始入库数量：记录该批次首次入库的原始数量，后续盘点和领退料不覆盖。 */
  initialQuantity: string | null;
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
  /** 本次操作数量：用于展示领料、退料和取消预留的实际操作量。 */
  operationQuantity: string;
  reservedQuantity: string;
  usedQuantity: string;
  /** 物料操作类型：预留、取消预留、领料或退料。 */
  operationType: 'reserve' | 'unreserve' | 'issue' | 'return';
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

/** 库存盘点对象类型：物料库存批次或成品/半成品库存批次。 */
export type InventoryStocktakeInventoryType = 'material' | 'product';

/** 库存盘点差异类型，由“实盘数量 - 账面数量”计算得到。 */
export type InventoryStocktakeDifferenceType = 'surplus' | 'shortage' | 'equal';

/** 库存盘点台账状态：confirmed 表示已登记，adjusted 表示已完成调账。 */
export type InventoryStocktakeStatus = 'draft' | 'confirmed' | 'adjusted' | 'voided';

/** 库存盘点目标下拉项，用于在前端选择要盘点的库存批次。 */
export interface InventoryStocktakeTargetOption {
  id: string;
  inventoryType: InventoryStocktakeInventoryType;
  batchNo: string;
  productId: string;
  productModel: string;
  productName: string;
  objectType: string | null;
  quantity: string;
  unit: string | null;
  location: string | null;
}

/** 库存盘点台账列表项，记录一次盘点事实及后续调账结果。 */
export interface InventoryStocktakeListItem {
  id: string;
  stocktakeNo: string | null;
  inventoryType: InventoryStocktakeInventoryType;
  inventoryBatchId: string;
  batchNoSnapshot: string | null;
  productIdSnapshot: string | null;
  productModel: string | null;
  productName: string | null;
  objectType: string | null;
  beforeQuantity: string;
  countedQuantity: string;
  differenceQuantity: string;
  differenceType: InventoryStocktakeDifferenceType;
  reasonType: string | null;
  status: InventoryStocktakeStatus;
  afterQuantity: string | null;
  operatorName: string | null;
  operatedAt: string;
  adjustedByName: string | null;
  adjustedAt: string | null;
  fileUrl: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** 新增盘点台账请求：账面数量由后端锁定库存批次后读取，前端只提交实盘数量。 */
export interface CreateInventoryStocktakePayload {
  inventoryType: InventoryStocktakeInventoryType;
  inventoryBatchId: string;
  countedQuantity: string | number;
  reasonType?: string | null;
  operatedAt?: string | null;
  fileUrl?: string | null;
  remark?: string | null;
}

/** 确认盘点调账请求：可补充调账说明，不允许前端直接提交调整后库存。 */
export interface AdjustInventoryStocktakePayload {
  remark?: string | null;
}

/** 物料出入库整合列表的记录类型。 */
export type MaterialTransactionType = 'inbound' | 'outbound' | 'return';

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

/** 物料入库请求：新增或累加入库同一物料批次。 */
export interface MaterialInboundPayload {
  /** 物料产品ID：关联 products.id。 */
  productId: string;
  /** 物料批次号：作为来料追溯入口。 */
  materialBatchNo: string;
  /** 本次入库数量，必须大于0。 */
  quantity: string | number;
  /** 供应商名称快照。 */
  supplierName?: string | null;
  /** 技术协议编码快照。 */
  protocolCode?: string | null;
  /** 入库日期，格式为 YYYY-MM-DD。 */
  receivedDate?: string | null;
  /** 入库备注。 */
  remark?: string | null;
}

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
