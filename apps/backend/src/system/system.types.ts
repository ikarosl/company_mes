import type { RowDataPacket } from 'mysql2/promise';

export interface UserListRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
  department_id: number | null;
  department_name: string | null;
  email: string | null;
  mobile: string | null;
  role_ids: string | null;
  roles: string | null;
  status: number;
  last_login_at: Date | null;
}

export interface CountRow extends RowDataPacket {
  total: number;
}

export interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
  department_id: number | null;
  email: string | null;
  mobile: string | null;
  status: number;
}

export interface RoleListRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  description: string | null;
  permission_count: number;
  user_count: number;
  status: number;
  updated_at: Date | null;
}

export interface RoleRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: number;
}

export interface PermissionListRow extends RowDataPacket {
  id: number;
  parent_id: number;
  name: string;
  code: string;
  type: string;
  route_path: string | null;
  api_method: string | null;
  api_path: string | null;
  status: number;
}

export interface DepartmentOptionRow extends RowDataPacket {
  id: number;
  parent_id: number;
  name: string;
  code: string;
}

export interface RoleOptionRow extends RowDataPacket {
  id: number;
  name: string;
  code: string;
}

export interface RolePermissionRow extends RowDataPacket {
  permission_id: number;
}
