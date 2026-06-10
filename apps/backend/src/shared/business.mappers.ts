import type {
  BatchInventoryItem,
  BatchMaterialUsageItem,
  BatchStepRecordItem,
  BatchStepRecordListItem,
  InspectionRecordItem,
  MaterialBatchListItem,
  ProcessStepTemplateItem,
  ProcessTemplateDetail,
  ProcessTemplateListItem,
  ProductionBatchDetail,
  ProductionBatchListItem,
  ProductionTaskDetail,
  ProductionTaskListItem,
  ReworkRecordItem,
  StorageShipmentRecordItem,
  TechnicalDocumentDetail,
  TechnicalDocumentListItem,
  TraceBatchMaterialUsageItem,
  TraceMaterialItem,
} from '@company/api-contract';
import type {
  BatchInventoryRow,
  BatchMaterialUsageRow,
  BatchStepRecordRow,
  InspectionRecordRow,
  MaterialBatchRow,
  ProcessStepTemplateRow,
  ProcessTemplateRow,
  ProductionBatchRow,
  ProductionTaskRow,
  ReworkRecordRow,
  StorageShipmentRecordRow,
  TechnicalDocumentRow,
  TraceMaterialRow,
  TraceMaterialUsageRow,
} from './business.types.js';
export const mapTechnicalDocument = (row: TechnicalDocumentRow): TechnicalDocumentListItem => ({
  id: String(row.id),
  documentCode: row.document_code,
  documentName: row.document_name,
  documentType: row.document_type,
  version: row.version,
  filePath: row.file_path,
  effectiveDate: formatDate(row.effective_date),
  status: row.status,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
  updatedAt: formatDateTime(row.updated_at),
});

export const mapTechnicalDocumentDetail = (row: TechnicalDocumentRow): TechnicalDocumentDetail => ({
  ...mapTechnicalDocument(row),
  createdBy: row.created_by === null ? null : String(row.created_by),
});

export const mapProcessTemplate = (row: ProcessTemplateRow): ProcessTemplateListItem => ({
  id: String(row.id),
  templateCode: row.template_code,
  templateName: row.template_name,
  version: row.version,
  productType: row.product_type,
  status: row.status,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
  updatedAt: formatDateTime(row.updated_at),
});

export const mapProcessTemplateDetail = (
  row: ProcessTemplateRow,
): Omit<ProcessTemplateDetail, 'steps'> => ({
  ...mapProcessTemplate(row),
  createdBy: row.created_by === null ? null : String(row.created_by),
});

export const mapProcessStepTemplate = (row: ProcessStepTemplateRow): ProcessStepTemplateItem => ({
  id: String(row.id),
  templateId: String(row.template_id),
  stepCode: row.step_code,
  stepName: row.step_name,
  stepOrder: row.step_order,
  isRequired: row.is_required,
  needSelfCheck: row.need_self_check,
  needSpecialCheck: row.need_special_check,
  needInspectionRecord: row.need_inspection_record,
  relatedSopDocumentId:
    row.related_sop_document_id === null ? null : String(row.related_sop_document_id),
  remark: row.remark,
  status: row.status,
});

export const mapProductionTask = (row: ProductionTaskRow): ProductionTaskListItem => ({
  id: String(row.id),
  taskNo: row.task_no,
  customerOrderNo: row.customer_order_no,
  customerName: row.customer_name,
  productName: row.product_name,
  productModel: row.product_model,
  planQuantity: Number(row.plan_quantity),
  deliveryDate: formatDate(row.delivery_date),
  specificationNo: row.specification_no,
  specificationDocumentId:
    row.specification_document_id === null ? null : String(row.specification_document_id),
  status: row.status,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
  updatedAt: formatDateTime(row.updated_at),
});

export const mapProductionTaskDetail = (row: ProductionTaskRow): ProductionTaskDetail => ({
  ...mapProductionTask(row),
  createdBy: row.created_by === null ? null : String(row.created_by),
});

export const mapProductionBatch = (row: ProductionBatchRow): ProductionBatchListItem => ({
  id: String(row.id),
  taskId: String(row.task_id),
  taskNo: row.task_no,
  parentBatchId: row.parent_batch_id === null ? null : String(row.parent_batch_id),
  batchNo: row.batch_no,
  subBatchNo: row.sub_batch_no,
  productName: row.product_name,
  productModel: row.product_model,
  templateId: row.template_id === null ? null : String(row.template_id),
  templateName: row.template_name,
  batchQuantity: Number(row.batch_quantity),
  currentStepRecordId:
    row.current_step_record_id === null ? null : String(row.current_step_record_id),
  status: row.status,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
  updatedAt: formatDateTime(row.updated_at),
});

export const mapProductionBatchDetail = (
  row: ProductionBatchRow,
): Omit<ProductionBatchDetail, 'steps'> => ({
  ...mapProductionBatch(row),
  createdBy: row.created_by === null ? null : String(row.created_by),
});

export const mapBatchStepRecord = (row: BatchStepRecordRow): BatchStepRecordItem => ({
  id: String(row.id),
  batchId: String(row.batch_id),
  templateStepId: row.template_step_id === null ? null : String(row.template_step_id),
  stepOrder: row.step_order,
  status: row.status,
  inputQuantity: row.input_quantity,
  outputQuantity: row.output_quantity,
  selfCheckPassQuantity: row.self_check_pass_qty,
  selfCheckFailQuantity: row.self_check_fail_qty,
  specialCheckPassQuantity: row.special_check_pass_qty,
  specialCheckFailQuantity: row.special_check_fail_qty,
  importantParamText: row.important_param_text,
  remark: row.remark,
});

export const mapBatchStepRecordListItem = (row: BatchStepRecordRow): BatchStepRecordListItem => ({
  ...mapBatchStepRecord(row),
  batchNo: row.batch_no ?? '',
  productName: row.product_name ?? null,
  stepCode: row.step_code ?? null,
  stepName: row.step_name ?? null,
  needSpecialCheck: row.need_special_check ?? null,
  actualOperatorId:
    row.actual_operator_id === undefined || row.actual_operator_id === null
      ? null
      : String(row.actual_operator_id),
  actualOperatorName: row.actual_operator_name ?? null,
  inspectorId:
    row.inspector_id === undefined || row.inspector_id === null ? null : String(row.inspector_id),
  inspectorName: row.inspector_name ?? null,
  assignedUserIds: splitCsv(row.assigned_user_ids),
  assignedUserNames: splitCsv(row.assigned_user_names),
  startedAt: formatDateTime(row.started_at ?? null),
  completedAt: formatDateTime(row.completed_at ?? null),
  inspectedAt: formatDateTime(row.inspected_at ?? null),
});

export const mapInspectionRecord = (row: InspectionRecordRow): InspectionRecordItem => ({
  id: String(row.id),
  batchId: String(row.batch_id),
  batchNo: row.batch_no,
  batchStepId: row.batch_step_id === null ? null : String(row.batch_step_id),
  stepName: row.step_name,
  inspectionType: row.inspection_type,
  inspectionName: row.inspection_name,
  result: row.result,
  passQuantity: row.pass_quantity,
  failQuantity: row.fail_quantity,
  inspectorId: row.inspector_id === null ? null : String(row.inspector_id),
  inspectorName: row.inspector_name,
  inspectedAt: formatDateTime(row.inspected_at),
  filePath: row.file_path,
  resultSummary: row.result_summary,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
});

export const mapReworkRecord = (row: ReworkRecordRow): ReworkRecordItem => ({
  id: String(row.id),
  reworkNo: row.rework_no,
  batchId: String(row.batch_id),
  batchNo: row.batch_no,
  subBatchId: row.sub_batch_id === null ? null : String(row.sub_batch_id),
  sourceStepId: row.source_step_id === null ? null : String(row.source_step_id),
  sourceStepName: row.source_step_name,
  sourceInspectionId: row.source_inspection_id === null ? null : String(row.source_inspection_id),
  returnStepId: row.return_step_id === null ? null : String(row.return_step_id),
  reworkQuantity: row.rework_quantity,
  reason: row.reason,
  handlingMethod: row.handling_method,
  handlerId: row.handler_id === null ? null : String(row.handler_id),
  handlerName: row.handler_name,
  handledAt: formatDateTime(row.handled_at),
  result: row.result,
  recheckInspectionId:
    row.recheck_inspection_id === null ? null : String(row.recheck_inspection_id),
  status: row.status,
  confirmedBy: row.confirmed_by === null ? null : String(row.confirmed_by),
  confirmedByName: row.confirmed_by_name,
  confirmedAt: formatDateTime(row.confirmed_at),
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
  updatedAt: formatDateTime(row.updated_at),
});

export const mapStorageShipmentRecord = (
  row: StorageShipmentRecordRow,
): StorageShipmentRecordItem => ({
  id: String(row.id),
  batchId: String(row.batch_id),
  batchNo: row.batch_no,
  productName: row.product_name,
  productModel: row.product_model,
  recordType: row.record_type,
  quantity: Number(row.quantity),
  operatorId: row.operator_id === null ? null : String(row.operator_id),
  operatorName: row.operator_name,
  warehouseKeeperId: row.warehouse_keeper_id === null ? null : String(row.warehouse_keeper_id),
  warehouseKeeperName: row.warehouse_keeper_name,
  recordDate: formatDate(row.record_date) ?? '',
  filePath: row.file_path,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
});

export const mapBatchInventory = (row: BatchInventoryRow): BatchInventoryItem => {
  const inboundQuantity = Number(row.inbound_quantity ?? 0);
  const outboundQuantity = Number(row.outbound_quantity ?? 0);
  const shipmentQuantity = Number(row.shipment_quantity ?? 0);

  return {
    batchId: String(row.batch_id),
    batchNo: row.batch_no,
    productName: row.product_name,
    productModel: row.product_model,
    inboundQuantity,
    outboundQuantity,
    shipmentQuantity,
    stockQuantity: inboundQuantity - outboundQuantity - shipmentQuantity,
  };
};

export const mapMaterialBatch = (row: MaterialBatchRow): MaterialBatchListItem => ({
  id: String(row.id),
  materialName: row.material_name,
  materialType: row.material_type,
  specification: row.specification,
  materialBatchNo: row.material_batch_no,
  supplierName: row.supplier_name,
  receivedDate: formatDate(row.received_date),
  unit: row.unit,
  quantity: row.quantity === null ? null : Number(row.quantity),
  status: row.status,
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
  updatedAt: formatDateTime(row.updated_at),
});

export const mapBatchMaterialUsage = (row: BatchMaterialUsageRow): BatchMaterialUsageItem => ({
  id: String(row.id),
  batchId: String(row.batch_id),
  batchNo: row.batch_no,
  materialBatchId: String(row.material_batch_id),
  materialBatchNo: row.material_batch_no,
  materialName: row.material_name,
  usageName: row.usage_name,
  usageQuantity: row.usage_quantity === null ? null : Number(row.usage_quantity),
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
});

export const mapTraceMaterial = (row: TraceMaterialRow): TraceMaterialItem => ({
  id: String(row.id),
  materialName: row.material_name,
  materialType: row.material_type,
  specification: row.specification,
  materialBatchNo: row.material_batch_no,
  supplierName: row.supplier_name,
  receivedDate: formatDate(row.received_date),
  unit: row.unit,
  quantity: row.quantity === null ? null : Number(row.quantity),
  status: row.status,
});

export const mapTraceMaterialUsage = (row: TraceMaterialUsageRow): TraceBatchMaterialUsageItem => ({
  id: String(row.id),
  batchId: String(row.batch_id),
  batchNo: row.batch_no,
  materialBatchId: String(row.material_batch_id),
  materialBatchNo: row.material_batch_no,
  materialName: row.material_name,
  usageName: row.usage_name,
  usageQuantity: row.usage_quantity === null ? null : Number(row.usage_quantity),
  remark: row.remark,
  createdAt: formatDateTime(row.created_at),
});

const splitCsv = (value?: string | null) => (value ? value.split(',') : []);

const formatDate = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return value.toISOString().slice(0, 10);
};

const formatDateTime = (value: Date | string | null) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return new Date(value).toISOString();
  }

  return value.toISOString();
};
