import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type {
  MaterialInboundPayload,
  MaterialOutboundPayload,
  MaterialReturnPayload,
  MaterialTransactionDemandOption,
  MaterialTransactionListItem,
} from '@company/api-contract';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import { execute, query } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface TransactionFilters {
  keyword?: string;
  transactionType?: string;
  materialBatchNo?: string;
  supplierName?: string;
  productionBatchNo?: string;
}

/** 统一出入库列表的数据库行结构。 */
interface TransactionRow extends RowDataPacket {
  id: string;
  transaction_type: 'inbound' | 'outbound';
  material_batch_id: number;
  material_batch_no: string;
  material_product_id: number;
  material_model: string;
  material_name: string;
  supplier_name: string | null;
  protocol_code: string | null;
  quantity: string | number;
  unit: string | null;
  production_batch_id: number | null;
  production_batch_no: string | null;
  order_no: string | null;
  recorded_by_name: string | null;
  recorded_at: Date;
  remark: string | null;
}

interface DemandRow extends RowDataPacket {
  usage_id: number;
  production_batch_id: number;
  production_batch_no: string;
  order_no: string;
  product_material_id: number;
  material_product_id: number;
  material_model: string;
  material_name: string;
  material_batch_id: number;
  material_batch_no: string;
  reserved_quantity: string | number;
  used_quantity: string | number;
  remaining_quantity: string | number;
  unit: string | null;
}

@Injectable()
export class MaterialTransactionRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  async list(filters: TransactionFilters, pagination: PaginationOptions) {
    const { where, params } = this.buildFilters(filters);
    // 入库来自 material_batches，生产出库来自 batch_material_usages，后端统一成同一列表口径。
    const source = this.transactionSource();
    const [count] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM (${source}) tx WHERE ${where}`,
      params,
    );
    const rows = await this.database.query<TransactionRow[]>(
      `
      SELECT *
      FROM (${source}) tx
      WHERE ${where}
      ORDER BY tx.recorded_at DESC, tx.id DESC
      LIMIT ? OFFSET ?
      `,
      [...params, pagination.pageSize, pagination.offset],
    );

    return toPageResult(rows.map(mapTransaction), Number(count?.total ?? 0), pagination);
  }

  async listDemandOptions(): Promise<MaterialTransactionDemandOption[]> {
    const rows = await this.database.query<DemandRow[]>(
      `
      SELECT
        bmu.id AS usage_id,
        b.id AS production_batch_id,
        b.batch_no AS production_batch_no,
        wo.order_no,
        pm.id AS product_material_id,
        pm.material_product_id,
        p.product_model AS material_model,
        p.product_name AS material_name,
        mb.id AS material_batch_id,
        mb.material_batch_no,
        bmu.reserved_quantity,
        bmu.used_quantity,
        GREATEST(bmu.reserved_quantity - bmu.used_quantity, 0) AS remaining_quantity,
        COALESCE(bmu.unit, pm.unit, p.unit) AS unit
      FROM batch_material_usages bmu
      INNER JOIN production_batches b ON b.id = bmu.batch_id AND b.is_deleted = 0
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN product_materials pm ON pm.id = bmu.product_materials_id AND pm.is_deleted = 0
      INNER JOIN products p ON p.id = pm.material_product_id AND p.is_deleted = 0
      INNER JOIN material_batches mb ON mb.id = bmu.material_batch_id AND mb.is_deleted = 0
      WHERE bmu.is_deleted = 0 AND bmu.status <> 'cancelled'
      ORDER BY b.id DESC, p.product_model ASC
      `,
    );
    return rows.map((row) => ({
      usageId: String(row.usage_id),
      productionBatchId: String(row.production_batch_id),
      productionBatchNo: row.production_batch_no,
      workOrderNo: row.order_no,
      productMaterialId: String(row.product_material_id),
      materialProductId: String(row.material_product_id),
      materialModel: row.material_model,
      materialName: row.material_name,
      materialBatchId: String(row.material_batch_id),
      materialBatchNo: row.material_batch_no,
      reservedQuantity: decimal(row.reserved_quantity),
      usedQuantity: decimal(row.used_quantity),
      remainingQuantity: decimal(row.remaining_quantity),
      unit: row.unit,
    }));
  }

  async inbound(payload: MaterialInboundPayload, userId: number) {
    const productId = positiveId(payload.productId, '请选择物料');
    const batchNo = required(payload.materialBatchNo, '请填写物料批次号');
    const quantity = positiveDecimal(payload.quantity, '入库数量必须大于0');
    const [existing] = await this.database.query<
      (RowDataPacket & { id: number; product_id: number })[]
    >(
      'SELECT id, product_id FROM material_batches WHERE material_batch_no = ? AND is_deleted = 0 LIMIT 1',
      [batchNo],
    );
    if (existing && existing.product_id !== productId) {
      throw new ConflictException('该批次号已被其他物料使用');
    }

    // 相同物料批次再次入库时累加库存，同时更新本批次的供应商和技术协议快照。
    if (existing) {
      this.auditContext.setBeforeData(await this.getMaterialBatchAuditSnapshot(existing.id));
      await this.database.execute(
        `
        UPDATE material_batches
        SET quantity = quantity + ?,
          supplier_name = COALESCE(?, supplier_name),
          protocol_code = COALESCE(?, protocol_code),
          received_date = COALESCE(?, received_date),
          remark = COALESCE(?, remark),
          status = 'available',
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ? AND is_deleted = 0
        `,
        [
          quantity,
          optional(payload.supplierName),
          optional(payload.protocolCode),
          optional(payload.receivedDate),
          optional(payload.remark),
          userId,
          existing.id,
        ],
      );
      this.auditContext.setAfterData(await this.getMaterialBatchAuditSnapshot(existing.id));
      return { materialBatchId: String(existing.id) };
    }

    const result = (await this.database.execute(
      `
      INSERT INTO material_batches (
        product_id, material_batch_no, supplier_name, protocol_code, received_date,
        quantity, status, remark, created_by, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'available', ?, ?, NOW(), NOW())
      `,
      [
        productId,
        batchNo,
        optional(payload.supplierName),
        optional(payload.protocolCode),
        optional(payload.receivedDate),
        quantity,
        optional(payload.remark),
        userId,
      ],
    )) as ResultSetHeader;
    this.auditContext.setAfterData(await this.getMaterialBatchAuditSnapshot(result.insertId));
    return { materialBatchId: String(result.insertId) };
  }

  async outbound(payload: MaterialOutboundPayload, userId: number) {
    const usageId = positiveId(payload.usageId, '请选择物料需求');
    const quantity = positiveDecimal(payload.quantity, '出库数量必须大于0');
    // 锁定需求和库存，保证累计出库与库存扣减在同一事务内完成。
    await this.database.transaction(async (connection) => {
      const usage = await this.lockUsage(connection, usageId);
      this.auditContext.setBeforeData(usage);
      const remaining = number(usage.reserved_quantity) - number(usage.used_quantity);
      if (number(quantity) > remaining) {
        throw new BadRequestException('出库数量不能超过剩余预留数量');
      }
      if (number(quantity) > number(usage.stock_quantity)) {
        throw new BadRequestException('出库数量不能超过当前库存数量');
      }
      const nextUsed = number(usage.used_quantity) + number(quantity);
      await execute(
        connection,
        `
        UPDATE batch_material_usages
        SET used_quantity = ?,
          status = CASE WHEN ? >= reserved_quantity THEN 'used' ELSE 'part_used' END,
          recorded_by = ?,
          recorded_at = NOW(),
          remark = COALESCE(?, remark),
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [nextUsed.toFixed(4), nextUsed, userId, optional(payload.remark), userId, usageId],
      );
      await execute(
        connection,
        `
        UPDATE material_batches
        SET quantity = quantity - ?,
          status = CASE WHEN quantity - ? <= 0 THEN 'used_up' ELSE 'partial_used' END,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [quantity, quantity, userId, usage.material_batch_id],
      );
    });
    this.auditContext.setAfterData(await this.getUsageAuditSnapshot(usageId));
    return { success: true };
  }

  async returnMaterial(payload: MaterialReturnPayload, userId: number) {
    const usageId = positiveId(payload.usageId, '请选择物料需求');
    const quantity = positiveDecimal(payload.quantity, '退料数量必须大于0');
    const reason = required(payload.reason, '请填写退料原因');
    // 退料反向减少累计使用量并回补同一个物料批次库存。
    await this.database.transaction(async (connection) => {
      const usage = await this.lockUsage(connection, usageId);
      this.auditContext.setBeforeData(usage);
      if (number(quantity) > number(usage.used_quantity)) {
        throw new BadRequestException('退料数量不能超过累计出库数量');
      }
      const nextUsed = number(usage.used_quantity) - number(quantity);
      const remark = [reason, optional(payload.remark)].filter(Boolean).join('；');
      await execute(
        connection,
        `
        UPDATE batch_material_usages
        SET used_quantity = ?,
          status = CASE
            WHEN ? <= 0 THEN 'reserved'
            WHEN ? < reserved_quantity THEN 'part_used'
            ELSE 'used'
          END,
          recorded_by = ?,
          recorded_at = NOW(),
          remark = ?,
          updated_by = ?,
          updated_at = NOW()
        WHERE id = ?
        `,
        [nextUsed.toFixed(4), nextUsed, nextUsed, userId, remark, userId, usageId],
      );
      await execute(
        connection,
        `UPDATE material_batches SET quantity = quantity + ?, status = 'available', updated_by = ?, updated_at = NOW() WHERE id = ?`,
        [quantity, userId, usage.material_batch_id],
      );
    });
    this.auditContext.setAfterData(await this.getUsageAuditSnapshot(usageId));
    return { success: true };
  }

  private async getMaterialBatchAuditSnapshot(materialBatchId: number) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT
        id, product_id, material_batch_no, supplier_name, protocol_code,
        received_date, quantity, status, remark, updated_by, updated_at
      FROM material_batches
      WHERE id = ? AND is_deleted = 0
      LIMIT 1
    `,
      [materialBatchId],
    );
    return row ?? null;
  }

  private async getUsageAuditSnapshot(usageId: number) {
    const [row] = await this.database.query<RowDataPacket[]>(
      `
      SELECT
        bmu.id AS usage_id,
        bmu.batch_id,
        bmu.material_batch_id,
        bmu.reserved_quantity,
        bmu.used_quantity,
        bmu.status AS usage_status,
        mb.material_batch_no,
        mb.quantity AS stock_quantity,
        mb.status AS material_batch_status
      FROM batch_material_usages bmu
      INNER JOIN material_batches mb ON mb.id = bmu.material_batch_id AND mb.is_deleted = 0
      WHERE bmu.id = ? AND bmu.is_deleted = 0
      LIMIT 1
    `,
      [usageId],
    );
    return row ?? null;
  }

  private async lockUsage(connection: Parameters<typeof query>[0], usageId: number) {
    const [row] = await query<
      (RowDataPacket & {
        material_batch_id: number;
        reserved_quantity: string | number;
        used_quantity: string | number;
        stock_quantity: string | number;
      })[]
    >(
      connection,
      `
      SELECT bmu.material_batch_id, bmu.reserved_quantity, bmu.used_quantity, mb.quantity AS stock_quantity
      FROM batch_material_usages bmu
      INNER JOIN material_batches mb ON mb.id = bmu.material_batch_id AND mb.is_deleted = 0
      WHERE bmu.id = ? AND bmu.is_deleted = 0
      FOR UPDATE
      `,
      [usageId],
    );
    if (!row) {
      throw new NotFoundException('物料需求或已分配物料批次不存在');
    }
    return row;
  }

  private buildFilters(filters: TransactionFilters) {
    const clauses = ['1 = 1'];
    const params: QueryParam[] = [];
    if (filters.keyword?.trim()) {
      clauses.push('(tx.material_model LIKE ? OR tx.material_name LIKE ?)');
      const keyword = `%${filters.keyword.trim()}%`;
      params.push(keyword, keyword);
    }
    if (filters.transactionType === 'inbound' || filters.transactionType === 'outbound') {
      clauses.push('tx.transaction_type = ?');
      params.push(filters.transactionType);
    }
    if (filters.materialBatchNo?.trim()) {
      clauses.push('tx.material_batch_no LIKE ?');
      params.push(`%${filters.materialBatchNo.trim()}%`);
    }
    if (filters.supplierName?.trim()) {
      clauses.push('tx.supplier_name LIKE ?');
      params.push(`%${filters.supplierName.trim()}%`);
    }
    if (filters.productionBatchNo?.trim()) {
      clauses.push('tx.production_batch_no LIKE ?');
      params.push(`%${filters.productionBatchNo.trim()}%`);
    }
    return { where: clauses.join(' AND '), params };
  }

  private transactionSource() {
    // 轻量系统不新增流水表：该 UNION 只用于整合当前入库批次与累计生产出库记录。
    return `
      SELECT
        CONCAT('inbound-', mb.id) AS id,
        'inbound' AS transaction_type,
        mb.id AS material_batch_id,
        mb.material_batch_no,
        mb.product_id AS material_product_id,
        p.product_model AS material_model,
        p.product_name AS material_name,
        mb.supplier_name,
        mb.protocol_code,
        mb.quantity,
        p.unit,
        NULL AS production_batch_id,
        NULL AS production_batch_no,
        NULL AS order_no,
        creator.display_name AS recorded_by_name,
        COALESCE(CAST(mb.received_date AS DATETIME), mb.created_at) AS recorded_at,
        mb.remark
      FROM material_batches mb
      INNER JOIN products p ON p.id = mb.product_id AND p.is_deleted = 0
      LEFT JOIN users creator ON creator.id = mb.created_by
      WHERE mb.is_deleted = 0
      UNION ALL
      SELECT
        CONCAT('outbound-', bmu.id) AS id,
        'outbound' AS transaction_type,
        mb.id AS material_batch_id,
        mb.material_batch_no,
        pm.material_product_id,
        p.product_model AS material_model,
        p.product_name AS material_name,
        mb.supplier_name,
        mb.protocol_code,
        bmu.used_quantity AS quantity,
        COALESCE(bmu.unit, pm.unit, p.unit) AS unit,
        b.id AS production_batch_id,
        b.batch_no AS production_batch_no,
        wo.order_no,
        recorder.display_name AS recorded_by_name,
        COALESCE(bmu.recorded_at, bmu.updated_at) AS recorded_at,
        bmu.remark
      FROM batch_material_usages bmu
      INNER JOIN material_batches mb ON mb.id = bmu.material_batch_id AND mb.is_deleted = 0
      INNER JOIN product_materials pm ON pm.id = bmu.product_materials_id AND pm.is_deleted = 0
      INNER JOIN products p ON p.id = pm.material_product_id AND p.is_deleted = 0
      INNER JOIN production_batches b ON b.id = bmu.batch_id AND b.is_deleted = 0
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      LEFT JOIN users recorder ON recorder.id = bmu.recorded_by
      WHERE bmu.is_deleted = 0 AND bmu.used_quantity > 0
    `;
  }
}

const mapTransaction = (row: TransactionRow): MaterialTransactionListItem => ({
  id: row.id,
  transactionType: row.transaction_type,
  materialBatchId: String(row.material_batch_id),
  materialBatchNo: row.material_batch_no,
  materialProductId: String(row.material_product_id),
  materialModel: row.material_model,
  materialName: row.material_name,
  supplierName: row.supplier_name,
  protocolCode: row.protocol_code,
  quantity: decimal(row.quantity),
  unit: row.unit,
  productionBatchId: row.production_batch_id === null ? null : String(row.production_batch_id),
  productionBatchNo: row.production_batch_no,
  workOrderNo: row.order_no,
  recordedByName: row.recorded_by_name,
  recordedAt: row.recorded_at.toISOString(),
  remark: row.remark,
});

const positiveId = (value: string | number | null | undefined, message: string) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new BadRequestException(message);
  return id;
};
const required = (value: string | null | undefined, message: string) => {
  const normalized = value?.trim();
  if (!normalized) throw new BadRequestException(message);
  return normalized;
};
const optional = (value: string | null | undefined) => value?.trim() || null;
const positiveDecimal = (value: string | number | null | undefined, message: string) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException(message);
  return amount.toFixed(4);
};
const number = (value: string | number | null | undefined) => Number(value ?? 0);
const decimal = (value: string | number | null | undefined) => number(value).toFixed(4);
