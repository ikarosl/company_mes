import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  BatchStepStatus,
  CreateProductionTaskPayload,
  DispatchTaskPayload,
  UpdateBatchStepRecordPayload,
  UpdateProductionBatchPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  BatchStepRecordListRow,
  CountRow,
  ProductionTaskListRow,
  TaskMaterialRequirementRow,
  WorkerTaskListRow,
} from '../production.types.js';
import {
  decimalNumber,
  decimalString,
  formatDate,
  mapBatchStepRecord,
  mapProductionBatch,
  mapTaskMaterialRequirement,
  mapWorkerTask,
  normalizeDate,
  normalizeDateTime,
  normalizeOptionalString,
  nullableId,
  readDecimal,
  readNullableDecimal,
  readPositiveId,
} from '../production.utils.js';

export interface ProductionTaskFilters {
  keyword?: string;
  productId?: string;
  status?: string;
  ownerId?: string;
}

const STEP_STATUSES = new Set<BatchStepStatus>([
  'pending',
  'doing',
  'completed',
  'abnormal',
  'skipped',
]);

@Injectable()
export class ProductionTaskRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listTasks(filters: ProductionTaskFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProductionTaskListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        wo.order_no,
        b.batch_no,
        b.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.material_status,
        b.dispatch_status,
        b.production_status,
        b.inspection_status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT sr.id) AS step_count,
        SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) AS finished_step_count
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      LEFT JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      WHERE ${where}
      GROUP BY b.id, b.work_order_id, wo.order_no, b.batch_no, b.product_id, p.product_model, p.product_name,
        b.route_id, r.route_name, b.planned_quantity, b.status, b.material_status, b.dispatch_status,
        b.production_status, b.inspection_status, b.owner_id, u.display_name, b.plan_start_date,
        b.plan_end_date, b.remark, b.created_at, b.updated_at
      ORDER BY b.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProductionBatch), Number(totalRow?.total ?? 0), pagination);
  }

  async getTask(id: number) {
    const task = await this.getTaskListItem(id);
    return {
      ...task,
      steps: await this.listStepRecords(id),
      materialRequirements: await this.listMaterialRequirements(id),
    };
  }

  async listTasksForWorker(userId: string, filters: ProductionTaskFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters({ ...filters, status: undefined });
    const userIdNumber = Number(userId);
    const stepStatus = filters.status?.trim();

    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      INNER JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      WHERE ${where}
        AND sr.responsible_user_id = ?
        ${stepStatus ? 'AND sr.status = ?' : ''}
    `,
      stepStatus ? [...params, userIdNumber, stepStatus] : [...params, userIdNumber],
    );

    const rows = await this.database.query<WorkerTaskListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        wo.order_no,
        b.batch_no,
        b.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.material_status,
        b.dispatch_status,
        b.production_status,
        b.inspection_status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT all_sr.id) AS step_count,
        SUM(CASE WHEN all_sr.status = 'completed' THEN 1 ELSE 0 END) AS finished_step_count,
        sr.id AS step_record_id,
        sr.route_step_id,
        sr.step_order,
        sr.step_name,
        sr.status AS step_status,
        sr.started_at AS step_started_at,
        sr.completed_at AS step_completed_at,
        sr.output_quantity,
        sr.return_quantity,
        sr.abnormal_quantity,
        sr.responsible_user_id,
        ru.display_name AS responsible_user_name
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      INNER JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      LEFT JOIN users ru ON ru.id = sr.responsible_user_id
      LEFT JOIN batch_step_records all_sr ON all_sr.batch_id = b.id AND all_sr.is_deleted = 0
      WHERE ${where}
        AND sr.responsible_user_id = ?
        ${stepStatus ? 'AND sr.status = ?' : ''}
      GROUP BY b.id, b.work_order_id, wo.order_no, b.batch_no, b.product_id, p.product_model, p.product_name,
        b.route_id, r.route_name, b.planned_quantity, b.status, b.material_status, b.dispatch_status,
        b.production_status, b.inspection_status, b.owner_id, u.display_name, b.plan_start_date,
        b.plan_end_date, b.remark, b.created_at, b.updated_at, sr.id, sr.route_step_id, sr.step_order,
        sr.step_name, sr.status, sr.started_at, sr.completed_at, sr.output_quantity, sr.return_quantity,
        sr.abnormal_quantity, sr.responsible_user_id, ru.display_name
      ORDER BY b.id DESC, sr.step_order ASC
      LIMIT ? OFFSET ?
    `,
      stepStatus
        ? [...params, userIdNumber, stepStatus, pagination.pageSize, pagination.offset]
        : [...params, userIdNumber, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapWorkerTask), Number(totalRow?.total ?? 0), pagination);
  }

  async getTaskForWorker(id: number, userId: string) {
    await this.assertWorkerTaskAccessible(id, userId);
    return this.getTask(id);
  }

  async startTaskForWorker(id: number, userId: string) {
    await this.assertWorkerTaskAccessible(id, userId);
    return this.startTask(id);
  }

  async finishTaskForWorker(id: number, userId: string) {
    await this.assertWorkerTaskAccessible(id, userId);
    return this.finishTask(id);
  }

  async updateStepRecordForWorker(
    taskId: number,
    recordId: number,
    payload: UpdateBatchStepRecordPayload,
    userId: string,
  ) {
    const task = await this.getTaskRowForWorker(taskId, userId);
    const current = await this.getStepRecordRow(taskId, recordId);

    if (
      current.responsible_user_id !== null &&
      current.responsible_user_id !== Number(userId) &&
      task.owner_id !== Number(userId)
    ) {
      throw new BadRequestException('You are not allowed to update this step record');
    }

    return this.updateStepRecord(taskId, recordId, payload);
  }

  async createTask(payload: CreateProductionTaskPayload) {
    const orderId = readPositiveId(payload.workOrderId, 'Missing work order');
    const order = await this.getWorkOrderRow(orderId);

    if (!['released', 'doing'].includes(order.status)) {
      throw new BadRequestException('Only released or doing work orders can create tasks');
    }

    const plannedQuantity = readDecimal(payload.plannedQuantity, 'Invalid task quantity');
    const ownerId = payload.ownerId === undefined ? order.owner_id : nullableId(payload.ownerId);
    const routeId = payload.routeId === undefined ? order.route_id : nullableId(payload.routeId);
    const batchNo = normalizeOptionalString(payload.batchNo) ?? (await this.generateBatchNo());

    await this.assertUserAvailable(ownerId);
    await this.assertRouteAvailable(routeId, order.product_id);
    await this.assertBatchNoAvailable(batchNo);
    await this.assertTaskQuantityWithinOrder(orderId, decimalNumber(plannedQuantity));

    const result = await this.database.transaction(async (connection) => {
      const insertResult = (await execute(
        connection,
        `
        INSERT INTO production_batches (
          work_order_id, batch_no, product_id, route_id, planned_quantity, owner_id,
          plan_start_date, plan_end_date, remark, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
        [
          orderId,
          batchNo,
          order.product_id,
          routeId,
          plannedQuantity,
          ownerId,
          normalizeDate(payload.planStartDate) ?? formatDate(order.plan_start_date),
          normalizeDate(payload.planEndDate) ?? formatDate(order.plan_end_date),
          normalizeOptionalString(payload.remark),
        ],
      )) as ResultSetHeader;

      if (routeId !== null) {
        const routeSteps = await this.listRouteSteps(routeId);
        const assignmentMap = new Map(
          (payload.steps ?? []).map((step) => [Number(step.routeStepId), nullableId(step.responsibleUserId)]),
        );

        for (const step of routeSteps) {
          const responsibleUserId = assignmentMap.has(step.id)
            ? assignmentMap.get(step.id) ?? null
            : step.default_owner_id;
          await this.assertUserAvailable(responsibleUserId);
          await execute(
            connection,
            `
            INSERT INTO batch_step_records (
              batch_id, route_step_id, step_order, step_name, sop_file_id,
              responsible_user_id, status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
          `,
            [
              insertResult.insertId,
              step.id,
              step.step_order,
              step.process_name,
              step.sop_file_id,
              responsibleUserId,
            ],
          );
        }

        await execute(
          connection,
          `
          UPDATE production_batches
          SET dispatch_status = CASE WHEN ? > 0 THEN 'assigned' ELSE dispatch_status END,
            status = CASE WHEN ? > 0 AND status = 'pending' THEN 'assigned' ELSE status END,
            material_status = CASE
              WHEN EXISTS (
                SELECT 1
                FROM route_step_materials rsm
                INNER JOIN process_route_steps prs ON prs.id = rsm.route_step_id AND prs.is_deleted = 0
                INNER JOIN product_materials pm ON pm.id = rsm.product_material_id AND pm.is_deleted = 0
                WHERE prs.route_id = ? AND pm.product_id = ? AND rsm.is_deleted = 0
              ) THEN 'unassigned'
              ELSE material_status
            END,
            updated_at = NOW()
          WHERE id = ? AND is_deleted = 0
        `,
          [routeSteps.length, routeSteps.length, routeId, order.product_id, insertResult.insertId],
        );
      }

      return insertResult;
    });

    await this.refreshWorkOrderStatusByTasks(orderId);
    return this.getTask(result.insertId);
  }

  async previewCreateTask(workOrderId: number, routeId: number | null, plannedQuantity: string | number | null | undefined) {
    const order = await this.getWorkOrderRow(workOrderId);
    const resolvedRouteId = routeId ?? order.route_id;
    const quantity = readDecimal(plannedQuantity ?? order.planned_quantity, 'Invalid task quantity');

    if (resolvedRouteId === null) {
      return {
        steps: [],
        materialRequirements: [],
      };
    }

    await this.assertRouteAvailable(resolvedRouteId, order.product_id);
    const routeSteps = await this.listRouteSteps(resolvedRouteId);
    const steps = routeSteps.map((step) =>
      mapBatchStepRecord({
        id: step.id,
        batch_id: 0,
        route_step_id: step.id,
        step_order: step.step_order,
        step_name: step.process_name,
        sop_file_id: step.sop_file_id,
        responsible_user_id: step.default_owner_id,
        responsible_user_name: step.default_owner_name,
        status: 'pending',
        started_at: null,
        completed_at: null,
        output_quantity: null,
        return_quantity: null,
        abnormal_quantity: null,
        remark: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as BatchStepRecordListRow),
    );

    return {
      steps,
      materialRequirements: await this.listMaterialRequirementsByRoute(
        resolvedRouteId,
        order.product_id,
        quantity,
      ),
    };
  }

  async updateTask(id: number, payload: UpdateProductionBatchPayload) {
    const current = await this.getTaskRow(id);
    const routeId = payload.routeId === undefined ? current.route_id : nullableId(payload.routeId);
    const ownerId = payload.ownerId === undefined ? current.owner_id : nullableId(payload.ownerId);

    await this.assertRouteAvailable(routeId, current.product_id);
    await this.assertUserAvailable(ownerId);

    await this.database.execute(
      `
      UPDATE production_batches
      SET route_id = ?,
        owner_id = ?,
        planned_quantity = ?,
        plan_start_date = ?,
        plan_end_date = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        routeId,
        ownerId,
        payload.plannedQuantity === undefined
          ? decimalString(current.planned_quantity)
          : readDecimal(payload.plannedQuantity, 'Invalid planned quantity'),
        payload.planStartDate === undefined ? formatDate(current.plan_start_date) : normalizeDate(payload.planStartDate),
        payload.planEndDate === undefined ? formatDate(current.plan_end_date) : normalizeDate(payload.planEndDate),
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getTask(id);
  }

  async generateMaterialDemand(id: number) {
    const task = await this.assertTaskHasRoute(id);
    await this.assertProductMaterialsConfigured(task.product_id);
    const materials = await this.listMaterialRequirements(id);
    const nextStatus = materials.length ? 'unassigned' : 'ungenerated';

    await this.database.execute(
      `
      UPDATE production_batches
      SET material_status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [nextStatus, id],
    );

    return {
      task: await this.getTask(id),
      materials,
    };
  }

  async previewDispatch(id: number) {
    const task = await this.assertTaskHasRoute(id);
    const existingRecords = await this.listStepRecords(id);

    if (existingRecords.length) {
      return existingRecords;
    }

    // 预览只读取路线工序，不写入 batch_step_records，避免用户打开弹窗即产生业务记录。
    const routeSteps = await this.listRouteSteps(task.route_id);
    return routeSteps.map((step) => {
      const row = {
        id: step.id,
        batch_id: id,
        route_step_id: step.id,
        step_order: step.step_order,
        step_name: step.process_name,
        sop_file_id: step.sop_file_id,
        responsible_user_id: step.default_owner_id,
        responsible_user_name: step.default_owner_name,
        status: 'pending',
        started_at: null,
        completed_at: null,
        output_quantity: null,
        return_quantity: null,
        abnormal_quantity: null,
        remark: null,
        created_at: new Date(),
        updated_at: new Date(),
      } as BatchStepRecordListRow;

      return mapBatchStepRecord(row);
    });
  }

  async dispatchTask(id: number, payload: DispatchTaskPayload) {
    const task = await this.assertTaskHasRoute(id);
    const routeSteps = await this.listRouteSteps(task.route_id);
    const assignmentMap = new Map(
      (payload.steps ?? []).map((step) => [Number(step.routeStepId), nullableId(step.responsibleUserId)]),
    );

    await this.database.transaction(async (connection) => {
      // 派工以工艺路线工序为源头生成执行记录，实际负责人记录在 batch_step_records。
      await execute(
        connection,
        'UPDATE batch_step_records SET is_deleted = 1, deleted_at = NOW() WHERE batch_id = ? AND is_deleted = 0',
        [id],
      );

      for (const step of routeSteps) {
        const responsibleUserId = assignmentMap.has(step.id)
          ? assignmentMap.get(step.id) ?? null
          : step.default_owner_id;
        await this.assertUserAvailable(responsibleUserId);
        await execute(
          connection,
          `
          INSERT INTO batch_step_records (
            batch_id, route_step_id, step_order, step_name, sop_file_id,
            responsible_user_id, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        `,
          [
            id,
            step.id,
            step.step_order,
            step.process_name,
            step.sop_file_id,
            responsibleUserId,
          ],
        );
      }

      await execute(
        connection,
        `
        UPDATE production_batches
        SET dispatch_status = 'assigned',
          status = CASE WHEN status = 'pending' THEN 'assigned' ELSE status END,
          updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
      `,
        [id],
      );
    });

    return this.getTask(id);
  }

  async startTask(id: number) {
    await this.getTaskRow(id);
    await this.database.execute(
      `
      UPDATE production_batches
      SET status = 'doing',
        production_status = 'doing',
        actual_start_at = COALESCE(actual_start_at, NOW()),
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0 AND status <> 'cancelled'
    `,
      [id],
    );

    return this.getTask(id);
  }

  async finishTask(id: number) {
    await this.getTaskRow(id);
    await this.database.execute(
      `
      UPDATE production_batches
      SET status = 'completed',
        production_status = 'completed',
        actual_end_at = NOW(),
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0 AND status <> 'cancelled'
    `,
      [id],
    );

    return this.getTask(id);
  }

  async updateStepRecord(taskId: number, recordId: number, payload: UpdateBatchStepRecordPayload) {
    await this.getTaskRow(taskId);
    const current = await this.getStepRecordRow(taskId, recordId);
    const responsibleUserId =
      payload.responsibleUserId === undefined ? current.responsible_user_id : nullableId(payload.responsibleUserId);
    const status = payload.status === undefined ? readStepStatus(current.status) : readStepStatus(payload.status);

    assertStepStatusTransition(current.status, status);
    await this.assertUserAvailable(responsibleUserId);

    await this.database.execute(
      `
      UPDATE batch_step_records
      SET responsible_user_id = ?,
        status = ?,
        started_at = ?,
        completed_at = ?,
        output_quantity = ?,
        return_quantity = ?,
        abnormal_quantity = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND batch_id = ? AND is_deleted = 0
    `,
      [
        responsibleUserId,
        status,
        payload.startedAt === undefined ? current.started_at : normalizeDateTime(payload.startedAt),
        payload.completedAt === undefined ? current.completed_at : normalizeDateTime(payload.completedAt),
        payload.outputQuantity === undefined ? current.output_quantity : readNullableDecimal(payload.outputQuantity, 'Invalid output quantity'),
        payload.returnQuantity === undefined ? current.return_quantity : readNullableDecimal(payload.returnQuantity, 'Invalid return quantity'),
        payload.abnormalQuantity === undefined ? current.abnormal_quantity : readNullableDecimal(payload.abnormalQuantity, 'Invalid abnormal quantity'),
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        recordId,
        taskId,
      ],
    );

    return this.getTask(taskId);
  }

  private buildListFilters(filters: ProductionTaskFilters) {
    const clauses = ['b.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(b.batch_no LIKE ? OR wo.order_no LIKE ? OR p.product_model LIKE ? OR p.product_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword);
    }

    if (filters.productId?.trim()) {
      clauses.push('b.product_id = ?');
      params.push(Number(filters.productId));
    }

    if (filters.ownerId?.trim()) {
      clauses.push('b.owner_id = ?');
      params.push(Number(filters.ownerId));
    }

    if (filters.status?.trim()) {
      clauses.push('b.status = ?');
      params.push(filters.status.trim());
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getTaskRow(id: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        product_id: number;
        route_id: number | null;
        planned_quantity: string | number;
        owner_id: number | null;
        status: string;
        plan_start_date: Date | null;
        plan_end_date: Date | null;
        remark: string | null;
      })[]
    >(
      `
      SELECT id, product_id, route_id, planned_quantity, owner_id, status, plan_start_date, plan_end_date, remark
      FROM production_batches
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Production task not found');
    }

    return row;
  }

  private async getTaskRowForWorker(id: number, userId: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT b.owner_id
      FROM production_batches b
      WHERE b.id = ?
        AND b.is_deleted = 0
        AND (
          b.owner_id = ?
          OR EXISTS (
            SELECT 1 FROM batch_step_records sr WHERE sr.batch_id = b.id AND sr.responsible_user_id = ? AND sr.is_deleted = 0
          )
        )
      LIMIT 1
    `,
      [id, Number(userId), Number(userId)],
    );

    if (!row) {
      throw new NotFoundException('Production task not found');
    }

    return row;
  }

  private async assertWorkerTaskAccessible(id: number, userId: string) {
    await this.getTaskRowForWorker(id, userId);
  }

  private async getWorkOrderRow(id: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        product_id: number;
        route_id: number | null;
        planned_quantity: string | number;
        owner_id: number | null;
        status: string;
        plan_start_date: Date | null;
        plan_end_date: Date | null;
      })[]
    >(
      `
      SELECT id, product_id, route_id, planned_quantity, owner_id, status, plan_start_date, plan_end_date
      FROM work_orders
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Work order not found');
    }

    return row;
  }

  private async getTaskListItem(id: number) {
    const [row] = await this.database.query<ProductionTaskListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        wo.order_no,
        b.batch_no,
        b.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.material_status,
        b.dispatch_status,
        b.production_status,
        b.inspection_status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at,
        COUNT(DISTINCT sr.id) AS step_count,
        SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) AS finished_step_count
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      LEFT JOIN batch_step_records sr ON sr.batch_id = b.id AND sr.is_deleted = 0
      WHERE b.id = ? AND b.is_deleted = 0
      GROUP BY b.id, b.work_order_id, wo.order_no, b.batch_no, b.product_id, p.product_model, p.product_name,
        b.route_id, r.route_name, b.planned_quantity, b.status, b.material_status, b.dispatch_status,
        b.production_status, b.inspection_status, b.owner_id, u.display_name, b.plan_start_date,
        b.plan_end_date, b.remark, b.created_at, b.updated_at
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Production task not found');
    }

    return mapProductionBatch(row);
  }

  private async listStepRecords(batchId: number) {
    const rows = await this.database.query<BatchStepRecordListRow[]>(
      `
      SELECT
        sr.id,
        sr.batch_id,
        sr.route_step_id,
        sr.step_order,
        sr.step_name,
        sr.sop_file_id,
        sr.responsible_user_id,
        ru.display_name AS responsible_user_name,
        sr.status,
        sr.started_at,
        sr.completed_at,
        sr.output_quantity,
        sr.return_quantity,
        sr.abnormal_quantity,
        sr.remark,
        sr.created_at,
        sr.updated_at
      FROM batch_step_records sr
      LEFT JOIN users ru ON ru.id = sr.responsible_user_id
      WHERE sr.batch_id = ? AND sr.is_deleted = 0
      ORDER BY sr.step_order ASC, sr.id ASC
    `,
      [batchId],
    );

    return rows.map(mapBatchStepRecord);
  }

  private async listMaterialRequirements(batchId: number) {
    const [task] = await this.database.query<
      (RowDataPacket & { product_id: number; route_id: number | null; planned_quantity: string | number })[]
    >(
      'SELECT product_id, route_id, planned_quantity FROM production_batches WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [batchId],
    );

    if (!task?.route_id) {
      return [];
    }

    return this.listMaterialRequirementsByRoute(task.route_id, task.product_id, task.planned_quantity);
  }

  private async listMaterialRequirementsByRoute(routeId: number, productId: number, plannedQuantity: string | number) {
    const rows = await this.database.query<TaskMaterialRequirementRow[]>(
      `
      SELECT
        rsm.id,
        prs.id AS route_step_id,
        prs.process_name AS route_step_name,
        pm.id AS product_material_id,
        pm.material_product_id,
        mp.product_model AS material_model,
        mp.product_name AS material_name,
        rsm.quantity_per_unit,
        ? AS planned_quantity,
        pm.unit,
        pm.is_key_material,
        pm.need_batch_record
      FROM route_step_materials rsm
      INNER JOIN process_route_steps prs ON prs.id = rsm.route_step_id AND prs.is_deleted = 0
      INNER JOIN product_materials pm ON pm.id = rsm.product_material_id AND pm.is_deleted = 0
      INNER JOIN products mp ON mp.id = pm.material_product_id AND mp.is_deleted = 0
      WHERE prs.route_id = ? AND pm.product_id = ? AND rsm.is_deleted = 0
      ORDER BY prs.step_order ASC, rsm.id ASC
    `,
      [decimalString(plannedQuantity), routeId, productId],
    );

    return rows.map(mapTaskMaterialRequirement);
  }

  private async assertTaskHasRoute(id: number) {
    const task = await this.getTaskRow(id);
    if (task.route_id === null) {
      throw new BadRequestException('Please select route before this operation');
    }

    return task as typeof task & { route_id: number };
  }

  private async listRouteSteps(routeId: number) {
    const rows = await this.database.query<
      (RowDataPacket & {
        id: number;
        step_order: number;
        process_id: number | null;
        process_code: string;
        process_name: string;
        sop_file_id: number | null;
        default_owner_id: number | null;
        default_owner_name: string | null;
      })[]
    >(
      `
      SELECT
        prs.id,
        prs.step_order,
        prs.process_id,
        COALESCE(ps.step_code, prs.process_code) AS process_code,
        COALESCE(ps.step_name, prs.process_name) AS process_name,
        prs.sop_file_id,
        prs.default_owner_id,
        u.display_name AS default_owner_name
      FROM process_route_steps prs
      LEFT JOIN process_steps ps ON ps.id = prs.process_step_id AND ps.is_deleted = 0
      LEFT JOIN users u ON u.id = prs.default_owner_id
      WHERE prs.route_id = ? AND prs.status = 1 AND prs.is_deleted = 0
      ORDER BY prs.step_order ASC, prs.id ASC
    `,
      [routeId],
    );

    if (!rows.length) {
      throw new BadRequestException('Route has no enabled steps');
    }

    return rows;
  }

  private async getStepRecordRow(batchId: number, recordId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        responsible_user_id: number | null;
        status: string;
        started_at: Date | null;
        completed_at: Date | null;
        output_quantity: string | number | null;
        return_quantity: string | number | null;
        abnormal_quantity: string | number | null;
        remark: string | null;
      })[]
    >(
      `
      SELECT id, responsible_user_id, status, started_at, completed_at, output_quantity, return_quantity, abnormal_quantity, remark
      FROM batch_step_records
      WHERE id = ? AND batch_id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [recordId, batchId],
    );

    if (!row) {
      throw new NotFoundException('Batch step record not found');
    }

    return row;
  }

  private async assertRouteAvailable(routeId: number | null, productId: number) {
    if (routeId === null) {
      return;
    }

    const [product] = await this.database.query<(RowDataPacket & { category_id: number | null })[]>(
      'SELECT category_id FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1',
      [productId],
    );
    const [route] = await this.database.query<(RowDataPacket & { product_category_id: number | null })[]>(
      'SELECT product_category_id FROM process_routes WHERE id = ? AND status = 1 AND is_deleted = 0 LIMIT 1',
      [routeId],
    );

    if (!route) {
      throw new BadRequestException('Route not found or disabled');
    }

    if (route.product_category_id !== null && product?.category_id !== null && route.product_category_id !== product?.category_id) {
      throw new BadRequestException('Route product type does not match task product');
    }
  }

  private async assertUserAvailable(userId: number | null) {
    if (userId === null) {
      return;
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ? AND status = 1 AND deleted_at IS NULL LIMIT 1',
      [userId],
    );

    if (!row) {
      throw new BadRequestException('Owner not found or disabled');
    }
  }

  private async assertProductMaterialsConfigured(productId: number) {
    const [row] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `
      SELECT COUNT(*) AS total
      FROM product_materials
      WHERE product_id = ? AND is_deleted = 0
    `,
      [productId],
    );

    if (Number(row?.total ?? 0) === 0) {
      throw new BadRequestException('当前产品未配置物料清单，请先在产品信息中配置后再生成物料需求');
    }
  }

  private async assertBatchNoAvailable(batchNo: string, ignoredBatchId?: number) {
    const params: QueryParam[] = [batchNo];
    const ignoredClause = ignoredBatchId ? ' AND id <> ?' : '';

    if (ignoredBatchId) {
      params.push(ignoredBatchId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `SELECT id FROM production_batches WHERE batch_no = ? AND is_deleted = 0${ignoredClause} LIMIT 1`,
      params,
    );

    if (row) {
      throw new BadRequestException('Task batch no already exists');
    }
  }

  private async assertTaskQuantityWithinOrder(orderId: number, newQuantity: number, ignoredTaskId?: number) {
    const order = await this.getWorkOrderRow(orderId);
    const params: QueryParam[] = [orderId];
    const ignoredClause = ignoredTaskId ? ' AND id <> ?' : '';

    if (ignoredTaskId) {
      params.push(ignoredTaskId);
    }

    const [row] = await this.database.query<(RowDataPacket & { assigned_quantity: string | number | null })[]>(
      `
      SELECT COALESCE(SUM(planned_quantity), 0) AS assigned_quantity
      FROM production_batches
      WHERE work_order_id = ? AND is_deleted = 0 AND status <> 'cancelled'${ignoredClause}
    `,
      params,
    );

    if (decimalNumber(row?.assigned_quantity) + newQuantity > decimalNumber(order.planned_quantity)) {
      throw new BadRequestException('Task quantity exceeds work order planned quantity');
    }
  }

  private async refreshWorkOrderStatusByTasks(orderId: number) {
    const order = await this.getWorkOrderRow(orderId);
    if (!['released', 'doing'].includes(order.status)) {
      return;
    }

    const [row] = await this.database.query<(RowDataPacket & { doing_count: number; completed_count: number })[]>(
      `
      SELECT
        SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END) AS doing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count
      FROM production_batches
      WHERE work_order_id = ? AND is_deleted = 0 AND status <> 'cancelled'
    `,
      [orderId],
    );
    const nextStatus = Number(row?.doing_count ?? 0) > 0 || Number(row?.completed_count ?? 0) > 0 ? 'doing' : 'released';

    await this.database.execute('UPDATE work_orders SET status = ?, updated_at = NOW() WHERE id = ? AND is_deleted = 0', [
      nextStatus,
      orderId,
    ]);
  }

  private async generateBatchNo() {
    const today = new Date();
    const dateText = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const [row] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `
      SELECT COUNT(*) AS total
      FROM production_batches
      WHERE batch_no LIKE ? AND is_deleted = 0
    `,
      [`PB${dateText}%`],
    );

    return `PB${dateText}${String(Number(row?.total ?? 0) + 1).padStart(3, '0')}`;
  }
}

const readStepStatus = (value: string) => {
  if (!STEP_STATUSES.has(value as BatchStepStatus)) {
    throw new BadRequestException('Invalid step status');
  }

  return value as BatchStepStatus;
};

const STEP_STATUS_TRANSITIONS: Record<BatchStepStatus, BatchStepStatus[]> = {
  pending: ['pending', 'doing', 'skipped'],
  doing: ['doing', 'completed', 'abnormal'],
  completed: ['completed'],
  abnormal: ['abnormal', 'doing'],
  skipped: ['skipped'],
};

const assertStepStatusTransition = (current: string, next: BatchStepStatus) => {
  const currentStatus = readStepStatus(current);
  if (!STEP_STATUS_TRANSITIONS[currentStatus].includes(next)) {
    throw new BadRequestException('Invalid step status transition');
  }
};
