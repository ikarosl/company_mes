export type WorkOrderStatus = 'draft' | 'released' | 'doing' | 'completed' | 'closed' | 'cancelled';
/** 生产批次主状态，仅表达批次执行阶段。 */
export type ProductionBatchStatus =
  | 'pending'
  | 'material_pending'
  | 'material_assigned'
  | 'doing'
  | 'completed'
  | 'cancelled';
export type BatchStepStatus = 'pending' | 'doing' | 'completed' | 'abnormal' | 'skipped';

/** 生产任务列表项，物料和派工状态均由后端关联数据实时汇总。 */
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
  materialStatus?: 'missing_demand' | 'unallocated' | 'partial' | 'allocated' | 'shortage' | 'used';
  dispatchStatus?: 'missing_steps' | 'unassigned' | 'partial' | 'assigned';
  materialRequirementCount?: number;
  assignedMaterialCount?: number;
  stepCount?: number;
  assignedStepCount?: number;
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
  canStart: boolean;
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

export interface MaterialAllocationRequirementItem extends TaskMaterialRequirementItem {
  reservedQuantity: string;
  unmetQuantity: string;
  availableBatchCount: number;
  allocationStatus: 'unallocated' | 'partial' | 'allocated' | 'used';
  /** 同一需求可由多个物料批次分次预留。 */
  allocations: MaterialAllocationRecordItem[];
}

/** 单次预留流水及其所在物料批次的领退料汇总。 */
export interface MaterialAllocationRecordItem {
  id: string;
  materialBatchId: string;
  materialBatchNo: string;
  reservedQuantity: string;
  issuedQuantity: string;
  returnedQuantity: string;
  usedQuantity: string;
  remainingQuantity: string;
  recordedByName: string | null;
  recordedAt: string;
  remark: string | null;
  canClear: boolean;
}

export interface MaterialAllocationBatchItem extends ProductionBatchItem {
  materialStatus: 'missing_demand' | 'unallocated' | 'partial' | 'allocated' | 'shortage' | 'used';
  requirementCount: number;
  allocatedCount: number;
  shortageCount: number;
  requirements: MaterialAllocationRequirementItem[];
}

export interface MaterialAllocationAvailableBatchItem {
  id: string;
  materialBatchNo: string;
  supplierName: string | null;
  receivedDate: string | null;
  quantity: string;
  reservedQuantity: string;
  usedQuantity: string;
  availableQuantity: string;
  status: string;
}

export interface AllocateMaterialPayload {
  productMaterialId: string;
  materialBatchId: string;
  reservedQuantity: string | number;
  remark?: string | null;
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

/** 工单列表查询条件。 */
export interface WorkOrderQuery {
  keyword?: string;
  customerOrderNo?: string;
  customerName?: string;
  productId?: string;
  ownerId?: string;
  status?: WorkOrderStatus;
  page?: number;
  pageSize?: number;
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

/** 开始生产前检查结果：blockers 阻止开始，warnings 仅要求操作员确认。 */
export interface ProductionTaskStartCheck {
  canStart: boolean;
  blockers: string[];
  warnings: string[];
  materialRequirementCount: number;
  unallocatedMaterialCount: number;
  partialMaterialCount: number;
  criticalUnallocatedCount: number;
  stepCount: number;
  unassignedStepCount: number;
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
