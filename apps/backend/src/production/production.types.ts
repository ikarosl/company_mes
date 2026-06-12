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
