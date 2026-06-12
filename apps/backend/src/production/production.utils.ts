import { BadRequestException } from '@nestjs/common';
import type {
  BatchDispatchStatus,
  BatchInspectionStatus,
  BatchMaterialStatus,
  BatchProductionStatus,
  ProductionBatchItem,
  ProductionBatchStatus,
  WorkOrderListItem,
  WorkOrderStatus,
} from '@company/api-contract';
import type { ProductionBatchListRow, WorkOrderListRow } from './production.types.js';

const WORK_ORDER_STATUS_META: Record<WorkOrderStatus, { currentFlow: string; nextAction: string }> = {
  draft: { currentFlow: '草稿', nextAction: '下达工单' },
  released: { currentFlow: '已下达，待分配生产任务', nextAction: '分配生产任务' },
  doing: { currentFlow: '生产中', nextAction: '跟进生产批次' },
  completed: { currentFlow: '已完工', nextAction: '关闭工单' },
  closed: { currentFlow: '已关闭', nextAction: '无需处理' },
  cancelled: { currentFlow: '已取消', nextAction: '无需处理' },
};

export const mapWorkOrder = (row: WorkOrderListRow): WorkOrderListItem => {
  const status = row.status as WorkOrderStatus;
  const statusMeta = WORK_ORDER_STATUS_META[status] ?? WORK_ORDER_STATUS_META.draft;

  return {
    id: String(row.id),
    orderNo: row.order_no,
    productId: String(row.product_id),
    productModel: row.product_model,
    productName: row.product_name,
    routeId: row.route_id === null ? null : String(row.route_id),
    routeName: row.route_name,
    plannedQuantity: decimalString(row.planned_quantity),
    assignedQuantity: decimalString(row.assigned_quantity),
    unit: row.unit,
    ownerId: row.owner_id === null ? null : String(row.owner_id),
    ownerName: row.owner_name,
    status,
    currentFlow: statusMeta.currentFlow,
    nextAction: statusMeta.nextAction,
    planStartDate: formatDate(row.plan_start_date),
    planEndDate: formatDate(row.plan_end_date),
    remark: row.remark,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};

export const mapProductionBatch = (row: ProductionBatchListRow): ProductionBatchItem => ({
  id: String(row.id),
  workOrderId: String(row.work_order_id),
  batchNo: row.batch_no,
  productId: String(row.product_id),
  productModel: row.product_model,
  productName: row.product_name,
  routeId: row.route_id === null ? null : String(row.route_id),
  routeName: row.route_name,
  plannedQuantity: decimalString(row.planned_quantity),
  status: row.status as ProductionBatchStatus,
  materialStatus: row.material_status as BatchMaterialStatus,
  dispatchStatus: row.dispatch_status as BatchDispatchStatus,
  productionStatus: row.production_status as BatchProductionStatus,
  inspectionStatus: row.inspection_status as BatchInspectionStatus,
  ownerId: row.owner_id === null ? null : String(row.owner_id),
  ownerName: row.owner_name,
  planStartDate: formatDate(row.plan_start_date),
  planEndDate: formatDate(row.plan_end_date),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

export const readRequiredString = (value: string | undefined, message: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
};

export const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const nullableId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

export const readPositiveId = (value: string | number | null | undefined, message: string) => {
  const id = nullableId(value);
  if (id === null) {
    throw new BadRequestException(message);
  }

  return id;
};

export const readDecimal = (value: string | number | null | undefined, message: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException(message);
  }

  return amount.toFixed(4);
};

export const decimalNumber = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

export const decimalString = (value: string | number | null | undefined) => decimalNumber(value).toFixed(4);

export const normalizeDate = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new BadRequestException('Invalid date');
  }

  return normalized;
};

export const formatDate = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};
