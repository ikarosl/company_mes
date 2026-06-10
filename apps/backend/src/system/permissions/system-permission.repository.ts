import { Inject, Injectable } from '@nestjs/common';
import type { SystemPermissionListItem, SystemPermissionTreeNode } from '@company/api-contract';
import { DatabaseService } from '../../database/database.service.js';
import type { PermissionListRow } from '../system.types.js';
import { buildPermissionTree } from '../system.utils.js';

@Injectable()
export class SystemPermissionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listPermissions(): Promise<SystemPermissionListItem[]> {
    const rows = await this.database.query<PermissionListRow[]>(`
      SELECT id, parent_id, name, code, type, route_path, api_method, api_path, status
      FROM permissions
      WHERE deleted_at IS NULL
      ORDER BY sort_order, id
    `);

    return rows.map((row) => ({
      id: String(row.id),
      parentId: String(row.parent_id),
      name: row.name,
      code: row.code,
      type: row.type,
      routePath: row.route_path,
      apiMethod: row.api_method,
      apiPath: row.api_path,
      status: row.status,
    }));
  }

  async listPermissionTree(): Promise<SystemPermissionTreeNode[]> {
    const permissions = await this.listPermissions();
    return buildPermissionTree(permissions);
  }
}
