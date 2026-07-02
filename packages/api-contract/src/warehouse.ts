/** 成/半成品库存来源类型：对应 product_inventory_batches.source_type。 */
export type FinishedInventorySourceType =
  | 'production'
  | 'purchase'
  | 'outsourcing'
  | 'stocktake'
  | 'other';

/** 成/半成品对象类型：对应 product_inventory_batches.object_type。 */
export type FinishedInventoryObjectType = 'semi_finished' | 'finished';

/** 成/半成品流转类型：对应 product_flow_records.flow_type。 */
export type FinishedTransactionType = 'inbound' | 'outbound' | 'adjustment';

/** 成/半成品出入库列表项：用于管理端表格展示库存批次流转记录。 */
export interface FinishedTransactionListItem {
  /** 流水记录 ID。 */
  id: string;
  /** 流水单号：由后端生成或留空。 */
  flowNo: string | null;
  /** 流转类型：入库、出库或盘点调整。 */
  transactionType: FinishedTransactionType;
  /** 产品库存 ID：关联 product_inventory_batches.id。 */
  inventoryId: string;
  /** 产品库存批次号：用于追踪成/半成品库存批次。 */
  inventoryBatchNo: string;
  /** 关联生产批次 ID：生产入库时通常来自已完成生产批次。 */
  productionBatchId: string | null;
  /** 关联生产批次号：列表展示用。 */
  productionBatchNo: string | null;
  /** 产品 ID。 */
  productId: string;
  /** 产品型号快照。 */
  productModel: string;
  /** 产品名称快照。 */
  productName: string;
  /** 对象类型：成品或半成品。 */
  objectType: FinishedInventoryObjectType;
  /** 流转原因：记录来源类型、普通出库或盘点调整等原因。 */
  flowReason: string | null;
  /** 本次流转数量，始终展示为正数。 */
  quantity: string;
  /** 单位快照。 */
  unit: string | null;
  /** 操作人名称。 */
  recordedByName: string | null;
  /** 操作日期。 */
  recordedAt: string;
  /** 备注说明。 */
  remark: string | null;
}

/** 可出库成/半成品库存批次选项。 */
export interface FinishedInventoryOption {
  /** 产品库存 ID。 */
  id: string;
  /** 产品库存批次号。 */
  inventoryBatchNo: string;
  /** 关联生产批次 ID。 */
  productionBatchId: string | null;
  /** 关联生产批次号。 */
  productionBatchNo: string | null;
  /** 产品 ID。 */
  productId: string;
  /** 产品型号。 */
  productModel: string;
  /** 产品名称。 */
  productName: string;
  /** 对象类型：成品或半成品。 */
  objectType: FinishedInventoryObjectType;
  /** 当前可出库数量。 */
  quantity: string;
  /** 单位。 */
  unit: string | null;
}

/** 可办理生产入库的已完成生产批次选项。 */
export interface FinishedProductionInboundOption {
  /** 生产批次 ID。 */
  id: string;
  /** 生产批次号。 */
  batchNo: string;
  /** 产品 ID。 */
  productId: string;
  /** 产品型号。 */
  productModel: string;
  /** 产品名称。 */
  productName: string;
  /** 批次计划数量。 */
  plannedQuantity: string;
  /** 该生产批次已写入 product_flow_records 的入库数量合计。 */
  inboundQuantity: string;
  /** 剩余可入库数量：plannedQuantity - inboundQuantity。 */
  availableQuantity: string;
  /** 单位。 */
  unit: string | null;
}

/** 成/半成品入库请求参数。 */
export interface FinishedInboundPayload {
  /** 来源类型：生产、外购、外协、盘点或其他。 */
  sourceType: FinishedInventorySourceType;
  /** 对象类型：成品或半成品。 */
  objectType: FinishedInventoryObjectType;
  /** 生产批次 ID：sourceType 为 production 时必填。 */
  productionBatchId?: string | null;
  /** 产品 ID：sourceType 非 production 时必填。 */
  productId?: string | null;
  /** 产品库存批次号：为空时由后端自动生成。 */
  inventoryBatchNo?: string | null;
  /** 本次入库数量。 */
  quantity: string | number;
  /** 备注说明。 */
  remark?: string | null;
}

/** 成/半成品出库请求参数。 */
export interface FinishedOutboundPayload {
  /** 产品库存 ID：从当前可用库存批次中选择。 */
  inventoryId: string;
  /** 本次出库数量。 */
  quantity: string | number;
  /** 备注说明。 */
  remark?: string | null;
}
