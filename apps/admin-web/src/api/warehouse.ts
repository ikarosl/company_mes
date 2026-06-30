import {
  BUSINESS_API,
  type CreateInboundOrderPayload,
  type CreateWarehouseItemPayload,
  type InboundOrderDetail,
  type InboundOrderListItem,
  type ItemBatchStockListItem,
  type PageResult,
  type UpdateWarehouseItemPayload,
  type WarehouseItemListItem,
  type WarehouseItemTypeOption,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';

export const warehouseApi = {
  listInventory: (params?: QueryParams) =>
    requestData<PageResult<ItemBatchStockListItem>>({
      url: BUSINESS_API.warehouseInventory,
      method: 'GET',
      params,
    }),
  getInventory: (id: string) =>
    requestData<ItemBatchStockListItem>({
      url: `${BUSINESS_API.warehouseInventory}/${id}`,
      method: 'GET',
    }),
  createInventory: (data: unknown) =>
    requestData<unknown>({
      url: BUSINESS_API.warehouseInventory,
      method: 'POST',
      data,
    }),
  updateInventory: (id: string, data: unknown) =>
    requestData<unknown>({
      url: `${BUSINESS_API.warehouseInventory}/${id}`,
      method: 'PUT',
      data,
    }),
  stocktakeInventory: (id: string, data: unknown) =>
    requestData<unknown>({
      url: `${BUSINESS_API.warehouseInventory}/${id}/stocktake`,
      method: 'PUT',
      data,
    }),
  changeInventoryStatus: (id: string, disabled: boolean) =>
    requestData<unknown>({
      url: `${BUSINESS_API.warehouseInventory}/${id}/${disabled ? 'disable' : 'enable'}`,
      method: 'PUT',
    }),
  listWarehouseItems: (params?: QueryParams) =>
    requestData<PageResult<WarehouseItemListItem>>({
      url: BUSINESS_API.warehouseItems,
      method: 'GET',
      params,
    }),
  getWarehouseItem: (id: string) =>
    requestData<WarehouseItemListItem>({
      url: `${BUSINESS_API.warehouseItems}/${id}`,
      method: 'GET',
    }),
  listWarehouseItemTypeOptions: (params?: QueryParams) =>
    requestData<WarehouseItemTypeOption[]>({
      url: `${BUSINESS_API.warehouseItems}/types/options`,
      method: 'GET',
      params,
    }),
  createWarehouseItem: (data: CreateWarehouseItemPayload) =>
    requestData<WarehouseItemListItem>({
      url: BUSINESS_API.warehouseItems,
      method: 'POST',
      data,
    }),
  updateWarehouseItem: (id: string, data: UpdateWarehouseItemPayload) =>
    requestData<WarehouseItemListItem>({
      url: `${BUSINESS_API.warehouseItems}/${id}`,
      method: 'PUT',
      data,
    }),
  changeWarehouseItemStatus: (id: string, disabled: boolean) =>
    requestData<WarehouseItemListItem>({
      url: `${BUSINESS_API.warehouseItems}/${id}/${disabled ? 'disable' : 'enable'}`,
      method: 'PUT',
    }),
  listInboundOrders: (params?: QueryParams) =>
    requestData<PageResult<InboundOrderListItem>>({
      url: BUSINESS_API.warehouseInboundOrders,
      method: 'GET',
      params,
    }),
  getInboundOrder: (id: string) =>
    requestData<InboundOrderDetail>({
      url: `${BUSINESS_API.warehouseInboundOrders}/${id}`,
      method: 'GET',
    }),
  createInboundOrder: (data: CreateInboundOrderPayload) =>
    requestData<InboundOrderDetail>({
      url: BUSINESS_API.warehouseInboundOrders,
      method: 'POST',
      data,
    }),
  confirmInboundOrder: (id: string) =>
    requestData<InboundOrderDetail>({
      url: `${BUSINESS_API.warehouseInboundOrders}/${id}/confirm`,
      method: 'PUT',
    }),
  cancelInboundOrder: (id: string) =>
    requestData<InboundOrderDetail>({
      url: `${BUSINESS_API.warehouseInboundOrders}/${id}/cancel`,
      method: 'PUT',
    }),
  listOutboundOrders: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: BUSINESS_API.warehouseOutboundOrders,
      method: 'GET',
      params,
    }),
  listReturnOrders: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: BUSINESS_API.warehouseReturnOrders,
      method: 'GET',
      params,
    }),
  listScraps: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: BUSINESS_API.warehouseScraps,
      method: 'GET',
      params,
    }),
  listStockChecks: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: BUSINESS_API.warehouseStockChecks,
      method: 'GET',
      params,
    }),
};
