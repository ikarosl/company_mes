import type { RowDataPacket } from 'mysql2/promise';

export interface CountRow extends RowDataPacket {
  total: number;
}

export interface MaterialBatchListRow extends RowDataPacket {
  id: number;
  product_id: number;
  product_model: string;
  product_name: string;
  product_attribute: string | null;
  product_type: string | null;
  material_batch_no: string;
  supplier_name: string | null;
  received_date: Date | null;
  quantity: string | number | null;
  reserved_quantity: string | number | null;
  used_quantity: string | number | null;
  status: string;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface MaterialBatchRow extends RowDataPacket {
  id: number;
  product_id: number;
  material_batch_no: string;
  supplier_name: string | null;
  received_date: Date | null;
  quantity: string | number | null;
  status: string;
  remark: string | null;
}

export interface MaterialBatchUsageRow extends RowDataPacket {
  id: number;
  batch_id: number | null;
  reserved_quantity: string | number | null;
  used_quantity: string | number | null;
  status: string | null;
  recorded_by: number | null;
  recorded_by_name: string | null;
  recorded_at: Date | null;
  remark: string | null;
}
