import type { SystemPermissionListItem, SystemPermissionTreeNode } from '@company/api-contract';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type { CountRow, PermissionListRow } from '../system.types.js';
import { buildPermissionTree } from '../system.utils.js';

@Injectable()
export class SystemPermissionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /**
   * 分页查询权限管理列表。
   * 授权场景需要完整层级时应调用 listPermissionTree，不能依赖分页结果拼树。
   */
  async listPermissions(pagination: PaginationOptions, filters: { keyword?: string }) {
    const keyword = filters.keyword?.trim();
    const clauses = ['deleted_at IS NULL'];
    const params: QueryParam[] = [];

    if (keyword) {
      clauses.push('(name LIKE ? OR code LIKE ? OR route_path LIKE ? OR api_path LIKE ?)');
      const pattern = `%${keyword}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const whereSql = `WHERE ${clauses.join(' AND ')}`;
    const [countRows, rows] = await Promise.all([
      this.database.query<CountRow[]>(`SELECT COUNT(*) AS total FROM permissions ${whereSql}`, params),
      this.database.query<PermissionListRow[]>(
        `SELECT id, parent_id, name, code, type, route_path, api_method, api_path, status
         FROM permissions
         ${whereSql}
         ORDER BY sort_order, id
         LIMIT ? OFFSET ?`,
        [...params, pagination.pageSize, pagination.offset],
      ),
    ]);

    return toPageResult(rows.map(mapPermission), Number(countRows[0]?.total ?? 0), pagination);
  }

  /** 查询完整权限树，供角色授权等需要完整层级的业务使用。 */
  async listPermissionTree(): Promise<SystemPermissionTreeNode[]> {
    const rows = await this.database.query<PermissionListRow[]>(`
      SELECT id, parent_id, name, code, type, route_path, api_method, api_path, status
      FROM permissions
      WHERE deleted_at IS NULL
      ORDER BY sort_order, id
    `);
    return buildPermissionTree(rows.map(mapPermission));
  }
}

/** 将数据库字段统一映射为前后端公共契约。 */
function mapPermission(row: PermissionListRow): SystemPermissionListItem {
  return {
    id: String(row.id),
    parentId: String(row.parent_id),
    name: row.name,
    code: row.code,
    type: row.type,
    routePath: row.route_path,
    apiMethod: row.api_method,
    apiPath: row.api_path,
    status: row.status,
  };
}
