import { BadRequestException } from '@nestjs/common';
import type {
  BatchStepRecordItem,
  BatchStepParameterValue,
  BatchStepStatus,
  ProductionBatchItem,
  ProductionBatchStatus,
  WorkerTaskItem,
  TaskMaterialRequirementItem,
  WorkOrderListItem,
  WorkOrderQualityLevel,
  WorkOrderStatus,
} from '@company/api-contract';
import type {
  BatchStepRecordListRow,
  ProductionBatchListRow,
  TaskMaterialRequirementRow,
  WorkerTaskListRow,
  WorkOrderListRow,
} from './production.types.js';

const WORK_ORDER_STATUS_META: Record<WorkOrderStatus, { currentFlow: string; nextAction: string }> = {
  draft: { currentFlow: '草稿', nextAction: '下达工单' },
  released: { currentFlow: '已下达，待分配生产批次', nextAction: '分配生产批次' },
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
    plannedQuantity: decimalString(row.planned_quantity),
    assignedQuantity: decimalString(row.assigned_quantity),
    customerOrderNo: row.customer_order_no,
    customerName: row.customer_name,
    qualityLevel: row.quality_level as WorkOrderQualityLevel | null,
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
  workOrderNo: 'order_no' in row ? String(row.order_no) : undefined,
  batchNo: row.batch_no,
  productId: String(row.product_id),
  productModel: row.product_model,
  productName: row.product_name,
  routeId: row.route_id === null ? null : String(row.route_id),
  routeName: row.route_name,
  plannedQuantity: decimalString(row.planned_quantity),
  status: row.status as ProductionBatchStatus,
  ownerId: row.owner_id === null ? null : String(row.owner_id),
  ownerName: row.owner_name,
  planStartDate: formatDate(row.plan_start_date),
  planEndDate: formatDate(row.plan_end_date),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  ...('step_count' in row
    ? {
        stepCount: Number(row.step_count ?? 0),
        assignedStepCount: Number(row.assigned_step_count ?? 0),
        dispatchStatus:
          Number(row.step_count ?? 0) === 0
            ? 'missing_steps' as const
            : Number(row.assigned_step_count ?? 0) === 0
              ? 'unassigned' as const
              : Number(row.assigned_step_count ?? 0) < Number(row.step_count ?? 0)
                ? 'partial' as const
                : 'assigned' as const,
        materialRequirementCount: Number(row.material_requirement_count ?? 0),
        assignedMaterialCount: Number(row.assigned_material_count ?? 0),
        materialStatus:
          Number(row.material_requirement_count ?? 0) === 0
            ? 'missing_demand' as const
            : Number(row.used_material_count ?? 0) === Number(row.material_requirement_count ?? 0)
              ? 'used' as const
              : Number(row.assigned_material_count ?? 0) === 0
                ? 'unallocated' as const
                : Number(row.assigned_material_count ?? 0) < Number(row.material_requirement_count ?? 0)
                  ? 'partial' as const
                  : 'allocated' as const,
      }
    : {}),
});

export const mapBatchStepRecord = (row: BatchStepRecordListRow): BatchStepRecordItem => ({
  id: String(row.id),
  batchId: String(row.batch_id),
  processRouteStepsId: String(row.process_route_steps_id),
  stepOrder: row.step_order,
  stepName: row.step_name,
  sopFileId: row.sop_file_id === null ? null : String(row.sop_file_id),
  sopFileName: row.sop_file_name,
  sopFileUrl: row.sop_file_url,
  defaultSopFileId: row.default_sop_file_id === null ? null : String(row.default_sop_file_id),
  defaultSopFileName: row.default_sop_file_name,
  defaultSopFileUrl: row.default_sop_file_url,
  responsibleUserId: row.responsible_user_id === null ? null : String(row.responsible_user_id),
  responsibleUserName: row.responsible_user_name,
  defaultResponsibleUserId: row.default_responsible_user_id === null ? null : String(row.default_responsible_user_id),
  defaultResponsibleUserName: row.default_responsible_user_name,
  status: row.status as BatchStepStatus,
  startedAt: row.started_at ? row.started_at.toISOString() : null,
  completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  outputQuantity: row.output_quantity === null ? null : decimalString(row.output_quantity),
  returnQuantity: row.return_quantity === null ? null : decimalString(row.return_quantity),
  abnormalQuantity: row.abnormal_quantity === null ? null : decimalString(row.abnormal_quantity),
  parameterValues: mergeBatchStepParameterValues(row.important_parameters, row.parameter_values),
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

/**
 * 合并工序参数定义与已报工值。
 * 参数名称、单位以工序配置为准，已保存的值按参数名称回填。
 */
export const mergeBatchStepParameterValues = (
  definitionsValue: unknown,
  valuesValue: unknown,
): BatchStepParameterValue[] => {
  const definitions = readJsonArray(definitionsValue);
  const values = readJsonArray(valuesValue);
  const valueMap = new Map(
    values.map((item) => [typeof item.key === 'string' ? item.key : '', item.value]),
  );
  return definitions
    .map((item) => {
      const key = typeof item.key === 'string' ? item.key.trim() : '';
      return {
        key,
        unit: typeof item.unit === 'string' ? item.unit.trim() || null : null,
        value: valueMap.has(key) ? String(valueMap.get(key) ?? '') : null,
      };
    })
    .filter((item) => item.key);
};

/** 校验报工参数：完成或异常报工时，每个已配置的重要参数都必须填写。 */
export const normalizeBatchStepParameterValues = (
  definitionsValue: unknown,
  valuesValue: unknown,
  required: boolean,
): BatchStepParameterValue[] => {
  const definitions = mergeBatchStepParameterValues(definitionsValue, []);
  if (!Array.isArray(valuesValue)) {
    throw new BadRequestException('报工参数格式不正确');
  }
  const submittedMap = new Map(
    valuesValue.map((item) => {
      const source = item as Partial<BatchStepParameterValue> | null;
      return [typeof source?.key === 'string' ? source.key.trim() : '', source?.value];
    }),
  );
  const result = definitions.map((definition) => {
    const rawValue = submittedMap.get(definition.key);
    const value = rawValue === null || rawValue === undefined ? '' : String(rawValue).trim();
    if (required && !value) {
      throw new BadRequestException(`请填写重要参数“${definition.key}”`);
    }
    return { ...definition, value: value || null };
  });
  if ([...submittedMap.keys()].some((key) => key && !definitions.some((item) => item.key === key))) {
    throw new BadRequestException('报工参数与当前工序配置不一致，请刷新后重试');
  }
  return result;
};

/** 兼容 mysql2 返回 JSON 字符串或对象数组两种形态。 */
const readJsonArray = (value: unknown): Array<Record<string, unknown>> => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const mapWorkerTask = (row: WorkerTaskListRow): WorkerTaskItem => ({
  ...mapProductionBatch(row),
  stepRecordId: String(row.step_record_id),
  processRouteStepsId: String(row.process_route_steps_id),
  stepOrder: row.step_order,
  stepName: row.step_name,
  sopFileName: row.sop_file_name,
  sopFileUrl: row.sop_file_url,
  stepStatus: row.step_status as BatchStepStatus,
  canStart: row.can_start === 1,
  startedAt: row.step_started_at ? row.step_started_at.toISOString() : null,
  completedAt: row.step_completed_at ? row.step_completed_at.toISOString() : null,
  outputQuantity: row.output_quantity === null ? null : decimalString(row.output_quantity),
  returnQuantity: row.return_quantity === null ? null : decimalString(row.return_quantity),
  abnormalQuantity: row.abnormal_quantity === null ? null : decimalString(row.abnormal_quantity),
  responsibleUserId: row.responsible_user_id === null ? null : String(row.responsible_user_id),
  responsibleUserName: row.responsible_user_name,
});

export const mapTaskMaterialRequirement = (row: TaskMaterialRequirementRow): TaskMaterialRequirementItem => ({
  id: String(row.id),
  usageId: row.usage_id === null ? null : String(row.usage_id),
  productMaterialId: String(row.product_material_id),
  materialProductId: String(row.material_product_id),
  materialModel: row.material_model,
  materialName: row.material_name,
  quantityPerUnit: decimalString(row.quantity_per_unit),
  planQuantity: decimalString(row.plan_quantity),
  usedQuantity: decimalString(row.used_quantity),
  unit: row.unit,
  isKeyMaterial: row.is_key_material === 1,
  needBatchRecord: row.need_batch_record === 1,
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

export const readNullableDecimal = (value: string | number | null | undefined, message: string) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new BadRequestException(message);
  }

  return amount.toFixed(4);
};

export const normalizeDateTime = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid datetime');
  }

  return parsed;
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
