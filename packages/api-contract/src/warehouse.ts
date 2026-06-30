/** 库存对象大类：物料、半成品、成品统一作为库存对象维护 */
export type WarehouseItemKind = 'material' | 'semi_finished' | 'finished_product';

/** 库存对象启停状态 */
export type WarehouseItemStatus = '启用' | '停用';

/** 库存批次来源类型 */
export type WarehouseSourceType = '自产' | '外购' | '委外' | '退货入库' | '盘点生成' | '其他';

/** 库存批次业务状态，只表达批次是否可用，不表达数量是否用完 */
export type WarehouseBatchStatus = '可用' | '冻结' | '停用';

/** 库存状态：可分配库存只统计“可用”状态 */
export type WarehouseStockStatus = '可用' | '待检' | '冻结' | '不良';

/** 库存变动类型：所有数量变化都应生成库存流水 */
export type InventoryTransactionType =
  | '采购入库'
  | '生产入库'
  | '委外入库'
  | '生产领料出库'
  | '销售出库'
  | '退料入库'
  | '报废出库'
  | '盘点调整'
  | '状态转入'
  | '状态转出';

/** 库存单据方向：主单统一承载入库和出库业务，方向决定流水数量正负。 */
export type StockOrderDirection = '入库' | '出库';

/** 库存单据状态：不同业务共用基础状态，拣货只用于出库流程。 */
export type StockOrderStatus = '待确认' | '已拣货' | '已完成' | '已取消';

/** 库存单据业务类型，对应库存流水的业务语义。 */
export type StockOrderBusinessType =
  | '采购入库'
  | '生产入库'
  | '委外入库'
  | '退货入库'
  | '盘点生成'
  | '生产领料出库'
  | '销售出库'
  | '其他入库'
  | '其他出库';

/** 库存对象列表项，对应 item_info + item_type */
export interface WarehouseItemListItem {
  id: string;
  itemCode: string;
  itemName: string;
  itemKind: WarehouseItemKind;
  typeId: string;
  typeName: string;
  defaultUnit: string;
  status: WarehouseItemStatus;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 库存对象分类选项，对应 item_type */
export interface WarehouseItemTypeOption {
  id: string;
  itemKind: WarehouseItemKind;
  typeName: string;
}

/** 创建库存对象请求参数 */
export interface CreateWarehouseItemPayload {
  /** 库存对象编码：物料、半成品、成品统一唯一 */
  itemCode: string;
  /** 库存对象名称 */
  itemName: string;
  /** 库存对象分类 ID，关联 item_type.id */
  typeId: string;
  /** 默认单位，例如 g、kg、个 */
  defaultUnit: string;
  /** 启停状态，默认启用 */
  status?: WarehouseItemStatus;
  /** 备注 */
  remark?: string | null;
}

/** 更新库存对象请求参数 */
export interface UpdateWarehouseItemPayload {
  itemCode?: string;
  itemName?: string;
  typeId?: string;
  defaultUnit?: string;
  status?: WarehouseItemStatus;
  remark?: string | null;
}

/** 库存批次现存量列表项，对应 item_batch 与 v_item_batch_stock */
export interface ItemBatchStockListItem {
  batchId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  itemKind: WarehouseItemKind;
  batchCode: string;
  sourceType: WarehouseSourceType;
  provider: string | null;
  sourceWorkOrderId: string | null;
  sourceProductionBatchId: string | null;
  batchStatus: WarehouseBatchStatus;
  availableQuantity: string;
  pendingQuantity: string;
  frozenQuantity: string;
  defectiveQuantity: string;
  totalQuantity: string;
}

/** 入库单状态：前端兼容名称，底层映射到 stock_order.status。 */
export type InboundOrderStatus = '待确认' | '已完成' | '已取消';

/** 入库单列表项，对应 stock_order(order_direction=入库) */
export interface InboundOrderListItem {
  id: string;
  inboundNo: string;
  sourceType: WarehouseSourceType;
  businessType: StockOrderBusinessType;
  provider: string | null;
  workOrderId: string | null;
  productionBatchId: string | null;
  status: InboundOrderStatus;
  inboundAt: string | null;
  operatorId: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  detailCount: number;
  totalInboundNumber: string;
}

/** 入库明细请求行。batchId 为空时，后端按 batchCode 创建库存批次。 */
export interface InboundDetailPayload {
  itemId: string;
  batchId?: string | null;
  batchCode?: string | null;
  productionDate?: string | null;
  inboundNumber: string | number;
  stockStatus?: WarehouseStockStatus;
  sourceStage?: string | null;
  remark?: string | null;
}

/** 创建入库单请求参数 */
export interface CreateInboundOrderPayload {
  inboundNo?: string | null;
  sourceType: WarehouseSourceType;
  provider?: string | null;
  workOrderId?: string | null;
  productionBatchId?: string | null;
  operatorId?: string | null;
  remark?: string | null;
  details: InboundDetailPayload[];
}

/** 入库明细详情，对应 stock_order_detail + item_info + item_batch */
export interface InboundDetailItem {
  id: string;
  inboundId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  batchId: string;
  batchCode: string;
  inboundNumber: string;
  stockStatus: WarehouseStockStatus;
  sourceStage: string | null;
  remark: string | null;
  createdAt: string;
}

/** 入库单详情 */
export interface InboundOrderDetail extends InboundOrderListItem {
  details: InboundDetailItem[];
}

/** 出库单状态：前端兼容名称，底层映射到 stock_order.status。 */
export type OutboundOrderStatus = '待确认' | '已拣货' | '已完成' | '已取消';

/** 退料单状态 */
export type ReturnOrderStatus = '待处理' | '已入库' | '已报废' | '已取消';

/** 报废场景：用于区分库存侧报废、退料后报废和生产消耗报废 */
export type ItemScrapScene =
  | 'WAREHOUSE_ALLOCATED'
  | 'RETURN_AFTER_OUTBOUND'
  | 'PRODUCTION_CONSUMED'
  | 'IN_STOCK';

/** 报废单状态 */
export type ItemScrapStatus = '待确认' | '已确认' | '已取消';

/** 盘点单状态 */
export type StockCheckStatus = '待盘点' | '盘点中' | '已完成' | '已取消';
