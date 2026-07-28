import type { PageQuery } from './common.js';

/** 检验业务类型。包装检验先保留基础登记能力，后续再扩展包装专属字段。 */
export type InspectionType =
  | 'incoming_material'
  | 'first_article'
  | 'process'
  | 'final'
  | 'package'
  | 'test'
  | 'recheck';

export type InspectionObjectType =
  | 'material_batch'
  | 'production_batch'
  | 'batch_step'
  | 'product_inventory';

export type InspectionResult = 'pass' | 'fail' | 'partial_pass';
export type InspectionDisposition =
  | 'accept'
  | 'reject'
  | 'conditional_accept'
  | 'rework'
  | 'scrap'
  | 'return_supplier'
  | 'hold';

export interface InspectionListQuery extends PageQuery {
  keyword?: string;
  inspectionType?: InspectionType | '';
  result?: InspectionResult | '';
  batchId?: string;
  materialBatchId?: string;
}

/** 新增/编辑共用字段；后端会按 inspectionType 校验目标关系。 */
export interface SaveInspectionPayload {
  inspectionType: InspectionType;
  inspectionName?: string | null;
  batchId?: string | null;
  materialBatchId?: string | null;
  productInventoryId?: string | null;
  relatedInspectionId?: string | null;
  batchStepRecordId?: string | null;
  inspectQuantity?: number | null;
  passQuantity?: number | null;
  failQuantity?: number | null;
  result: InspectionResult;
  disposition?: InspectionDisposition | null;
  inspectorId?: string | null;
  inspectedAt?: string | null;
  fileUrl?: string | null;
  resultSummary?: string | null;
  /** 首检时用于记录设备、人员、材料或工艺变更等首检原因，且为必填。 */
  remark?: string | null;
}

export type CreateInspectionPayload = SaveInspectionPayload;
export type UpdateInspectionPayload = SaveInspectionPayload;

/** 检测端待过程检验任务查询条件。 */
export interface PendingProcessInspectionQuery extends PageQuery {
  keyword?: string;
}

/** 已完成需检工序派生出的检测任务，不额外保存任务状态。 */
export interface PendingProcessInspectionItem {
  id: string;
  batchId: string;
  batchNo: string;
  workOrderId: string;
  workOrderNo: string;
  productId: string;
  productCode: string | null;
  productModel: string | null;
  productName: string | null;
  productUnit: string | null;
  stepOrder: number;
  stepCode: string | null;
  stepName: string;
  sopFileName: string | null;
  sopVersion: string | null;
  sopFileUrl: string | null;
  responsibleUserName: string | null;
  outputQuantity: number;
  abnormalQuantity: number;
  suggestedInspectQuantity: number;
  completedAt: string | null;
}

/** 检测端提交过程检验结果；批次和工序关系由后端根据任务 ID 确定。 */
export interface SubmitProcessInspectionPayload {
  inspectionName?: string | null;
  inspectQuantity: number;
  passQuantity: number;
  failQuantity: number;
  result: InspectionResult;
  disposition?: InspectionDisposition | null;
  inspectedAt?: string | null;
  fileUrl?: string | null;
  resultSummary?: string | null;
  remark?: string | null;
}

export interface InspectionListItem extends SaveInspectionPayload {
  id: string;
  inspectionNo: string | null;
  inspectionObjectType: InspectionObjectType;
  productIdSnapshot: string | null;
  materialBatchNo: string | null;
  productionBatchNo: string | null;
  workOrderNo: string | null;
  productModel: string | null;
  productName: string | null;
  stepName: string | null;
  stepOrder: number | null;
  inspectorName: string | null;
  /** 当前检验记录已创建的有效返工单数量。 */
  reworkCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface InspectionTargetOption {
  id: string;
  targetType:
    | 'material_batch'
    | 'production_batch'
    | 'batch_step'
    | 'product_inventory'
    | 'inspection';
  label: string;
  batchId?: string | null;
  productId?: string | null;
  productModel?: string | null;
  productName?: string | null;
  stepName?: string | null;
  stepOrder?: number | null;
  /** 目标当前可参考的数量，用于新增检验时自动预填，用户仍可手动调整。 */
  quantity?: number | null;
}

/** 返工状态：分派后进入处理中，提交结果后等待复检。 */
export type ReworkStatus = 'pending' | 'doing' | 'wait_recheck' | 'completed' | 'closed';
export type ReworkResult = InspectionResult;

/** 返工记录查询条件。 */
export interface ReworkListQuery extends PageQuery {
  keyword?: string;
  status?: ReworkStatus | '';
  sourceInspectionId?: string;
  handlerId?: string;
}

/** 返工记录列表及详情结构。 */
export interface ReworkListItem {
  id: string;
  reworkNo: string;
  sourceInspectionId: string;
  sourceInspectionNo: string | null;
  recheckInspectionId: string | null;
  recheckInspectionNo: string | null;
  productIdentifier: string | null;
  defectItem: string;
  defectDesc: string | null;
  returnStepName: string | null;
  handlerId: string | null;
  handlerName: string | null;
  handlingDesc: string | null;
  status: ReworkStatus;
  result: ReworkResult;
  closedAt: string | null;
  remark: string | null;
  inspectionType: InspectionType;
  inspectionResult: InspectionResult;
  inspectionDisposition: InspectionDisposition | null;
  failQuantity: number | null;
  productionBatchId: string | null;
  productionBatchNo: string | null;
  materialBatchId: string | null;
  materialBatchNo: string | null;
  productModel: string | null;
  productName: string | null;
  stepName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/** 从不合格或部分合格检验创建返工单。 */
export interface CreateReworkPayload {
  sourceInspectionId: string;
  productIdentifier?: string | null;
  defectItem: string;
  defectDesc?: string | null;
  returnStepName?: string | null;
  handlerId?: string | null;
  remark?: string | null;
}

export interface UpdateReworkPayload {
  productIdentifier?: string | null;
  defectItem?: string;
  defectDesc?: string | null;
  returnStepName?: string | null;
  remark?: string | null;
}

/** 分配或改派返工处理人。 */
export interface AssignReworkHandlerPayload {
  handlerId: string;
}

/** 提交返工处理结果并进入待复检。 */
export interface SubmitReworkResultPayload {
  handlingDesc: string;
  result: ReworkResult;
  remark?: string | null;
}

/** 返工完成后的复检参数；检验对象自动继承来源检验。 */
export interface CreateReworkRecheckPayload {
  inspectionName?: string | null;
  inspectQuantity: number;
  passQuantity: number;
  failQuantity: number;
  result: InspectionResult;
  disposition?: InspectionDisposition | null;
  inspectorId?: string | null;
  inspectedAt?: string | null;
  fileUrl?: string | null;
  resultSummary?: string | null;
  remark?: string | null;
}
