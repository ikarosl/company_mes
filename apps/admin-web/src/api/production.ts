import {
  BUSINESS_API,
  type CreateProductionBatchPayload,
  type CreateProductionTaskPayload,
  type CreateWorkOrderPayload,
  type DispatchTaskPayload,
  type PageResult,
  type ProductionTaskCreatePreview,
  type ProductionTaskDetail,
  type ProductionBatchItem,
  type UpdateBatchStepRecordPayload,
  type UpdateProductionBatchPayload,
  type WorkerTaskItem,
  type UpdateWorkOrderPayload,
  type WorkOrderDetail,
  type WorkOrderListItem,
  type WorkOrderStatus,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';

export const productionApi = {
  listOrders: (params?: QueryParams) =>
    requestData<PageResult<WorkOrderListItem>>({
      url: BUSINESS_API.orders,
      method: 'GET',
      params,
    }),
  getOrder: (id: string) =>
    requestData<WorkOrderDetail>({
      url: `${BUSINESS_API.orders}/${id}`,
      method: 'GET',
    }),
  createOrder: (data: CreateWorkOrderPayload) =>
    requestData<WorkOrderDetail>({
      url: BUSINESS_API.orders,
      method: 'POST',
      data,
    }),
  updateOrder: (id: string, data: UpdateWorkOrderPayload) =>
    requestData<WorkOrderDetail>({
      url: `${BUSINESS_API.orders}/${id}`,
      method: 'PUT',
      data,
    }),
  changeOrderStatus: (id: string, status: Extract<WorkOrderStatus, 'released' | 'closed' | 'cancelled'>) =>
    requestData<WorkOrderDetail>({
      url: `${BUSINESS_API.orders}/${id}/${status === 'released' ? 'release' : status === 'closed' ? 'close' : 'cancel'}`,
      method: 'PUT',
    }),
  listOrderBatches: (id: string) =>
    requestData<ProductionBatchItem[]>({
      url: `${BUSINESS_API.orders}/${id}/tasks`,
      method: 'GET',
    }),
  createOrderBatch: (id: string, data: CreateProductionBatchPayload) =>
    requestData<ProductionBatchItem>({
      url: `${BUSINESS_API.orders}/${id}/tasks`,
      method: 'POST',
      data,
    }),
  updateOrderBatch: (id: string, taskId: string, data: UpdateProductionBatchPayload) =>
    requestData<ProductionBatchItem>({
      url: `${BUSINESS_API.orders}/${id}/tasks/${taskId}`,
      method: 'PUT',
      data,
    }),
  listTasks: (params?: QueryParams) =>
    requestData<PageResult<ProductionBatchItem>>({
      url: BUSINESS_API.tasks,
      method: 'GET',
      params,
    }),
  getTask: (id: string) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.tasks}/${id}`,
      method: 'GET',
    }),
  listWorkerTasks: (params?: QueryParams) =>
    requestData<PageResult<WorkerTaskItem>>({
      url: BUSINESS_API.workerTasks,
      method: 'GET',
      params,
    }),
  getWorkerTask: (id: string) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.workerTasks}/${id}`,
      method: 'GET',
    }),
  startWorkerTask: (id: string) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.workerTasks}/${id}/start`,
      method: 'PUT',
    }),
  completeWorkerTask: (id: string) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.workerTasks}/${id}/complete`,
      method: 'PUT',
    }),
  updateWorkerTaskStep: (id: string, recordId: string, data: UpdateBatchStepRecordPayload) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.workerTasks}/${id}/steps/${recordId}`,
      method: 'PUT',
      data,
    }),
  createTask: (data: CreateProductionTaskPayload) =>
    requestData<ProductionTaskDetail>({
      url: BUSINESS_API.tasks,
      method: 'POST',
      data,
    }),
  previewCreateTask: (params: QueryParams) =>
    requestData<ProductionTaskCreatePreview>({
      url: `${BUSINESS_API.tasks}/create-preview`,
      method: 'GET',
      params,
    }),
  previewTaskDispatch: (id: string) =>
    requestData<ProductionTaskDetail['steps']>({
      url: `${BUSINESS_API.tasks}/${id}/dispatch-preview`,
      method: 'GET',
    }),
  updateTask: (id: string, data: UpdateProductionBatchPayload) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.tasks}/${id}`,
      method: 'PUT',
      data,
    }),
  generateTaskMaterialDemand: (id: string) =>
    requestData<{ task: ProductionTaskDetail; materials: ProductionTaskDetail['materialRequirements'] }>({
      url: `${BUSINESS_API.tasks}/${id}/material-demand`,
      method: 'POST',
    }),
  dispatchTask: (id: string, data: DispatchTaskPayload) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.tasks}/${id}/dispatch`,
      method: 'POST',
      data,
    }),
  startTask: (id: string) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.tasks}/${id}/start`,
      method: 'PUT',
    }),
  finishTask: (id: string) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.tasks}/${id}/finish`,
      method: 'PUT',
    }),
  updateTaskStep: (id: string, recordId: string, data: UpdateBatchStepRecordPayload) =>
    requestData<ProductionTaskDetail>({
      url: `${BUSINESS_API.tasks}/${id}/steps/${recordId}`,
      method: 'PUT',
      data,
    }),
};
