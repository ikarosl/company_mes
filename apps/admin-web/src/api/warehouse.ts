import {
  BUSINESS_API,
  type CreateMaterialBatchPayload,
  type MaterialBatchDetail,
  type MaterialBatchListItem,
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
};
