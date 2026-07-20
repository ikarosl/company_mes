-- 返工记录明细：通过来源检验取得批次、物料、产品和工序追溯信息
SET NAMES utf8mb4;
USE `company_test`;
DROP VIEW IF EXISTS `v_rework_record_detail`;
CREATE VIEW `v_rework_record_detail` AS
SELECT rw.id rework_id,rw.rework_no,rw.source_inspection_id,source.inspection_no source_inspection_no,
  rw.recheck_inspection_id,recheck.inspection_no recheck_inspection_no,
  source.inspection_object_type,source.inspection_type,source.result source_result,
  source.disposition source_disposition,source.fail_quantity source_fail_quantity,
  source.batch_id,source.batch_no,source.work_order_id,source.order_no,
  source.material_batch_id,source.material_batch_no,source.product_inventory_id,source.inventory_batch_no,
  source.batch_step_record_id,source.route_step_id,source.step_order,source.process_step_id,source.step_code,source.step_name,
  source.product_id,source.product_code,source.product_model,source.product_name,
  rw.product_identifier,rw.defect_item,rw.defect_desc,rw.return_step_name,
  rw.handler_id,handler.display_name handler_name,rw.handling_desc,rw.status,rw.result,rw.closed_at,rw.remark,
  rw.created_by,rw.created_at,rw.updated_by,rw.updated_at
FROM rework_records rw
INNER JOIN v_inspection_record_detail source ON source.inspection_id=rw.source_inspection_id
LEFT JOIN inspection_records recheck ON recheck.id=rw.recheck_inspection_id
LEFT JOIN users handler ON handler.id=rw.handler_id
WHERE rw.is_deleted=0;
