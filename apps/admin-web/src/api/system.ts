import {
  type AssignSystemUserRolesPayload,
  type CreateSystemUserPayload,
  type OperationLogListItem,
  type ResetSystemUserPasswordPayload,
  SYSTEM_API,
  type SystemDepartmentOption,
  type SystemPermissionListItem,
  type SystemRoleListItem,
  type SystemRoleOption,
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
  listRoles: () =>
    requestData<SystemRoleListItem[]>({
      url: SYSTEM_API.roles,
      method: 'GET',
    }),
  listPermissions: () =>
    requestData<SystemPermissionListItem[]>({
      url: SYSTEM_API.permissions,
      method: 'GET',
    }),
  listOperationLogs: (params?: QueryParams) =>
    requestPageItems<OperationLogListItem>({
      url: SYSTEM_API.logs,
      method: 'GET',
      params,
    }),
};
