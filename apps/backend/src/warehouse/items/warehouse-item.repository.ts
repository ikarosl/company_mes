import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateWarehouseItemPayload,
  WarehouseItemKind,
  WarehouseItemListItem,
  WarehouseItemStatus,
  WarehouseItemTypeOption,
  UpdateWarehouseItemPayload,
} from '@company/api-contract';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface WarehouseItemRow extends RowDataPacket {
  id: number;
  item_code: string;
  item_name: string;
  type_id: number;
  item_kind: WarehouseItemKind;
  type_name: string;
  default_unit: string;
  status: WarehouseItemStatus;
  remark: string | null;
  created_at: Date;
  updated_at: Date;
}

interface WarehouseItemTypeRow extends RowDataPacket {
  id: number;
  item_kind: WarehouseItemKind;
  type_name: string;
}

interface CountRow extends RowDataPacket {
  total: number;
}

export interface WarehouseItemFilters {
  keyword?: string;
  itemKind?: string;
  typeId?: string;
  status?: string;
}

const ITEM_KINDS = new Set<WarehouseItemKind>(['material', 'semi_finished', 'finished_product']);
const ITEM_STATUSES = new Set<WarehouseItemStatus>(['启用', '停用']);

@Injectable()
export class WarehouseItemRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /**
   * 查询库存对象列表。
   * 统一库存模型中物料、半成品、成品都来自 item_info，通过 item_type.item_kind 区分大类。
   */
  async listItems(filters: WarehouseItemFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM item_info ii
      INNER JOIN item_type it ON it.id = ii.type_id
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<WarehouseItemRow[]>(
      `
      SELECT
        ii.id,
        ii.item_code,
        ii.item_name,
        ii.type_id,
        it.item_kind,
        it.type_name,
        ii.default_unit,
        ii.status,
        ii.remark,
        ii.created_at,
        ii.updated_at
      FROM item_info ii
      INNER JOIN item_type it ON it.id = ii.type_id
      WHERE ${where}
      ORDER BY ii.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapWarehouseItem), Number(totalRow?.total ?? 0), pagination);
  }

  /** 查询库存对象详情，用于编辑弹窗回显。 */
  async getItem(id: number) {
    return mapWarehouseItem(await this.getItemRow(id));
  }

  /** 查询库存对象分类选项，供新增和编辑时选择 item_type。 */
  async listTypeOptions(itemKind?: string): Promise<WarehouseItemTypeOption[]> {
    const params: QueryParam[] = [];
    const clauses: string[] = [];

    if (itemKind?.trim()) {
      clauses.push('item_kind = ?');
      params.push(readItemKind(itemKind));
    }

    const rows = await this.database.query<WarehouseItemTypeRow[]>(
      `
      SELECT id, item_kind, type_name
      FROM item_type
      ${clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''}
      ORDER BY item_kind ASC, type_name ASC
    `,
      params,
    );

    return rows.map((row) => ({
      id: String(row.id),
      itemKind: row.item_kind,
      typeName: row.type_name,
    }));
  }

  /**
   * 创建库存对象。
   * 1. 校验分类存在
   * 2. 校验库存对象编码唯一
   * 3. 写入 item_info
   */
  async createItem(payload: CreateWarehouseItemPayload) {
    const itemCode = readRequiredString(payload.itemCode, 'Missing item code');
    const itemName = readRequiredString(payload.itemName, 'Missing item name');
    const typeId = readPositiveId(payload.typeId, 'Missing item type');
    const defaultUnit = readRequiredString(payload.defaultUnit, 'Missing default unit');
    const status = readItemStatus(payload.status ?? '启用');

    await this.assertTypeExists(typeId);
    await this.assertItemCodeAvailable(itemCode);

    const result = (await this.database.execute(
      `
      INSERT INTO item_info (
        item_code, item_name, type_id, default_unit, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [itemCode, itemName, typeId, defaultUnit, status, normalizeOptionalString(payload.remark)],
    )) as ResultSetHeader;

    return this.getItem(result.insertId);
  }

  /**
   * 编辑库存对象。
   * 编码变更时必须重新校验唯一，避免后续库存批次按编码展示时混淆。
   */
  async updateItem(id: number, payload: UpdateWarehouseItemPayload) {
    const current = await this.getItemRow(id);
    const itemCode = payload.itemCode === undefined ? current.item_code : readRequiredString(payload.itemCode, 'Missing item code');
    const itemName = payload.itemName === undefined ? current.item_name : readRequiredString(payload.itemName, 'Missing item name');
    const typeId = payload.typeId === undefined ? current.type_id : readPositiveId(payload.typeId, 'Missing item type');
    const defaultUnit =
      payload.defaultUnit === undefined ? current.default_unit : readRequiredString(payload.defaultUnit, 'Missing default unit');
    const status = payload.status === undefined ? current.status : readItemStatus(payload.status);

    await this.assertTypeExists(typeId);
    await this.assertItemCodeAvailable(itemCode, id);

    await this.database.execute(
      `
      UPDATE item_info
      SET item_code = ?,
        item_name = ?,
        type_id = ?,
        default_unit = ?,
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ?
    `,
      [
        itemCode,
        itemName,
        typeId,
        defaultUnit,
        status,
        payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark),
        id,
      ],
    );

    return this.getItem(id);
  }

  /** 启停用库存对象，仅修改 item_info.status，不影响历史库存流水。 */
  async changeItemStatus(id: number, status: WarehouseItemStatus) {
    await this.getItemRow(id);
    await this.database.execute(
      `
      UPDATE item_info
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [readItemStatus(status), id],
    );

    return this.getItem(id);
  }

  private buildListFilters(filters: WarehouseItemFilters) {
    const clauses = ['1 = 1'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(ii.item_code LIKE ? OR ii.item_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword);
    }

    if (filters.itemKind?.trim()) {
      clauses.push('it.item_kind = ?');
      params.push(readItemKind(filters.itemKind));
    }

    if (filters.typeId?.trim()) {
      clauses.push('ii.type_id = ?');
      params.push(readPositiveId(filters.typeId, 'Invalid item type'));
    }

    if (filters.status?.trim()) {
      clauses.push('ii.status = ?');
      params.push(readItemStatus(filters.status));
    }

    return { where: clauses.join(' AND '), params };
  }

  private async getItemRow(id: number) {
    const [row] = await this.database.query<WarehouseItemRow[]>(
      `
      SELECT
        ii.id,
        ii.item_code,
        ii.item_name,
        ii.type_id,
        it.item_kind,
        it.type_name,
        ii.default_unit,
        ii.status,
        ii.remark,
        ii.created_at,
        ii.updated_at
      FROM item_info ii
      INNER JOIN item_type it ON it.id = ii.type_id
      WHERE ii.id = ?
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Warehouse item not found');
    }

    return row;
  }

  private async assertTypeExists(typeId: number) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM item_type
      WHERE id = ?
      LIMIT 1
    `,
      [typeId],
    );

    if (!row) {
      throw new BadRequestException('Warehouse item type not found');
    }
  }

  private async assertItemCodeAvailable(itemCode: string, ignoredId?: number) {
    const params: QueryParam[] = [itemCode];
    const ignoredClause = ignoredId ? ' AND id <> ?' : '';

    if (ignoredId) {
      params.push(ignoredId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM item_info
      WHERE item_code = ?${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Warehouse item code already exists');
    }
  }
}

const mapWarehouseItem = (row: WarehouseItemRow): WarehouseItemListItem => ({
  id: String(row.id),
  itemCode: row.item_code,
  itemName: row.item_name,
  itemKind: row.item_kind,
  typeId: String(row.type_id),
  typeName: row.type_name,
  defaultUnit: row.default_unit,
  status: row.status,
  remark: row.remark,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const readRequiredString = (value: string | undefined, message: string) => {
  const normalized = value?.trim();
  if (!normalized) {
    throw new BadRequestException(message);
  }

  return normalized;
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

const readItemKind = (value: string) => {
  if (!ITEM_KINDS.has(value as WarehouseItemKind)) {
    throw new BadRequestException('Invalid item kind');
  }

  return value as WarehouseItemKind;
};

const readItemStatus = (value: string) => {
  if (!ITEM_STATUSES.has(value as WarehouseItemStatus)) {
    throw new BadRequestException('Invalid item status');
  }

  return value as WarehouseItemStatus;
};
