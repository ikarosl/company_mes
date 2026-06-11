import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ResultSetHeader } from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise';
import type {
  CreateProductCategoryPayload,
  UpdateProductCategoryPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  CountRow,
  ProductCategoryListRow,
  ProductCategoryRow,
} from '../product.types.js';
import {
  mapProductCategory,
  normalizeOptionalString,
  readRequiredString,
  readTinyStatus,
} from '../product.utils.js';

export interface ProductCategoryFilters {
  productAttribute?: string;
  productType?: string;
  status?: string;
}

@Injectable()
export class ProductCategoryRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listCategories(filters: ProductCategoryFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM product_categories
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProductCategoryListRow[]>(
      `
      SELECT
        id,
        product_attribute,
        product_type,
        status,
        remark,
        created_at,
        updated_at
      FROM product_categories
      WHERE ${where}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProductCategory), Number(totalRow?.total ?? 0), pagination);
  }

  async getCategory(id: number) {
    return this.getCategoryListItem(id);
  }

  async createCategory(payload: CreateProductCategoryPayload) {
    const productAttribute = readRequiredString(
      payload.productAttribute,
      'Missing product attribute',
    );
    const productType = readRequiredString(payload.productType, 'Missing product type');
    const status = readTinyStatus(payload.status ?? 1);

    await this.assertCategoryAvailable(productAttribute, productType);

    const result = (await this.database.execute(
      `
      INSERT INTO product_categories (
        product_attribute, product_type, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `,
      [
        productAttribute,
        productType,
        status,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    return this.getCategoryListItem(result.insertId);
  }

  async updateCategory(id: number, payload: UpdateProductCategoryPayload) {
    const current = await this.getCategoryRow(id);
    const productAttribute =
      payload.productAttribute === undefined
        ? current.product_attribute
        : readRequiredString(payload.productAttribute, 'Missing product attribute');
    const productType =
      payload.productType === undefined
        ? current.product_type
        : readRequiredString(payload.productType, 'Missing product type');
    const status = payload.status === undefined ? current.status : readTinyStatus(payload.status);
    const remark =
      payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark);

    await this.assertCategoryAvailable(productAttribute, productType, id);

    await this.database.execute(
      `
      UPDATE product_categories
      SET product_attribute = ?,
        product_type = ?,
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [productAttribute, productType, status, remark, id],
    );

    return this.getCategoryListItem(id);
  }

  async changeCategoryStatus(id: number, status: number) {
    await this.getCategoryRow(id);

    await this.database.execute(
      `
      UPDATE product_categories
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [readTinyStatus(status), id],
    );

    return this.getCategoryListItem(id);
  }

  private buildListFilters(filters: ProductCategoryFilters) {
    const clauses = ['is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.productAttribute?.trim()) {
      clauses.push('product_attribute LIKE ?');
      params.push(`%${filters.productAttribute.trim()}%`);
    }

    if (filters.productType?.trim()) {
      clauses.push('product_type LIKE ?');
      params.push(`%${filters.productType.trim()}%`);
    }

    if (filters.status === 'enabled') {
      clauses.push('status = 1');
    }

    if (filters.status === 'disabled') {
      clauses.push('status = 0');
    }

    return {
      where: clauses.join(' AND '),
      params,
    };
  }

  private async getCategoryRow(id: number) {
    const [row] = await this.database.query<ProductCategoryRow[]>(
      `
      SELECT id, product_attribute, product_type, status, remark
      FROM product_categories
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Product category not found');
    }

    return row;
  }

  private async getCategoryListItem(id: number) {
    const [row] = await this.database.query<ProductCategoryListRow[]>(
      `
      SELECT
        id,
        product_attribute,
        product_type,
        status,
        remark,
        created_at,
        updated_at
      FROM product_categories
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Product category not found');
    }

    return mapProductCategory(row);
  }

  private async assertCategoryAvailable(
    productAttribute: string,
    productType: string,
    ignoredCategoryId?: number,
  ) {
    const params: QueryParam[] = [productAttribute, productType];
    const ignoredClause = ignoredCategoryId ? ' AND id <> ?' : '';

    if (ignoredCategoryId) {
      params.push(ignoredCategoryId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM product_categories
      WHERE product_attribute = ? AND product_type = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Product category already exists');
    }
  }
}
