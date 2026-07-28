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
  ConfigureProcessRouteStepsPayload,
  CreateProcessRoutePayload,
  ProcessRouteStepPayload,
  UpdateProcessRoutePayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  CountRow,
  ProcessRouteListRow,
  ProcessRouteRow,
  ProcessRouteStepListRow,
} from '../product.types.js';
import {
  mapProcessRoute,
  mapProcessRouteStep,
  normalizeOptionalString,
  nullableId,
  readRequiredString,
  readTinyStatus,
} from '../product.utils.js';

export interface ProcessRouteFilters {
  keyword?: string;
  status?: string;
}

@Injectable()
export class ProcessRouteRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listRoutes(filters: ProcessRouteFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM process_routes r
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProcessRouteListRow[]>(
      `
      SELECT
        r.id,
        r.route_code,
        r.route_name,
        r.product_category_id,
        c.product_attribute,
        c.product_type,
        r.version,
        r.status,
        r.remark,
        COUNT(DISTINCT s.id) AS step_count,
        GROUP_CONCAT(DISTINCT ps.step_name ORDER BY s.step_order SEPARATOR ' -> ') AS process_summary,
        r.created_at,
        r.updated_at
      FROM process_routes r
      LEFT JOIN process_route_steps s ON s.route_id = r.id AND s.is_deleted = 0
      LEFT JOIN process_steps ps ON ps.id = s.process_step_id AND ps.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = r.product_category_id AND c.is_deleted = 0
      WHERE ${where}
      GROUP BY r.id, r.route_code, r.route_name, r.product_category_id, c.product_attribute, c.product_type, r.version, r.status, r.remark, r.created_at, r.updated_at
      ORDER BY r.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProcessRoute), Number(totalRow?.total ?? 0), pagination);
  }

  async getRoute(id: number) {
    return {
      ...(await this.getRouteListItem(id)),
      steps: await this.listRouteSteps(id),
    };
  }

  async createRoute(payload: CreateProcessRoutePayload) {
    const routeCode = readRequiredString(payload.routeCode, 'Missing route code');
    const routeName = readRequiredString(payload.routeName, 'Missing route name');
    const productCategoryId = nullableId(payload.productCategoryId);
    const status = readTinyStatus(payload.status ?? 1);

    await this.assertRouteCodeAvailable(routeCode);
    await this.assertCategoryAvailable(productCategoryId);

    const result = (await this.database.execute(
      `
      INSERT INTO process_routes (
        route_code, route_name, product_category_id, version, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        routeCode,
        routeName,
        productCategoryId,
        normalizeOptionalString(payload.version),
        status,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    return this.getRoute(result.insertId);
  }

  async updateRoute(id: number, payload: UpdateProcessRoutePayload) {
    const current = await this.getRouteRow(id);
    await this.assertRouteNotInProduction(id);
    const routeCode =
      payload.routeCode === undefined
        ? current.route_code
        : readRequiredString(payload.routeCode, 'Missing route code');
    const routeName =
      payload.routeName === undefined
        ? current.route_name
        : readRequiredString(payload.routeName, 'Missing route name');
    const productCategoryId =
      payload.productCategoryId === undefined
        ? current.product_category_id
        : nullableId(payload.productCategoryId);
    const status = payload.status === undefined ? current.status : readTinyStatus(payload.status);

    await this.assertRouteCodeAvailable(routeCode, id);
    await this.assertCategoryAvailable(productCategoryId);

    await this.database.execute(
      `
      UPDATE process_routes
      SET route_code = ?,
        route_name = ?,
        product_category_id = ?,
        version = ?,
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        routeCode,
        routeName,
        productCategoryId,
        payload.version === undefined ? current.version : normalizeOptionalString(payload.version),
        status,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getRoute(id);
  }

  async deleteRoute(id: number) {
    await this.getRouteRow(id);
    await this.assertRouteNotInProduction(id);

    await this.database.transaction(async (connection) => {
      await execute(
        connection,
        'UPDATE process_route_steps SET is_deleted = 1, deleted_at = NOW() WHERE route_id = ? AND is_deleted = 0',
        [id],
      );
      await execute(
        connection,
        'UPDATE process_routes SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND is_deleted = 0',
        [id],
      );
    });

    return { success: true };
  }

  async changeRouteStatus(id: number, status: number) {
    await this.getRouteRow(id);
    await this.assertRouteNotInProduction(id);

    await this.database.execute(
      `
      UPDATE process_routes
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [readTinyStatus(status), id],
    );

    return this.getRoute(id);
  }

  async configureRouteSteps(id: number, payload: ConfigureProcessRouteStepsPayload) {
    await this.getRouteRow(id);
    await this.assertRouteNotInProduction(id);
    const steps = this.normalizeSteps(payload.steps);

    await this.database.transaction(async (connection) => {
      /**
       * 未投产路线采用原位差异更新：
       * 1. 锁定路线，避免保存期间被生产批次引用
       * 2. 暂时释放步骤顺序，支持上下移动时交换顺序
       * 3. 更新已有步骤、插入新增步骤、物理删除被移除且从未投产的步骤
       */
      const [lockedRoute] = await query<(RowDataPacket & { id: number })[]>(
        connection,
        'SELECT id FROM process_routes WHERE id = ? AND is_deleted = 0 FOR UPDATE',
        [id],
      );
      if (!lockedRoute) {
        throw new NotFoundException('工艺路线不存在');
      }
      await this.assertRouteNotInProduction(id, connection);

      const currentSteps = await query<(RowDataPacket & { id: number })[]>(
        connection,
        'SELECT id FROM process_route_steps WHERE route_id = ? AND is_deleted = 0 FOR UPDATE',
        [id],
      );
      const currentStepIds = new Set(currentSteps.map((step) => step.id));
      const submittedStepIds = new Set<number>();

      for (const step of steps) {
        if (step.id !== null && !currentStepIds.has(step.id)) {
          throw new BadRequestException('路线步骤已变化，请刷新后重试');
        }
        if (step.id !== null) {
          submittedStepIds.add(step.id);
        }
      }

      // 临时使用负数顺序释放唯一键，避免第 1、2 道工序互换时产生瞬时冲突。
      await execute(
        connection,
        'UPDATE process_route_steps SET step_order = -id WHERE route_id = ? AND is_deleted = 0',
        [id],
      );

      for (const step of steps) {
        const process = await this.getProcessSnapshot(step.processId);
        await this.assertUserAvailable(step.defaultOwnerId);
        const params: QueryParam[] = [
          step.processId,
          step.stepOrder,
          step.defaultOwnerId,
          step.needInspection ? 1 : 0,
          step.needRecord ? 1 : 0,
          process.sop_file_id,
          step.status,
          normalizeOptionalString(step.remark),
        ];
        if (step.id !== null) {
          await execute(
            connection,
            `UPDATE process_route_steps
             SET process_step_id = ?, step_order = ?, default_owner_id = ?, need_inspection = ?,
               need_record = ?, sop_file_id = ?, status = ?, remark = ?, updated_at = NOW()
             WHERE id = ? AND route_id = ? AND is_deleted = 0`,
            [...params, step.id, id],
          );
        } else {
          await execute(
            connection,
            `INSERT INTO process_route_steps (
               route_id, process_step_id, step_order, default_owner_id, need_inspection, need_record,
               sop_file_id, status, remark, created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, ...params],
          );
        }
      }

      const removedIds = currentSteps
        .map((step) => step.id)
        .filter((stepId) => !submittedStepIds.has(stepId));
      if (removedIds.length) {
        // 路线未投产时步骤不会被报工记录引用，因此删除移除项不会破坏追溯链路。
        await execute(
          connection,
          `DELETE FROM process_route_steps
           WHERE route_id = ? AND id IN (${removedIds.map(() => '?').join(', ')})`,
          [id, ...removedIds],
        );
      }
    });

    return this.getRoute(id);
  }

  private buildListFilters(filters: ProcessRouteFilters) {
    const clauses = ['r.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push(`(
        r.route_code LIKE ?
        OR r.route_name LIKE ?
        OR r.version LIKE ?
        OR r.remark LIKE ?
        OR EXISTS (
          SELECT 1 FROM product_categories keyword_category
          WHERE keyword_category.id = r.product_category_id
            AND keyword_category.is_deleted = 0
            AND (keyword_category.product_attribute LIKE ? OR keyword_category.product_type LIKE ?)
        )
        OR EXISTS (
          SELECT 1
          FROM process_route_steps keyword_step
          INNER JOIN process_steps keyword_process
            ON keyword_process.id = keyword_step.process_step_id
            AND keyword_process.is_deleted = 0
          WHERE keyword_step.route_id = r.id
            AND keyword_step.is_deleted = 0
            AND (keyword_process.step_code LIKE ? OR keyword_process.step_name LIKE ?)
        )
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.status === 'enabled') {
      clauses.push('r.status = 1');
    }

    if (filters.status === 'disabled') {
      clauses.push('r.status = 0');
    }

    return {
      where: clauses.join(' AND '),
      params,
    };
  }

  private normalizeSteps(steps: ProcessRouteStepPayload[]) {
    if (!Array.isArray(steps)) {
      throw new BadRequestException('Invalid route steps');
    }

    const orders = new Set<number>();
    const processIds = new Set<number>();
    const stepIds = new Set<number>();

    return steps.map((step) => {
      const stepId = nullableId(step.id);
      const stepOrder = Number(step.stepOrder);
      const processId = nullableId(step.processId);

      if (!Number.isInteger(stepOrder) || stepOrder <= 0) {
        throw new BadRequestException('Invalid step order');
      }

      if (processId === null) {
        throw new BadRequestException('Missing process');
      }

      if (stepId !== null && (!Number.isInteger(stepId) || stepId <= 0)) {
        throw new BadRequestException('Invalid route step');
      }

      if (stepId !== null && stepIds.has(stepId)) {
        throw new BadRequestException('Duplicate route step');
      }

      if (orders.has(stepOrder)) {
        throw new BadRequestException('Duplicate step order');
      }

      if (processIds.has(processId)) {
        throw new BadRequestException('Duplicate process');
      }

      orders.add(stepOrder);
      processIds.add(processId);
      if (stepId !== null) {
        stepIds.add(stepId);
      }

      return {
        id: stepId,
        stepOrder,
        processId,
        defaultOwnerId: nullableId(step.defaultOwnerId),
        needInspection: Boolean(step.needInspection),
        needRecord: step.needRecord === undefined ? true : Boolean(step.needRecord),
        status: readTinyStatus(step.status ?? 1),
        remark: step.remark,
      };
    });
  }

  private async listRouteSteps(routeId: number) {
    const rows = await this.database.query<ProcessRouteStepListRow[]>(
      `
      SELECT
        s.id,
        s.route_id,
        s.process_step_id,
        s.step_order,
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        NULL AS description,
        s.default_owner_id,
        u.display_name AS default_owner_name,
        s.need_inspection,
        s.need_record,
        COALESCE(s.sop_file_id, ps.sop_file_id) AS sop_file_id,
        f.file_name AS sop_file_name,
        f.file_url AS sop_file_url,
        s.status,
        s.remark,
        s.created_at,
        s.updated_at
      FROM process_route_steps s
      LEFT JOIN process_steps ps ON ps.id = s.process_step_id AND ps.is_deleted = 0
      LEFT JOIN users u ON u.id = s.default_owner_id AND u.deleted_at IS NULL
      LEFT JOIN technical_files f ON f.id = COALESCE(s.sop_file_id, ps.sop_file_id) AND f.is_deleted = 0
      WHERE s.route_id = ? AND s.is_deleted = 0
      ORDER BY s.step_order ASC, s.id ASC
    `,
      [routeId],
    );

    return rows.map(mapProcessRouteStep);
  }

  private async getRouteRow(id: number) {
    const [row] = await this.database.query<ProcessRouteRow[]>(
      `
      SELECT id, route_code, route_name, product_category_id, version, status, remark
      FROM process_routes
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Process route not found');
    }

    return row;
  }

  private async getRouteListItem(id: number) {
    const [row] = await this.database.query<ProcessRouteListRow[]>(
      `
      SELECT
        r.id,
        r.route_code,
        r.route_name,
        r.product_category_id,
        c.product_attribute,
        c.product_type,
        r.version,
        r.status,
        r.remark,
        COUNT(DISTINCT s.id) AS step_count,
        GROUP_CONCAT(DISTINCT ps.step_name ORDER BY s.step_order SEPARATOR ' -> ') AS process_summary,
        r.created_at,
        r.updated_at
      FROM process_routes r
      LEFT JOIN process_route_steps s ON s.route_id = r.id AND s.is_deleted = 0
      LEFT JOIN process_steps ps ON ps.id = s.process_step_id AND ps.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = r.product_category_id AND c.is_deleted = 0
      WHERE r.id = ? AND r.is_deleted = 0
      GROUP BY r.id, r.route_code, r.route_name, r.product_category_id, c.product_attribute, c.product_type, r.version, r.status, r.remark, r.created_at, r.updated_at
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Process route not found');
    }

    return mapProcessRoute(row);
  }

  private async getProcessSnapshot(processId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        process_code: string;
        process_name: string;
        description: string | null;
        sop_file_id: number | null;
        sop_file_name: string | null;
        sop_file_url: string | null;
      })[]
    >(
      `
      SELECT
        ps.id,
        ps.step_code AS process_code,
        ps.step_name AS process_name,
        NULL AS description,
        ps.sop_file_id,
        f.file_name AS sop_file_name,
        f.file_url AS sop_file_url
      FROM process_steps ps
      LEFT JOIN technical_files f ON f.id = ps.sop_file_id AND f.is_deleted = 0
      WHERE ps.id = ? AND ps.is_deleted = 0 AND ps.status = 1
      LIMIT 1
    `,
      [processId],
    );

    if (!row) {
      throw new BadRequestException('Process not found or disabled');
    }

    return row;
  }

  /**
   * 路线一旦被任一生产批次采用即视为已投产并永久冻结。
   * 取消的批次同样属于历史事实，不能通过取消批次重新开放路线修改。
   */
  private async assertRouteNotInProduction(
    routeId: number,
    executor: DbExecutor = this.database,
  ) {
    const [row] = await query<(RowDataPacket & { id: number })[]>(
      executor,
      `SELECT id
       FROM production_batches
       WHERE route_id = ? AND is_deleted = 0
       LIMIT 1`,
      [routeId],
    );
    if (row) {
      throw new ConflictException('该工艺路线已投入生产，不能修改；请新建一个路线版本');
    }
  }

  private async assertRouteCodeAvailable(routeCode: string, ignoredRouteId?: number) {
    const params: QueryParam[] = [routeCode];
    const ignoredClause = ignoredRouteId ? ' AND id <> ?' : '';

    if (ignoredRouteId) {
      params.push(ignoredRouteId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM process_routes
      WHERE route_code = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Route code already exists');
    }
  }

  private async assertCategoryAvailable(categoryId: number | null) {
    if (categoryId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM product_categories
      WHERE id = ? AND status = 1 AND is_deleted = 0
      LIMIT 1
    `,
      [categoryId],
    );

    if (!row) {
      throw new BadRequestException('Product category not found or disabled');
    }
  }

  private async assertUserAvailable(userId: number | null) {
    if (userId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM users
      WHERE id = ? AND status = 1 AND deleted_at IS NULL
      LIMIT 1
    `,
      [userId],
    );

    if (!row) {
      throw new BadRequestException('Default owner not found or disabled');
    }
  }
}
