-- 生产批次进度汇总：统一工序、派工、物料齐套和检验结果口径
SET NAMES utf8mb4;
USE `company_test`;
DROP VIEW IF EXISTS `v_production_batch_progress`;
CREATE VIEW `v_production_batch_progress` AS
SELECT batch.*,
  COALESCE(s.step_count,0) step_count,
  COALESCE(s.pending_step_count,0) pending_step_count,
  COALESCE(s.doing_step_count,0) doing_step_count,
  COALESCE(s.completed_step_count,0) completed_step_count,
  COALESCE(s.abnormal_step_count,0) abnormal_step_count,
  COALESCE(s.skipped_step_count,0) skipped_step_count,
  COALESCE(s.finished_step_count,0) finished_step_count,
  COALESCE(s.assigned_step_count,0) assigned_step_count,
  COALESCE(s.step_count,0)-COALESCE(s.assigned_step_count,0) unassigned_step_count,
  CASE WHEN COALESCE(s.step_count,0)=0 THEN 0 ELSE ROUND(s.finished_step_count*100/s.step_count,2) END step_completion_rate,
  COALESCE(m.material_requirement_count,0) material_requirement_count,
  COALESCE(m.assigned_material_count,0) assigned_material_count,
  COALESCE(m.used_material_count,0) used_material_count,
  COALESCE(m.material_ready_count,0) material_ready_count,
  COALESCE(m.material_shortage_count,0) material_shortage_count,
  CASE WHEN COALESCE(m.material_requirement_count,0)=0 OR m.material_ready_count=m.material_requirement_count THEN 1 ELSE 0 END is_material_ready,
  COALESCE(i.inspection_count,0) inspection_count,
  COALESCE(i.passed_inspection_count,0) passed_inspection_count,
  COALESCE(i.failed_inspection_count,0) failed_inspection_count,
  CASE WHEN COALESCE(i.failed_inspection_count,0)>0 THEN 1 ELSE 0 END has_failed_inspection
FROM v_production_batch_overview batch
LEFT JOIN (
  SELECT batch_id,COUNT(*) step_count,SUM(status='pending') pending_step_count,
    SUM(status='doing') doing_step_count,SUM(status='completed') completed_step_count,
    SUM(status='abnormal') abnormal_step_count,SUM(status='skipped') skipped_step_count,
    SUM(status IN ('completed','abnormal','skipped')) finished_step_count,
    SUM(responsible_user_id IS NOT NULL) assigned_step_count
  FROM batch_step_records WHERE is_deleted=0 GROUP BY batch_id
) s ON s.batch_id=batch.batch_id
LEFT JOIN (
  SELECT batch_id,COUNT(*) material_requirement_count,
    SUM(reserved_quantity>0) assigned_material_count,
    SUM(used_quantity>=required_quantity) used_material_count,
    SUM(reserved_quantity>=required_quantity) material_ready_count,
    SUM(reserved_quantity<required_quantity) material_shortage_count
  FROM v_batch_material_allocation GROUP BY batch_id
) m ON m.batch_id=batch.batch_id
LEFT JOIN (
  SELECT batch_id,COUNT(*) inspection_count,SUM(result='pass') passed_inspection_count,
    SUM(result IN ('fail','partial_pass')) failed_inspection_count
  FROM inspection_records WHERE is_deleted=0 AND batch_id IS NOT NULL GROUP BY batch_id
) i ON i.batch_id=batch.batch_id;
