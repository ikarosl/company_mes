export type WorkOrderStatus = 'draft' | 'released' | 'doing' | 'completed' | 'closed' | 'cancelled';
/** 工单质量等级：用于区分军品、准军品和工业品的生产质量要求。 */
export type WorkOrderQualityLevel = 'military_grade' | 'standard_military_grade' | 'industrial_grade';
/** 生产批次主状态，仅表达批次执行阶段。 */
export type ProductionBatchStatus =
  | 'pending'
  | 'material_pending'
  | 'material_assigned'
  | 'doing'
  | 'completed'
  | 'cancelled';
export type BatchStepStatus = 'pending' | 'doing' | 'completed' | 'abnormal' | 'skipped';

/** 生产任务列表项，物料和派工状态均由后端关联数据实时汇总。 */
export interface ProductionBatchItem {
  id: string;
  workOrderId: string;
  workOrderNo?: string;
  batchNo: string;
  productId: string;
  productModel: string;
  productName: string;
  routeId: string | null;
  routeName: string | null;
  plannedQuantity: string;
  status: ProductionBatchStatus;
  ownerId: string | null;
  ownerName: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  materialStatus?: 'missing_demand' | 'unallocated' | 'partial' | 'allocated' | 'shortage' | 'used';
  dispatchStatus?: 'missing_steps' | 'unassigned' | 'partial' | 'assigned';
  materialRequirementCount?: number;
  assignedMaterialCount?: number;
  stepCount?: number;
  assignedStepCount?: number;
}

/** 报工参数值：名称和单位来自工序配置，value 在报工时填写。 */
export interface BatchStepParameterValue {
  key: string;
  value: string | null;
  unit?: string | null;
}

export interface BatchStepRecordItem {
  id: string;
  batchId: string;
  processRouteStepsId: string;
  stepOrder: number;
  stepName: string;
  sopFileId: string | null;
  /** 当前批次工序实际使用的参考文件名称。 */
  sopFileName: string | null;
  /** 当前批次工序实际使用的参考文件访问地址。 */
  sopFileUrl: string | null;
  /** 工艺路线或工序资料中配置的默认参考文件 ID。 */
  defaultSopFileId: string | null;
  /** 工艺路线或工序资料中配置的默认参考文件名称。 */
  defaultSopFileName: string | null;
  /** 工艺路线或工序资料中配置的默认参考文件地址。 */
  defaultSopFileUrl: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  /** 工艺路线工序配置的默认负责人 ID。 */
  defaultResponsibleUserId: string | null;
  /** 工艺路线工序配置的默认负责人名称。 */
  defaultResponsibleUserName: string | null;
  status: BatchStepStatus;
  startedAt: string | null;
  completedAt: string | null;
  /** 报工总数：合格数量与异常数量之和。 */
  outputQuantity: string | null;
  /** 历史返工数量兼容字段；普通报工不再直接填写。 */
  returnQuantity: string | null;
  /** 异常数量：等待管理或检验人员决定返工、报废等处置。 */
  abnormalQuantity: string | null;
  /** 当前工序配置的重要参数及本次报工填写值。 */
  parameterValues: BatchStepParameterValue[];
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerTaskItem extends ProductionBatchItem {
  stepRecordId: string;
  processRouteStepsId: string;
  stepOrder: number;
  stepName: string;
  /** 当前员工任务工序最终生效的工艺文件名：优先批次派工文件，其次工序默认文件。 */
  sopFileName: string | null;
  /** 当前员工任务工序最终生效的工艺文件在线访问地址。 */
  sopFileUrl: string | null;
  stepStatus: BatchStepStatus;
  canStart: boolean;
  startedAt: string | null;
  completedAt: string | null;
  outputQuantity: string | null;
  returnQuantity: string | null;
  abnormalQuantity: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
}

/** 员工任务页产品筛选选项：仅包含当前员工关联任务中的轻量产品信息。 */
export interface WorkerTaskProductOption {
  /** 产品 ID：用于提交员工任务筛选条件。 */
  id: string;
  /** 产品编码：供员工快速识别；未配置时返回空字符串。 */
  code: string;
  /** 产品名称：用于筛选下拉展示。 */
  name: string;
  /** 产品型号或规格：用于区分同名产品。 */
  specification?: string;
}

export interface TaskMaterialRequirementItem {
  id: string;
  usageId: string | null;
  productMaterialId: string;
  materialProductId: string;
  materialModel: string;
  materialName: string;
  quantityPerUnit: string;
  planQuantity: string;
  usedQuantity: string;
  unit: string | null;
  isKeyMaterial: boolean;
  needBatchRecord: boolean;
}

export interface MaterialAllocationRequirementItem extends TaskMaterialRequirementItem {
  /** 当前所有有效物料批次的可分配库存合计。 */
  availableInventoryQuantity: string;
  /** 当前可分配库存仍无法覆盖未满足需求时的实时缺口。 */
  shortageQuantity: string;
  reservedQuantity: string;
  unmetQuantity: string;
  /** 当前仍有可分配库存的物料批次数量。 */
  availableBatchCount: number;
  allocationStatus: 'unallocated' | 'partial' | 'allocated' | 'used';
  /** 同一需求可由多个物料批次分次预留。 */
  allocations: MaterialAllocationRecordItem[];
}

/** 单次预留流水及其所在物料批次的领退料汇总。 */
export interface MaterialAllocationRecordItem {
  id: string;
  materialBatchId: string;
  materialBatchNo: string;
  reservedQuantity: string;
  issuedQuantity: string;
  returnedQuantity: string;
  usedQuantity: string;
  remainingQuantity: string;
  recordedByName: string | null;
  recordedAt: string;
  remark: string | null;
  canClear: boolean;
}

export interface MaterialAllocationBatchItem extends ProductionBatchItem {
  materialStatus: 'missing_demand' | 'unallocated' | 'partial' | 'allocated' | 'shortage' | 'used';
  requirementCount: number;
  allocatedCount: number;
  shortageCount: number;
  requirements: MaterialAllocationRequirementItem[];
}

export interface MaterialAllocationAvailableBatchItem {
  id: string;
  materialBatchNo: string;
  supplierName: string | null;
  receivedDate: string | null;
  quantity: string;
  reservedQuantity: string;
  usedQuantity: string;
  availableQuantity: string;
  status: string;
}

export interface AllocateMaterialPayload {
  productMaterialId: string;
  materialBatchId: string;
  reservedQuantity: string | number;
  remark?: string | null;
}

export interface ProductionTaskDetail extends ProductionBatchItem {
  steps: BatchStepRecordItem[];
  materialRequirements: TaskMaterialRequirementItem[];
}

export interface ProductionTaskCreatePreview {
  steps: BatchStepRecordItem[];
  materialRequirements: TaskMaterialRequirementItem[];
}

export interface WorkOrderListItem {
  id: string;
  orderNo: string;
  productId: string;
  productModel: string;
  productName: string;
  plannedQuantity: string;
  assignedQuantity: string;
  customerOrderNo: string | null;
  customerName: string | null;
  /** 工单质量等级；未设置时返回 null。 */
  qualityLevel: WorkOrderQualityLevel | null;
  ownerId: string | null;
  ownerName: string | null;
  status: WorkOrderStatus;
  currentFlow: string;
  nextAction: string;
  planStartDate: string | null;
  planEndDate: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderDetail extends WorkOrderListItem {
  batches: ProductionBatchItem[];
}

/** 工单列表查询条件。 */
export interface WorkOrderQuery {
  keyword?: string;
  customerOrderNo?: string;
  customerName?: string;
  productId?: string;
  ownerId?: string;
  status?: WorkOrderStatus;
  qualityLevel?: WorkOrderQualityLevel;
  page?: number;
  pageSize?: number;
}

export interface CreateWorkOrderPayload {
  /** 工单编号：留空时由后端按当天流水规则自动生成。 */
  orderNo?: string;
  productId: string;
  plannedQuantity: string | number;
  customerOrderNo?: string | null;
  customerName?: string | null;
  /** 质量等级；允许留空以兼容未分级工单。 */
  qualityLevel?: WorkOrderQualityLevel | null;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface UpdateWorkOrderPayload {
  orderNo?: string;
  productId?: string;
  plannedQuantity?: string | number;
  customerOrderNo?: string | null;
  customerName?: string | null;
  /** 质量等级；传 null 表示清空。 */
  qualityLevel?: WorkOrderQualityLevel | null;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface CreateProductionBatchPayload {
  batchNo?: string | null;
  routeId?: string | null;
  plannedQuantity: string | number;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  remark?: string | null;
}

export interface CreateProductionTaskPayload extends CreateProductionBatchPayload {
  workOrderId: string;
  steps?: DispatchTaskStepPayload[];
}

/** 开始生产前检查结果：blockers 阻止开始，warnings 仅要求操作员确认。 */
export interface ProductionTaskStartCheck {
  canStart: boolean;
  blockers: string[];
  warnings: string[];
  materialRequirementCount: number;
  unallocatedMaterialCount: number;
  partialMaterialCount: number;
  criticalUnallocatedCount: number;
  stepCount: number;
  unassignedStepCount: number;
}

export interface UpdateProductionBatchPayload {
  batchNo?: string;
  routeId?: string | null;
  plannedQuantity?: string | number;
  ownerId?: string | null;
  planStartDate?: string | null;
  planEndDate?: string | null;
  status?: ProductionBatchStatus;
  remark?: string | null;
  steps?: DispatchTaskStepPayload[];
}

export interface DispatchTaskStepPayload {
  processRouteStepsId: string;
  responsibleUserId?: string | null;
  sopFileId?: string | null;
}

export interface DispatchTaskPayload {
  steps?: DispatchTaskStepPayload[];
}

export interface UpdateBatchStepRecordPayload {
  responsibleUserId?: string | null;
  sopFileId?: string | null;
  status?: BatchStepStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  /** 报工总数：调用方应按合格数量 + 异常数量计算。 */
  outputQuantity?: string | number | null;
  /** 历史兼容字段；普通员工报工不应提交。 */
  returnQuantity?: string | number | null;
  /** 本次异常数量。 */
  abnormalQuantity?: string | number | null;
  /** 本次报工填写的重要参数值。 */
  parameterValues?: BatchStepParameterValue[];
  remark?: string | null;
}
