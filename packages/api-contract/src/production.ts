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
