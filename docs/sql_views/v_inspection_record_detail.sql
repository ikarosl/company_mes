-- 检验记录明细：统一来料、批次、工序和产品库存检验的追溯字段
SET NAMES utf8mb4;
USE `company_test`;
DROP VIEW IF EXISTS `v_inspection_record_detail`;
CREATE VIEW `v_inspection_record_detail` AS
SELECT ir.id inspection_id,ir.inspection_no,ir.inspection_object_type,ir.inspection_type,ir.inspection_name,
  ir.related_inspection_id,related.inspection_no related_inspection_no,
  ir.batch_id,batch.batch_no,batch.work_order_id,batch.order_no,
  ir.material_batch_id,mb.material_batch_no,ir.product_inventory_id,pi.inventory_batch_no,
  ir.batch_step_record_id,step.route_step_id,step.step_order,step.process_step_id,step.step_code,step.step_name,
  ir.product_id_snapshot product_id,p.product_code,p.product_model,p.product_name,p.unit product_unit,
  ir.inspect_quantity,ir.pass_quantity,ir.fail_quantity,ir.result,ir.disposition,
  ir.inspector_id,inspector.display_name inspector_name,ir.inspected_at,ir.file_url,ir.result_summary,ir.remark,
  COALESCE(r.rework_count,0) rework_count,COALESCE(r.open_rework_count,0) open_rework_count,
  COALESCE(r.completed_rework_count,0) completed_rework_count,
  CASE WHEN COALESCE(r.rework_count,0)>0 THEN 1 ELSE 0 END has_rework,
  ir.created_by,ir.created_at,ir.updated_by,ir.updated_at
FROM inspection_records ir
LEFT JOIN inspection_records related ON related.id=ir.related_inspection_id
LEFT JOIN v_production_batch_overview batch ON batch.batch_id=ir.batch_id
LEFT JOIN material_batches mb ON mb.id=ir.material_batch_id
LEFT JOIN product_inventory_batches pi ON pi.id=ir.product_inventory_id
LEFT JOIN v_batch_step_execution_detail step ON step.step_record_id=ir.batch_step_record_id
LEFT JOIN products p ON p.id=ir.product_id_snapshot
LEFT JOIN users inspector ON inspector.id=ir.inspector_id
LEFT JOIN (
  SELECT source_inspection_id,COUNT(*) rework_count,
    SUM(status IN ('pending','doing','wait_recheck')) open_rework_count,
    SUM(status IN ('completed','closed')) completed_rework_count
  FROM rework_records WHERE is_deleted=0 GROUP BY source_inspection_id
) r ON r.source_inspection_id=ir.id
WHERE ir.is_deleted=0;
