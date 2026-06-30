import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateItemScrapPayload,
  ItemScrapDetail,
  ItemScrapListItem,
  ItemScrapScene,
  ItemScrapStatus,
} from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute, query, type DbExecutor } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface ItemScrapRow extends RowDataPacket {
  id: number;
  scrap_no: string;
  production_batch_id: number | null;
  demand_id: number | null;
  allocation_id: number | null;
  item_id: number;
  item_code: string;
  item_name: string;
  batch_id: number | null;
  batch_code: string | null;
  scrap_scene: ItemScrapScene;
  scrap_number: string;
  status: ItemScrapStatus;
  reason: string | null;
  operator_id: number | null;
  confirmed_at: Date | null;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

const SCRAP_STATUSES = new Set<ItemScrapStatus>(['待确认', '已确认', '已取消']);
const SCRAP_SCENES = new Set<ItemScrapScene>(['WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND', 'PRODUCTION_CONSUMED', 'IN_STOCK']);

@Injectable()
export class ItemScrapRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /** 查询报废单列表，读取 item_scrap 并关联库存对象信息。 */
  async listScraps(filters: ItemScrapFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM item_scrap isc
      INNER JOIN products p ON p.id = isc.item_id
      WHERE ${where}
    `,
      params,
    );

    const rows = await this.database.query<ItemScrapRow[]>(
      `
      SELECT
        isc.id,
        isc.scrap_no,
        isc.production_batch_id,
        isc.demand_id,
        isc.allocation_id,
        isc.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        isc.batch_id,
        ib.batch_code,
        isc.scrap_scene,
        isc.scrap_number,
        isc.status,
        isc.reason,
        isc.operator_id,
        isc.confirmed_at,
        isc.remark,
        isc.created_at,
        isc.updated_at
      FROM item_scrap isc
      INNER JOIN products p ON p.id = isc.item_id
      LEFT JOIN item_batch ib ON ib.id = isc.batch_id AND ib.item_id = isc.item_id
      WHERE ${where}
      ORDER BY isc.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapItemScrap), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询报废单详情。 */
  async getScrap(id: number): Promise<ItemScrapDetail> {
    const row = await this.getScrapRow(id);
    return mapItemScrap(row);
  }

  /**
   * 创建报废单，按 scrap_scene 校验关联对象。
   * - IN_STOCK：直接报废库存，需要 batch_id
   * - WAREHOUSE_ALLOCATED：已分配未出库报废，需要 allocation_id
   * - RETURN_AFTER_OUTBOUND：退料后报废，通过退料流程触发
   * - PRODUCTION_CONSUMED：生产消耗报废，记录消耗
   */
  async createScrap(payload: CreateItemScrapPayload) {
    const itemId = readPositiveId(payload.itemId, 'Missing item');
    const scrapNo = normalizeOptionalString(payload.scrapNo) ?? (await this.generateScrapNo());
    const scrapScene = readScrapScene(payload.scrapScene);
    const scrapNumber = readPositiveDecimal(payload.scrapNumber, 'Invalid scrap number');
    const productionBatchId = nullablePositiveId(payload.productionBatchId, 'Invalid production batch');
    const demandId = nullablePositiveId(payload.demandId, 'Invalid demand');
    const allocationId = nullablePositiveId(payload.allocationId, 'Invalid allocation');
    const batchId = nullablePositiveId(payload.batchId, 'Invalid batch');
    const operatorId = nullablePositiveId(payload.operatorId, 'Invalid operator');
    const reason = normalizeOptionalString(payload.reason);
    const remark = normalizeOptionalString(payload.remark);

    await this.assertScrapNoAvailable(scrapNo);

    const scrapRowId = await this.database.transaction(async (connection) => {
      await this.assertItemExists(connection, itemId);
      await this.assertOptionalReferenceExists(connection, 'production_batches', productionBatchId, 'Production batch not found');
      await this.assertOptionalReferenceExists(connection, 'users', operatorId, 'Operator not found');

      if (scrapScene === 'IN_STOCK' && batchId !== null) {
        await this.assertBatchExists(connection, batchId, itemId);
      }

      const result = await execute(
        connection,
        `
        INSERT INTO item_scrap (
          scrap_no, production_batch_id, demand_id, allocation_id, item_id, batch_id,
          scrap_scene, scrap_number, status, reason, operator_id, remark, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '待确认', ?, ?, ?, NOW(), NOW())
      `,
        [scrapNo, productionBatchId, demandId, allocationId, itemId, batchId, scrapScene, scrapNumber, reason, operatorId, remark],
      );

      return (result as ResultSetHeader).insertId;
    });

    return this.getScrap(scrapRowId);
  }

  /**
   * 确认报废，按场景生成库存流水或补料需求。
   * - IN_STOCK / WAREHOUSE_ALLOCATED：生成 '报废出库' 类型负数 inventory_transaction
   * - PRODUCTION_CONSUMED / RETURN_AFTER_OUTBOUND：仅记录，不产生库存变动
   */
  async confirmScrap(id: number) {
    await this.database.transaction(async (connection) => {
      const row = await this.getScrapRow(id, connection, true);
      if (row.status !== '待确认') {
        throw new BadRequestException('Only pending scrap can be confirmed');
      }

      if (row.scrap_scene === 'IN_STOCK' || row.scrap_scene === 'WAREHOUSE_ALLOCATED') {
        if (!row.batch_id) {
          throw new BadRequestException('Scrap batch is required for stock scrap');
        }

        await execute(
          connection,
          `
          INSERT INTO inventory_transaction (
            item_id, batch_id, transaction_type, quantity, stock_status,
            reference_type, reference_detail_id, idempotency_key, reason, remark, created_at
          )
          VALUES (?, ?, '报废出库', ?, '报废', 'ITEM_SCRAP', ?, ?, ?, ?, NOW())
        `,
          [
            row.item_id,
            row.batch_id,
            negativeDecimal(row.scrap_number),
            row.id,
            `ITEM_SCRAP:${row.id}`,
            row.reason,
            row.remark,
          ],
        );
      }

      await execute(
        connection,
        `
        UPDATE item_scrap
        SET status = '已确认',
          confirmed_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getScrap(id);
  }

  /** 取消报废单，仅允许待确认状态的报废单取消。 */
  async cancelScrap(id: number) {
    await this.database.transaction(async (connection) => {
      const row = await this.getScrapRow(id, connection, true);
      if (row.status !== '待确认') {
        throw new BadRequestException('Only pending scrap can be canceled');
      }

      await execute(
        connection,
        `
        UPDATE item_scrap
        SET status = '已取消',
          updated_at = NOW()
        WHERE id = ?
      `,
        [id],
      );
    });

    return this.getScrap(id);
  }

  private buildListFilters(filters: ItemScrapFilters) {
    const clauses: string[] = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(isc.scrap_no LIKE ? OR p.item_code LIKE ? OR p.product_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (filters.status?.trim()) {
      clauses.push('isc.status = ?');
      params.push(readScrapStatus(filters.status));
    }

    if (filters.scrapScene?.trim()) {
      clauses.push('isc.scrap_scene = ?');
      params.push(readScrapScene(filters.scrapScene));
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getScrapRow(id: number, executor: DbExecutor = this.database, lock = false) {
    const rows = await query<ItemScrapRow[]>(
      executor,
      `
      SELECT
        isc.id,
        isc.scrap_no,
        isc.production_batch_id,
        isc.demand_id,
        isc.allocation_id,
        isc.item_id,
        COALESCE(p.item_code, p.product_model) AS item_code,
        p.product_name AS item_name,
        isc.batch_id,
        ib.batch_code,
        isc.scrap_scene,
        isc.scrap_number,
        isc.status,
        isc.reason,
        isc.operator_id,
        isc.confirmed_at,
        isc.remark,
        isc.created_at,
        isc.updated_at
      FROM item_scrap isc
      INNER JOIN products p ON p.id = isc.item_id
      LEFT JOIN item_batch ib ON ib.id = isc.batch_id AND ib.item_id = isc.item_id
      WHERE isc.id = ?
      ${lock ? 'FOR UPDATE' : ''}
    `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      throw new NotFoundException('Scrap record not found');
    }

    return row;
  }

  private async assertScrapNoAvailable(scrapNo: string) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM item_scrap
      WHERE scrap_no = ?
      LIMIT 1
    `,
      [scrapNo],
    );

    if (row) {
      throw new ConflictException('Scrap no already exists');
    }
  }

  private async assertItemExists(executor: DbExecutor, itemId: number) {
    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT id
      FROM products
      WHERE id = ? AND status = '启用'
      LIMIT 1
    `,
      [itemId],
    );

    if (!row) {
      throw new BadRequestException('Warehouse item not found or disabled');
    }
  }

  private async assertBatchExists(executor: DbExecutor, batchId: number, itemId: number) {
    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT id
      FROM item_batch
      WHERE id = ? AND item_id = ?
      LIMIT 1
    `,
      [batchId, itemId],
    );

    if (!row) {
      throw new BadRequestException('Item batch not found');
    }
  }

  private async assertOptionalReferenceExists(
    executor: DbExecutor,
    table: 'production_batches' | 'users',
    id: number | null,
    message: string,
  ) {
    if (id === null) {
      return;
    }

    const [row] = await query<RowDataPacket[]>(
      executor,
      `
      SELECT id
      FROM ${table}
      WHERE id = ?
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new BadRequestException(message);
    }
  }

  private async generateScrapNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `SCR${datePart}`;
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT scrap_no
      FROM item_scrap
      WHERE scrap_no LIKE ?
      ORDER BY scrap_no DESC
      LIMIT 1
    `,
      [`${prefix}%`],
    );
    const lastNo = typeof row?.scrap_no === 'string' ? row.scrap_no : '';
    const lastSequence = lastNo.startsWith(prefix) ? Number(lastNo.slice(prefix.length)) : 0;
    const nextSequence = Number.isInteger(lastSequence) ? lastSequence + 1 : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }
}

export interface ItemScrapFilters {
  keyword?: string;
  status?: string;
  scrapScene?: string;
}

const mapItemScrap = (row: ItemScrapRow): ItemScrapListItem => ({
  id: String(row.id),
  scrapNo: row.scrap_no,
  productionBatchId: row.production_batch_id === null ? null : String(row.production_batch_id),
  demandId: row.demand_id === null ? null : String(row.demand_id),
  allocationId: row.allocation_id === null ? null : String(row.allocation_id),
  itemId: String(row.item_id),
  itemCode: row.item_code,
  itemName: row.item_name,
  batchId: row.batch_id === null ? null : String(row.batch_id),
  batchCode: row.batch_code,
  scrapScene: row.scrap_scene,
  scrapNumber: String(row.scrap_number),
  status: row.status,
  reason: row.reason,
  operatorId: row.operator_id === null ? null : String(row.operator_id),
  confirmedAt: row.confirmed_at?.toISOString() ?? null,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const readScrapScene = (value: string) => {
  if (!SCRAP_SCENES.has(value as ItemScrapScene)) {
    throw new BadRequestException('Invalid scrap scene');
  }

  return value as ItemScrapScene;
};

const readScrapStatus = (value: string) => {
  if (!SCRAP_STATUSES.has(value as ItemScrapStatus)) {
    throw new BadRequestException('Invalid scrap status');
  }

  return value as ItemScrapStatus;
};

const normalizeOptionalString = (value: string | null | undefined) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const readPositiveId = (value: string | number | null | undefined, message: string) => {
  if (value === null || value === undefined || value === '') {
    throw new BadRequestException(message);
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new BadRequestException('Invalid id');
  }

  return id;
};

const nullablePositiveId = (value: string | number | null | undefined, message: string) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return readPositiveId(value, message);
};

const readPositiveDecimal = (value: string | number, message: string) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new BadRequestException(message);
  }

  return numberValue.toFixed(4);
};

const negativeDecimal = (value: string | number) => (-Number(value)).toFixed(4);
