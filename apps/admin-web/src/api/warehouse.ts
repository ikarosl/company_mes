import {
  BUSINESS_API,
  type CreateInboundOrderPayload,
  type CreateOutboundOrderPayload,
  type CreateReturnOrderPayload,
  type CreateItemScrapPayload,
  type CreateStockCheckPayload,
  type UpdateStockCheckPayload,
  type CreateWarehouseItemPayload,
  type InboundOrderDetail,
  type InboundOrderListItem,
  type ItemBatchStockListItem,
  type ItemScrapDetail,
  type ItemScrapListItem,
  type OutboundOrderDetail,
  type OutboundOrderListItem,
  type PageResult,
  type ReturnOrderDetail,
  type ReturnOrderListItem,
  type StockCheckOrderDetail,
  type StockCheckListItem,
  type UpdateWarehouseItemPayload,
  WAREHOUSE_API,
  type WarehouseItemListItem,
  type WarehouseItemTypeOption,
  type ProductionItemAllocationSummaryItem,
  type ItemBatchAvailableToAllocateItem,
  PRODUCTION_MATERIAL_API,
  type ProductionItemDemandSummaryItem,
  type CreateAllocationPayload,
} from '@company/api-contract';
import { requestData, type QueryParams } from './shared/request-data';

export const warehouseApi = {
  // ─── 库存批次现存量 ────────────────────────────────
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
  listAvailableInventory: (params?: QueryParams) =>
    requestData<ItemBatchAvailableToAllocateItem[]>({
      url: WAREHOUSE_API.inventory.available,
      method: 'GET',
      params,
    }),

  // ─── 库存对象管理 ──────────────────────────────────
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

  // ─── 入库管理 ──────────────────────────────────────
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

  // ─── 出库管理 ──────────────────────────────────────
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

  // ─── 退料管理 ──────────────────────────────────────
  listReturnOrders: (params?: QueryParams) =>
    requestData<PageResult<ReturnOrderListItem>>({
      url: WAREHOUSE_API.returnOrders.root,
      method: 'GET',
      params,
    }),
  getReturnOrder: (id: string) =>
    requestData<ReturnOrderDetail>({
      url: WAREHOUSE_API.returnOrders.detail(id),
      method: 'GET',
    }),
  createReturnOrder: (data: CreateReturnOrderPayload) =>
    requestData<ReturnOrderDetail>({
      url: WAREHOUSE_API.returnOrders.root,
      method: 'POST',
      data,
    }),
  confirmReturnInbound: (id: string) =>
    requestData<ReturnOrderDetail>({
      url: WAREHOUSE_API.returnOrders.confirmInbound(id),
      method: 'PUT',
    }),
  confirmReturnScrap: (id: string) =>
    requestData<ReturnOrderDetail>({
      url: WAREHOUSE_API.returnOrders.confirmScrap(id),
      method: 'PUT',
    }),
  cancelReturnOrder: (id: string) =>
    requestData<ReturnOrderDetail>({
      url: WAREHOUSE_API.returnOrders.cancel(id),
      method: 'PUT',
    }),

  // ─── 报废管理 ──────────────────────────────────────
  listScraps: (params?: QueryParams) =>
    requestData<PageResult<ItemScrapListItem>>({
      url: WAREHOUSE_API.scraps.root,
      method: 'GET',
      params,
    }),
  getScrap: (id: string) =>
    requestData<ItemScrapDetail>({
      url: WAREHOUSE_API.scraps.detail(id),
      method: 'GET',
    }),
  createScrap: (data: CreateItemScrapPayload) =>
    requestData<ItemScrapDetail>({
      url: WAREHOUSE_API.scraps.root,
      method: 'POST',
      data,
    }),
  confirmScrap: (id: string) =>
    requestData<ItemScrapDetail>({
      url: WAREHOUSE_API.scraps.confirm(id),
      method: 'PUT',
    }),
  cancelScrap: (id: string) =>
    requestData<ItemScrapDetail>({
      url: WAREHOUSE_API.scraps.cancel(id),
      method: 'PUT',
    }),

  // ─── 盘点管理 ──────────────────────────────────────
  listStockChecks: (params?: QueryParams) =>
    requestData<PageResult<StockCheckListItem>>({
      url: WAREHOUSE_API.stockChecks.root,
      method: 'GET',
      params,
    }),
  getStockCheck: (id: string) =>
    requestData<StockCheckOrderDetail>({
      url: WAREHOUSE_API.stockChecks.detail(id),
      method: 'GET',
    }),
  createStockCheck: (data: CreateStockCheckPayload) =>
    requestData<StockCheckOrderDetail>({
      url: WAREHOUSE_API.stockChecks.root,
      method: 'POST',
      data,
    }),
  updateStockCheck: (id: string, data: UpdateStockCheckPayload) =>
    requestData<StockCheckOrderDetail>({
      url: WAREHOUSE_API.stockChecks.detail(id),
      method: 'PUT',
      data,
    }),
  completeStockCheck: (id: string) =>
    requestData<StockCheckOrderDetail>({
      url: WAREHOUSE_API.stockChecks.complete(id),
      method: 'PUT',
    }),
  adjustStockCheck: (id: string) =>
    requestData<StockCheckOrderDetail>({
      url: WAREHOUSE_API.stockChecks.adjust(id),
      method: 'POST',
    }),
  cancelStockCheck: (id: string) =>
    requestData<StockCheckOrderDetail>({
      url: WAREHOUSE_API.stockChecks.cancel(id),
      method: 'PUT',
    }),

  // ─── 生产物料需求与分配 ─────────────────────────────
  listDemands: (taskId: string) =>
    requestData<ProductionItemDemandSummaryItem[]>({
      url: PRODUCTION_MATERIAL_API.demands(taskId),
      method: 'GET',
    }),
  listAllocations: (taskId: string) =>
    requestData<ProductionItemAllocationSummaryItem[]>({
      url: PRODUCTION_MATERIAL_API.allocations(taskId),
      method: 'GET',
    }),
  generateDemand: (taskId: string) =>
    requestData<{ batchId: string; generatedCount: number }>({
      url: `${BUSINESS_API.tasks}/${taskId}/generate-demand`,
      method: 'POST',
    }),
  createAllocation: (data: CreateAllocationPayload) =>
    requestData<{ allocationId: string }>({
      url: PRODUCTION_MATERIAL_API.allocation.root,
      method: 'POST',
      data,
    }),
  cancelAllocation: (id: string) =>
    requestData<{ allocationId: string }>({
      url: PRODUCTION_MATERIAL_API.allocation.cancel(id),
      method: 'PUT',
    }),
};
