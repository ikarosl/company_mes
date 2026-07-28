import {
  type AssignSystemRolePermissionsPayload,
  type AssignSystemUserRolesPayload,
  type CreateSystemUserPayload,
  type OperationLogListItem,
  type PageResult,
  type ResetSystemUserPasswordPayload,
  SYSTEM_API,
  type SystemDepartmentOption,
  type SystemPermissionListItem,
  type SystemPermissionTreeNode,
  type SystemRoleListItem,
  type SystemRoleOption,
  type SystemRolePermissionDetail,
  type SystemUserListItem,
  type UpdateSystemUserPayload,
  type UpdateSystemUserStatusPayload,
} from '@company/api-contract';
import { requestData, requestPageItems, type QueryParams } from './shared/request-data';

export const systemApi = {
  listUsers: (params?: QueryParams) =>
    requestPageItems<SystemUserListItem>({
      url: SYSTEM_API.users,
      method: 'GET',
      // 该方法主要供负责人、人员等下拉选项复用，默认加载后端允许的最大页容量。
      params: { page: 1, pageSize: 100, ...params },
    }),
  /** 用户管理分页结果：保留总数和当前页信息，供统一分页组件使用。 */
  listUsersPage: (params?: QueryParams) =>
    requestData<PageResult<SystemUserListItem>>({
      url: SYSTEM_API.users,
      method: 'GET',
      params,
    }),
  createUser: (data: CreateSystemUserPayload) =>
    requestData<SystemUserListItem>({
      url: SYSTEM_API.users,
      method: 'POST',
      data,
    }),
  updateUser: (id: string, data: UpdateSystemUserPayload) =>
    requestData<SystemUserListItem>({
      url: `${SYSTEM_API.users}/${id}`,
      method: 'PUT',
      data,
    }),
  changeUserStatus: (id: string, data: UpdateSystemUserStatusPayload) =>
    requestData<SystemUserListItem>({
      url: `${SYSTEM_API.users}/${id}/${Number(data.status) === 1 ? 'enable' : 'disable'}`,
      method: 'PUT',
    }),
  resetUserPassword: (id: string, data: ResetSystemUserPasswordPayload) =>
    requestData<{ success: boolean }>({
      url: `${SYSTEM_API.users}/${id}/reset-password`,
      method: 'PUT',
      data,
    }),
  assignUserRoles: (id: string, data: AssignSystemUserRolesPayload) =>
    requestData<SystemUserListItem>({
      url: `${SYSTEM_API.users}/${id}/roles`,
      method: 'PUT',
      data,
    }),
  listDepartmentOptions: () =>
    requestData<SystemDepartmentOption[]>({
      url: SYSTEM_API.departmentOptions,
      method: 'GET',
    }),
  listRoleOptions: () =>
    requestData<SystemRoleOption[]>({
      url: SYSTEM_API.roleOptions,
      method: 'GET',
    }),
  listRoles: (params?: QueryParams) =>
    requestData<PageResult<SystemRoleListItem>>({
      url: SYSTEM_API.roles,
      method: 'GET',
      params,
    }),
  listPermissions: (params?: QueryParams) =>
    requestData<PageResult<SystemPermissionListItem>>({
      url: SYSTEM_API.permissions,
      method: 'GET',
      params,
    }),
  listPermissionTree: () =>
    requestData<SystemPermissionTreeNode[]>({
      url: `${SYSTEM_API.permissions}/tree`,
      method: 'GET',
    }),
  getRolePermissions: (id: string) =>
    requestData<SystemRolePermissionDetail>({
      url: `${SYSTEM_API.roles}/${id}/permissions`,
      method: 'GET',
    }),
  assignRolePermissions: (id: string, data: AssignSystemRolePermissionsPayload) =>
    requestData<SystemRolePermissionDetail>({
      url: `${SYSTEM_API.roles}/${id}/permissions`,
      method: 'PUT',
      data,
    }),
  listOperationLogs: (params?: QueryParams) =>
    requestData<PageResult<OperationLogListItem>>({
      url: SYSTEM_API.logs,
      method: 'GET',
      params,
    }),
};
