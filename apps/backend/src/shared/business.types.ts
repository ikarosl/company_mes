import type { RowDataPacket } from 'mysql2/promise';

export interface CountRow extends RowDataPacket {
  total: number;
}

export interface TechnicalDocumentRow extends RowDataPacket {
  id: number;
  document_code: string;
  document_name: string;
  document_type: string;
  version: string;
  file_path: string | null;
  effective_date: Date | string | null;
  status: string;
  remark: string | null;
  created_by: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ProcessTemplateRow extends RowDataPacket {
  id: number;
  template_code: string;
  template_name: string;
  version: string;
  product_type: string | null;
  status: string;
  remark: string | null;
  created_by: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ProcessStepTemplateRow extends RowDataPacket {
  id: number;
  template_id: number;
  step_code: string;
  step_name: string;
  step_order: number;
  is_required: number;
  need_self_check: number;
  need_special_check: number;
  need_inspection_record: number;
  related_sop_document_id: number | null;
  remark: string | null;
  status: number;
}

export interface ProductionTaskRow extends RowDataPacket {
  id: number;
  task_no: string;
  customer_order_no: string | null;
  customer_name: string | null;
  product_name: string;
  product_model: string | null;
  plan_quantity: number;
  delivery_date: Date | string | null;
  specification_no: string | null;
  specification_document_id: number | null;
  status: string;
  remark: string | null;
  created_by: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface ProductionBatchRow extends RowDataPacket {
  id: number;
  task_id: number;
  task_no: string | null;
  parent_batch_id: number | null;
  batch_no: string;
  sub_batch_no: string | null;
  product_name: string;
  product_model: string | null;
  template_id: number | null;
  template_name: string | null;
  batch_quantity: number;
  current_step_record_id: number | null;
  status: string;
  remark: string | null;
  created_by: number | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface BatchStepRecordRow extends RowDataPacket {
  id: number;
  batch_id: number;
  batch_no?: string | null;
  product_name?: string | null;
  template_step_id: number | null;
  step_code?: string | null;
  step_name?: string | null;
  need_special_check?: number | null;
  step_order: number;
  status: string;
  input_quantity: number | null;
  output_quantity: number | null;
  self_check_pass_qty: number | null;
  self_check_fail_qty: number | null;
  special_check_pass_qty: number | null;
  special_check_fail_qty: number | null;
  important_param_text: string | null;
  actual_operator_id?: number | null;
  actual_operator_name?: string | null;
  inspector_id?: number | null;
  inspector_name?: string | null;
  assigned_user_ids?: string | null;
  assigned_user_names?: string | null;
  started_at?: Date | string | null;
  completed_at?: Date | string | null;
  inspected_at?: Date | string | null;
  remark: string | null;
}

export interface BatchStatusRow extends RowDataPacket {
  id: number;
  status: string;
}

export interface EmployeeWorkloadRow extends RowDataPacket {
  user_id: number;
  display_name: string;
  assigned_count: number;
  doing_count: number;
  wait_inspection_count: number;
  completed_count: number;
}

export interface InspectionRecordRow extends RowDataPacket {
  id: number;
  batch_id: number;
  batch_no: string | null;
  batch_step_id: number | null;
  step_name: string | null;
  inspection_type: string;
  inspection_name: string;
  result: string;
  pass_quantity: number | null;
  fail_quantity: number | null;
  inspector_id: number | null;
  inspector_name: string | null;
  inspected_at: Date | string | null;
  file_path: string | null;
  result_summary: string | null;
  remark: string | null;
  created_at: Date | string | null;
}

export interface ReworkRecordRow extends RowDataPacket {
  id: number;
  rework_no: string;
  batch_id: number;
  batch_no: string | null;
  sub_batch_id: number | null;
  source_step_id: number | null;
  source_step_name: string | null;
  source_inspection_id: number | null;
  return_step_id: number | null;
  rework_quantity: number | null;
  reason: string;
  handling_method: string | null;
  handler_id: number | null;
  handler_name: string | null;
  handled_at: Date | string | null;
  result: string | null;
  recheck_inspection_id: number | null;
  status: string;
  confirmed_by: number | null;
  confirmed_by_name: string | null;
  confirmed_at: Date | string | null;
  remark: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface StorageShipmentRecordRow extends RowDataPacket {
  id: number;
  batch_id: number;
  batch_no: string | null;
  product_name: string | null;
  product_model: string | null;
  record_type: string;
  quantity: number;
  operator_id: number | null;
  operator_name: string | null;
  warehouse_keeper_id: number | null;
  warehouse_keeper_name: string | null;
  record_date: Date | string;
  file_path: string | null;
  remark: string | null;
  created_at: Date | string | null;
}

export interface BatchInventoryRow extends RowDataPacket {
  batch_id: number;
  batch_no: string | null;
  product_name: string | null;
  product_model: string | null;
  inbound_quantity: number | string | null;
  outbound_quantity: number | string | null;
  shipment_quantity: number | string | null;
}

export interface BatchStockRow extends RowDataPacket {
  stock_quantity: number | string | null;
}

export interface MaterialBatchRow extends RowDataPacket {
  id: number;
  material_name: string;
  material_type: string | null;
  specification: string | null;
  material_batch_no: string;
  supplier_name: string | null;
  received_date: Date | string | null;
  unit: string | null;
  quantity: number | string | null;
  status: string;
  remark: string | null;
  created_at: Date | string | null;
  updated_at: Date | string | null;
}

export interface BatchMaterialUsageRow extends RowDataPacket {
  id: number;
  batch_id: number;
  batch_no: string | null;
  material_batch_id: number;
  material_batch_no: string | null;
  material_name: string | null;
  usage_name: string | null;
  usage_quantity: number | string | null;
  remark: string | null;
  created_at: Date | string | null;
}

export interface TraceMaterialRow extends RowDataPacket {
  id: number;
  material_name: string;
  material_type: string | null;
  specification: string | null;
  material_batch_no: string;
  supplier_name: string | null;
  received_date: Date | string | null;
  unit: string | null;
  quantity: number | string | null;
  status: string;
}

export interface TraceMaterialUsageRow extends RowDataPacket {
  id: number;
  batch_id: number;
  batch_no: string | null;
  material_batch_id: number;
  material_batch_no: string | null;
  material_name: string | null;
  usage_name: string | null;
  usage_quantity: number | string | null;
  remark: string | null;
  created_at: Date | string | null;
}
