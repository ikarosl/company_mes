import {
  BUSINESS_API,
  type CreateProductionBatchPayload,
  type CreateWorkOrderPayload,
  type PageResult,
  type ProductionBatchItem,
  type UpdateProductionBatchPayload,
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
};
