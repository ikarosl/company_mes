export type WorkOrderStatus = 'draft' | 'released' | 'doing' | 'completed' | 'closed' | 'cancelled';
export type ProductionBatchStatus =
  | 'pending'
  | 'material_pending'
  | 'material_assigned'
  | 'doing'
  | 'completed'
  | 'cancelled';
export type BatchStepStatus = 'pending' | 'doing' | 'completed' | 'abnormal' | 'skipped';

export interface ProductionBatchItem {
  id: string;
  workOrderId: string;
  workOrderNo?: string;
  batchNo: string;
  productId: string;
  productModel: string;
  productName: string;
  routeId: string | null;
  routeName: string | null;
  plannedQuantity: string;
  status: ProductionBatchStatus;
  ownerId: string | null;
  ownerName: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchStepRecordItem {
  id: string;
  batchId: string;
  processRouteStepsId: string;
  stepOrder: number;
  stepName: string;
  sopFileId: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  status: BatchStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  outputQuantity: string | null;
  returnQuantity: string | null;
  abnormalQuantity: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerTaskItem extends ProductionBatchItem {
  stepRecordId: string;
  processRouteStepsId: string;
  stepOrder: number;
  stepName: string;
  stepStatus: BatchStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  outputQuantity: string | null;
  returnQuantity: string | null;
  abnormalQuantity: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
}

export interface TaskMaterialRequirementItem {
  id: string;
  usageId: string | null;
  productMaterialId: string;
  materialProductId: string;
  materialModel: string;
  materialName: string;
  quantityPerUnit: string;
  planQuantity: string;
  usedQuantity: string;
  unit: string | null;
  isKeyMaterial: boolean;
  needBatchRecord: boolean;
}

export interface ProductionTaskDetail extends ProductionBatchItem {
  steps: BatchStepRecordItem[];
  materialRequirements: TaskMaterialRequirementItem[];
}

export interface ProductionTaskCreatePreview {
  steps: BatchStepRecordItem[];
  materialRequirements: TaskMaterialRequirementItem[];
}

export interface WorkOrderListItem {
  id: string;
  orderNo: string;
  productId: string;
  productModel: string;
  productName: string;
  routeId: string | null;
  routeName: string | null;
  plannedQuantity: string;
  assignedQuantity: string;
  customerOrderNo: string | null;
  customerName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  status: WorkOrderStatus;
  currentFlow: string;
  nextAction: string;
  planStartDate: string | null;
  planEndDate: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderDetail extends WorkOrderListItem {
  batches: ProductionBatchItem[];
}

export interface CreateWorkOrderPayload {
  orderNo: string;
  productId: string;
  plannedQuantity: string | number;
  customerOrderNo?: string | null;
  customerName?: string | null;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface UpdateWorkOrderPayload {
  orderNo?: string;
  productId?: string;
  plannedQuantity?: string | number;
  customerOrderNo?: string | null;
  customerName?: string | null;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface CreateProductionBatchPayload {
  batchNo?: string | null;
  routeId?: string | null;
  plannedQuantity: string | number;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface CreateProductionTaskPayload extends CreateProductionBatchPayload {
  workOrderId: string;
  steps?: DispatchTaskStepPayload[];
}

export interface UpdateProductionBatchPayload {
  batchNo?: string;
  routeId?: string | null;
  plannedQuantity?: string | number;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  status?: ProductionBatchStatus;
  remark?: string | null;
  steps?: DispatchTaskStepPayload[];
}

export interface DispatchTaskStepPayload {
  processRouteStepsId: string;
  responsibleUserId?: string | null;
  sopFileId?: string | null;
}

export interface DispatchTaskPayload {
  steps?: DispatchTaskStepPayload[];
}

export interface UpdateBatchStepRecordPayload {
  responsibleUserId?: string | null;
  sopFileId?: string | null;
  status?: BatchStepStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  outputQuantity?: string | number | null;
  returnQuantity?: string | number | null;
  abnormalQuantity?: string | number | null;
  remark?: string | null;
}

// ─── 生产投入需求与分配（统一库存方案） ──────────────────────

/** 生产投入需求汇总项，对应 v_production_item_demand_summary */
export interface ProductionItemDemandSummaryItem {
  demandId: string;
  productionBatchId: string;
  bomId: string | null;
  itemId: string;
  itemCode: string;
  itemName: string;
  needNumber: string;
  demandType: number;
  parentDemandId: string | null;
  sourceScrapId: string | null;
  businessStatus: string;
  allocatedQuantity: string;
  unallocatedQuantity: string;
  outboundQuantity: string;
  notOutboundQuantity: string;
  returnedQuantity: string;
  stockScrappedQuantity: string;
  productionScrappedQuantity: string;
  availableOutboundQuantity: string;
  isShortage: boolean;
  isQuantityAbnormal: boolean;
  progressStatus: string;
}

/** 生产投入分配汇总项，对应 v_production_item_allocation_summary */
export interface ProductionItemAllocationSummaryItem {
  allocationId: string;
  demandId: string;
  productionBatchId: string;
  itemId: string;
  batchId: string;
  batchCode: string;
  assignedNumber: string;
  outboundQuantity: string;
  returnedQuantity: string;
  returnedAvailableQuantity: string;
  releasedReturnQuantity: string;
  stockScrappedQuantity: string;
  productionScrappedQuantity: string;
  availableOutboundQuantity: string;
  isQuantityAbnormal: boolean;
}

/** 可分配库存批次，对应 v_item_batch_available_to_allocate */
export interface ItemBatchAvailableToAllocateItem {
  batchId: string;
  itemId: string;
  itemName: string;
  itemKind: string;
  batchCode: string;
  onHandAvailableQuantity: string;
  reservedQuantity: string;
  availableToAllocateQuantity: string;
}

/** 创建分配请求参数 */
export interface CreateAllocationPayload {
  productionBatchId: string;
  demandId: string;
  itemId: string;
  batchId: string;
  assignedNumber: string | number;
  remark?: string | null;
}

/** 生产批次投入汇总，对应 v_production_batch_item_summary */
export interface ProductionBatchItemSummaryItem {
  productionBatchId: string;
  itemId: string;
  itemName: string;
  totalNeedNumber: string;
  totalAllocatedQuantity: string;
  totalUnallocatedQuantity: string;
  totalOutboundQuantity: string;
  totalReturnedQuantity: string;
  actualConsumedQuantity: string;
  totalStockScrappedQuantity: string;
  totalProductionScrappedQuantity: string;
  isShortage: boolean;
  isQuantityAbnormal: boolean;
}

/** 生产批次产出汇总，对应 v_production_batch_output_summary */
export interface ProductionBatchOutputSummaryItem {
  productionBatchId: string;
  workOrderId: string;
  itemId: string;
  itemName: string;
  itemKind: string;
  batchId: string;
  batchCode: string;
  inboundQuantity: string;
  stockStatus: string;
  sourceStage: string | null;
}

/** 生产物料需求与分配详情 */
export interface ProductionMaterialDetail {
  demands: ProductionItemDemandSummaryItem[];
  allocations: ProductionItemAllocationSummaryItem[];
  batchItemSummary: ProductionBatchItemSummaryItem[];
  outputSummary: ProductionBatchOutputSummaryItem[];
}
