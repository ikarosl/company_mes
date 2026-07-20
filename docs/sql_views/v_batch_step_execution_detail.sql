-- 批次工序执行明细：以实际报工记录为主，保留已停用工艺模板对应的历史执行数据
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_batch_step_execution_detail`;
CREATE VIEW `v_batch_step_execution_detail` AS
SELECT
  record.id AS step_record_id,
  record.batch_id,
  batch.batch_no,
  batch.work_order_id,
  batch.order_no,
  batch.customer_order_no,
  batch.customer_name,
  batch.quality_level,
  batch.product_id,
  batch.product_code,
  batch.product_model,
  batch.product_name,
  batch.product_unit,
  batch.planned_quantity AS batch_planned_quantity,
  batch.batch_status,
  batch.route_id,
  batch.route_code,
  batch.route_name,
  batch.route_version,
  record.process_route_steps_id AS route_step_id,
  route_step.step_order,
  route_step.process_step_id,
  step.step_code,
  step.step_name,
  COALESCE(route_step.sop_file_id, step.sop_file_id) AS sop_file_id,
  sop.file_code AS sop_file_code,
  sop.file_name AS sop_file_name,
  sop.version AS sop_version,
  sop.file_url AS sop_file_url,
  route_step.need_inspection,
  route_step.need_record,
  batch.owner_id AS batch_owner_id,
  batch.owner_name AS batch_owner_name,
  record.responsible_user_id,
  responsible.display_name AS responsible_user_name,
  record.output_quantity,
  record.abnormal_quantity,
  record.return_quantity,
  record.status AS step_status,
  record.started_at,
  record.completed_at,
  record.remark,
  record.created_by,
  record.created_at,
  record.updated_by,
  record.updated_at
FROM batch_step_records record
INNER JOIN v_production_batch_overview batch ON batch.batch_id = record.batch_id
LEFT JOIN process_route_steps route_step ON route_step.id = record.process_route_steps_id
LEFT JOIN process_steps step ON step.id = route_step.process_step_id
LEFT JOIN technical_files sop ON sop.id = COALESCE(route_step.sop_file_id, step.sop_file_id)
LEFT JOIN users responsible ON responsible.id = record.responsible_user_id
WHERE record.is_deleted = 0;
