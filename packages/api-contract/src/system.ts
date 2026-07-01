/** 系统用户列表项，供用户管理和业务负责人选择器复用。 */
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

/** 角色列表及其权限、用户数量汇总。 */
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

/** 权限基础信息，覆盖菜单、页面和接口权限。 */
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

/** 前端权限树节点。 */
export interface SystemPermissionTreeNode extends SystemPermissionListItem {
  children: SystemPermissionTreeNode[];
}

/** 角色当前绑定的权限集合。 */
export interface SystemRolePermissionDetail {
  roleId: string;
  permissionIds: string[];
}

/** 操作审计日志的列表及详情共用结构。 */
export interface OperationLogListItem {
  id: string;
  logType: string;
  module: string;
  action: string;
  userId: string | null;
  username: string | null;
  targetId: string | null;
  targetType: string | null;
  targetIds: unknown;
  businessKey: string | null;
  result: string;
  requestId: string | null;
  httpMethod: string | null;
  route: string | null;
  httpStatus: number | null;
  durationMs: number | null;
  requestData: unknown;
  beforeData: unknown;
  afterData: unknown;
  ip: string | null;
  userAgent: string | null;
  errorCode: string | null;
  remark: string | null;
  createdAt: string;
}

/** 日志模块枚举值：与后端审计写入的 module 字段保持一致，供查询下拉框复用。 */
export const OPERATION_LOG_MODULE_OPTIONS = [
  { label: '认证登录', value: 'auth' },
  { label: '系统管理', value: 'system' },
  { label: '产品资料', value: 'product' },
  { label: '生产管理', value: 'production' },
  { label: '生产物料分配', value: 'material-allocation' },
  { label: '仓储管理', value: 'warehouse' },
  { label: '质量管理', value: 'quality' },
  { label: '未知模块', value: 'unknown' },
] as const;

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
