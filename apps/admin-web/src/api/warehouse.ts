import {
  type CreateInboundOrderPayload,
  type CreateOutboundOrderPayload,
  type CreateWarehouseItemPayload,
  type InboundOrderDetail,
  type InboundOrderListItem,
  type ItemBatchStockListItem,
  type OutboundOrderDetail,
  type OutboundOrderListItem,
  type PageResult,
  type UpdateWarehouseItemPayload,
  WAREHOUSE_API,
  type WarehouseItemListItem,
  type WarehouseItemTypeOption,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';

export const warehouseApi = {
  listInventory: (params?: QueryParams) =>
    requestData<PageResult<ItemBatchStockListItem>>({
      url: WAREHOUSE_API.inventory.root,
      method: 'GET',
      params,
    }),
  getInventory: (id: string) =>
    requestData<ItemBatchStockListItem>({
      url: WAREHOUSE_API.inventory.detail(id),
      method: 'GET',
    }),
  createInventory: (data: unknown) =>
    requestData<unknown>({
      url: WAREHOUSE_API.inventory.root,
      method: 'POST',
      data,
    }),
  updateInventory: (id: string, data: unknown) =>
    requestData<unknown>({
      url: WAREHOUSE_API.inventory.detail(id),
      method: 'PUT',
      data,
    }),
  stocktakeInventory: (id: string, data: unknown) =>
    requestData<unknown>({
      url: WAREHOUSE_API.inventory.stocktake(id),
      method: 'PUT',
      data,
    }),
  changeInventoryStatus: (id: string, disabled: boolean) =>
    requestData<unknown>({
      url: disabled ? WAREHOUSE_API.inventory.disable(id) : WAREHOUSE_API.inventory.enable(id),
      method: 'PUT',
    }),
  listWarehouseItems: (params?: QueryParams) =>
    requestData<PageResult<WarehouseItemListItem>>({
      url: WAREHOUSE_API.items.root,
      method: 'GET',
      params,
    }),
  getWarehouseItem: (id: string) =>
    requestData<WarehouseItemListItem>({
      url: WAREHOUSE_API.items.detail(id),
      method: 'GET',
    }),
  listWarehouseItemTypeOptions: (params?: QueryParams) =>
    requestData<WarehouseItemTypeOption[]>({
      url: WAREHOUSE_API.items.typeOptions,
      method: 'GET',
      params,
    }),
  createWarehouseItem: (data: CreateWarehouseItemPayload) =>
    requestData<WarehouseItemListItem>({
      url: WAREHOUSE_API.items.root,
      method: 'POST',
      data,
    }),
  updateWarehouseItem: (id: string, data: UpdateWarehouseItemPayload) =>
    requestData<WarehouseItemListItem>({
      url: WAREHOUSE_API.items.detail(id),
      method: 'PUT',
      data,
    }),
  changeWarehouseItemStatus: (id: string, disabled: boolean) =>
    requestData<WarehouseItemListItem>({
      url: disabled ? WAREHOUSE_API.items.disable(id) : WAREHOUSE_API.items.enable(id),
      method: 'PUT',
    }),
  listInboundOrders: (params?: QueryParams) =>
    requestData<PageResult<InboundOrderListItem>>({
      url: WAREHOUSE_API.inboundOrders.root,
      method: 'GET',
      params,
    }),
  getInboundOrder: (id: string) =>
    requestData<InboundOrderDetail>({
      url: WAREHOUSE_API.inboundOrders.detail(id),
      method: 'GET',
    }),
  createInboundOrder: (data: CreateInboundOrderPayload) =>
    requestData<InboundOrderDetail>({
      url: WAREHOUSE_API.inboundOrders.root,
      method: 'POST',
      data,
    }),
  confirmInboundOrder: (id: string) =>
    requestData<InboundOrderDetail>({
      url: WAREHOUSE_API.inboundOrders.confirm(id),
      method: 'PUT',
    }),
  cancelInboundOrder: (id: string) =>
    requestData<InboundOrderDetail>({
      url: WAREHOUSE_API.inboundOrders.cancel(id),
      method: 'PUT',
    }),
  listOutboundOrders: (params?: QueryParams) =>
    requestData<PageResult<OutboundOrderListItem>>({
      url: WAREHOUSE_API.outboundOrders.root,
      method: 'GET',
      params,
    }),
  getOutboundOrder: (id: string) =>
    requestData<OutboundOrderDetail>({
      url: WAREHOUSE_API.outboundOrders.detail(id),
      method: 'GET',
    }),
  createOutboundOrder: (data: CreateOutboundOrderPayload) =>
    requestData<OutboundOrderDetail>({
      url: WAREHOUSE_API.outboundOrders.root,
      method: 'POST',
      data,
    }),
  pickOutboundOrder: (id: string) =>
    requestData<OutboundOrderDetail>({
      url: WAREHOUSE_API.outboundOrders.pick(id),
      method: 'PUT',
    }),
  confirmOutboundOrder: (id: string) =>
    requestData<OutboundOrderDetail>({
      url: WAREHOUSE_API.outboundOrders.confirm(id),
      method: 'PUT',
    }),
  cancelOutboundOrder: (id: string) =>
    requestData<OutboundOrderDetail>({
      url: WAREHOUSE_API.outboundOrders.cancel(id),
      method: 'PUT',
    }),
  listReturnOrders: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: WAREHOUSE_API.returnOrders.root,
      method: 'GET',
      params,
    }),
  listScraps: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: WAREHOUSE_API.scraps.root,
      method: 'GET',
      params,
    }),
  listStockChecks: (params?: QueryParams) =>
    requestData<PageResult<unknown>>({
      url: WAREHOUSE_API.stockChecks.root,
      method: 'GET',
      params,
    }),
};
