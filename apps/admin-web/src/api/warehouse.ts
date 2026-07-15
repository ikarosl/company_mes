import {
  BUSINESS_API,
  type CreateMaterialBatchPayload,
  type CreateInventoryStocktakePayload,
  type AdjustInventoryStocktakePayload,
  type InventoryStocktakeListItem,
  type InventoryStocktakeTargetOption,
  type FinishedInboundPayload,
  type FinishedInventoryOption,
  type FinishedOutboundPayload,
  type FinishedProductionInboundOption,
  type FinishedTransactionListItem,
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
  stocktakeInventoryByType: (inventoryType: 'material' | 'product', id: string, data: StocktakeMaterialBatchPayload) =>
    requestData<MaterialBatchDetail | InventoryStocktakeListItem>({
      url: `${BUSINESS_API.warehouseInventory}/${inventoryType}/${id}/stocktake`,
      method: 'PUT',
      data,
    }),
  changeInventoryStatus: (id: string, disabled: boolean) =>
    requestData<MaterialBatchDetail>({
      url: `${BUSINESS_API.warehouseInventory}/${id}/${disabled ? 'disable' : 'enable'}`,
      method: 'PUT',
    }),
  listStocktakes: (params?: QueryParams) =>
    requestData<PageResult<InventoryStocktakeListItem>>({
      url: BUSINESS_API.warehouseStocktakes,
      method: 'GET',
      params,
    }),
  listStocktakeTargets: (params?: QueryParams) =>
    requestData<InventoryStocktakeTargetOption[]>({
      url: `${BUSINESS_API.warehouseStocktakes}/targets`,
      method: 'GET',
      params,
    }),
  createStocktake: (data: CreateInventoryStocktakePayload) =>
    requestData<InventoryStocktakeListItem>({
      url: BUSINESS_API.warehouseStocktakes,
      method: 'POST',
      data,
    }),
  adjustStocktake: (id: string, data: AdjustInventoryStocktakePayload) =>
    requestData<InventoryStocktakeListItem>({
      url: `${BUSINESS_API.warehouseStocktakes}/${id}/adjust`,
      method: 'POST',
      data,
    }),
  listFinishedTransactions: (params?: QueryParams) =>
    requestData<PageResult<FinishedTransactionListItem>>({
      url: BUSINESS_API.warehouseFinishedTransactions,
      method: 'GET',
      params,
    }),
  listFinishedInventoryOptions: (params?: QueryParams) =>
    requestData<FinishedInventoryOption[]>({
      url: `${BUSINESS_API.warehouseFinishedTransactions}/inventory-options`,
      method: 'GET',
      params,
    }),
  listFinishedProductionInboundOptions: (params?: QueryParams) =>
    requestData<FinishedProductionInboundOption[]>({
      url: `${BUSINESS_API.warehouseFinishedTransactions}/production-inbound-options`,
      method: 'GET',
      params,
    }),
  finishedInbound: (data: FinishedInboundPayload) =>
    requestData<{ inventoryId: string; flowId: string }>({
      url: `${BUSINESS_API.warehouseFinishedTransactions}/inbound`,
      method: 'POST',
      data,
    }),
  finishedOutbound: (data: FinishedOutboundPayload) =>
    requestData<{ success: boolean; flowId: string }>({
      url: `${BUSINESS_API.warehouseFinishedTransactions}/outbound`,
      method: 'POST',
      data,
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
    requestData<{ materialBatchId: string; inspectionId: string }>({
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
