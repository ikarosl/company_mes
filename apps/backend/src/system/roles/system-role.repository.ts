import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import type {
  AssignSystemRolePermissionsPayload,
  CreateSystemRolePayload,
  SystemRoleListItem,
  SystemRolePermissionDetail,
  UpdateSystemRolePayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import type { CountRow, RoleListRow, RolePermissionRow, RoleRow } from '../system.types.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import {
  mapSystemRole,
  normalizeOptionalString,
  readPermissionIds,
  readRequiredString,
  readTinyStatus,
  replaceRolePermissions,
} from '../system.utils.js';

@Injectable()
export class SystemRoleRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  /** 分页查询角色，并在数据库中完成关键字、名称、编码和状态筛选。 */
  async listRoles(
    pagination: PaginationOptions,
    filters: { keyword?: string; name?: string; code?: string; status?: string },
  ) {
    const clauses = ['r.deleted_at IS NULL'];
    const params: QueryParam[] = [];
    if (filters.keyword?.trim()) {
      const keyword = `%${filters.keyword.trim()}%`;
      clauses.push('(r.name LIKE ? OR r.code LIKE ? OR r.description LIKE ?)');
      params.push(keyword, keyword, keyword);
    }
    if (filters.name?.trim()) {
      clauses.push('r.name LIKE ?');
      params.push(`%${filters.name.trim()}%`);
    }
    if (filters.code?.trim()) {
      clauses.push('r.code LIKE ?');
      params.push(`%${filters.code.trim()}%`);
    }
    if (filters.status?.trim() !== undefined && filters.status?.trim() !== '') {
      clauses.push('r.status = ?');
      // 角色筛选兼容 enabled/disabled 和 1/0，避免不同页面复用时产生参数错误。
      const status = filters.status === 'enabled' ? 1 : filters.status === 'disabled' ? 0 : Number(filters.status);
      params.push(readTinyStatus(status));
    }
    const where = clauses.join(' AND ');
    const [totalRow] = await this.database.query<CountRow[]>(`SELECT COUNT(*) AS total FROM roles r WHERE ${where}`, params);
    const rows = await this.database.query<RoleListRow[]>(
      `SELECT r.id, r.name, r.code, r.description,
        COUNT(DISTINCT rp.permission_id) AS permission_count,
        COUNT(DISTINCT role_user.id) AS user_count, r.status, r.updated_at
       FROM roles r
       LEFT JOIN role_permissions rp ON rp.role_id = r.id
       LEFT JOIN user_roles ur ON ur.role_id = r.id
       LEFT JOIN users role_user ON role_user.id = ur.user_id AND role_user.deleted_at IS NULL
       WHERE ${where}
       GROUP BY r.id, r.name, r.code, r.description, r.status, r.updated_at
       ORDER BY r.id LIMIT ? OFFSET ?`,
      [...params, pagination.pageSize, pagination.offset],
    );
    return toPageResult(rows.map(mapSystemRole), Number(totalRow?.total ?? 0), pagination);
  }

  async createRole(payload: CreateSystemRolePayload) {
    const name = readRequiredString(payload.name, 'Missing role name');
    const code = readRequiredString(payload.code, 'Missing role code');
    const status = readTinyStatus(payload.status ?? 1);

    await this.assertRoleCodeAvailable(code);

    const result = (await this.database.execute(
      `
      INSERT INTO roles (name, code, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `,
      [name, code, normalizeOptionalString(payload.description), status],
    )) as ResultSetHeader;

    return this.getRoleListItem(result.insertId);
  }

  async updateRole(id: number, payload: UpdateSystemRolePayload) {
    const current = await this.getRoleRow(id);
    this.auditContext.setBeforeData(current);
    const name =
      payload.name === undefined
        ? current.name
        : readRequiredString(payload.name, 'Missing role name');
    const code =
      payload.code === undefined
        ? current.code
        : readRequiredString(payload.code, 'Missing role code');
    const status = payload.status === undefined ? current.status : readTinyStatus(payload.status);
    const description =
      payload.description === undefined
        ? current.description
        : normalizeOptionalString(payload.description);

    await this.assertRoleCodeAvailable(code, id);

    await this.database.execute(
      `
      UPDATE roles
      SET name = ?,
        code = ?,
        description = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `,
      [name, code, description, status, id],
    );

    const updated = await this.getRoleListItem(id);
    this.auditContext.setAfterData(updated);
    return updated;
  }

  async deleteRole(id: number) {
    const role = await this.getRoleRow(id);
    this.auditContext.setBeforeData({
      ...role,
      permissions: await this.getRolePermissions(id),
    });

    if (role.code === 'admin') {
      throw new BadRequestException('Built-in admin role cannot be deleted');
    }

    await this.database.transaction(async (connection) => {
      await connection.execute('DELETE FROM user_roles WHERE role_id = ?', [id]);
      await connection.execute('DELETE FROM role_permissions WHERE role_id = ?', [id]);
      await connection.execute('UPDATE roles SET deleted_at = NOW() WHERE id = ?', [id]);
    });

    this.auditContext.setAfterData({ id: String(id), deleted: true });
    return { success: true };
  }

  async getRolePermissions(id: number): Promise<SystemRolePermissionDetail> {
    await this.getRoleRow(id);
    const rows = await this.database.query<RolePermissionRow[]>(
      `
      SELECT permission_id
      FROM role_permissions
      WHERE role_id = ?
      ORDER BY permission_id
    `,
      [id],
    );

    return {
      roleId: String(id),
      permissionIds: rows.map((row) => String(row.permission_id)),
    };
  }

  async assignRolePermissions(id: number, payload: AssignSystemRolePermissionsPayload) {
    await this.getRoleRow(id);
    this.auditContext.setBeforeData(await this.getRolePermissions(id));
    const permissionIds = readPermissionIds(payload.permissionIds);
    await this.assertPermissionsAvailable(permissionIds);

    await this.database.transaction(async (connection) => {
      await replaceRolePermissions(connection, id, permissionIds);
    });

    const updated = await this.getRolePermissions(id);
    this.auditContext.setAfterData(updated);
    return updated;
  }

  private async getRoleRow(id: number) {
    const [row] = await this.database.query<RoleRow[]>(
      `
      SELECT id, name, code, description, status
      FROM roles
      WHERE id = ? AND deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Role not found');
    }

    return row;
  }

  private async getRoleListItem(id: number) {
    const [row] = await this.database.query<RoleListRow[]>(
      `
      SELECT
        r.id,
        r.name,
        r.code,
        r.description,
        COUNT(DISTINCT rp.permission_id) AS permission_count,
        COUNT(DISTINCT role_user.id) AS user_count,
        r.status,
        r.updated_at
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN user_roles ur ON ur.role_id = r.id
      LEFT JOIN users role_user ON role_user.id = ur.user_id AND role_user.deleted_at IS NULL
      WHERE r.id = ? AND r.deleted_at IS NULL
      GROUP BY r.id, r.name, r.code, r.description, r.status, r.updated_at
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Role not found');
    }

    return mapSystemRole(row);
  }

  private async assertRoleCodeAvailable(code: string, ignoredRoleId?: number) {
    const params: QueryParam[] = [code];
    const ignoredClause = ignoredRoleId ? ' AND id <> ?' : '';

    if (ignoredRoleId) {
      params.push(ignoredRoleId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM roles
      WHERE code = ? AND deleted_at IS NULL${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Role code already exists');
    }
  }

  private async assertPermissionsAvailable(permissionIds: number[]) {
    if (permissionIds.length === 0) {
      return;
    }

    const placeholders = permissionIds.map(() => '?').join(', ');
    const rows = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM permissions
      WHERE id IN (${placeholders}) AND status = 1 AND deleted_at IS NULL
    `,
      permissionIds,
    );

    if (rows.length !== permissionIds.length) {
      throw new BadRequestException('Permission not found or disabled');
    }
  }
}
