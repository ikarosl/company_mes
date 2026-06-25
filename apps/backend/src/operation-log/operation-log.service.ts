import { Inject, Injectable, Logger } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import type { OperationLogListItem } from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../shared/request-utils.js';

export interface OperationLogPayload {
  logType: string;
  module: string;
  action: string;
  userId?: string | null;
  operatorUsername?: string | null;
  targetId?: string | number | null;
  targetType?: string | null;
  targetIds?: unknown;
  businessKey?: string | null;
  result?: string;
  requestId?: string | null;
  httpMethod?: string | null;
  route?: string | null;
  httpStatus?: number | null;
  durationMs?: number | null;
  requestData?: unknown;
  beforeData?: unknown;
  afterData?: unknown;
  ip?: string | null;
  userAgent?: string | null;
  errorCode?: string | null;
  remark?: string | null;
}

interface OperationLogRow extends RowDataPacket {
  id: number;
  log_type: string;
  module: string;
  action: string;
  user_id: number | null;
  operator_username: string | null;
  username: string | null;
  target_id: number | null;
  target_type: string | null;
  target_ids: string | null;
  business_key: string | null;
  result: string;
  request_id: string | null;
  http_method: string | null;
  route: string | null;
  http_status: number | null;
  duration_ms: number | null;
  request_data: string | null;
  before_data: string | null;
  after_data: string | null;
  ip: string | null;
  user_agent: string | null;
  error_code: string | null;
  remark: string | null;
  created_at: Date | string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

@Injectable()
export class OperationLogService {
  private readonly logger = new Logger(OperationLogService.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async write(payload: OperationLogPayload) {
    try {
      await this.database.execute(
        `
        INSERT INTO operation_logs (
          log_type, module, action, user_id, operator_username,
          target_id, target_type, target_ids, business_key,
          result, request_id, http_method, route, http_status, duration_ms,
          request_data, before_data, after_data, ip, user_agent, error_code,
          remark, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `,
        [
          payload.logType,
          payload.module,
          payload.action,
          nullableNumber(payload.userId),
          payload.operatorUsername ?? null,
          nullableNumber(payload.targetId),
          payload.targetType ?? null,
          toJson(payload.targetIds),
          payload.businessKey ?? null,
          payload.result ?? 'success',
          payload.requestId ?? null,
          payload.httpMethod ?? null,
          payload.route ?? null,
          payload.httpStatus ?? null,
          payload.durationMs ?? null,
          toJson(payload.requestData),
          toJson(payload.beforeData),
          toJson(payload.afterData),
          payload.ip ?? null,
          payload.userAgent ?? null,
          payload.errorCode ?? null,
          payload.remark ?? null,
        ],
      );
    } catch (error) {
      this.logger.error('Failed to persist operation log', error);
    }
  }

  async list(
    filters: {
      keyword?: string;
      logType?: string;
      module?: string;
      result?: string;
      userId?: string;
      action?: string;
      targetType?: string;
      targetId?: string;
      requestId?: string;
      keyword?: string;
      startedAt?: string;
      endedAt?: string;
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

    if (filters.action) {
      clauses.push('ol.action LIKE ?');
      params.push(`%${filters.action.trim()}%`);
    }

    if (filters.targetType) {
      clauses.push('ol.target_type = ?');
      params.push(filters.targetType);
    }

    if (filters.targetId) {
      clauses.push('ol.target_id = ?');
      params.push(Number(filters.targetId));
    }

    if (filters.requestId) {
      clauses.push('ol.request_id = ?');
      params.push(filters.requestId);
    }

    if (filters.keyword) {
      clauses.push(
        '(ol.action LIKE ? OR ol.business_key LIKE ? OR ol.operator_username LIKE ? OR u.username LIKE ?)',
      );
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    if (filters.startedAt) {
      clauses.push('ol.created_at >= ?');
      params.push(filters.startedAt);
    }

    if (filters.endedAt) {
      clauses.push('ol.created_at <= ?');
      params.push(filters.endedAt);
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
  username: row.operator_username ?? row.username,
  targetId: row.target_id === null ? null : String(row.target_id),
  targetType: row.target_type,
  targetIds: fromJson(row.target_ids),
  businessKey: row.business_key,
  result: row.result,
  requestId: row.request_id,
  httpMethod: row.http_method,
  route: row.route,
  httpStatus: row.http_status,
  durationMs: row.duration_ms,
  requestData: fromJson(row.request_data),
  beforeData: fromJson(row.before_data),
  afterData: fromJson(row.after_data),
  ip: row.ip,
  userAgent: row.user_agent,
  errorCode: row.error_code,
  remark: row.remark,
  createdAt:
    typeof row.created_at === 'string'
      ? new Date(row.created_at).toISOString()
      : row.created_at.toISOString(),
});
