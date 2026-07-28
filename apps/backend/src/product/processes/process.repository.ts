import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import type {
  CreateProcessPayload,
  ProcessOption,
  UpdateProcessPayload,
  UploadProcessSopPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type { CountRow, ProcessListRow, ProcessOptionRow, ProcessRow } from '../product.types.js';
import {
  mapProcess,
  mapProcessOption,
  normalizeProcessImportantParameters,
  parseProcessImportantParameters,
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
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProcessListRow[]>(
      `
      SELECT
        ps.id,
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        NULL AS description,
        ps.sop_file_id,
        f.file_name AS sop_file_name,
        f.file_url AS sop_file_url,
        ps.important_parameters,
        ps.status,
        ps.remark,
        ps.created_at,
        ps.updated_at
      FROM process_steps ps
      LEFT JOIN technical_files f ON f.id = ps.sop_file_id AND f.is_deleted = 0
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
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        NULL AS description,
        ps.sop_file_id,
        f.file_name AS sop_file_name,
        f.file_url AS sop_file_url
        , ps.important_parameters
      FROM process_steps ps
      LEFT JOIN technical_files f ON f.id = ps.sop_file_id AND f.is_deleted = 0
      WHERE ps.is_deleted = 0 AND ps.status = 1
      ORDER BY ps.step_code ASC, ps.id ASC
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
    // 工序这里只保存参数定义；实际参数值由批次工序报工接口写入。
    const importantParameters = normalizeProcessImportantParameters(payload.importantParameters ?? []);

    await this.assertProcessCodeAvailable(processCode);
    await this.assertTechnicalFileAvailable(sopFileId);

    const result = (await this.database.execute(
      `
      INSERT INTO process_steps (
        step_code, step_name, sop_file_id, important_parameters, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, CAST(? AS JSON), ?, ?, NOW(), NOW())
    `,
      [
        processCode,
        processName,
        sopFileId,
        JSON.stringify(importantParameters),
        status,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    return this.getProcessListItem(result.insertId);
  }

  async updateProcess(id: number, payload: UpdateProcessPayload) {
    const current = await this.getProcessRow(id);
    await this.assertProcessNotInProduction(id);
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
    const importantParameters =
      payload.importantParameters === undefined
        ? parseProcessImportantParameters(current.important_parameters)
        : normalizeProcessImportantParameters(payload.importantParameters);

    await this.assertProcessCodeAvailable(processCode, id);
    await this.assertTechnicalFileAvailable(sopFileId);

    await this.database.execute(
      `
      UPDATE process_steps
      SET step_code = ?,
        step_name = ?,
        sop_file_id = ?,
        important_parameters = CAST(? AS JSON),
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        processCode,
        processName,
        sopFileId,
        JSON.stringify(importantParameters),
        status,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getProcessListItem(id);
  }

  async changeProcessStatus(id: number, status: number) {
    await this.getProcessRow(id);
    await this.assertProcessNotInProduction(id);

    await this.database.execute(
      `
      UPDATE process_steps
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [readTinyStatus(status), id],
    );

    return this.getProcessListItem(id);
  }

  async uploadProcessSop(id: number, payload: UploadProcessSopPayload) {
    await this.getProcessRow(id);
    await this.assertProcessNotInProduction(id);
    const sopFileName = readRequiredString(payload.sopFileName, 'Missing SOP file name');
    const sopFileUrl = normalizeOptionalString(payload.sopFileUrl);

    const obsoleteFileUrl = await this.database.transaction(async (connection) => {
      // 锁定工序并再次校验投产状态，避免校验后到保存前被生产任务并发引用。
      const [lockedProcess] = await query<(RowDataPacket & { sop_file_id: number | null })[]>(
        connection,
        'SELECT sop_file_id FROM process_steps WHERE id = ? AND is_deleted = 0 FOR UPDATE',
        [id],
      );
      if (!lockedProcess) {
        throw new NotFoundException('工序不存在');
      }
      await this.assertProcessNotInProduction(id, connection);

      const fileResult = await execute(
        connection,
        `INSERT INTO technical_files (
           file_code, file_name, file_url, file_type, version, status, remark, created_at, updated_at
         ) VALUES (?, ?, ?, 'process_sop', 'V1.0', 1, '生产工序上传文件', NOW(), NOW())`,
        [`SOP-${randomUUID()}`, sopFileName, sopFileUrl],
      );

      await execute(
        connection,
        'UPDATE process_steps SET sop_file_id = ?, updated_at = NOW() WHERE id = ? AND is_deleted = 0',
        [fileResult.insertId, id],
      );

      // 未投产路线中继承了原默认 SOP 的步骤同步切换到新文件，保证路线详情不再指向旧文件。
      if (lockedProcess.sop_file_id !== null) {
        await execute(
          connection,
          `UPDATE process_route_steps
           SET sop_file_id = ?, updated_at = NOW()
           WHERE process_step_id = ? AND sop_file_id = ? AND is_deleted = 0`,
          [fileResult.insertId, id, lockedProcess.sop_file_id],
        );
      }

      return this.retireUnreferencedTechnicalFile(connection, lockedProcess.sop_file_id);
    });

    return { process: await this.getProcessListItem(id), obsoleteFileUrl };
  }

  /** 上传控制器写入磁盘前调用，避免业务已冻结时先落盘再返回失败。 */
  async assertProcessSopUploadAllowed(id: number) {
    await this.getProcessRow(id);
    await this.assertProcessNotInProduction(id);
  }

  private buildListFilters(filters: ProcessFilters) {
    const clauses = ['ps.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push(`(
        ps.step_code LIKE ?
        OR ps.step_name LIKE ?
        OR ps.remark LIKE ?
        OR EXISTS (
          SELECT 1 FROM technical_files keyword_file
          WHERE keyword_file.id = ps.sop_file_id
            AND keyword_file.is_deleted = 0
            AND (keyword_file.file_code LIKE ? OR keyword_file.file_name LIKE ?)
        )
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.status === 'enabled') {
      clauses.push('ps.status = 1');
    }

    if (filters.status === 'disabled') {
      clauses.push('ps.status = 0');
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
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        NULL AS description,
        ps.sop_file_id,
        f.file_name AS sop_file_name,
        f.file_url AS sop_file_url,
        ps.important_parameters,
        ps.status,
        ps.remark
      FROM process_steps ps
      LEFT JOIN technical_files f ON f.id = ps.sop_file_id AND f.is_deleted = 0
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
        ps.id,
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        NULL AS description,
        ps.sop_file_id,
        f.file_name AS sop_file_name,
        f.file_url AS sop_file_url,
        ps.important_parameters,
        ps.status,
        ps.remark,
        ps.created_at,
        ps.updated_at
      FROM process_steps ps
      LEFT JOIN technical_files f ON f.id = ps.sop_file_id AND f.is_deleted = 0
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

  /** 被已投产路线采用的标准工序永久冻结，后续变化必须新建工序及路线版本。 */
  private async assertProcessNotInProduction(
    processId: number,
    executor: DbExecutor = this.database,
  ) {
    const [row] = await query<RowDataPacket[]>(
      executor,
      `SELECT bsr.id
       FROM batch_step_records bsr
       INNER JOIN process_route_steps prs
         ON prs.id = bsr.process_route_steps_id
        AND prs.process_step_id = ?
       WHERE bsr.is_deleted = 0
       LIMIT 1`,
      [processId],
    );
    if (row) {
      throw new ConflictException('该工序已随工艺路线投入生产，不能修改；请新建工序及路线版本');
    }
  }

  /** 旧技术文件无任何业务引用时软删除，并返回可安全删除的本地文件地址。 */
  private async retireUnreferencedTechnicalFile(
    executor: DbExecutor,
    fileId: number | null,
  ): Promise<string | null> {
    if (fileId === null) {
      return null;
    }
    const [reference] = await query<(RowDataPacket & { file_url: string | null })[]>(
      executor,
      `SELECT tf.file_url
       FROM technical_files tf
       WHERE tf.id = ?
         AND NOT EXISTS (SELECT 1 FROM process_steps ps WHERE ps.sop_file_id = tf.id)
         AND NOT EXISTS (SELECT 1 FROM process_route_steps prs WHERE prs.sop_file_id = tf.id)
         AND NOT EXISTS (SELECT 1 FROM products p WHERE p.spec_file_id = tf.id)
       LIMIT 1`,
      [fileId],
    );
    if (!reference) {
      return null;
    }
    await execute(
      executor,
      `UPDATE technical_files
       SET is_deleted = 1, status = 0, deleted_at = NOW(), updated_at = NOW()
       WHERE id = ? AND is_deleted = 0`,
      [fileId],
    );
    return reference.file_url;
  }
}
