import { Inject, Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type { OperationLogListItem } from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../shared/request-utils.js';

export interface OperationLogPayload {
  logType: string;
  module: string;
  action: string;
  userId?: string | null;
  targetId?: string | number | null;
  targetType?: string | null;
  result?: string;
  beforeData?: unknown;
  afterData?: unknown;
  ip?: string | null;
  remark?: string | null;
}

interface OperationLogRow extends RowDataPacket {
  id: number;
  log_type: string;
  module: string;
  action: string;
  user_id: number | null;
  username: string | null;
  target_id: number | null;
  target_type: string | null;
  result: string;
  before_data: string | null;
  after_data: string | null;
  ip: string | null;
  remark: string | null;
  created_at: Date | string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

@Injectable()
export class OperationLogService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async write(payload: OperationLogPayload) {
    try {
      await this.database.execute(
        `
        INSERT INTO operation_logs (
          log_type, module, action, user_id, target_id, target_type,
          result, before_data, after_data, ip, remark, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
        [
          payload.logType,
          payload.module,
          payload.action,
          nullableNumber(payload.userId),
          nullableNumber(payload.targetId),
          payload.targetType ?? null,
          payload.result ?? 'success',
          toJson(payload.beforeData),
          toJson(payload.afterData),
          payload.ip ?? null,
          payload.remark ?? null,
        ],
      );
    } catch {
      // Audit logging must never break the business request path.
    }
  }

  async list(
    filters: {
      keyword?: string;
      logType?: string;
      module?: string;
      result?: string;
      userId?: string;
    },
    pagination: PaginationOptions,
  ) {
    const clauses = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push(`(
        ol.module LIKE ?
        OR ol.action LIKE ?
        OR u.username LIKE ?
        OR u.display_name LIKE ?
        OR ol.target_type LIKE ?
        OR CAST(ol.target_id AS CHAR) LIKE ?
        OR ol.ip LIKE ?
        OR ol.remark LIKE ?
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.logType) {
      clauses.push('ol.log_type = ?');
      params.push(filters.logType);
    }

    if (filters.module) {
      clauses.push('ol.module = ?');
      params.push(filters.module);
    }

    if (filters.result) {
      clauses.push('ol.result = ?');
      params.push(filters.result);
    }

    if (filters.userId) {
      clauses.push('ol.user_id = ?');
      params.push(Number(filters.userId));
    }

    const where = clauses.join(' AND ');
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM operation_logs ol
      LEFT JOIN users u ON u.id = ol.user_id
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<OperationLogRow[]>(
      `
      SELECT
        ol.*,
        u.username
      FROM operation_logs ol
      LEFT JOIN users u ON u.id = ol.user_id
      WHERE ${where}
      ORDER BY ol.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapOperationLog), Number(totalRow?.total ?? 0), pagination);
  }
}

const nullableNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const toJson = (value: unknown) => {
  if (value === undefined) {
    return null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ unserializable: true });
  }
};

const fromJson = (value: string | null) => {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

const mapOperationLog = (row: OperationLogRow): OperationLogListItem => ({
  id: String(row.id),
  logType: row.log_type,
  module: row.module,
  action: row.action,
  userId: row.user_id === null ? null : String(row.user_id),
  username: row.username,
  targetId: row.target_id === null ? null : String(row.target_id),
  targetType: row.target_type,
  result: row.result,
  beforeData: fromJson(row.before_data),
  afterData: fromJson(row.after_data),
  ip: row.ip,
  remark: row.remark,
  createdAt:
    typeof row.created_at === 'string'
      ? new Date(row.created_at).toISOString()
      : row.created_at.toISOString(),
});
