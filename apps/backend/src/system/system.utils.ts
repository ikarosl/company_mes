import { BadRequestException } from '@nestjs/common';
import type {
  SystemPermissionListItem,
  SystemPermissionTreeNode,
  SystemRoleListItem,
  SystemUserListItem,
} from '@company/api-contract';
import type { PoolConnection } from 'mysql2/promise';
import type { RoleListRow, UserListRow } from './system.types.js';

export const mapSystemRole = (row: RoleListRow): SystemRoleListItem => ({
  id: String(row.id),
  name: row.name,
  code: row.code,
  description: row.description,
  permissionCount: Number(row.permission_count),
  userCount: Number(row.user_count),
  status: row.status,
  updatedAt: row.updated_at?.toISOString() ?? null,
});

export const mapSystemUser = (row: UserListRow): SystemUserListItem => ({
  id: String(row.id),
  username: row.username,
  displayName: row.display_name,
  departmentId: row.department_id === null ? null : String(row.department_id),
  departmentName: row.department_name,
  email: row.email,
  mobile: row.mobile,
  roleIds: row.role_ids ? row.role_ids.split(',') : [],
  roles: row.roles ? row.roles.split(',') : [],
  status: row.status,
  lastLoginAt: row.last_login_at?.toISOString() ?? null,
});

export const readRequiredString = (value: string | undefined, message: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
};

export const readPassword = (value: string | undefined) => {
  const password = readRequiredString(value, 'Missing password');
  if (password.length < 6) {
    throw new BadRequestException('Password must be at least 6 characters');
  }

  return password;
};

export const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const nullableId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

export const readRoleIds = (values: string[] | undefined) => {
  const roleIds = values?.map((value) => nullableId(value)) ?? [];
  const validRoleIds = roleIds.filter((value): value is number => value !== null);
  const uniqueRoleIds = [...new Set(validRoleIds)];

  if (uniqueRoleIds.length !== validRoleIds.length) {
    throw new BadRequestException('Duplicate role ids');
  }

  return uniqueRoleIds;
};

export const readPermissionIds = (values: string[] | undefined) => {
  const permissionIds = values?.map((value) => nullableId(value)) ?? [];
  const validPermissionIds = permissionIds.filter((value): value is number => value !== null);
  const uniquePermissionIds = [...new Set(validPermissionIds)];

  if (uniquePermissionIds.length !== validPermissionIds.length) {
    throw new BadRequestException('Duplicate permission ids');
  }

  return uniquePermissionIds;
};

export const readTinyStatus = (value: number | boolean) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (value !== 0 && value !== 1) {
    throw new BadRequestException('Invalid status');
  }

  return value;
};

export const replaceUserRoles = async (
  connection: PoolConnection,
  userId: number,
  roleIds: number[],
) => {
  await connection.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);

  for (const roleId of roleIds) {
    await connection.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [
      userId,
      roleId,
    ]);
  }
};

export const replaceRolePermissions = async (
  connection: PoolConnection,
  roleId: number,
  permissionIds: number[],
) => {
  await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);

  for (const permissionId of permissionIds) {
    await connection.execute(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
      [roleId, permissionId],
    );
  }
};

export const buildPermissionTree = (
  permissions: SystemPermissionListItem[],
): SystemPermissionTreeNode[] => {
  const nodeMap = new Map<string, SystemPermissionTreeNode>();
  const roots: SystemPermissionTreeNode[] = [];

  for (const permission of permissions) {
    nodeMap.set(permission.id, { ...permission, children: [] });
  }

  for (const permission of permissions) {
    const node = nodeMap.get(permission.id);
    if (!node) {
      continue;
    }

    const parent = nodeMap.get(permission.parentId);
    if (permission.parentId !== '0' && parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
};
