import {
  BUSINESS_API,
  type CreateMaterialBatchPayload,
  type MaterialBatchDetail,
  type MaterialBatchListItem,
  type MaterialInboundPayload,
  type MaterialOutboundPayload,
  type MaterialReturnPayload,
  type MaterialTransactionDemandOption,
  type MaterialTransactionListItem,
  type PageResult,
  type StocktakeMaterialBatchPayload,
  type UpdateMaterialBatchPayload,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';

export const warehouseApi = {
  listInventory: (params?: QueryParams) =>
    requestData<PageResult<MaterialBatchListItem>>({
      url: BUSINESS_API.warehouseInventory,
      method: 'GET',
      params,
    }),
  getInventory: (id: string) =>
    requestData<MaterialBatchDetail>({
      url: `${BUSINESS_API.warehouseInventory}/${id}`,
      method: 'GET',
    }),
  createInventory: (data: CreateMaterialBatchPayload) =>
    requestData<MaterialBatchDetail>({
      url: BUSINESS_API.warehouseInventory,
      method: 'POST',
      data,
    }),
  updateInventory: (id: string, data: UpdateMaterialBatchPayload) =>
    requestData<MaterialBatchDetail>({
      url: `${BUSINESS_API.warehouseInventory}/${id}`,
      method: 'PUT',
      data,
    }),
  stocktakeInventory: (id: string, data: StocktakeMaterialBatchPayload) =>
    requestData<MaterialBatchDetail>({
      url: `${BUSINESS_API.warehouseInventory}/${id}/stocktake`,
      method: 'PUT',
      data,
    }),
  changeInventoryStatus: (id: string, disabled: boolean) =>
    requestData<MaterialBatchDetail>({
      url: `${BUSINESS_API.warehouseInventory}/${id}/${disabled ? 'disable' : 'enable'}`,
      method: 'PUT',
    }),
  listFinishedTransactions: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: BUSINESS_API.warehouseFinishedTransactions,
      method: 'GET',
      params,
    }),
  listMaterialTransactions: (params?: QueryParams) =>
    requestData<PageResult<MaterialTransactionListItem>>({
      url: BUSINESS_API.warehouseMaterialTransactions,
      method: 'GET',
      params,
    }),
  listMaterialTransactionDemands: () =>
    requestData<MaterialTransactionDemandOption[]>({
      url: `${BUSINESS_API.warehouseMaterialTransactions}/demands`,
      method: 'GET',
    }),
  materialInbound: (data: MaterialInboundPayload) =>
    requestData<{ materialBatchId: string }>({
      url: `${BUSINESS_API.warehouseMaterialTransactions}/inbound`,
      method: 'POST',
      data,
    }),
  materialOutbound: (data: MaterialOutboundPayload) =>
    requestData<{ success: boolean }>({
      url: `${BUSINESS_API.warehouseMaterialTransactions}/outbound`,
      method: 'POST',
      data,
    }),
  materialReturn: (data: MaterialReturnPayload) =>
    requestData<{ success: boolean }>({
      url: `${BUSINESS_API.warehouseMaterialTransactions}/return`,
      method: 'POST',
      data,
    }),
};
