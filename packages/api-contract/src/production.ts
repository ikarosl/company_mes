export type WorkOrderStatus = 'draft' | 'released' | 'doing' | 'completed' | 'closed' | 'cancelled';
export type ProductionBatchStatus = 'pending' | 'assigned' | 'doing' | 'completed' | 'cancelled';
export type BatchMaterialStatus = 'ungenerated' | 'unassigned' | 'partial_assigned' | 'assigned' | 'ready' | 'outbound' | 'shortage' | 'returned';
export type BatchDispatchStatus = 'pending' | 'assigned';
export type BatchProductionStatus = 'pending' | 'doing' | 'completed';
export type BatchInspectionStatus = 'pending' | 'inspecting' | 'passed' | 'failed' | 'partial_pass';
export type BatchStepStatus = 'pending' | 'assigned' | 'doing' | 'completed' | 'abnormal' | 'skipped';

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
  materialStatus: BatchMaterialStatus;
  dispatchStatus: BatchDispatchStatus;
  productionStatus: BatchProductionStatus;
  inspectionStatus: BatchInspectionStatus;
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
  routeStepId: string;
  stepOrder: number;
  processId: string | null;
  processCode: string;
  processName: string;
  defaultOwnerId: string | null;
  defaultOwnerName: string | null;
  actualOwnerId: string | null;
  actualOwnerName: string | null;
  status: BatchStepStatus;
  startedAt: string | null;
  finishedAt: string | null;
  totalQuantity: string | null;
  qualifiedQuantity: string | null;
  defectiveQuantity: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskMaterialRequirementItem {
  id: string;
  routeStepId: string;
  routeStepName: string;
  productMaterialId: string;
  materialProductId: string;
  materialModel: string;
  materialName: string;
  quantityPerUnit: string;
  requiredQuantity: string;
  unit: string | null;
  isKeyMaterial: boolean;
  needBatchRecord: boolean;
}

export interface ProductionTaskDetail extends ProductionBatchItem {
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
  unit: string;
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
  routeId?: string | null;
  plannedQuantity: string | number;
  unit?: string | null;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface UpdateWorkOrderPayload {
  orderNo?: string;
  productId?: string;
  routeId?: string | null;
  plannedQuantity?: string | number;
  unit?: string | null;
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
}

export interface DispatchTaskStepPayload {
  routeStepId: string;
  actualOwnerId?: string | null;
}

export interface DispatchTaskPayload {
  steps?: DispatchTaskStepPayload[];
}

export interface UpdateBatchStepRecordPayload {
  actualOwnerId?: string | null;
  status?: BatchStepStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  totalQuantity?: string | number | null;
  qualifiedQuantity?: string | number | null;
  defectiveQuantity?: string | number | null;
  remark?: string | null;
}
