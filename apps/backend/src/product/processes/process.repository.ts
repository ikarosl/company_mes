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
  CreateProcessPayload,
  ProcessOption,
  UpdateProcessPayload,
  UploadProcessSopPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type { CountRow, ProcessListRow, ProcessOptionRow, ProcessRow } from '../product.types.js';
import {
  mapProcess,
  mapProcessOption,
  normalizeOptionalString,
  nullableId,
  readRequiredString,
  readTinyStatus,
} from '../product.utils.js';

export interface ProcessFilters {
  keyword?: string;
  status?: string;
}

@Injectable()
export class ProcessRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listProcesses(filters: ProcessFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM process_steps ps
      LEFT JOIN processes p ON p.id = ps.id AND p.is_deleted = 0
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProcessListRow[]>(
      `
      SELECT
        ps.id,
        COALESCE(ps.step_code, p.process_code) AS process_code,
        COALESCE(ps.step_name, p.process_name) AS process_name,
        p.description,
        COALESCE(ps.sop_file_id, p.sop_file_id) AS sop_file_id,
        COALESCE(f.file_name, p.sop_file_name) AS sop_file_name,
        COALESCE(f.file_url, p.sop_file_url) AS sop_file_url,
        COALESCE(p.status, 1) AS status,
        ps.remark,
        ps.created_at,
        ps.updated_at
      FROM process_steps ps
      LEFT JOIN processes p ON p.id = ps.id AND p.is_deleted = 0
      LEFT JOIN technical_files f ON f.id = COALESCE(ps.sop_file_id, p.sop_file_id) AND f.is_deleted = 0
      WHERE ${where}
      ORDER BY ps.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProcess), Number(totalRow?.total ?? 0), pagination);
  }

  async listProcessOptions(): Promise<ProcessOption[]> {
    const rows = await this.database.query<ProcessOptionRow[]>(`
      SELECT
        ps.id,
        COALESCE(ps.step_code, p.process_code) AS process_code,
        COALESCE(ps.step_name, p.process_name) AS process_name,
        p.description,
        COALESCE(ps.sop_file_id, p.sop_file_id) AS sop_file_id,
        COALESCE(f.file_name, p.sop_file_name) AS sop_file_name,
        COALESCE(f.file_url, p.sop_file_url) AS sop_file_url
      FROM process_steps ps
      LEFT JOIN processes p ON p.id = ps.id AND p.is_deleted = 0
      LEFT JOIN technical_files f ON f.id = COALESCE(ps.sop_file_id, p.sop_file_id) AND f.is_deleted = 0
      WHERE ps.is_deleted = 0 AND COALESCE(p.status, 1) = 1
      ORDER BY p.process_code ASC, p.id ASC
      LIMIT 500
    `);

    return rows.map(mapProcessOption);
  }

  async getProcess(id: number) {
    return this.getProcessListItem(id);
  }

  async createProcess(payload: CreateProcessPayload) {
    const processCode = readRequiredString(payload.processCode, 'Missing process code');
    const processName = readRequiredString(payload.processName, 'Missing process name');
    const sopFileId = nullableId(payload.sopFileId);
    const status = readTinyStatus(payload.status ?? 1);

    await this.assertProcessCodeAvailable(processCode);
    await this.assertTechnicalFileAvailable(sopFileId);

    const result = (await this.database.execute(
      `
      INSERT INTO process_steps (
        step_code, step_name, sop_file_id, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `,
      [
        processCode,
        processName,
        sopFileId,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    await this.database.execute(
      `
      INSERT INTO processes (
        id, process_code, process_name, description, sop_file_id, sop_file_name,
        sop_file_url, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        process_code = VALUES(process_code),
        process_name = VALUES(process_name),
        description = VALUES(description),
        sop_file_id = VALUES(sop_file_id),
        sop_file_name = VALUES(sop_file_name),
        sop_file_url = VALUES(sop_file_url),
        status = VALUES(status),
        remark = VALUES(remark),
        updated_at = NOW()
    `,
      [
        result.insertId,
        processCode,
        processName,
        normalizeOptionalString(payload.description),
        sopFileId,
        normalizeOptionalString(payload.sopFileName),
        normalizeOptionalString(payload.sopFileUrl),
        status,
        normalizeOptionalString(payload.remark),
      ],
    );

    return this.getProcessListItem(result.insertId);
  }

  async updateProcess(id: number, payload: UpdateProcessPayload) {
    const current = await this.getProcessRow(id);
    const processCode =
      payload.processCode === undefined
        ? current.process_code
        : readRequiredString(payload.processCode, 'Missing process code');
    const processName =
      payload.processName === undefined
        ? current.process_name
        : readRequiredString(payload.processName, 'Missing process name');
    const sopFileId =
      payload.sopFileId === undefined ? current.sop_file_id : nullableId(payload.sopFileId);
    const status = payload.status === undefined ? current.status : readTinyStatus(payload.status);

    await this.assertProcessCodeAvailable(processCode, id);
    await this.assertTechnicalFileAvailable(sopFileId);

    await this.database.execute(
      `
      UPDATE process_steps
      SET step_code = ?,
        step_name = ?,
        sop_file_id = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        processCode,
        processName,
        sopFileId,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    await this.database.execute(
      `
      UPDATE processes
      SET process_code = ?,
        process_name = ?,
        description = ?,
        sop_file_id = ?,
        sop_file_name = ?,
        sop_file_url = ?,
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        processCode,
        processName,
        payload.description === undefined
          ? current.description
          : normalizeOptionalString(payload.description),
        sopFileId,
        payload.sopFileName === undefined
          ? current.sop_file_name
          : normalizeOptionalString(payload.sopFileName),
        payload.sopFileUrl === undefined
          ? current.sop_file_url
          : normalizeOptionalString(payload.sopFileUrl),
        status,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getProcessListItem(id);
  }

  async changeProcessStatus(id: number, status: number) {
    await this.getProcessRow(id);

    await this.database.execute(
      `
      UPDATE processes
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [readTinyStatus(status), id],
    );

    return this.getProcessListItem(id);
  }

  async uploadProcessSop(id: number, payload: UploadProcessSopPayload) {
    await this.getProcessRow(id);
    const sopFileName = readRequiredString(payload.sopFileName, 'Missing SOP file name');
    const sopFileUrl = normalizeOptionalString(payload.sopFileUrl);

    const fileResult = (await this.database.execute(
      `
      INSERT INTO technical_files (
        file_name, file_url, file_type, status, remark, created_at, updated_at
      )
      VALUES (?, ?, 'process_sop', 1, '生产工序上传文件', NOW(), NOW())
    `,
      [sopFileName, sopFileUrl],
    )) as ResultSetHeader;

    // 当前阶段文件先保存在本地 uploads 目录，数据库只记录可访问地址，后续可替换为对象存储。
    await this.database.execute(
      `
      UPDATE processes
      SET sop_file_id = ?,
        sop_file_name = ?,
        sop_file_url = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [fileResult.insertId, sopFileName, sopFileUrl, id],
    );

    await this.database.execute(
      `
      UPDATE process_steps
      SET sop_file_id = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [fileResult.insertId, id],
    );

    return this.getProcessListItem(id);
  }

  private buildListFilters(filters: ProcessFilters) {
    const clauses = ['ps.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(ps.step_code LIKE ? OR ps.step_name LIKE ? OR p.process_code LIKE ? OR p.process_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    if (filters.status === 'enabled') {
      clauses.push('COALESCE(p.status, 1) = 1');
    }

    if (filters.status === 'disabled') {
      clauses.push('COALESCE(p.status, 1) = 0');
    }

    return {
      where: clauses.join(' AND '),
      params,
    };
  }

  private async getProcessRow(id: number) {
    const [row] = await this.database.query<ProcessRow[]>(
      `
      SELECT
        ps.id,
        COALESCE(ps.step_code, p.process_code) AS process_code,
        COALESCE(ps.step_name, p.process_name) AS process_name,
        p.description,
        COALESCE(ps.sop_file_id, p.sop_file_id) AS sop_file_id,
        p.sop_file_name,
        p.sop_file_url,
        COALESCE(p.status, 1) AS status,
        ps.remark
      FROM process_steps ps
      LEFT JOIN processes p ON p.id = ps.id AND p.is_deleted = 0
      WHERE ps.id = ? AND ps.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Process not found');
    }

    return row;
  }

  private async getProcessListItem(id: number) {
    const [row] = await this.database.query<ProcessListRow[]>(
      `
      SELECT
        p.id,
        COALESCE(ps.step_code, p.process_code) AS process_code,
        COALESCE(ps.step_name, p.process_name) AS process_name,
        p.description,
        COALESCE(ps.sop_file_id, p.sop_file_id) AS sop_file_id,
        COALESCE(f.file_name, p.sop_file_name) AS sop_file_name,
        COALESCE(f.file_url, p.sop_file_url) AS sop_file_url,
        COALESCE(p.status, 1) AS status,
        ps.remark,
        ps.created_at,
        ps.updated_at
      FROM process_steps ps
      LEFT JOIN processes p ON p.id = ps.id AND p.is_deleted = 0
      LEFT JOIN technical_files f ON f.id = COALESCE(ps.sop_file_id, p.sop_file_id) AND f.is_deleted = 0
      WHERE ps.id = ? AND ps.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Process not found');
    }

    return mapProcess(row);
  }

  private async assertTechnicalFileAvailable(fileId: number | null) {
    if (fileId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM technical_files
      WHERE id = ? AND status = 1 AND is_deleted = 0
      LIMIT 1
    `,
      [fileId],
    );

    if (!row) {
      throw new BadRequestException('Technical file not found or disabled');
    }
  }

  private async assertProcessCodeAvailable(processCode: string, ignoredProcessId?: number) {
    const params: QueryParam[] = [processCode];
    const ignoredClause = ignoredProcessId ? ' AND id <> ?' : '';

    if (ignoredProcessId) {
      params.push(ignoredProcessId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM process_steps
      WHERE step_code = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Process code already exists');
    }
  }
}
