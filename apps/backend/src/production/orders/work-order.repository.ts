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
  CreateProductionBatchPayload,
  CreateWorkOrderPayload,
  ProductionBatchStatus,
  UpdateProductionBatchPayload,
  UpdateWorkOrderPayload,
  WorkOrderStatus,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  CountRow,
  ProductionBatchListRow,
  WorkOrderListRow,
  WorkOrderRow,
} from '../production.types.js';
import {
  decimalNumber,
  decimalString,
  formatDate,
  mapProductionBatch,
  mapWorkOrder,
  normalizeDate,
  normalizeOptionalString,
  nullableId,
  readDecimal,
  readPositiveId,
  readRequiredString,
} from '../production.utils.js';

export interface WorkOrderFilters {
  keyword?: string;
  productId?: string;
  status?: string;
  ownerId?: string;
}

const WORK_ORDER_STATUSES = new Set<WorkOrderStatus>([
  'draft',
  'released',
  'doing',
  'completed',
  'closed',
  'cancelled',
]);
const BATCH_STATUSES = new Set<ProductionBatchStatus>([
  'pending',
  'material_pending',
  'material_assigned',
  'doing',
  'completed',
  'cancelled',
]);

@Injectable()
export class WorkOrderRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listOrders(filters: WorkOrderFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM work_orders wo
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<WorkOrderListRow[]>(
      `
      SELECT
        wo.id,
        wo.order_no,
        wo.product_id,
        p.product_model,
        p.product_name,
        wo.route_id,
        r.route_name,
        wo.planned_quantity,
        COALESCE(b.assigned_quantity, 0) AS assigned_quantity,
        wo.unit,
        wo.owner_id,
        u.display_name AS owner_name,
        wo.status,
        wo.plan_start_date,
        wo.plan_end_date,
        wo.remark,
        wo.created_at,
        wo.updated_at
      FROM work_orders wo
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = wo.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = wo.owner_id
      LEFT JOIN (
        SELECT work_order_id, SUM(planned_quantity) AS assigned_quantity
        FROM production_batches
        WHERE is_deleted = 0 AND status <> 'cancelled'
        GROUP BY work_order_id
      ) b ON b.work_order_id = wo.id
      WHERE ${where}
      ORDER BY wo.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapWorkOrder), Number(totalRow?.total ?? 0), pagination);
  }

  async getOrder(id: number) {
    return {
      ...(await this.getOrderListItem(id)),
      batches: await this.listOrderBatches(id),
    };
  }

  async createOrder(payload: CreateWorkOrderPayload) {
    const orderNo = readRequiredString(payload.orderNo, 'Missing order no');
    const productId = readPositiveId(payload.productId, 'Missing product');
    const routeId = nullableId(payload.routeId);
    const plannedQuantity = readDecimal(payload.plannedQuantity, 'Invalid planned quantity');
    const ownerId = nullableId(payload.ownerId);

    const product = await this.assertProductAvailable(productId);
    await this.assertRouteAvailable(routeId, product.category_id);
    await this.assertUserAvailable(ownerId);
    await this.assertOrderNoAvailable(orderNo);

    const result = (await this.database.execute(
      `
      INSERT INTO work_orders (
        order_no, product_id, route_id, planned_quantity, unit, owner_id,
        status, plan_start_date, plan_end_date, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, NOW(), NOW())
    `,
      [
        orderNo,
        productId,
        routeId,
        plannedQuantity,
        normalizeOptionalString(payload.unit) ?? product.unit,
        ownerId,
        normalizeDate(payload.planStartDate),
        normalizeDate(payload.planEndDate),
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    return this.getOrder(result.insertId);
  }

  async updateOrder(id: number, payload: UpdateWorkOrderPayload) {
    const current = await this.getOrderRow(id);
    this.assertOrderEditable(current.status);

    const productId =
      payload.productId === undefined ? current.product_id : readPositiveId(payload.productId, 'Missing product');
    const product = await this.assertProductAvailable(productId);
    const routeId = payload.routeId === undefined ? current.route_id : nullableId(payload.routeId);
    const orderNo =
      payload.orderNo === undefined ? current.order_no : readRequiredString(payload.orderNo, 'Missing order no');
    const ownerId = payload.ownerId === undefined ? current.owner_id : nullableId(payload.ownerId);

    await this.assertRouteAvailable(routeId, product.category_id);
    await this.assertUserAvailable(ownerId);
    await this.assertOrderNoAvailable(orderNo, id);

    await this.database.execute(
      `
      UPDATE work_orders
      SET order_no = ?,
        product_id = ?,
        route_id = ?,
        planned_quantity = ?,
        unit = ?,
        owner_id = ?,
        plan_start_date = ?,
        plan_end_date = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        orderNo,
        productId,
        routeId,
        payload.plannedQuantity === undefined
          ? decimalString(current.planned_quantity)
          : readDecimal(payload.plannedQuantity, 'Invalid planned quantity'),
        payload.unit === undefined ? current.unit : normalizeOptionalString(payload.unit) ?? product.unit,
        ownerId,
        payload.planStartDate === undefined ? formatDate(current.plan_start_date) : normalizeDate(payload.planStartDate),
        payload.planEndDate === undefined ? formatDate(current.plan_end_date) : normalizeDate(payload.planEndDate),
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getOrder(id);
  }

  async changeOrderStatus(id: number, nextStatus: WorkOrderStatus) {
    const current = await this.getOrderRow(id);
    const allowed = this.getAllowedOrderTransitions(current.status as WorkOrderStatus);

    if (!allowed.has(nextStatus)) {
      throw new BadRequestException('Invalid work order status transition');
    }

    await this.database.execute(
      `
      UPDATE work_orders
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [nextStatus, id],
    );

    return this.getOrder(id);
  }

  async listOrderBatches(orderId: number) {
    await this.getOrderRow(orderId);
    const rows = await this.database.query<ProductionBatchListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        b.batch_no,
        b.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at
      FROM production_batches b
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      WHERE b.work_order_id = ? AND b.is_deleted = 0
      ORDER BY b.id DESC
    `,
      [orderId],
    );

    return rows.map(mapProductionBatch);
  }

  async createOrderBatch(orderId: number, payload: CreateProductionBatchPayload) {
    const order = await this.getOrderRow(orderId);
    if (!['released', 'doing'].includes(order.status)) {
      throw new BadRequestException('Only released or doing work orders can assign batches');
    }

    const plannedQuantity = readDecimal(payload.plannedQuantity, 'Invalid batch quantity');
    const ownerId = payload.ownerId === undefined ? order.owner_id : nullableId(payload.ownerId);
    const batchNo = normalizeOptionalString(payload.batchNo) ?? (await this.generateBatchNo());
    const routeId = payload.routeId === undefined ? order.route_id : nullableId(payload.routeId);

    await this.assertUserAvailable(ownerId);
    await this.assertRouteAvailable(routeId, (await this.assertProductAvailable(order.product_id)).category_id);
    await this.assertBatchNoAvailable(batchNo);
    await this.assertBatchQuantityWithinOrder(orderId, decimalNumber(plannedQuantity));

    const result = (await this.database.execute(
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

    await this.refreshOrderStatusByBatches(orderId);
    return this.getOrderBatch(result.insertId);
  }

  async updateOrderBatch(orderId: number, batchId: number, payload: UpdateProductionBatchPayload) {
    const order = await this.getOrderRow(orderId);
    this.assertOrderNotClosed(order.status);
    const current = await this.getBatchRow(orderId, batchId);
    const batchNo =
      payload.batchNo === undefined ? current.batch_no : readRequiredString(payload.batchNo, 'Missing batch no');
    const plannedQuantity =
      payload.plannedQuantity === undefined
        ? decimalString(current.planned_quantity)
        : readDecimal(payload.plannedQuantity, 'Invalid batch quantity');
    const ownerId = payload.ownerId === undefined ? current.owner_id : nullableId(payload.ownerId);
    const routeId = payload.routeId === undefined ? current.route_id : nullableId(payload.routeId);
    const status = payload.status === undefined ? current.status : readBatchStatus(payload.status);

    await this.assertUserAvailable(ownerId);
    await this.assertRouteAvailable(routeId, (await this.assertProductAvailable(order.product_id)).category_id);
    await this.assertBatchNoAvailable(batchNo, batchId);
    await this.assertBatchQuantityWithinOrder(orderId, decimalNumber(plannedQuantity), batchId);

    await this.database.execute(
      `
      UPDATE production_batches
      SET batch_no = ?,
        route_id = ?,
        planned_quantity = ?,
        owner_id = ?,
        status = ?,
        plan_start_date = ?,
        plan_end_date = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND work_order_id = ? AND is_deleted = 0
    `,
      [
        batchNo,
        routeId,
        plannedQuantity,
        ownerId,
        status,
        payload.planStartDate === undefined ? formatDate(current.plan_start_date) : normalizeDate(payload.planStartDate),
        payload.planEndDate === undefined ? formatDate(current.plan_end_date) : normalizeDate(payload.planEndDate),
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        batchId,
        orderId,
      ],
    );

    await this.refreshOrderStatusByBatches(orderId);
    return this.getOrderBatch(batchId);
  }

  private buildListFilters(filters: WorkOrderFilters) {
    const clauses = ['wo.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(wo.order_no LIKE ? OR p.product_model LIKE ? OR p.product_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (filters.productId?.trim()) {
      clauses.push('wo.product_id = ?');
      params.push(readPositiveId(filters.productId, 'Invalid product'));
    }

    if (filters.ownerId?.trim()) {
      clauses.push('wo.owner_id = ?');
      params.push(readPositiveId(filters.ownerId, 'Invalid owner'));
    }

    if (filters.status?.trim()) {
      clauses.push('wo.status = ?');
      params.push(readWorkOrderStatus(filters.status.trim()));
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getOrderRow(id: number) {
    const [row] = await this.database.query<WorkOrderRow[]>(
      `
      SELECT id, order_no, product_id, route_id, planned_quantity, unit, owner_id, status, plan_start_date, plan_end_date, remark
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

  private async getOrderListItem(id: number) {
    const [row] = await this.database.query<WorkOrderListRow[]>(
      `
      SELECT
        wo.id,
        wo.order_no,
        wo.product_id,
        p.product_model,
        p.product_name,
        wo.route_id,
        r.route_name,
        wo.planned_quantity,
        COALESCE(b.assigned_quantity, 0) AS assigned_quantity,
        wo.unit,
        wo.owner_id,
        u.display_name AS owner_name,
        wo.status,
        wo.plan_start_date,
        wo.plan_end_date,
        wo.remark,
        wo.created_at,
        wo.updated_at
      FROM work_orders wo
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = wo.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = wo.owner_id
      LEFT JOIN (
        SELECT work_order_id, SUM(planned_quantity) AS assigned_quantity
        FROM production_batches
        WHERE is_deleted = 0 AND status <> 'cancelled'
        GROUP BY work_order_id
      ) b ON b.work_order_id = wo.id
      WHERE wo.id = ? AND wo.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Work order not found');
    }

    return mapWorkOrder(row);
  }

  private async getOrderBatch(batchId: number) {
    const [row] = await this.database.query<ProductionBatchListRow[]>(
      `
      SELECT
        b.id,
        b.work_order_id,
        b.batch_no,
        b.product_id,
        p.product_model,
        p.product_name,
        b.route_id,
        r.route_name,
        b.planned_quantity,
        b.status,
        b.owner_id,
        u.display_name AS owner_name,
        b.plan_start_date,
        b.plan_end_date,
        b.remark,
        b.created_at,
        b.updated_at
      FROM production_batches b
      INNER JOIN products p ON p.id = b.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id AND r.is_deleted = 0
      LEFT JOIN users u ON u.id = b.owner_id
      WHERE b.id = ? AND b.is_deleted = 0
      LIMIT 1
    `,
      [batchId],
    );

    if (!row) {
      throw new NotFoundException('Production batch not found');
    }

    return mapProductionBatch(row);
  }

  private async getBatchRow(orderId: number, batchId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & {
        id: number;
        batch_no: string;
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
      SELECT id, batch_no, route_id, planned_quantity, owner_id, status, plan_start_date, plan_end_date, remark
      FROM production_batches
      WHERE id = ? AND work_order_id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [batchId, orderId],
    );

    if (!row) {
      throw new NotFoundException('Production batch not found');
    }

    return row;
  }

  private async assertProductAvailable(productId: number) {
    const [row] = await this.database.query<
      (RowDataPacket & { id: number; unit: string; category_id: number | null })[]
    >(
      `
      SELECT id, unit, category_id
      FROM products
      WHERE id = ? AND status = 1 AND is_deleted = 0
      LIMIT 1
    `,
      [productId],
    );

    if (!row) {
      throw new BadRequestException('Product not found or disabled');
    }

    return row;
  }

  private async assertRouteAvailable(routeId: number | null, productCategoryId: number | null) {
    if (routeId === null) {
      return;
    }

    const [row] = await this.database.query<(RowDataPacket & { id: number; product_category_id: number | null })[]>(
      `
      SELECT id, product_category_id
      FROM process_routes
      WHERE id = ? AND status = 1 AND is_deleted = 0
      LIMIT 1
    `,
      [routeId],
    );

    if (!row) {
      throw new BadRequestException('Route not found or disabled');
    }

    if (row.product_category_id !== null && productCategoryId !== null && row.product_category_id !== productCategoryId) {
      throw new BadRequestException('Route product type does not match product');
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
      throw new BadRequestException('Owner not found or disabled');
    }
  }

  private async assertOrderNoAvailable(orderNo: string, ignoredId?: number) {
    await this.assertUniqueText('work_orders', 'order_no', orderNo, ignoredId, 'Work order no already exists');
  }

  private async assertBatchNoAvailable(batchNo: string, ignoredId?: number) {
    await this.assertUniqueText('production_batches', 'batch_no', batchNo, ignoredId, 'Production batch no already exists');
  }

  private async assertUniqueText(tableName: string, columnName: string, value: string, ignoredId: number | undefined, message: string) {
    const params: QueryParam[] = [value];
    const ignoredClause = ignoredId ? ' AND id <> ?' : '';

    if (ignoredId) {
      params.push(ignoredId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM ${tableName}
      WHERE ${columnName} = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException(message);
    }
  }

  private async assertBatchQuantityWithinOrder(orderId: number, newQuantity: number, ignoredBatchId?: number) {
    const order = await this.getOrderRow(orderId);
    const params: QueryParam[] = [orderId];
    const ignoredClause = ignoredBatchId ? ' AND id <> ?' : '';

    if (ignoredBatchId) {
      params.push(ignoredBatchId);
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
      throw new BadRequestException('Batch quantity exceeds work order planned quantity');
    }
  }

  private async refreshOrderStatusByBatches(orderId: number) {
    const order = await this.getOrderRow(orderId);
    if (!['released', 'doing'].includes(order.status)) {
      return;
    }

    const batches = await this.listOrderBatches(orderId);
    const nextStatus = batches.some((batch) => batch.status === 'doing' || batch.status === 'completed')
      ? 'doing'
      : 'released';

    await this.database.execute(
      'UPDATE work_orders SET status = ?, updated_at = NOW() WHERE id = ? AND is_deleted = 0',
      [nextStatus, orderId],
    );
  }

  private getAllowedOrderTransitions(status: WorkOrderStatus) {
    const transitions: Record<WorkOrderStatus, WorkOrderStatus[]> = {
      draft: ['released', 'cancelled'],
      released: ['closed', 'cancelled'],
      doing: ['completed', 'cancelled'],
      completed: ['closed'],
      closed: [],
      cancelled: [],
    };

    return new Set(transitions[status] ?? []);
  }

  private assertOrderEditable(status: string) {
    if (!['draft', 'released'].includes(status)) {
      throw new BadRequestException('Only draft or released work orders can be edited');
    }
  }

  private assertOrderNotClosed(status: string) {
    if (['closed', 'cancelled'].includes(status)) {
      throw new BadRequestException('Closed or cancelled work orders cannot be changed');
    }
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
      [`SCPC-${dateText}-%`],
    );

    return `SCPC-${dateText}-${String(Number(row?.total ?? 0) + 1).padStart(3, '0')}`;
  }
}

const readWorkOrderStatus = (value: string) => {
  if (!WORK_ORDER_STATUSES.has(value as WorkOrderStatus)) {
    throw new BadRequestException('Invalid work order status');
  }

  return value as WorkOrderStatus;
};

const readBatchStatus = (value: string) => {
  if (!BATCH_STATUSES.has(value as ProductionBatchStatus)) {
    throw new BadRequestException('Invalid production batch status');
  }

  return value as ProductionBatchStatus;
};
