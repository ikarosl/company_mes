export interface SystemUserListItem {
  id: string;
  username: string;
  displayName: string;
  departmentId: string | null;
  departmentName: string | null;
  email: string | null;
  mobile: string | null;
  roleIds: string[];
  roles: string[];
  status: number;
  lastLoginAt: string | null;
}

export interface SystemRoleListItem {
  id: string;
  name: string;
  code: string;
  description: string | null;
  permissionCount: number;
  userCount: number;
  status: number;
  updatedAt: string | null;
}

export interface SystemPermissionListItem {
  id: string;
  parentId: string;
  name: string;
  code: string;
  type: string;
  routePath: string | null;
  apiMethod: string | null;
  apiPath: string | null;
  status: number;
}

export interface SystemPermissionTreeNode extends SystemPermissionListItem {
  children: SystemPermissionTreeNode[];
}

export interface SystemRolePermissionDetail {
  roleId: string;
  permissionIds: string[];
}

export interface OperationLogListItem {
  id: string;
  logType: string;
  module: string;
  action: string;
  userId: string | null;
  username: string | null;
  targetId: string | null;
  targetType: string | null;
  result: string;
  beforeData: unknown;
  afterData: unknown;
  ip: string | null;
  remark: string | null;
  createdAt: string;
}

export interface SystemDepartmentOption {
  id: string;
  parentId: string;
  name: string;
  code: string;
}

export interface SystemRoleOption {
  id: string;
  name: string;
  code: string;
}

export interface CreateSystemUserPayload {
  username: string;
  password: string;
  displayName: string;
  departmentId?: string | null;
  email?: string | null;
  mobile?: string | null;
  status?: number | boolean;
  roleIds?: string[];
}

export interface UpdateSystemUserPayload {
  username?: string;
  displayName?: string;
  departmentId?: string | null;
  email?: string | null;
  mobile?: string | null;
}

export interface UpdateSystemUserStatusPayload {
  status: number | boolean;
}

export interface ResetSystemUserPasswordPayload {
  password: string;
}

export interface AssignSystemUserRolesPayload {
  roleIds: string[];
}

export interface CreateSystemRolePayload {
  name: string;
  code: string;
  description?: string | null;
  status?: number | boolean;
}

export interface UpdateSystemRolePayload {
  name?: string;
  code?: string;
  description?: string | null;
  status?: number | boolean;
}

export interface AssignSystemRolePermissionsPayload {
  permissionIds: string[];
}
