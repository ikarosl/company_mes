import type { ProductionBatchStatus } from './production.js';

import type { ProductionBatchStatus } from './production.js';

/** 产品分类的一级属性：用于区分成品、半成品、物料及其他库存对象。 */
export type ProductAttribute =
  | 'finished'
  | 'semi_finished'
  | 'material'
  | 'auxiliary'
  | 'other';

/** 产品属性中文标签：供各业务页面统一展示固定枚举值。 */
export const PRODUCT_ATTRIBUTE_LABELS: Record<ProductAttribute, string> = {
  finished: '成品',
  semi_finished: '半成品',
  material: '物料',
  auxiliary: '辅料',
  other: '其他',
};

/** 历史中文属性到当前固定枚举的兼容映射，仅用于存量数据过渡。 */
export const LEGACY_PRODUCT_ATTRIBUTE_MAP: Record<string, ProductAttribute> = {
  成品: 'finished',
  半成品: 'semi_finished',
  物料: 'material',
  原材料: 'material',
  辅料: 'auxiliary',
  其他: 'other',
};

/** 将接口或数据库中的产品属性统一转换为当前英文枚举。 */
export const normalizeProductAttribute = (
  value: string | null | undefined,
): ProductAttribute | null => {
  if (!value) {
    return null;
  }
  const normalized = LEGACY_PRODUCT_ATTRIBUTE_MAP[value] ?? value;
  return normalized in PRODUCT_ATTRIBUTE_LABELS ? (normalized as ProductAttribute) : null;
};

/** 判断产品属性是否允许进入生产工单。 */
export const isProductionProductAttribute = (value: string | null | undefined) => {
  const normalized = normalizeProductAttribute(value);
  return normalized === 'finished' || normalized === 'semi_finished';
};

export interface ProductCategoryListItem {
  id: string;
  /** 一级产品属性，只允许使用系统约定的固定分类。 */
  productAttribute: ProductAttribute;
  productType: string;
  status: number;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryQuery {
  keyword?: string;
  /** 一级产品属性筛选条件。 */
  productAttribute?: ProductAttribute | '';
  productType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProductCategoryPayload {
  /** 一级产品属性，只允许使用系统约定的固定分类。 */
  productAttribute: ProductAttribute;
  productType: string;
  status?: number | boolean;
  remark?: string | null;
}

export interface UpdateProductCategoryPayload {
  /** 一级产品属性，只允许使用系统约定的固定分类。 */
  productAttribute?: ProductAttribute;
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

/** 工序重要参数定义：实际参数值由员工报工时填写。 */
export interface ProcessImportantParameter {
  /** 参数名称，例如焊接温度、驻波。 */
  key: string;
  /** 参数单位，例如 ℃、s、dB；无单位时为空。 */
  unit?: string | null;
}

export interface ProcessListItem {
  id: string;
  processCode: string;
  processName: string;
  description: string | null;
  sopFileId: string | null;
  sopFileName: string | null;
  sopFileUrl: string | null;
  /** 工序报工时必须填写的重要参数定义。 */
  importantParameters: ProcessImportantParameter[];
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
  /** 报工时需要填写的重要参数定义。 */
  importantParameters?: ProcessImportantParameter[];
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
  /** 报工时需要填写的重要参数定义。 */
  importantParameters?: ProcessImportantParameter[];
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
  /** 报工时需要填写的重要参数定义。 */
  importantParameters: ProcessImportantParameter[];
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

/** 物料批次质量状态：库存数量与质量放行状态分开表达。 */
export type MaterialBatchQualityStatus =
  | 'qualified'
  | 'partial_qualified';

/** 物料批次库存列表项，protocolCode 是该入库批次的检测依据编码。 */
export interface MaterialBatchListItem {
  id: string;
  /** 库存来源类型：material 来自物料批次表，product 来自产品库存批次表。 */
  inventoryType?: InventoryStocktakeInventoryType;
  productId: string;
  productModel: string;
  productName: string;
  productAttribute: string | null;
  productType: string | null;
  /** 产品库存对象类型：finished 成品，semi_finished 半成品；物料库存为空。 */
  objectType?: string | null;
  /** 产品库存来源类型：生产、采购、外协、盘点或其他；物料库存为空。 */
  sourceType?: string | null;
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
  /** 物料质量状态；成品/半成品库存不使用该字段。 */
  qualityStatus: MaterialBatchQualityStatus | null;
  /** 库存计量单位：产品库存优先取库存批次单位，物料库存取产品主数据单位。 */
  unit?: string | null;
  /** 库位：当前主要用于产品库存批次展示。 */
  location?: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 设置产品默认工艺路线请求；routeId 为空表示取消默认路线。 */
export interface SetProductDefaultRoutePayload {
  /** 默认工艺路线 ID，必须是启用且适用于该产品分类的路线。 */
  routeId: string | null;
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
  /** 生产任务状态：领料出库仅允许生产中的任务。 */
  productionBatchStatus: ProductionBatchStatus;
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

/** 入库时可同步提交的来料检验信息。 */
export interface MaterialInboundInspectionPayload {
  /** 检验名称，默认使用“来料检验”。 */
  inspectionName?: string | null;
  /** 检验数量：允许抽检；部分合格时应填写实际放行数量。 */
  inspectQuantity: number;
  /** 合格数量：部分合格时作为本批次的初始合格可用数量。 */
  passQuantity: number;
  /** 不合格数量。 */
  failQuantity: number;
  /** 检验结论。 */
  result: 'pass' | 'partial_pass';
  /** 入库允许接收或让步接收合格部分；无合格数量时不能调用入库接口。 */
  disposition?: 'accept' | 'conditional_accept' | null;
  /** 检验人员 ID；为空时使用当前入库操作人。 */
  inspectorId?: string | null;
  /** 检验时间；为空时使用服务器当前时间。 */
  inspectedAt?: string | null;
  /** 检验报告或图片地址。 */
  fileUrl?: string | null;
  /** 检验结果摘要。 */
  resultSummary?: string | null;
  /** 检验补充说明。 */
  remark?: string | null;
}

/** 物料入库请求：一个物料批次号只允许办理一次入库。 */
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
  /** 来料检验：必填，并与物料批次在同一事务内创建。 */
  inspection: MaterialInboundInspectionPayload;
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
