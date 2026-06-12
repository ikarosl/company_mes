export type WorkOrderStatus = 'draft' | 'released' | 'doing' | 'completed' | 'closed' | 'cancelled';
export type ProductionBatchStatus = 'pending' | 'assigned' | 'doing' | 'completed' | 'cancelled';
export type BatchMaterialStatus = 'ungenerated' | 'unassigned' | 'partial_assigned' | 'assigned' | 'ready' | 'outbound' | 'shortage' | 'returned';
export type BatchDispatchStatus = 'pending' | 'assigned';
export type BatchProductionStatus = 'pending' | 'doing' | 'completed';
export type BatchInspectionStatus = 'pending' | 'inspecting' | 'passed' | 'failed' | 'partial_pass';

export interface ProductionBatchItem {
  id: string;
  workOrderId: string;
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
  plannedQuantity: string | number;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface UpdateProductionBatchPayload {
  batchNo?: string;
  plannedQuantity?: string | number;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  status?: ProductionBatchStatus;
  remark?: string | null;
}
