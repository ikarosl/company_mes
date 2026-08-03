-- 待过程检验任务：由已派工且标记为需要检验的批次工序动态派生，不保存重复任务状态
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_pending_process_inspection`;
CREATE VIEW `v_pending_process_inspection` AS
SELECT
  step.step_record_id AS inspection_task_id,
  step.batch_id, step.batch_no, step.work_order_id, step.order_no,
  step.customer_order_no, step.customer_name, step.product_id, step.product_code,
  step.product_model, step.product_name, step.product_unit, step.route_step_id,
  step.step_order, step.process_step_id, step.step_code, step.step_name,
  step.sop_file_id, step.sop_file_name, step.sop_version, step.sop_file_url,
  step.responsible_user_id, step.responsible_user_name, step.output_quantity,
  step.abnormal_quantity,
  COALESCE(
    NULLIF(step.output_quantity, 0),
    (
      SELECT GREATEST(COALESCE(previous.output_quantity, 0) - COALESCE(previous.abnormal_quantity, 0), 0)
      FROM v_batch_step_execution_detail previous
      WHERE previous.batch_id = step.batch_id
        AND previous.step_order < step.step_order
        AND previous.step_status IN ('completed', 'abnormal')
      ORDER BY previous.step_order DESC, previous.step_record_id DESC
      LIMIT 1
    ),
    step.batch_planned_quantity
  ) AS suggested_inspect_quantity,
  step.completed_at
FROM v_batch_step_execution_detail step
WHERE step.need_inspection = 1
  AND step.step_status IN ('pending', 'doing', 'completed', 'abnormal')
  AND NOT EXISTS (
    SELECT 1 FROM inspection_records inspection
    WHERE inspection.batch_step_record_id = step.step_record_id
      AND inspection.inspection_type = 'process'
      AND inspection.is_deleted = 0
  );
