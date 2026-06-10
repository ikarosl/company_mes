import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import type {
  AssignSystemUserRolesPayload,
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type { CountRow, UserListRow, UserRow } from '../system.types.js';
import {
  mapSystemUser,
  normalizeOptionalString,
  nullableId,
  readPassword,
  readRequiredString,
  readRoleIds,
  readTinyStatus,
  replaceUserRoles,
} from '../system.utils.js';

@Injectable()
export class SystemUserRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listUsers(pagination: PaginationOptions) {
    const [totalRow] = await this.database.query<CountRow[]>(`
      SELECT COUNT(*) AS total
      FROM users
      WHERE deleted_at IS NULL
    `);
    const rows = await this.database.query<UserListRow[]>(
      `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.department_id,
        d.name AS department_name,
        u.email,
        u.mobile,
        GROUP_CONCAT(DISTINCT r.id ORDER BY r.id) AS role_ids,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.id) AS roles,
        u.status,
        u.last_login_at
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id AND d.deleted_at IS NULL
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
      GROUP BY
        u.id, u.username, u.display_name, u.department_id, d.name,
        u.email, u.mobile, u.status, u.last_login_at
      ORDER BY u.id
      LIMIT ? OFFSET ?
    `,
      [pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapSystemUser), Number(totalRow?.total ?? 0), pagination);
  }

  async createUser(payload: CreateSystemUserPayload) {
    const username = readRequiredString(payload.username, 'Missing username');
    const displayName = readRequiredString(payload.displayName, 'Missing display name');
    const password = readPassword(payload.password);
    const departmentId = nullableId(payload.departmentId);
    const roleIds = readRoleIds(payload.roleIds ?? []);
    const status = readTinyStatus(payload.status ?? 1);

    await this.assertUsernameAvailable(username);
    await this.assertDepartmentAvailable(departmentId);
    await this.assertRolesAvailable(roleIds);

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await this.database.transaction(async (connection) => {
      const [result] = await connection.execute(
        `
        INSERT INTO users (
          department_id, username, password_hash, display_name,
          email, mobile, status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
        [
          departmentId,
          username,
          passwordHash,
          displayName,
          normalizeOptionalString(payload.email),
          normalizeOptionalString(payload.mobile),
          status,
        ],
      );
      const insertId = (result as ResultSetHeader).insertId;
      await replaceUserRoles(connection, insertId, roleIds);
      return insertId;
    });

    return this.getUserListItem(userId);
  }

  async updateUser(id: number, payload: UpdateSystemUserPayload) {
    const current = await this.getUserRow(id);
    const username =
      payload.username === undefined
        ? current.username
        : readRequiredString(payload.username, 'Missing username');
    const displayName =
      payload.displayName === undefined
        ? current.display_name
        : readRequiredString(payload.displayName, 'Missing display name');
    const departmentId =
      payload.departmentId === undefined ? current.department_id : nullableId(payload.departmentId);

    await this.assertUsernameAvailable(username, id);
    await this.assertDepartmentAvailable(departmentId);

    await this.database.execute(
      `
      UPDATE users
      SET username = ?,
        display_name = ?,
        department_id = ?,
        email = ?,
        mobile = ?,
        updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `,
      [
        username,
        displayName,
        departmentId,
        payload.email === undefined ? current.email : normalizeOptionalString(payload.email),
        payload.mobile === undefined ? current.mobile : normalizeOptionalString(payload.mobile),
        id,
      ],
    );

    return this.getUserListItem(id);
  }

  async changeUserStatus(id: number, payload: UpdateSystemUserStatusPayload) {
    await this.getUserRow(id);
    const status = readTinyStatus(payload.status);

    await this.database.execute(
      `
      UPDATE users
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `,
      [status, id],
    );

    return this.getUserListItem(id);
  }

  async resetUserPassword(id: number, payload: ResetSystemUserPasswordPayload) {
    await this.getUserRow(id);
    const passwordHash = await bcrypt.hash(readPassword(payload.password), 10);

    await this.database.execute(
      `
      UPDATE users
      SET password_hash = ?, updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `,
      [passwordHash, id],
    );

    return { success: true };
  }

  async assignUserRoles(id: number, payload: AssignSystemUserRolesPayload) {
    await this.getUserRow(id);
    const roleIds = readRoleIds(payload.roleIds);
    await this.assertRolesAvailable(roleIds);

    await this.database.transaction(async (connection) => {
      await replaceUserRoles(connection, id, roleIds);
    });

    return this.getUserListItem(id);
  }

  private async getUserRow(id: number) {
    const [row] = await this.database.query<UserRow[]>(
      `
      SELECT id, username, display_name, department_id, email, mobile, status
      FROM users
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return row;
  }

  private async getUserListItem(id: number) {
    const [row] = await this.database.query<UserListRow[]>(
      `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.department_id,
        d.name AS department_name,
        u.email,
        u.mobile,
        GROUP_CONCAT(DISTINCT r.id ORDER BY r.id) AS role_ids,
        GROUP_CONCAT(DISTINCT r.code ORDER BY r.id) AS roles,
        u.status,
        u.last_login_at
      FROM users u
      LEFT JOIN departments d ON d.id = u.department_id AND d.deleted_at IS NULL
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id AND r.deleted_at IS NULL
      WHERE u.id = ? AND u.deleted_at IS NULL
      GROUP BY
        u.id, u.username, u.display_name, u.department_id, d.name,
        u.email, u.mobile, u.status, u.last_login_at
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('User not found');
    }

    return mapSystemUser(row);
  }

  private async assertUsernameAvailable(username: string, ignoredUserId?: number) {
    const params: QueryParam[] = [username];
    const ignoredClause = ignoredUserId ? ' AND id <> ?' : '';

    if (ignoredUserId) {
      params.push(ignoredUserId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM users
      WHERE username = ? AND deleted_at IS NULL${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Username already exists');
    }
  }

  private async assertDepartmentAvailable(departmentId: number | null) {
    if (departmentId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM departments
      WHERE id = ? AND status = 1 AND deleted_at IS NULL
      LIMIT 1
    `,
      [departmentId],
    );

    if (!row) {
      throw new BadRequestException('Department not found or disabled');
    }
  }

  private async assertRolesAvailable(roleIds: number[]) {
    if (roleIds.length === 0) {
      return;
    }

    const placeholders = roleIds.map(() => '?').join(', ');
    const rows = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM roles
      WHERE id IN (${placeholders}) AND status = 1 AND deleted_at IS NULL
    `,
      roleIds,
    );

    if (rows.length !== roleIds.length) {
      throw new BadRequestException('Role not found or disabled');
    }
  }
}
