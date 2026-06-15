import type { RowDataPacket } from 'mysql2/promise';

export interface CountRow extends RowDataPacket {
  total: number;
}

export interface WorkOrderListRow extends RowDataPacket {
  id: number;
  order_no: string;
  product_id: number;
  product_model: string;
  product_name: string;
  route_id: number | null;
  route_name: string | null;
  planned_quantity: string | number;
  assigned_quantity: string | number | null;
  unit: string;
  owner_id: number | null;
  owner_name: string | null;
  status: string;
  plan_start_date: Date | null;
  plan_end_date: Date | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkOrderRow extends RowDataPacket {
  id: number;
  order_no: string;
  product_id: number;
  route_id: number | null;
  planned_quantity: string | number;
  unit: string;
  owner_id: number | null;
  status: string;
  plan_start_date: Date | null;
  plan_end_date: Date | null;
  remark: string | null;
}

export interface ProductionBatchListRow extends RowDataPacket {
  id: number;
  work_order_id: number;
  batch_no: string;
  product_id: number;
  product_model: string;
  product_name: string;
  route_id: number | null;
  route_name: string | null;
  planned_quantity: string | number;
  status: string;
  material_status: string;
  dispatch_status: string;
  production_status: string;
  inspection_status: string;
  owner_id: number | null;
  owner_name: string | null;
  plan_start_date: Date | null;
  plan_end_date: Date | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductionTaskListRow extends ProductionBatchListRow {
  order_no: string;
  step_count: number;
  finished_step_count: number;
}

export interface BatchStepRecordListRow extends RowDataPacket {
  id: number;
  batch_id: number;
  route_step_id: number;
  step_order: number;
  process_id: number | null;
  process_code: string;
  process_name: string;
  default_owner_id: number | null;
  default_owner_name: string | null;
  actual_owner_id: number | null;
  actual_owner_name: string | null;
  status: string;
  started_at: Date | null;
  finished_at: Date | null;
  total_quantity: string | number | null;
  qualified_quantity: string | number | null;
  defective_quantity: string | number | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskMaterialRequirementRow extends RowDataPacket {
  id: number;
  route_step_id: number;
  route_step_name: string;
  product_material_id: number;
  material_product_id: number;
  material_model: string;
  material_name: string;
  quantity_per_unit: string | number;
  planned_quantity: string | number;
  unit: string | null;
  is_key_material: number;
  need_batch_record: number;
}
