import type { RowDataPacket } from 'mysql2/promise';

export interface ProductCategoryListRow extends RowDataPacket {
  id: number;
  product_attribute: string;
  product_type: string;
  status: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductCategoryRow extends RowDataPacket {
  id: number;
  product_attribute: string;
  product_type: string;
  status: number;
  remark: string | null;
}

export interface CountRow extends RowDataPacket {
  total: number;
}

export interface ProductListRow extends RowDataPacket {
  id: number;
  product_model: string;
  product_name: string;
  category_id: number | null;
  product_attribute: string | null;
  product_type: string | null;
  unit: string;
  acquire_method: string;
  spec_values: string | null;
  material_count: number;
  status: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRow extends RowDataPacket {
  id: number;
  product_model: string;
  product_name: string;
  category_id: number | null;
  unit: string;
  acquire_method: string;
  spec_values: string | null;
  status: number;
  remark: string | null;
}

export interface ProductMaterialListRow extends RowDataPacket {
  id: number;
  product_id: number;
  material_product_id: number;
  material_model: string;
  material_name: string;
  material_unit: string;
  quantity_per_unit: string | number;
  unit: string | null;
  is_key_material: number;
  need_batch_record: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessListRow extends RowDataPacket {
  id: number;
  process_code: string;
  process_name: string;
  description: string | null;
  sop_file_id: number | null;
  sop_file_name: string | null;
  sop_file_url: string | null;
  status: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessRow extends RowDataPacket {
  id: number;
  process_code: string;
  process_name: string;
  description: string | null;
  sop_file_id: number | null;
  sop_file_name: string | null;
  sop_file_url: string | null;
  status: number;
  remark: string | null;
}

export interface ProcessRouteOptionRow extends RowDataPacket {
  id: number;
  route_code: string;
  route_name: string;
  version: string | null;
}

export interface ProcessOptionRow extends RowDataPacket {
  id: number;
  process_code: string;
  process_name: string;
  description: string | null;
  sop_file_id: number | null;
  sop_file_name: string | null;
  sop_file_url: string | null;
}

export interface ProcessRouteStepListRow extends RowDataPacket {
  id: number;
  route_id: number;
  process_id: number;
  step_order: number;
  process_code: string;
  process_name: string;
  description: string | null;
  default_owner_id: number | null;
  default_owner_name: string | null;
  sop_file_id: number | null;
  sop_file_name: string | null;
  sop_file_url: string | null;
  status: number;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessRouteListRow extends RowDataPacket {
  id: number;
  route_code: string;
  route_name: string;
  product_category_id: number | null;
  product_attribute: string | null;
  product_type: string | null;
  version: string | null;
  status: number;
  remark: string | null;
  step_count: number;
  process_summary: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProcessRouteRow extends RowDataPacket {
  id: number;
  route_code: string;
  route_name: string;
  product_category_id: number | null;
  version: string | null;
  status: number;
  remark: string | null;
}
