import type {
  TraceBatchDetail,
  TraceBatchOverview,
  TraceClosureStatus,
  TraceFlowItem,
  TraceMaterialItem,
  TraceQualityItem,
  TraceScrapItem,
  TraceSearchItem,
  TraceStepItem,
} from '@company/api-contract';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService, type QueryParam } from '../database/database.service.js';

type TraceRow<T> = RowDataPacket & T;

@Injectable()
export class TraceRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  /**
   * 统一搜索追溯入口。
   * 关联子查询只用于定位真实生产批次，避免另外维护易失真的搜索索引表。
   */
  async search(keyword: string): Promise<TraceSearchItem[]> {
    const params: QueryParam[] = [];
    let keywordWhere = '';
    if (keyword) {
      const like = `%${keyword}%`;
      keywordWhere = `AND (
        wo.order_no LIKE ? OR b.batch_no LIKE ? OR wo.customer_order_no LIKE ?
        OR wo.customer_name LIKE ? OR p.product_code LIKE ? OR p.product_model LIKE ? OR p.product_name LIKE ?
        OR EXISTS (SELECT 1 FROM batch_material_usages mu INNER JOIN material_batches mb ON mb.id = mu.material_batch_id WHERE mu.batch_id = b.id AND mu.is_deleted = 0 AND mb.material_batch_no LIKE ?)
        OR EXISTS (SELECT 1 FROM inspection_records ir WHERE ir.batch_id = b.id AND ir.is_deleted = 0 AND ir.inspection_no LIKE ?)
        OR EXISTS (SELECT 1 FROM product_flow_records pf WHERE pf.batch_id = b.id AND pf.is_deleted = 0 AND (pf.flow_no LIKE ? OR pf.external_doc_no LIKE ?))
      )`;
      params.push(like, like, like, like, like, like, like, like, like, like, like);
    }

    const rows = await this.database.query<TraceRow<TraceSearchItem>[]>(`
      SELECT
        CAST(wo.id AS CHAR) AS workOrderId, wo.order_no AS orderNo,
        CAST(b.id AS CHAR) AS batchId, b.batch_no AS batchNo,
        p.product_code AS productCode, p.product_model AS productModel, p.product_name AS productName,
        wo.customer_order_no AS customerOrderNo, wo.customer_name AS customerName,
        CAST(b.planned_quantity AS CHAR) AS plannedQuantity, b.status AS batchStatus,
        CASE
          WHEN b.status = 'cancelled' THEN 'abnormal'
          WHEN b.status <> 'completed' THEN 'in_progress'
          WHEN EXISTS (SELECT 1 FROM batch_step_records sr WHERE sr.batch_id = b.id AND sr.is_deleted = 0 AND sr.status NOT IN ('completed','skipped')) THEN 'incomplete'
          WHEN EXISTS (SELECT 1 FROM inspection_records ir LEFT JOIN rework_records rr ON rr.source_inspection_id = ir.id AND rr.is_deleted = 0 WHERE ir.batch_id = b.id AND ir.is_deleted = 0 AND ir.result <> 'pass' AND (ir.disposition IS NULL OR (ir.disposition = 'rework' AND (rr.id IS NULL OR rr.status NOT IN ('completed','closed'))))) THEN 'abnormal'
          WHEN NOT EXISTS (SELECT 1 FROM product_flow_records pf WHERE pf.batch_id = b.id AND pf.is_deleted = 0 AND pf.flow_type = 'inbound') THEN 'incomplete'
          ELSE 'closed'
        END AS closureStatus,
        (
          (SELECT COUNT(*) FROM batch_step_records sr WHERE sr.batch_id = b.id AND sr.is_deleted = 0 AND sr.status = 'abnormal') +
          (SELECT COUNT(*) FROM inspection_records ir WHERE ir.batch_id = b.id AND ir.is_deleted = 0 AND ir.result <> 'pass')
        ) AS issueCount
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      WHERE b.is_deleted = 0 ${keywordWhere}
      ORDER BY b.updated_at DESC, b.id DESC
      LIMIT 100
    `, params);
    return rows.map((row) => ({ ...row, issueCount: Number(row.issueCount) }));
  }

  /**
   * 聚合单个生产批次的闭环证据。
   * 各明细并行查询，所有数量均来自流水汇总，不读取前端缓存状态。
   */
  async getBatch(batchId: number): Promise<TraceBatchDetail> {
    const overview = await this.getOverview(batchId);
    const [materials, steps, quality, scraps, flows] = await Promise.all([
      this.getMaterials(batchId), this.getSteps(batchId), this.getQuality(batchId),
      this.getScraps(batchId), this.getFlows(batchId),
    ]);
    const issues = this.calculateIssues(overview, materials, steps, quality, flows);
    overview.issueCount = issues.length;
    overview.closureStatus = this.calculateClosureStatus(overview, issues, flows);
    return { overview, issues, materials, steps, quality, scraps, flows };
  }

  private async getOverview(batchId: number): Promise<TraceBatchOverview> {
    const [row] = await this.database.query<TraceRow<TraceBatchOverview>[]>(`
      SELECT CAST(wo.id AS CHAR) AS workOrderId, wo.order_no AS orderNo,
        CAST(b.id AS CHAR) AS batchId, b.batch_no AS batchNo,
        p.product_code AS productCode, p.product_model AS productModel, p.product_name AS productName,
        wo.customer_order_no AS customerOrderNo, wo.customer_name AS customerName,
        CAST(b.planned_quantity AS CHAR) AS plannedQuantity, b.status AS batchStatus,
        wo.status AS workOrderStatus, r.route_name AS routeName, r.version AS routeVersion,
        u.display_name AS ownerName, b.plan_start_date AS planStartDate, b.plan_end_date AS planEndDate,
        b.actual_start_at AS actualStartAt, b.actual_end_at AS actualEndAt, p.unit AS productUnit,
        'in_progress' AS closureStatus, 0 AS issueCount
      FROM production_batches b
      INNER JOIN work_orders wo ON wo.id = b.work_order_id AND wo.is_deleted = 0
      INNER JOIN products p ON p.id = wo.product_id AND p.is_deleted = 0
      LEFT JOIN process_routes r ON r.id = b.route_id
      LEFT JOIN users u ON u.id = b.owner_id
      WHERE b.id = ? AND b.is_deleted = 0
    `, [batchId]);
    if (!row) throw new NotFoundException('未找到生产批次追溯记录');
    return row;
  }

  private getMaterials(batchId: number) {
    return this.database.query<TraceRow<TraceMaterialItem>[]>(`
      SELECT CAST(req.id AS CHAR) AS requirementId, p.product_code AS materialCode,
        p.product_model AS materialModel, p.product_name AS materialName,
        CAST(req.plan_quantity AS CHAR) AS planQuantity, req.unit,
        mb.material_batch_no AS materialBatchNo, mb.supplier_name AS supplierName,
        CAST(COALESCE(SUM(CASE WHEN mu.operation_type='reserve' THEN mu.operation_quantity WHEN mu.operation_type='unreserve' THEN -mu.operation_quantity ELSE 0 END),0) AS CHAR) AS reservedQuantity,
        CAST(COALESCE(SUM(CASE WHEN mu.operation_type='issue' THEN mu.operation_quantity ELSE 0 END),0) AS CHAR) AS issuedQuantity,
        CAST(COALESCE(SUM(CASE WHEN mu.operation_type='return' THEN mu.operation_quantity ELSE 0 END),0) AS CHAR) AS returnedQuantity,
        CAST(COALESCE(SUM(CASE WHEN mu.operation_type='issue' THEN mu.operation_quantity WHEN mu.operation_type='return' THEN -mu.operation_quantity ELSE 0 END),0) AS CHAR) AS netIssuedQuantity
      FROM batch_material_requirement req
      INNER JOIN products p ON p.id = req.material_product_id
      LEFT JOIN batch_material_usages mu ON mu.require_id = req.id AND mu.is_deleted = 0
      LEFT JOIN material_batches mb ON mb.id = mu.material_batch_id
      WHERE req.batch_id = ? AND req.is_deleted = 0 AND req.status <> 'cancelled'
      GROUP BY req.id, p.product_code, p.product_model, p.product_name, req.plan_quantity, req.unit, mb.id, mb.material_batch_no, mb.supplier_name
      ORDER BY req.id, mb.material_batch_no
    `, [batchId]);
  }

  private getSteps(batchId: number) {
    return this.database.query<TraceRow<TraceStepItem>[]>(`
      SELECT CAST(sr.id AS CHAR) AS stepRecordId, prs.step_order AS stepOrder,
        ps.step_code AS stepCode, ps.step_name AS stepName, u.display_name AS responsibleUserName,
        sr.status, CAST(sr.output_quantity AS CHAR) AS outputQuantity,
        CAST(sr.abnormal_quantity AS CHAR) AS abnormalQuantity,
        sr.started_at AS startedAt, sr.completed_at AS completedAt, tf.file_name AS sopFileName
      FROM batch_step_records sr
      INNER JOIN process_route_steps prs ON prs.id = sr.process_route_steps_id
      INNER JOIN process_steps ps ON ps.id = prs.process_step_id
      LEFT JOIN users u ON u.id = sr.responsible_user_id
      LEFT JOIN technical_files tf ON tf.id = COALESCE(sr.sop_file_id, prs.sop_file_id, ps.sop_file_id)
      WHERE sr.batch_id = ? AND sr.is_deleted = 0 ORDER BY prs.step_order
    `, [batchId]);
  }

  private getQuality(batchId: number) {
    return this.database.query<TraceRow<TraceQualityItem>[]>(`
      SELECT CAST(ir.id AS CHAR) AS inspectionId, ir.inspection_no AS inspectionNo,
        ir.inspection_type AS inspectionType, ir.inspection_name AS inspectionName,
        ir.result, ir.disposition, CAST(ir.inspect_quantity AS CHAR) AS inspectQuantity,
        CAST(ir.pass_quantity AS CHAR) AS passQuantity, CAST(ir.fail_quantity AS CHAR) AS failQuantity,
        u.display_name AS inspectorName, ir.inspected_at AS inspectedAt,
        CAST(rr.id AS CHAR) AS reworkId, rr.rework_no AS reworkNo, rr.status AS reworkStatus,
        rr.result AS reworkResult, CAST(rr.recheck_inspection_id AS CHAR) AS recheckInspectionId
      FROM inspection_records ir LEFT JOIN users u ON u.id = ir.inspector_id
      LEFT JOIN rework_records rr ON rr.source_inspection_id = ir.id AND rr.is_deleted = 0
      WHERE ir.batch_id = ? AND ir.is_deleted = 0 ORDER BY ir.inspected_at, ir.id
    `, [batchId]);
  }

  private getScraps(batchId: number) {
    return this.database.query<TraceRow<TraceScrapItem>[]>(`
      SELECT CAST(id AS CHAR) AS id, scrap_no AS scrapNo, scrap_object_type AS scrapObjectType,
        CAST(scrap_quantity AS CHAR) AS scrapQuantity, unit, scrap_stage AS scrapStage,
        reason_type AS reasonType, operated_at AS operatedAt
      FROM scrap_records WHERE batch_id = ? AND is_deleted = 0 ORDER BY operated_at, id
    `, [batchId]);
  }

  private getFlows(batchId: number) {
    return this.database.query<TraceRow<TraceFlowItem>[]>(`
      SELECT CAST(pf.id AS CHAR) AS id, pf.flow_no AS flowNo,
        COALESCE(pi.inventory_batch_no, '') AS inventoryBatchNo, pf.object_type AS objectType,
        pf.flow_type AS flowType, CAST(pf.quantity AS CHAR) AS quantity,
        pf.partner_name AS partnerName, pf.external_doc_no AS externalDocNo, pf.flow_date AS flowDate
      FROM product_flow_records pf INNER JOIN product_inventory_batches pi ON pi.id = pf.inventory_id
      WHERE pf.batch_id = ? AND pf.is_deleted = 0 ORDER BY pf.flow_date, pf.id
    `, [batchId]);
  }

  /** 闭环缺口使用可读中文返回，供页面和后续导出复用。 */
  private calculateIssues(
    overview: TraceBatchOverview, materials: TraceMaterialItem[], steps: TraceStepItem[],
    quality: TraceQualityItem[], flows: TraceFlowItem[],
  ) {
    const issues: string[] = [];
    if (!steps.length) issues.push('尚未生成工序执行记录');
    if (steps.some((item) => !['completed', 'skipped'].includes(item.status))) issues.push('存在未完成工序');
    if (materials.some((item) => Number(item.netIssuedQuantity) < Number(item.planQuantity))) issues.push('存在物料净领用量低于计划需求');
    if (quality.some((item) => item.result !== 'pass' && !item.disposition)) issues.push('存在未处置的不合格检验');
    if (quality.some((item) => item.disposition === 'rework' && (!item.reworkId || !['completed', 'closed'].includes(item.reworkStatus ?? '')))) issues.push('存在未闭环返工');
    if (overview.batchStatus === 'completed' && !flows.some((item) => item.flowType === 'inbound')) issues.push('批次已完成但尚无成品或半成品入库记录');
    return [...new Set(issues)];
  }

  private calculateClosureStatus(
    overview: TraceBatchOverview, issues: string[], flows: TraceFlowItem[],
  ): TraceClosureStatus {
    if (overview.batchStatus === 'cancelled' || issues.some((item) => item.includes('不合格') || item.includes('返工'))) return 'abnormal';
    if (overview.batchStatus !== 'completed') return 'in_progress';
    if (issues.length || !flows.some((item) => item.flowType === 'inbound')) return 'incomplete';
    return 'closed';
  }
}
