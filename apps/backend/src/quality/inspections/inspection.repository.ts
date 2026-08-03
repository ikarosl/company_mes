import type {
  InspectionDisposition,
  InspectionListItem,
  InspectionObjectType,
  PendingProcessInspectionItem,
  InspectionResult,
  InspectionTargetOption,
  InspectionType,
  SaveInspectionPayload,
  SubmitProcessInspectionPayload,
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

/** 待过程检验视图行：任务 ID 等同于批次工序记录 ID。 */
interface PendingProcessInspectionRow extends RowDataPacket {
  inspection_task_id: number; batch_id: number; batch_no: string; work_order_id: number;
  order_no: string; product_id: number; product_code: string | null; product_model: string | null;
  product_name: string | null; product_unit: string | null; step_order: number;
  step_code: string | null; step_name: string; sop_file_name: string | null;
  sop_version: string | null; sop_file_url: string | null; responsible_user_name: string | null;
  output_quantity: string | number; abnormal_quantity: string | number;
  suggested_inspect_quantity: string | number; plan_end_date: Date | string | null; completed_at: Date | null;
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
      `SELECT COUNT(*) AS total FROM v_inspection_record_detail inspection WHERE ${where}`,
      params,
    );
    const rows = await this.database.query<InspectionRow[]>(
      `${this.source()} WHERE ${where} ORDER BY inspection.inspected_at DESC, inspection.inspection_id DESC LIMIT ? OFFSET ?`,
      [...params, pagination.pageSize, pagination.offset],
    );
    return toPageResult(rows.map(mapInspection), Number(count?.total ?? 0), pagination);
  }

  /** 查询已派工、需要检验且尚未提交检验结果的工序。 */
  async listPendingProcessTasks(keyword: string | undefined, pagination: PaginationOptions) {
    const params: QueryParam[] = [];
    let where = '1=1';
    if (keyword?.trim()) {
      const like = `%${keyword.trim()}%`;
      where = `(batch_no LIKE ? OR order_no LIKE ? OR product_code LIKE ? OR product_model LIKE ?
        OR product_name LIKE ? OR step_code LIKE ? OR step_name LIKE ?)`;
      params.push(like, like, like, like, like, like, like);
    }
    const [count] = await this.database.query<(RowDataPacket & { total: number })[]>(
      `SELECT COUNT(*) total FROM v_pending_process_inspection WHERE ${where}`, params,
    );
    const rows = await this.database.query<PendingProcessInspectionRow[]>(
      `SELECT pending.*, work_order.plan_end_date
       FROM (SELECT * FROM v_pending_process_inspection WHERE ${where}) pending
       INNER JOIN work_orders work_order ON work_order.id = pending.work_order_id AND work_order.is_deleted = 0
       ORDER BY pending.completed_at ASC, pending.inspection_task_id ASC LIMIT ? OFFSET ?`,
      [...params, pagination.pageSize, pagination.offset],
    );
    return toPageResult(rows.map(mapPendingProcessInspection), Number(count?.total ?? 0), pagination);
  }

  /**
   * 提交唯一过程检验。
   * 锁定需检工序，并在同一事务内完成工序和写入检验记录，防止重复提交或状态不一致。
   */
  async submitPendingProcessTask(id: number, payload: SubmitProcessInspectionPayload, userId: number) {
    const fileUrl = requiredInspectionFileUrl(payload.fileUrl);
    const inspectQuantity = quantity(payload.inspectQuantity, '检验数量');
    const passQuantity = quantity(payload.passQuantity, '合格数量');
    const failQuantity = quantity(payload.failQuantity, '不合格数量');
    const result = enumValue(payload.result, results, '检验结果无效');
    const disposition = validateInspectionOutcome('process', result,
      payload.disposition ? enumValue(payload.disposition, dispositions, '处置方式无效') : null,
      inspectQuantity, passQuantity, failQuantity);
    const inspectionId = await this.database.transaction(async (connection) => {
      const [stepRows] = await connection.query<(RowDataPacket & {
        id: number; batch_id: number; product_id: number; need_inspection: number; status: string;
      })[]>(`SELECT record.id,record.batch_id,work_order.product_id,route_step.need_inspection,record.status
        FROM batch_step_records record
        INNER JOIN process_route_steps route_step ON route_step.id=record.process_route_steps_id
        INNER JOIN production_batches batch ON batch.id=record.batch_id
        INNER JOIN work_orders work_order ON work_order.id=batch.work_order_id
        WHERE record.id=? AND record.is_deleted=0 FOR UPDATE`, [id]);
      const step = stepRows[0];
      if (!step || step.need_inspection !== 1 || !['pending', 'doing', 'completed', 'abnormal'].includes(step.status))
        throw new BadRequestException('待检任务不存在，工序可能尚未完成或无需检验');
      const [duplicateRows] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM inspection_records WHERE batch_step_record_id=?
         AND inspection_type='process' AND is_deleted=0 LIMIT 1`, [id]);
      if (duplicateRows[0]) throw new BadRequestException('该工序已提交过程检验，请刷新任务列表');
      // 检验即该工序的执行动作：工序完成状态与质量记录必须在同一事务内落库。
      await execute(connection, `UPDATE batch_step_records
        SET status=?,started_at=COALESCE(started_at,NOW()),completed_at=NOW(),
          output_quantity=?,abnormal_quantity=?,updated_by=?,updated_at=NOW()
        WHERE id=?`, [result === 'pass' ? 'completed' : 'abnormal', passQuantity, failQuantity, userId, id]);
      const inserted = await execute(connection, `INSERT INTO inspection_records (
        batch_id,product_id_snapshot,inspection_no,inspection_object_type,inspection_type,inspection_name,
        batch_step_record_id,inspect_quantity,pass_quantity,fail_quantity,result,disposition,inspector_id,
        inspected_at,file_url,result_summary,remark,created_by,created_at,updated_by,updated_at
      ) VALUES (?,?,?,'batch_step','process',?,?,?,?,?,?,?,?,COALESCE(?,NOW()),?,?,?,?,NOW(),?,NOW())`, [
        step.batch_id,step.product_id,makeInspectionNo('process'),optional(payload.inspectionName)??'过程检验',
        id,inspectQuantity,passQuantity,failQuantity,result,disposition,userId,optional(payload.inspectedAt),
        fileUrl,optional(payload.resultSummary),optional(payload.remark),userId,userId,
      ]);
      return inserted.insertId;
    });
    return this.get(inspectionId);
  }

  async get(id: number) {
    const [row] = await this.database.query<InspectionRow[]>(
      `${this.source()} WHERE inspection.inspection_id = ?`,
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
      sql = `SELECT step_record_id id, 'batch_step' target_type, CONCAT(step_order, '. ', step_name) label,
        batch_id, product_id, product_model, product_name, step_name, step_order, NULL quantity
        FROM v_batch_step_execution_detail WHERE batch_id=? ORDER BY step_order`;
      params.push(id);
    } else if (kind === 'product_inventory') {
      sql = `SELECT product_inventory_id id, 'product_inventory' target_type,
        CONCAT(COALESCE(inventory_batch_no, '-'), ' / ', product_model, ' ', product_name) label,
        batch_id, product_id, product_model, product_name, NULL step_name, NULL step_order, stock_quantity quantity
        FROM v_product_inventory_available
        WHERE COALESCE(inventory_batch_no,'') LIKE ? OR product_model LIKE ? OR product_name LIKE ?
        ORDER BY product_inventory_id DESC LIMIT 100`;
      params.push(like, like, like);
    } else if (kind === 'inspection') {
      sql = `SELECT inspection_id id, 'inspection' target_type, CONCAT(inspection_no, ' / ', inspection_type) label,
        batch_id, product_id, product_model, product_name, step_name, step_order, inspect_quantity quantity
        FROM v_inspection_record_detail WHERE result IN ('fail','partial_pass')
        AND inspection_no LIKE ? ORDER BY inspection_id DESC LIMIT 100`;
      params.push(like);
    } else {
      sql = `SELECT batch_id id, 'production_batch' target_type,
        CONCAT(batch_no, ' / ', order_no, ' / ', product_model, ' ', product_name) label,
        batch_id, product_id, product_model, product_name, NULL step_name, NULL step_order,
        planned_quantity quantity FROM v_production_batch_overview
        WHERE batch_no LIKE ? OR order_no LIKE ? OR product_model LIKE ? OR product_name LIKE ?
        ORDER BY batch_id DESC LIMIT 100`;
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
    const fileUrl = requiredInspectionFileUrl(payload.fileUrl);
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
      fileUrl,
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
    // 详情视图已经统一排除软删除记录，这里仅追加业务筛选条件。
    const clauses = ['1 = 1'];
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
    return `SELECT inspection.inspection_id id, inspection.*,
      inspection.batch_no production_batch_no, inspection.order_no work_order_no
      FROM v_inspection_record_detail inspection`;
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
/** 将待检视图字段转换为公共契约。 */
const mapPendingProcessInspection = (row: PendingProcessInspectionRow): PendingProcessInspectionItem => ({
  id:String(row.inspection_task_id),batchId:String(row.batch_id),batchNo:row.batch_no,
  workOrderId:String(row.work_order_id),workOrderNo:row.order_no,productId:String(row.product_id),
  productCode:row.product_code,productModel:row.product_model,productName:row.product_name,
  productUnit:row.product_unit,stepOrder:Number(row.step_order),stepCode:row.step_code,stepName:row.step_name,
  sopFileName:row.sop_file_name,sopVersion:row.sop_version,sopFileUrl:row.sop_file_url,
  responsibleUserName:row.responsible_user_name,outputQuantity:Number(row.output_quantity??0),
  abnormalQuantity:Number(row.abnormal_quantity??0),suggestedInspectQuantity:Number(row.suggested_inspect_quantity??0),
  planEndDate:row.plan_end_date instanceof Date
    ? row.plan_end_date.toISOString().slice(0,10)
    : row.plan_end_date ? String(row.plan_end_date).slice(0,10) : null,
  completedAt:row.completed_at?.toISOString()??null,
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
/** 检验记录必须保留检测依据文件，禁止仅由前端控制必填。 */
const requiredInspectionFileUrl = (value: unknown) => {
  const fileUrl = optional(value);
  if (!fileUrl) throw new BadRequestException('请上传检测文件');
  return fileUrl;
};
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
