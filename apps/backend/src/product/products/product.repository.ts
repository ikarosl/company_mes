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
  ConfigureProductMaterialsPayload,
  CreateProductPayload,
  ProductMaterialPayload,
  UpdateProductPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type { CountRow, ProductListRow, ProductMaterialListRow, ProductRow } from '../product.types.js';
import {
  mapProductMaterial,
  mapProduct,
  normalizeOptionalString,
  normalizeSpecValues,
  nullableId,
  readAcquireMethod,
  readPositiveDecimal,
  readPositiveId,
  readRequiredString,
  readTinyStatus,
} from '../product.utils.js';

export interface ProductFilters {
  keyword?: string;
  categoryId?: string;
  acquireMethod?: string;
  status?: string;
}

@Injectable()
export class ProductRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async listProducts(filters: ProductFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildListFilters(filters);
    const [totalRow] = await this.database.query<CountRow[]>(
      `
      SELECT COUNT(*) AS total
      FROM products p
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      WHERE ${where}
    `,
      params,
    );
    const rows = await this.database.query<ProductListRow[]>(
      `
      SELECT
        p.id,
        p.product_model,
        p.product_name,
        p.category_id,
        c.product_attribute,
        c.product_type,
        p.unit,
        p.acquire_method,
        p.spec_values,
        COALESCE(pm.material_count, 0) AS material_count,
        p.status,
        p.remark,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT product_id, COUNT(*) AS material_count
        FROM product_materials
        WHERE is_deleted = 0
        GROUP BY product_id
      ) pm ON pm.product_id = p.id
      WHERE ${where}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapProduct), Number(totalRow?.total ?? 0), pagination);
  }

  async getProduct(id: number) {
    return this.getProductListItem(id);
  }

  async createProduct(payload: CreateProductPayload) {
    const productModel = readRequiredString(payload.productModel, 'Missing product model');
    const productName = readRequiredString(payload.productName, 'Missing product name');
    const unit = readRequiredString(payload.unit, 'Missing product unit');
    const categoryId = nullableId(payload.categoryId);
    const acquireMethod = readAcquireMethod(payload.acquireMethod);
    const specValues = normalizeSpecValues(payload.specValues ?? []);
    const status = readTinyStatus(payload.status ?? 1);

    await this.assertProductModelAvailable(productModel);
    await this.assertCategoryAvailable(categoryId);

    const result = (await this.database.execute(
      `
      INSERT INTO products (
        product_model, product_name, category_id, unit, acquire_method,
        spec_values, status, remark, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, CAST(? AS JSON), ?, ?, NOW(), NOW())
    `,
      [
        productModel,
        productName,
        categoryId,
        unit,
        acquireMethod,
        JSON.stringify(specValues),
        status,
        normalizeOptionalString(payload.remark),
      ],
    )) as ResultSetHeader;

    return this.getProductListItem(result.insertId);
  }

  async updateProduct(id: number, payload: UpdateProductPayload) {
    const current = await this.getProductRow(id);
    const productModel =
      payload.productModel === undefined
        ? current.product_model
        : readRequiredString(payload.productModel, 'Missing product model');
    const productName =
      payload.productName === undefined
        ? current.product_name
        : readRequiredString(payload.productName, 'Missing product name');
    const unit =
      payload.unit === undefined ? current.unit : readRequiredString(payload.unit, 'Missing product unit');
    const categoryId =
      payload.categoryId === undefined ? current.category_id : nullableId(payload.categoryId);
    const acquireMethod =
      payload.acquireMethod === undefined
        ? current.acquire_method
        : readAcquireMethod(payload.acquireMethod);
    const specValues =
      payload.specValues === undefined
        ? current.spec_values
        : JSON.stringify(normalizeSpecValues(payload.specValues));
    const status = payload.status === undefined ? current.status : readTinyStatus(payload.status);
    const remark =
      payload.remark === undefined ? current.remark : normalizeOptionalString(payload.remark);

    await this.assertProductModelAvailable(productModel, id);
    await this.assertCategoryAvailable(categoryId);

    await this.database.execute(
      `
      UPDATE products
      SET product_model = ?,
        product_name = ?,
        category_id = ?,
        unit = ?,
        acquire_method = ?,
        spec_values = CAST(? AS JSON),
        status = ?,
        remark = ?,
        updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [
        productModel,
        productName,
        categoryId,
        unit,
        acquireMethod,
        specValues ?? '[]',
        status,
        remark,
        id,
      ],
    );

    return this.getProductListItem(id);
  }

  async changeProductStatus(id: number, status: number) {
    await this.getProductRow(id);

    await this.database.execute(
      `
      UPDATE products
      SET status = ?, updated_at = NOW()
      WHERE id = ? AND is_deleted = 0
    `,
      [readTinyStatus(status), id],
    );

    return this.getProductListItem(id);
  }

  async getProductInventory(id: number) {
    await this.getProductRow(id);
    return {
      productId: String(id),
      batches: [],
    };
  }

  async getProductRoutes(id: number) {
    await this.getProductRow(id);
    return {
      productId: String(id),
      routes: [],
    };
  }

  async listProductMaterials(productId: number) {
    await this.getProductRow(productId);
    const rows = await this.database.query<ProductMaterialListRow[]>(
      `
      SELECT
        pm.id,
        pm.product_id,
        pm.material_product_id,
        mp.product_model AS material_model,
        mp.product_name AS material_name,
        mp.unit AS material_unit,
        pm.quantity_per_unit,
        pm.unit,
        pm.is_key_material,
        pm.need_batch_record,
        pm.remark,
        pm.created_at,
        pm.updated_at
      FROM product_materials pm
      INNER JOIN products mp ON mp.id = pm.material_product_id AND mp.is_deleted = 0
      WHERE pm.product_id = ? AND pm.is_deleted = 0
      ORDER BY pm.id ASC
    `,
      [productId],
    );

    return rows.map(mapProductMaterial);
  }

  async configureProductMaterials(productId: number, payload: ConfigureProductMaterialsPayload) {
    await this.getProductRow(productId);
    const materials = await this.normalizeMaterialPayloads(productId, payload.materials ?? []);
    await this.assertProductMaterialsUnlocked(productId);
    const activeRows = await this.getProductMaterialRows(productId, false);
    const allRows = await this.getProductMaterialRows(productId, true);
    const activeByMaterialId = new Map(activeRows.map((row) => [row.material_product_id, row]));
    const anyByMaterialId = new Map(allRows.map((row) => [row.material_product_id, row]));
    const nextMaterialIds = new Set(materials.map((item) => item.materialProductId));

    await this.database.transaction(async (connection) => {
      // 产品用料清单是产品自关联，不新增物料主数据；保存时按物料产品逐行同步。
      for (const row of activeRows) {
        if (!nextMaterialIds.has(row.material_product_id)) {
          await execute(
            connection,
            'UPDATE product_materials SET is_deleted = 1, deleted_at = NOW(), updated_at = NOW() WHERE id = ?',
            [row.id],
          );
        }
      }

      for (const item of materials) {
        const activeRow = activeByMaterialId.get(item.materialProductId);
        const historicalRow = anyByMaterialId.get(item.materialProductId);
        const params = [
          item.quantityPerUnit,
          item.unit,
          item.isKeyMaterial,
          item.needBatchRecord,
          item.remark,
        ];

        if (activeRow) {
          await execute(
            connection,
            `
            UPDATE product_materials
            SET quantity_per_unit = ?,
              unit = ?,
              is_key_material = ?,
              need_batch_record = ?,
              remark = ?,
              updated_at = NOW()
            WHERE id = ?
          `,
            [...params, activeRow.id],
          );
          continue;
        }

        if (historicalRow) {
          await execute(
            connection,
            `
            UPDATE product_materials
            SET quantity_per_unit = ?,
              unit = ?,
              is_key_material = ?,
              need_batch_record = ?,
              remark = ?,
              is_deleted = 0,
              deleted_by = NULL,
              deleted_at = NULL,
              updated_at = NOW()
            WHERE id = ?
          `,
            [...params, historicalRow.id],
          );
          continue;
        }

        await execute(
          connection,
          `
          INSERT INTO product_materials (
            product_id, material_product_id, quantity_per_unit, unit,
            is_key_material, need_batch_record, remark, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
          [
            productId,
            item.materialProductId,
            item.quantityPerUnit,
            item.unit,
            item.isKeyMaterial,
            item.needBatchRecord,
            item.remark,
          ],
        );
      }

      // 已生成但尚未分配的需求跟随最新 BOM；已分配或已使用记录由前置校验锁定。
      await execute(
        connection,
        `
        INSERT INTO batch_material_usages (
          batch_id, product_materials_id, material_batch_id, plan_quantity,
          reserved_quantity, used_quantity, unit, status, recorded_at,
          created_at, updated_at
        )
        SELECT
          b.id,
          pm.id,
          NULL,
          pm.quantity_per_unit * b.planned_quantity,
          0,
          0,
          pm.unit,
          'reserved',
          NOW(),
          NOW(),
          NOW()
        FROM production_batches b
        INNER JOIN work_orders wo
          ON wo.id = b.work_order_id
          AND wo.product_id = ?
          AND wo.is_deleted = 0
        INNER JOIN product_materials pm
          ON pm.product_id = wo.product_id
          AND pm.is_deleted = 0
        WHERE b.is_deleted = 0
          AND EXISTS (
            SELECT 1
            FROM batch_material_usages generated
            WHERE generated.batch_id = b.id
              AND generated.is_deleted = 0
          )
          AND NOT EXISTS (
            SELECT 1
            FROM batch_material_usages current_usage
            WHERE current_usage.batch_id = b.id
              AND current_usage.product_materials_id = pm.id
              AND current_usage.is_deleted = 0
          )
        ON DUPLICATE KEY UPDATE
          batch_material_usages.plan_quantity = IF(
            batch_material_usages.material_batch_id IS NULL
              AND batch_material_usages.reserved_quantity = 0
              AND batch_material_usages.used_quantity = 0,
            pm.quantity_per_unit * b.planned_quantity,
            batch_material_usages.plan_quantity
          ),
          batch_material_usages.unit = IF(
            batch_material_usages.material_batch_id IS NULL
              AND batch_material_usages.reserved_quantity = 0
              AND batch_material_usages.used_quantity = 0,
            pm.unit,
            batch_material_usages.unit
          ),
          batch_material_usages.status = IF(
            batch_material_usages.material_batch_id IS NULL
              AND batch_material_usages.reserved_quantity = 0
              AND batch_material_usages.used_quantity = 0,
            'reserved',
            batch_material_usages.status
          ),
          batch_material_usages.is_deleted = IF(
            batch_material_usages.material_batch_id IS NULL
              AND batch_material_usages.reserved_quantity = 0
              AND batch_material_usages.used_quantity = 0,
            0,
            batch_material_usages.is_deleted
          ),
          batch_material_usages.deleted_by = IF(
            batch_material_usages.material_batch_id IS NULL
              AND batch_material_usages.reserved_quantity = 0
              AND batch_material_usages.used_quantity = 0,
            NULL,
            batch_material_usages.deleted_by
          ),
          batch_material_usages.deleted_at = IF(
            batch_material_usages.material_batch_id IS NULL
              AND batch_material_usages.reserved_quantity = 0
              AND batch_material_usages.used_quantity = 0,
            NULL,
            batch_material_usages.deleted_at
          ),
          batch_material_usages.updated_at = NOW()
      `,
        [productId],
      );

      await execute(
        connection,
        `
        UPDATE batch_material_usages bmu
        INNER JOIN product_materials pm
          ON pm.id = bmu.product_materials_id
          AND pm.product_id = ?
          AND pm.is_deleted = 0
        INNER JOIN production_batches b
          ON b.id = bmu.batch_id
          AND b.is_deleted = 0
        SET bmu.plan_quantity = pm.quantity_per_unit * b.planned_quantity,
          bmu.unit = COALESCE(pm.unit, bmu.unit),
          bmu.updated_at = NOW()
        WHERE bmu.is_deleted = 0
          AND bmu.material_batch_id IS NULL
          AND bmu.reserved_quantity = 0
          AND bmu.used_quantity = 0
      `,
        [productId],
      );

      await execute(
        connection,
        `
        UPDATE batch_material_usages bmu
        INNER JOIN product_materials pm
          ON pm.id = bmu.product_materials_id
          AND pm.product_id = ?
          AND pm.is_deleted = 1
        SET bmu.is_deleted = 1,
          bmu.deleted_at = NOW(),
          bmu.updated_at = NOW()
        WHERE bmu.is_deleted = 0
          AND bmu.material_batch_id IS NULL
          AND bmu.reserved_quantity = 0
          AND bmu.used_quantity = 0
      `,
        [productId],
      );
    });

    return this.listProductMaterials(productId);
  }

  private async assertProductMaterialsUnlocked(productId: number) {
    const [row] = await this.database.query<(CountRow)[]>(
      `
      SELECT COUNT(*) AS total
      FROM product_materials pm
      INNER JOIN batch_material_usages bmu ON bmu.product_materials_id = pm.id AND bmu.is_deleted = 0
      WHERE pm.product_id = ?
        AND pm.is_deleted = 0
        AND (
          bmu.material_batch_id IS NOT NULL
          OR bmu.reserved_quantity > 0
          OR bmu.used_quantity > 0
        )
    `,
      [productId],
    );

    if ((row?.total ?? 0) > 0) {
      throw new BadRequestException('该产品已有物料批次分配或使用记录，不能修改产品物料清单');
    }
  }

  private buildListFilters(filters: ProductFilters) {
    const clauses = ['p.is_deleted = 0'];
    const params: QueryParam[] = [];

    if (filters.keyword?.trim()) {
      clauses.push('(p.product_model LIKE ? OR p.product_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword);
    }

    if (filters.categoryId?.trim()) {
      const categoryId = nullableId(filters.categoryId);
      if (categoryId !== null) {
        clauses.push('p.category_id = ?');
        params.push(categoryId);
      }
    }

    if (filters.acquireMethod?.trim()) {
      clauses.push('p.acquire_method = ?');
      params.push(filters.acquireMethod.trim());
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

  private async getProductRow(id: number) {
    const [row] = await this.database.query<ProductRow[]>(
      `
      SELECT id, product_model, product_name, category_id, unit, acquire_method, spec_values, status, remark
      FROM products
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Product not found');
    }

    return row;
  }

  private async getProductListItem(id: number) {
    const [row] = await this.database.query<ProductListRow[]>(
      `
      SELECT
        p.id,
        p.product_model,
        p.product_name,
        p.category_id,
        c.product_attribute,
        c.product_type,
        p.unit,
        p.acquire_method,
        p.spec_values,
        COALESCE(pm.material_count, 0) AS material_count,
        p.status,
        p.remark,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT product_id, COUNT(*) AS material_count
        FROM product_materials
        WHERE is_deleted = 0
        GROUP BY product_id
      ) pm ON pm.product_id = p.id
      WHERE p.id = ? AND p.is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!row) {
      throw new NotFoundException('Product not found');
    }

    return mapProduct(row);
  }

  private async assertProductModelAvailable(productModel: string, ignoredProductId?: number) {
    const params: QueryParam[] = [productModel];
    const ignoredClause = ignoredProductId ? ' AND id <> ?' : '';

    if (ignoredProductId) {
      params.push(ignoredProductId);
    }

    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT id
      FROM products
      WHERE product_model = ? AND is_deleted = 0${ignoredClause}
      LIMIT 1
    `,
      params,
    );

    if (row) {
      throw new ConflictException('Product model already exists');
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

  private async normalizeMaterialPayloads(productId: number, payloads: ProductMaterialPayload[]) {
    if (!Array.isArray(payloads)) {
      throw new BadRequestException('Invalid product materials');
    }

    const seenMaterialIds = new Set<number>();

    return Promise.all(
      payloads.map(async (item, index) => {
        const materialProductId = readPositiveId(item.materialProductId, `Missing material product at row ${index + 1}`);
        if (materialProductId === productId) {
          throw new BadRequestException('Product cannot use itself as material');
        }

        if (seenMaterialIds.has(materialProductId)) {
          throw new BadRequestException('Duplicate material product');
        }

        seenMaterialIds.add(materialProductId);
        const material = await this.getProductRow(materialProductId);
        if (material.status !== 1) {
          throw new BadRequestException('Material product is disabled');
        }

        return {
          materialProductId,
          quantityPerUnit: readPositiveDecimal(item.quantityPerUnit ?? 1, `Invalid material quantity at row ${index + 1}`),
          unit: normalizeOptionalString(item.unit) ?? material.unit,
          isKeyMaterial: item.isKeyMaterial === undefined ? true : Boolean(item.isKeyMaterial),
          needBatchRecord: item.needBatchRecord === undefined ? true : Boolean(item.needBatchRecord),
          remark: normalizeOptionalString(item.remark),
        };
      }),
    );
  }

  private async getProductMaterialRows(productId: number, includeDeleted: boolean) {
    return this.database.query<
      (RowDataPacket & {
        id: number;
        material_product_id: number;
      })[]
    >(
      `
      SELECT id, material_product_id
      FROM product_materials
      WHERE product_id = ?${includeDeleted ? '' : ' AND is_deleted = 0'}
      ORDER BY id ASC
    `,
      [productId],
    );
  }
}
