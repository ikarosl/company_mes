-- View structure for `v_process_route_step_detail`
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_process_route_step_detail`;
CREATE VIEW `v_process_route_step_detail` AS
SELECT
  route.id AS route_id,
  route.route_code,
  route.route_name,
  route.version AS route_version,
  route.status AS route_status,
  route_step.id AS route_step_id,
  route_step.step_order,
  route_step.process_step_id,
  step.step_code,
  step.step_name,
  COALESCE(route_step.sop_file_id, step.sop_file_id) AS sop_file_id,
  sop.file_code AS sop_file_code,
  sop.file_name AS sop_file_name,
  sop.version AS sop_version,
  sop.file_url AS sop_file_url,
  route_step.default_owner_id,
  owner.display_name AS default_owner_name,
  route_step.need_inspection,
  route_step.need_record,
  route_step.remark
FROM process_route_steps route_step
INNER JOIN process_routes route
  ON route.id = route_step.route_id
  AND route.is_deleted = 0
INNER JOIN process_steps step
  ON step.id = route_step.process_step_id
  AND step.is_deleted = 0
LEFT JOIN technical_files sop
  ON sop.id = COALESCE(route_step.sop_file_id, step.sop_file_id)
  AND sop.is_deleted = 0
LEFT JOIN users owner
  ON owner.id = route_step.default_owner_id
  AND owner.deleted_at IS NULL
WHERE route_step.is_deleted = 0
  AND route_step.status = 1;
