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
      FROM processes p
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProcessListRow[]>(
      `
      SELECT
        p.id,
        p.process_code,
        p.process_name,
        p.description,
        p.sop_file_id,
        COALESCE(f.file_name, p.sop_file_name) AS sop_file_name,
        COALESCE(f.file_url, p.sop_file_url) AS sop_file_url,
        p.status,
        p.remark,
        p.created_at,
        p.updated_at
      FROM processes p
      LEFT JOIN technical_files f ON f.id = p.sop_file_id AND f.is_deleted = 0
      WHERE ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProcess), Number(totalRow?.total ?? 0), pagination);
  }

  async listProcessOptions(): Promise<ProcessOption[]> {
    const rows = await this.database.query<ProcessOptionRow[]>(`
      SELECT
        p.id,
        p.process_code,
        p.process_name,
        p.description,
        p.sop_file_id,
        COALESCE(f.file_name, p.sop_file_name) AS sop_file_name,
        COALESCE(f.file_url, p.sop_file_url) AS sop_file_url
      FROM processes p
      LEFT JOIN technical_files f ON f.id = p.sop_file_id AND f.is_deleted = 0
      WHERE p.is_deleted = 0 AND p.status = 1
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
      INSERT INTO processes (
        process_code, process_name, description, sop_file_id, sop_file_name,
        sop_file_url, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        processCode,
        processName,
        normalizeOptionalString(payload.description),
        sopFileId,
        normalizeOptionalString(payload.sopFileName),
        normalizeOptionalString(payload.sopFileUrl),
        status,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

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

    return this.getProcessListItem(id);
  }

  private buildListFilters(filters: ProcessFilters) {
    const clauses = ['p.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(p.process_code LIKE ? OR p.process_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword);
    }

    if (filters.status === 'enabled') {
      clauses.push('p.status = 1');
    }

    if (filters.status === 'disabled') {
      clauses.push('p.status = 0');
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
        id,
        process_code,
        process_name,
        description,
        sop_file_id,
        sop_file_name,
        sop_file_url,
        status,
        remark
      FROM processes
      WHERE id = ? AND is_deleted = 0
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
        p.process_code,
        p.process_name,
        p.description,
        p.sop_file_id,
        COALESCE(f.file_name, p.sop_file_name) AS sop_file_name,
        COALESCE(f.file_url, p.sop_file_url) AS sop_file_url,
        p.status,
        p.remark,
        p.created_at,
        p.updated_at
      FROM processes p
      LEFT JOIN technical_files f ON f.id = p.sop_file_id AND f.is_deleted = 0
      WHERE p.id = ? AND p.is_deleted = 0
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
      FROM processes
      WHERE process_code = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Process code already exists');
    }
  }
}
