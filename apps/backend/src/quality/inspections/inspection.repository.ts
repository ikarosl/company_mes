import type {
  InspectionDisposition,
  InspectionListItem,
  InspectionObjectType,
  InspectionResult,
  InspectionTargetOption,
  InspectionType,
  SaveInspectionPayload,
} from '@company/api-contract';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../../database/database.service.js';
import { AuditContextService } from '../../operation-log/audit-context.service.js';
import { execute } from '../../shared/repository.helpers.js';
import { type PaginationOptions, toPageResult } from '../../shared/request-utils.js';

interface InspectionFilters {
  keyword?: string;
  inspectionType?: string;
  result?: string;
  batchId?: string;
  materialBatchId?: string;
}

interface InspectionRow extends RowDataPacket {
  id: number;
  inspection_no: string | null;
  inspection_object_type: InspectionObjectType;
  inspection_type: InspectionType;
  inspection_name: string | null;
  batch_id: number | null;
  material_batch_id: number | null;
  product_inventory_id: number | null;
  product_id_snapshot: number | null;
  related_inspection_id: number | null;
  batch_step_record_id: number | null;
  inspect_quantity: string | number | null;
  pass_quantity: string | number | null;
  fail_quantity: string | number | null;
  result: InspectionResult;
  disposition: InspectionDisposition | null;
  inspector_id: number | null;
  inspected_at: Date;
  file_url: string | null;
  result_summary: string | null;
  remark: string | null;
  material_batch_no: string | null;
  production_batch_no: string | null;
  work_order_no: string | null;
  product_model: string | null;
  product_name: string | null;
  step_name: string | null;
  step_order: number | null;
  inspector_name: string | null;
  created_at: Date;
  updated_at: Date | null;
  rework_count: number;
}

interface TargetRow extends RowDataPacket {
  id: number;
  target_type: InspectionTargetOption['targetType'];
  label: string;
  batch_id: number | null;
  product_id: number | null;
  product_model: string | null;
  product_name: string | null;
  step_name: string | null;
  step_order: number | null;
  quantity: string | number | null;
}

interface TargetIdentityRow extends RowDataPacket {
  id: number;
  batch_id: number | null;
  product_id: number | null;
  need_inspection: number | null;
  material_batch_id: number | null;
  product_inventory_id: number | null;
  batch_step_record_id: number | null;
  inspection_object_type: InspectionObjectType | null;
  result: InspectionResult | null;
}

const inspectionTypes: InspectionType[] = [
  'incoming_material',
  'first_article',
  'process',
  'final',
  'package',
  'test',
  'recheck',
];
const results: InspectionResult[] = ['pass', 'fail', 'partial_pass'];
const dispositions: InspectionDisposition[] = [
  'accept',
  'reject',
  'conditional_accept',
  'rework',
  'scrap',
  'return_supplier',
  'hold',
];

@Injectable()
export class InspectionRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
  ) {}

  async list(filters: InspectionFilters, pagination: PaginationOptions) {
    const { where, params } = this.filters(filters);
    const [count] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) AS total FROM inspection_records inspection WHERE ${where}`,
      params,
    );
    const rows = await this.database.query<InspectionRow[]>(
      `${this.source()} WHERE ${where} ORDER BY inspection.inspected_at DESC, inspection.id DESC LIMIT ? OFFSET ?`,
      [...params, pagination.pageSize, pagination.offset],
    );
    return toPageResult(rows.map(mapInspection), Number(count?.total ?? 0), pagination);
  }

  async get(id: number) {
    const [row] = await this.database.query<InspectionRow[]>(
      `${this.source()} WHERE inspection.id = ? AND inspection.is_deleted = 0`,
      [id],
    );
    if (!row) throw new NotFoundException('检验记录不存在');
    return mapInspection(row);
  }

  async listTargets(
    targetType?: string,
    batchId?: string,
    keyword?: string,
  ): Promise<InspectionTargetOption[]> {
    const kind = targetType || 'production_batch';
    const like = `%${keyword?.trim() || ''}%`;
    let sql = '';
    const params: QueryParam[] = [];
    if (kind === 'material_batch') {
      sql = `SELECT mb.id, 'material_batch' target_type, CONCAT(mb.material_batch_no, ' / ', p.product_model, ' ', p.product_name) label,
        NULL batch_id, p.id product_id, p.product_model, p.product_name, NULL step_name, NULL step_order,
        COALESCE(mb.initial_quantity, mb.quantity) quantity
        FROM material_batches mb JOIN products p ON p.id=mb.product_id AND p.is_deleted=0
        WHERE mb.is_deleted=0 AND (mb.material_batch_no LIKE ? OR p.product_model LIKE ? OR p.product_name LIKE ?) ORDER BY mb.id DESC LIMIT 100`;
      params.push(like, like, like);
    } else if (kind === 'batch_step') {
      const id = positiveId(batchId, '请先选择生产批次');
      sql = `SELECT bsr.id, 'batch_step' target_type, CONCAT(prs.step_order, '. ', ps.step_name) label,
        bsr.batch_id, NULL product_id, NULL product_model, NULL product_name, ps.step_name, prs.step_order,
        NULL quantity
        FROM batch_step_records bsr JOIN process_route_steps prs ON prs.id=bsr.process_route_steps_id AND prs.is_deleted=0
        JOIN process_steps ps ON ps.id=prs.process_step_id AND ps.is_deleted=0
        WHERE bsr.is_deleted=0 AND bsr.batch_id=? ORDER BY prs.step_order`;
      params.push(id);
    } else if (kind === 'product_inventory') {
      sql = `SELECT pib.id, 'product_inventory' target_type, CONCAT(COALESCE(pib.inventory_batch_no, '-'), ' / ', p.product_model, ' ', p.product_name) label,
        pib.batch_id, p.id product_id, p.product_model, p.product_name, NULL step_name, NULL step_order,
        pib.quantity
        FROM product_inventory_batches pib JOIN products p ON p.id=pib.product_id AND p.is_deleted=0
        WHERE pib.is_deleted=0 AND (COALESCE(pib.inventory_batch_no,'') LIKE ? OR p.product_model LIKE ? OR p.product_name LIKE ?) ORDER BY pib.id DESC LIMIT 100`;
      params.push(like, like, like);
    } else if (kind === 'inspection') {
      sql = `SELECT inspection.id, 'inspection' target_type, CONCAT(inspection.inspection_no, ' / ', inspection.inspection_type) label,
        inspection.batch_id, inspection.product_id_snapshot product_id, p.product_model, p.product_name, NULL step_name, NULL step_order,
        inspection.inspect_quantity quantity
        FROM inspection_records inspection LEFT JOIN products p ON p.id=inspection.product_id_snapshot
        WHERE inspection.is_deleted=0 AND inspection.result IN ('fail','partial_pass')
        AND inspection.inspection_no LIKE ? ORDER BY inspection.id DESC LIMIT 100`;
      params.push(like);
    } else {
      sql = `SELECT pb.id, 'production_batch' target_type, CONCAT(pb.batch_no, ' / ', wo.order_no, ' / ', p.product_model, ' ', p.product_name) label,
        pb.id batch_id, p.id product_id, p.product_model, p.product_name, NULL step_name, NULL step_order,
        pb.planned_quantity quantity
        FROM production_batches pb JOIN work_orders wo ON wo.id=pb.work_order_id AND wo.is_deleted=0
        JOIN products p ON p.id=wo.product_id AND p.is_deleted=0
        WHERE pb.is_deleted=0 AND (pb.batch_no LIKE ? OR wo.order_no LIKE ? OR p.product_model LIKE ? OR p.product_name LIKE ?) ORDER BY pb.id DESC LIMIT 100`;
      params.push(like, like, like, like);
    }
    const rows = await this.database.query<TargetRow[]>(sql, params);
    return rows.map((row) => ({
      id: String(row.id),
      targetType: row.target_type,
      label: row.label,
      batchId: nullableString(row.batch_id),
      productId: nullableString(row.product_id),
      productModel: row.product_model,
      productName: row.product_name,
      stepName: row.step_name,
      stepOrder: row.step_order,
      quantity: row.quantity === null ? null : Number(row.quantity),
    }));
  }

  async create(payload: SaveInspectionPayload, userId: number) {
    const value = await this.normalize(payload);
    const result = await execute(
      this.database,
      `INSERT INTO inspection_records (
      batch_id, material_batch_id, product_inventory_id, product_id_snapshot, related_inspection_id,
      inspection_no, inspection_object_type, inspection_type, inspection_name, batch_step_record_id,
      inspect_quantity, pass_quantity, fail_quantity, result, disposition, inspector_id, inspected_at,
      file_url, result_summary, remark, created_by, created_at, updated_by, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,COALESCE(?,NOW()),?,?,?,?,NOW(),?,NOW())`,
      [
        value.batchId,
        value.materialBatchId,
        value.productInventoryId,
        value.productId,
        value.relatedInspectionId,
        makeInspectionNo(value.inspectionType),
        value.objectType,
        value.inspectionType,
        value.inspectionName,
        value.batchStepRecordId,
        value.inspectQuantity,
        value.passQuantity,
        value.failQuantity,
        value.result,
        value.disposition,
      value.inspectorId ?? userId,
        value.inspectedAt,
        value.fileUrl,
        value.resultSummary,
        value.remark,
        userId,
        userId,
      ],
    );
    return this.get(result.insertId);
  }

  async update(id: number, payload: SaveInspectionPayload, userId: number) {
    const before = await this.get(id);
    this.auditContext.setBeforeData(before);
    const value = await this.normalize(payload, id);
    await this.assertReworkSourceImmutable(id, before, value);
    await execute(
      this.database,
      `UPDATE inspection_records SET batch_id=?, material_batch_id=?, product_inventory_id=?,
      product_id_snapshot=?, related_inspection_id=?, inspection_object_type=?, inspection_type=?, inspection_name=?,
      batch_step_record_id=?, inspect_quantity=?, pass_quantity=?, fail_quantity=?, result=?, disposition=?, inspector_id=?,
      inspected_at=COALESCE(?,inspected_at), file_url=?, result_summary=?, remark=?, updated_by=?, updated_at=NOW()
      WHERE id=? AND is_deleted=0`,
      [
        value.batchId,
        value.materialBatchId,
        value.productInventoryId,
        value.productId,
        value.relatedInspectionId,
        value.objectType,
        value.inspectionType,
        value.inspectionName,
        value.batchStepRecordId,
        value.inspectQuantity,
        value.passQuantity,
        value.failQuantity,
        value.result,
        value.disposition,
      value.inspectorId ?? userId,
        value.inspectedAt,
        value.fileUrl,
        value.resultSummary,
        value.remark,
        userId,
        id,
      ],
    );
    const after = await this.get(id);
    this.auditContext.setAfterData(after);
    return after;
  }

  /** 统一解析目标关系，防止前端篡改 ID 后把检验记录挂到错误批次或工序。 */
  private async normalize(payload: SaveInspectionPayload, editingId?: number) {
    const inspectionType = enumValue(payload.inspectionType, inspectionTypes, '检验类型无效');
    const result = enumValue(payload.result, results, '检验结果无效');
    let disposition = payload.disposition
      ? enumValue(payload.disposition, dispositions, '处置方式无效')
      : null;
    const inspectQuantity = quantity(payload.inspectQuantity, '检验数量');
    const passQuantity = quantity(payload.passQuantity, '合格数量');
    const failQuantity = quantity(payload.failQuantity, '不合格数量');
    disposition = validateInspectionOutcome(
      inspectionType, result, disposition, inspectQuantity, passQuantity, failQuantity,
    );
    let batchId = nullablePositiveId(payload.batchId, '生产批次无效');
    let materialBatchId = nullablePositiveId(payload.materialBatchId, '物料批次无效');
    let productInventoryId = nullablePositiveId(payload.productInventoryId, '产品库存无效');
    let relatedInspectionId = nullablePositiveId(payload.relatedInspectionId, '原检验记录无效');
    let batchStepRecordId = nullablePositiveId(payload.batchStepRecordId, '工序记录无效');
    let productId: number | null = null;
    let objectType: InspectionObjectType = 'production_batch';

    if (inspectionType === 'incoming_material') {
      materialBatchId = requiredId(materialBatchId, '来料检验必须选择物料入库批次');
      const target = await this.identity('material', materialBatchId);
      productId = target.product_id;
      batchId = null;
      batchStepRecordId = null;
      objectType = 'material_batch';
      const [duplicate] = await this.database.query<(RowDataPacket & { id: number })[]>(
        `SELECT id FROM inspection_records WHERE material_batch_id=? AND inspection_type='incoming_material'
         AND is_deleted=0${editingId ? ' AND id<>?' : ''} LIMIT 1`,
        editingId ? [materialBatchId, editingId] : [materialBatchId],
      );
      if (duplicate) throw new BadRequestException('该物料批次已有来料检验，请编辑原记录或创建复检');
    } else if (inspectionType === 'recheck') {
      relatedInspectionId = requiredId(relatedInspectionId, '复检必须选择原检验记录');
      const original = await this.identity('inspection', relatedInspectionId);
      if (original.result === 'pass') throw new BadRequestException('原检验已经合格，不需要复检');
      batchId = original.batch_id;
      productId = original.product_id;
      materialBatchId = original.material_batch_id;
      productInventoryId = original.product_inventory_id;
      batchStepRecordId = original.batch_step_record_id;
      objectType = original.inspection_object_type ?? (batchId ? 'production_batch' : 'material_batch');
    } else {
      if (inspectionType === 'package' && productInventoryId) {
        const inventory = await this.identity('inventory', productInventoryId);
        batchId = inventory.batch_id;
        productId = inventory.product_id;
        objectType = 'product_inventory';
      } else {
        batchId = requiredId(batchId, '该检验类型必须选择生产批次');
        const batch = await this.identity('batch', batchId);
        productId = batch.product_id;
      }
      if (inspectionType === 'process') {
        batchStepRecordId = requiredId(batchStepRecordId, '过程检验必须选择对应的检验工序');
        const step = await this.identity('step', batchStepRecordId);
        if (step.batch_id !== batchId) throw new BadRequestException('所选工序不属于当前生产批次');
        objectType = 'batch_step';
      } else if (inspectionType === 'first_article' && batchStepRecordId) {
        const step = await this.identity('step', batchStepRecordId);
        if (step.batch_id !== batchId) throw new BadRequestException('所选工序不属于当前生产批次');
        objectType = 'batch_step';
      }
      if (inspectionType === 'first_article' && !payload.remark?.trim())
        throw new BadRequestException('请填写首检原因');
      if (inspectionType === 'package' && productInventoryId && batchId) {
        const inventory = await this.identity('inventory', productInventoryId);
        if (inventory.batch_id && inventory.batch_id !== batchId)
          throw new BadRequestException('所选产品库存不属于当前生产批次');
        objectType = 'product_inventory';
      }
    }
    return {
      inspectionType,
      objectType,
      batchId,
      materialBatchId,
      productInventoryId,
      relatedInspectionId,
      batchStepRecordId,
      productId,
      inspectionName: optional(payload.inspectionName),
      inspectQuantity,
      passQuantity,
      failQuantity,
      result,
      disposition,
      inspectorId: nullablePositiveId(payload.inspectorId, '检验人员无效'),
      inspectedAt: optional(payload.inspectedAt),
      fileUrl: optional(payload.fileUrl),
      resultSummary: optional(payload.resultSummary),
      remark: optional(payload.remark),
    };
  }

  private async identity(
    kind: 'material' | 'batch' | 'step' | 'inventory' | 'inspection',
    id: number,
  ) {
    const sources = {
      material:
        "SELECT id,NULL batch_id,product_id,NULL need_inspection,id material_batch_id,NULL product_inventory_id,NULL batch_step_record_id,'material_batch' inspection_object_type,NULL result FROM material_batches WHERE id=? AND is_deleted=0",
      batch:
        "SELECT pb.id,pb.id batch_id,wo.product_id,NULL need_inspection,NULL material_batch_id,NULL product_inventory_id,NULL batch_step_record_id,'production_batch' inspection_object_type,NULL result FROM production_batches pb JOIN work_orders wo ON wo.id=pb.work_order_id WHERE pb.id=? AND pb.is_deleted=0",
      step: "SELECT bsr.id,bsr.batch_id,NULL product_id,prs.need_inspection,NULL material_batch_id,NULL product_inventory_id,bsr.id batch_step_record_id,'batch_step' inspection_object_type,NULL result FROM batch_step_records bsr JOIN process_route_steps prs ON prs.id=bsr.process_route_steps_id WHERE bsr.id=? AND bsr.is_deleted=0",
      inventory:
        "SELECT id,batch_id,product_id,NULL need_inspection,NULL material_batch_id,id product_inventory_id,NULL batch_step_record_id,'product_inventory' inspection_object_type,NULL result FROM product_inventory_batches WHERE id=? AND is_deleted=0",
      inspection:
        'SELECT id,batch_id,product_id_snapshot product_id,NULL need_inspection,material_batch_id,product_inventory_id,batch_step_record_id,inspection_object_type,result FROM inspection_records WHERE id=? AND is_deleted=0',
    };
    const [row] = await this.database.query<TargetIdentityRow[]>(sources[kind], [id]);
    if (!row) throw new BadRequestException('关联的检验对象不存在或已删除');
    return row;
  }

  private filters(filters: InspectionFilters) {
    const clauses = ['inspection.is_deleted = 0'];
    const params: QueryParam[] = [];
    if (filters.inspectionType) {
      enumValue(filters.inspectionType, inspectionTypes, '检验类型无效');
      clauses.push('inspection.inspection_type=?');
      params.push(filters.inspectionType);
    }
    if (filters.result) {
      enumValue(filters.result, results, '检验结果无效');
      clauses.push('inspection.result=?');
      params.push(filters.result);
    }
    if (filters.batchId) {
      clauses.push('inspection.batch_id=?');
      params.push(positiveId(filters.batchId, '生产批次无效'));
    }
    if (filters.materialBatchId) {
      clauses.push('inspection.material_batch_id=?');
      params.push(positiveId(filters.materialBatchId, '物料批次无效'));
    }
    if (filters.keyword?.trim()) {
      const like = `%${filters.keyword.trim()}%`;
      clauses.push(
        '(inspection.inspection_no LIKE ? OR inspection.inspection_name LIKE ? OR inspection.result_summary LIKE ? OR inspection.remark LIKE ?)',
      );
      params.push(like, like, like, like);
    }
    return { where: clauses.join(' AND '), params };
  }

  private source() {
    return `SELECT inspection.*, mb.material_batch_no, pb.batch_no production_batch_no,
    wo.order_no work_order_no, p.product_model, p.product_name, ps.step_name, prs.step_order,
    u.display_name inspector_name,
    (SELECT COUNT(*) FROM rework_records rw WHERE rw.source_inspection_id=inspection.id AND rw.is_deleted=0) rework_count
    FROM inspection_records inspection
    LEFT JOIN material_batches mb ON mb.id=inspection.material_batch_id
    LEFT JOIN production_batches pb ON pb.id=inspection.batch_id
    LEFT JOIN work_orders wo ON wo.id=pb.work_order_id
    LEFT JOIN products p ON p.id=inspection.product_id_snapshot
    LEFT JOIN batch_step_records bsr ON bsr.id=inspection.batch_step_record_id
    LEFT JOIN process_route_steps prs ON prs.id=bsr.process_route_steps_id
    LEFT JOIN process_steps ps ON ps.id=prs.process_step_id
    LEFT JOIN users u ON u.id=inspection.inspector_id`;
  }

  /** 已生成返工单后，来源检验的对象、数量、结果和处置不可再改写。 */
  private async assertReworkSourceImmutable(id: number, before: InspectionListItem, value: Awaited<ReturnType<InspectionRepository['normalize']>>) {
    const [row] = await this.database.query<(RowDataPacket & { total: number })[]>(
      'SELECT COUNT(*) total FROM rework_records WHERE source_inspection_id=? AND is_deleted=0', [id],
    );
    if (!Number(row?.total ?? 0)) return;
    const changed = before.inspectionType !== value.inspectionType
      || before.batchId !== nullableString(value.batchId)
      || before.materialBatchId !== nullableString(value.materialBatchId)
      || before.productInventoryId !== nullableString(value.productInventoryId)
      || before.batchStepRecordId !== nullableString(value.batchStepRecordId)
      || before.inspectQuantity !== value.inspectQuantity || before.passQuantity !== value.passQuantity
      || before.failQuantity !== value.failQuantity || before.result !== value.result
      || before.disposition !== value.disposition;
    if (changed) throw new BadRequestException('该检验已生成返工单，只能补充说明、附件和检验人员信息');
  }
}

const mapInspection = (r: InspectionRow): InspectionListItem => ({
  id: String(r.id),
  inspectionNo: r.inspection_no,
  inspectionObjectType: r.inspection_object_type,
  inspectionType: r.inspection_type,
  inspectionName: r.inspection_name,
  batchId: nullableString(r.batch_id),
  materialBatchId: nullableString(r.material_batch_id),
  productInventoryId: nullableString(r.product_inventory_id),
  productIdSnapshot: nullableString(r.product_id_snapshot),
  relatedInspectionId: nullableString(r.related_inspection_id),
  batchStepRecordId: nullableString(r.batch_step_record_id),
  inspectQuantity: nullableNumber(r.inspect_quantity),
  passQuantity: nullableNumber(r.pass_quantity),
  failQuantity: nullableNumber(r.fail_quantity),
  result: r.result,
  disposition: r.disposition,
  inspectorId: nullableString(r.inspector_id),
  inspectedAt: r.inspected_at.toISOString(),
  fileUrl: r.file_url,
  resultSummary: r.result_summary,
  remark: r.remark,
  materialBatchNo: r.material_batch_no,
  productionBatchNo: r.production_batch_no,
  workOrderNo: r.work_order_no,
  productModel: r.product_model,
  productName: r.product_name,
  stepName: r.step_name,
  stepOrder: r.step_order,
  inspectorName: r.inspector_name,
  reworkCount: Number(r.rework_count ?? 0),
  createdAt: r.created_at.toISOString(),
  updatedAt: r.updated_at?.toISOString() ?? null,
});
const enumValue = <T extends string>(value: string, allowed: readonly T[], message: string): T => {
  if (!allowed.includes(value as T)) throw new BadRequestException(message);
  return value as T;
};
const positiveId = (value: unknown, message: string) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(message);
  return n;
};
const nullablePositiveId = (value: unknown, message: string) =>
  value === null || value === undefined || value === '' ? null : positiveId(value, message);
const requiredId = (value: number | null, message: string) => {
  if (!value) throw new BadRequestException(message);
  return value;
};
const quantity = (value: unknown, label: string) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new BadRequestException(`${label}必须是非负数`);
  return Number(n.toFixed(4));
};
const optional = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
const nullableString = (value: number | null) => (value === null ? null : String(value));
const nullableNumber = (value: string | number | null) => (value === null ? null : Number(value));
/** 数量决定检验结论，检验结论再约束可选处置，避免相互矛盾的数据进入追溯链。 */
const validateInspectionOutcome = (
  inspectionType: InspectionType,
  result: InspectionResult,
  disposition: InspectionDisposition | null,
  inspectQuantity: number | null,
  passQuantity: number | null,
  failQuantity: number | null,
) => {
  if (inspectQuantity === null || passQuantity === null || failQuantity === null || inspectQuantity <= 0) {
    throw new BadRequestException('检验数量、合格数量和不合格数量均为必填，检验数量必须大于0');
  }
  if (Math.abs(passQuantity + failQuantity - inspectQuantity) > 0.00005) {
    throw new BadRequestException('检验数量必须等于合格数量与不合格数量之和');
  }
  const expected: InspectionResult = failQuantity === 0 ? 'pass' : passQuantity === 0 ? 'fail' : 'partial_pass';
  if (result !== expected) throw new BadRequestException('检验结果与合格/不合格数量不一致');
  const allowed: Record<InspectionResult, InspectionDisposition[]> = {
    pass: ['accept'],
    partial_pass: ['conditional_accept', 'rework', 'scrap', 'hold'],
    fail: inspectionType === 'incoming_material'
      ? ['reject', 'return_supplier', 'hold']
      : ['reject', 'rework', 'scrap', 'hold'],
  };
  const fallback: InspectionDisposition = result === 'pass'
    ? 'accept'
    : result === 'partial_pass'
      ? 'conditional_accept'
      : inspectionType === 'incoming_material' ? 'return_supplier' : 'hold';
  const normalized = disposition ?? fallback;
  if (!allowed[result].includes(normalized)) throw new BadRequestException('检验结果与处置方式不一致');
  if (inspectionType === 'incoming_material' && result === 'fail') {
    throw new BadRequestException('完全不合格来料不能形成库存批次，请执行退供或拒收流程');
  }
  return normalized;
};
const makeInspectionNo = (type: InspectionType) => {
  const prefix: Record<InspectionType, string> = {
    incoming_material: 'IQC',
    first_article: 'FAI',
    process: 'IPQC',
    final: 'FQC',
    package: 'PKG',
    test: 'TEST',
    recheck: 'RECHECK',
  };
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${prefix[type]}${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
};
