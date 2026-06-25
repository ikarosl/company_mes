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
  MaterialBatchListItem,
  MaterialBatchStatus,
  ProductMaterialPayload,
  UpdateProductPayload,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { execute } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';
import type {
  CountRow,
  ProductInventoryBatchRow,
  ProductListRow,
  ProductMaterialListRow,
  ProductRouteListRow,
  ProductRow,
} from '../product.types.js';
import {
  mapProcessRoute,
  mapProductMaterial,
  mapProduct,
  normalizeOptionalString,
  normalizeSpecValues,
  parseSpecValues,
  nullableId,
  readAcquireMethod,
  readPositiveDecimal,
  readPositiveId,
  readRequiredString,
  readTinyStatus,
} from '../product.utils.js';

export interface ProductFilters {
  keyword?: string;
  specKeyword?: string;
  /** 产品属性集合，用于区分订单产品与原材料、辅料。 */
  productAttributes?: string;
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
        ? JSON.stringify(parseSpecValues(current.spec_values))
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
    const rows = await this.database.query<ProductInventoryBatchRow[]>(
      `
      SELECT
        mb.id,
        mb.product_id,
        p.product_model,
        p.product_name,
        c.product_attribute,
        c.product_type,
        mb.material_batch_no,
        mb.supplier_name,
        mb.protocol_code,
        mb.received_date,
        mb.quantity,
        COALESCE(u.reserved_quantity, 0) AS reserved_quantity,
        COALESCE(u.used_quantity, 0) AS used_quantity,
        mb.status,
        mb.remark,
        mb.created_at,
        mb.updated_at
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = p.category_id AND c.is_deleted = 0
      LEFT JOIN (
        SELECT material_batch_id, reserved_not_used_quantity AS reserved_quantity, used_quantity
        FROM v_material_batch_available
      ) u ON u.material_batch_id = mb.id
      WHERE mb.product_id = ? AND mb.is_deleted = 0
      ORDER BY mb.id DESC
    `,
      [id],
    );
    const batches = rows.map(mapProductInventoryBatch);

    return {
      productId: String(id),
      totalQuantity: decimalTotal(batches.map((item) => item.quantity)),
      reservedQuantity: decimalTotal(batches.map((item) => item.reservedQuantity)),
      usedQuantity: decimalTotal(batches.map((item) => item.usedQuantity)),
      availableQuantity: decimalTotal(batches.map((item) => item.availableQuantity)),
      batches,
    };
  }

  async getProductRoutes(id: number) {
    const [product] = await this.database.query<
      (RowDataPacket & { category_id: number | null; default_route_id: number | null })[]
    >(
      `
      SELECT category_id, default_route_id
      FROM products
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [id],
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const rows = await this.database.query<ProductRouteListRow[]>(
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
        r.updated_at,
        CASE WHEN r.id = ? THEN 1 ELSE 0 END AS is_default
      FROM process_routes r
      LEFT JOIN process_route_steps s ON s.route_id = r.id AND s.is_deleted = 0
      LEFT JOIN process_steps ps ON ps.id = s.process_step_id AND ps.is_deleted = 0
      LEFT JOIN product_categories c ON c.id = r.product_category_id AND c.is_deleted = 0
      WHERE r.is_deleted = 0
        AND (
          r.id = ?
          OR r.product_category_id = ?
          OR r.product_category_id IS NULL
        )
      GROUP BY
        r.id, r.route_code, r.route_name, r.product_category_id,
        c.product_attribute, c.product_type, r.version, r.status,
        r.remark, r.created_at, r.updated_at
      ORDER BY is_default DESC, r.status DESC, r.id DESC
    `,
      [product.default_route_id, product.default_route_id, product.category_id],
    );

    return {
      productId: String(id),
      defaultRouteId:
        product.default_route_id === null ? null : String(product.default_route_id),
      routes: rows.map((row) => ({
        ...mapProcessRoute(row),
        isDefault: row.is_default === 1,
      })),
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
        INSERT INTO batch_material_requirements (
          batch_id, product_materials_id, plan_quantity, unit, created_at, updated_at
        )
        SELECT
          b.id,
          pm.id,
          pm.quantity_per_unit * b.planned_quantity,
          pm.unit,
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
            FROM batch_material_requirements generated
            WHERE generated.batch_id = b.id
              AND generated.is_deleted = 0
          )
          AND NOT EXISTS (
            SELECT 1
            FROM batch_material_requirements current_usage
            WHERE current_usage.batch_id = b.id
              AND current_usage.product_materials_id = pm.id
              AND current_usage.is_deleted = 0
          )
        ON DUPLICATE KEY UPDATE
          batch_material_requirements.plan_quantity = IF(
            NOT EXISTS (
              SELECT 1 FROM batch_material_usages operation
              WHERE operation.batch_id = b.id
                AND operation.product_materials_id = pm.id
                AND operation.is_deleted = 0
            ),
            pm.quantity_per_unit * b.planned_quantity,
            batch_material_requirements.plan_quantity
          ),
          batch_material_requirements.unit = IF(
            NOT EXISTS (
              SELECT 1 FROM batch_material_usages operation
              WHERE operation.batch_id = b.id
                AND operation.product_materials_id = pm.id
                AND operation.is_deleted = 0
            ),
            pm.unit,
            batch_material_requirements.unit
          ),
          batch_material_requirements.is_deleted = 0,
          batch_material_requirements.deleted_by = NULL,
          batch_material_requirements.deleted_at = NULL,
          batch_material_requirements.updated_at = NOW()
      `,
        [productId],
      );

      await execute(
        connection,
        `
        UPDATE batch_material_requirements requirement
        INNER JOIN product_materials pm
          ON pm.id = requirement.product_materials_id
          AND pm.product_id = ?
          AND pm.is_deleted = 0
        INNER JOIN production_batches b
          ON b.id = requirement.batch_id
          AND b.is_deleted = 0
        SET requirement.plan_quantity = pm.quantity_per_unit * b.planned_quantity,
          requirement.unit = COALESCE(pm.unit, requirement.unit),
          requirement.updated_at = NOW()
        WHERE requirement.is_deleted = 0
          AND NOT EXISTS (
            SELECT 1 FROM batch_material_usages operation
            WHERE operation.batch_id = requirement.batch_id
              AND operation.product_materials_id = requirement.product_materials_id
              AND operation.is_deleted = 0
          )
      `,
        [productId],
      );

      await execute(
        connection,
        `
        UPDATE batch_material_requirements requirement
        INNER JOIN product_materials pm
          ON pm.id = requirement.product_materials_id
          AND pm.product_id = ?
          AND pm.is_deleted = 1
        SET requirement.is_deleted = 1,
          requirement.deleted_at = NOW(),
          requirement.updated_at = NOW()
        WHERE requirement.is_deleted = 0
          AND NOT EXISTS (
            SELECT 1 FROM batch_material_usages operation
            WHERE operation.batch_id = requirement.batch_id
              AND operation.product_materials_id = requirement.product_materials_id
              AND operation.is_deleted = 0
          )
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
      INNER JOIN batch_material_usages operation
        ON operation.product_materials_id = pm.id
        AND operation.is_deleted = 0
      WHERE pm.product_id = ?
        AND pm.is_deleted = 0
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
      clauses.push(`(
        p.product_model LIKE ?
        OR p.product_name LIKE ?
        OR c.product_attribute LIKE ?
        OR c.product_type LIKE ?
        OR CONVERT(p.spec_values USING utf8mb4) LIKE ?
        OR p.remark LIKE ?
      )`);
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }

    if (filters.specKeyword?.trim()) {
      // 规格参数存储为 JSON 数组，转为 utf8mb4 文本后可同时模糊匹配参数名、值和单位。
      clauses.push('CONVERT(p.spec_values USING utf8mb4) LIKE ?');
      params.push(`%${filters.specKeyword.trim()}%`);
    }

    if (filters.productAttributes?.trim()) {
      /**
       * 产品和物料共用 products 表，通过分类属性区分。
       * 多属性筛选使用参数占位符，避免把前端传值直接拼接进 SQL。
       */
      const productAttributes = [
        ...new Set(
          filters.productAttributes
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ];
      if (productAttributes.length > 0) {
        clauses.push(`c.product_attribute IN (${productAttributes.map(() => '?').join(', ')})`);
        params.push(...productAttributes);
      }
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

/** 产品库存接口沿用库存管理模块的数量及状态计算口径。 */
const mapProductInventoryBatch = (row: ProductInventoryBatchRow): MaterialBatchListItem => {
  const quantity = decimalNumber(row.quantity);
  const reservedQuantity = decimalNumber(row.reserved_quantity);
  const usedQuantity = decimalNumber(row.used_quantity);
  const availableQuantity = quantity - reservedQuantity;

  return {
    id: String(row.id),
    productId: String(row.product_id),
    productModel: row.product_model,
    productName: row.product_name,
    productAttribute: row.product_attribute,
    productType: row.product_type,
    materialBatchNo: row.material_batch_no,
    supplierName: row.supplier_name,
    protocolCode: row.protocol_code,
    receivedDate: row.received_date ? formatDate(row.received_date) : null,
    quantity: formatDecimal(quantity),
    reservedQuantity: formatDecimal(reservedQuantity),
    usedQuantity: formatDecimal(usedQuantity),
    availableQuantity: formatDecimal(availableQuantity),
    status:
      row.status === 'disabled'
        ? 'disabled'
        : deriveMaterialBatchStatus(quantity, reservedQuantity, usedQuantity),
    remark: row.remark,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
};

const deriveMaterialBatchStatus = (
  quantity: number,
  reservedQuantity: number,
  usedQuantity: number,
): MaterialBatchStatus => {
  if (quantity - reservedQuantity <= 0) {
    return 'used_up';
  }

  if (reservedQuantity > 0 || usedQuantity > 0) {
    return 'partial_used';
  }

  return 'available';
};

const decimalNumber = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

const formatDecimal = (value: number) => value.toFixed(4);

const decimalTotal = (values: string[]) =>
  formatDecimal(values.reduce((total, value) => total + decimalNumber(value), 0));

const formatDate = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
