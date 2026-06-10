import { Inject, Injectable } from '@nestjs/common';
import type { SystemDepartmentOption, SystemRoleOption } from '@company/api-contract';
import { DatabaseService } from '../../database/database.service.js';
import type { DepartmentOptionRow, RoleOptionRow } from '../system.types.js';

@Injectable()
export class SystemOptionRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listDepartmentOptions(): Promise<SystemDepartmentOption[]> {
    const rows = await this.database.query<DepartmentOptionRow[]>(`
      SELECT id, parent_id, name, code
      FROM departments
      WHERE deleted_at IS NULL AND status = 1
      ORDER BY sort_order, id
    `);

    return rows.map((row) => ({
      id: String(row.id),
      parentId: String(row.parent_id),
      name: row.name,
      code: row.code,
    }));
  }

  async listRoleOptions(): Promise<SystemRoleOption[]> {
    const rows = await this.database.query<RoleOptionRow[]>(`
      SELECT id, name, code
      FROM roles
      WHERE deleted_at IS NULL AND status = 1
      ORDER BY id
    `);

    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      code: row.code,
    }));
  }
}
