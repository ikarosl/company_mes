-- View structure for `v_production_batch_overview`
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_production_batch_overview`;
CREATE VIEW `v_production_batch_overview` AS
SELECT
  b.id AS batch_id,
  b.batch_no,
  b.work_order_id,
  wo.order_no,
  wo.customer_order_no,
  wo.customer_name,
  wo.quality_level,
  wo.product_id,
  p.product_code,
  p.product_model,
  p.product_name,
  p.unit AS product_unit,
  b.route_id,
  r.route_code,
  r.route_name,
  r.version AS route_version,
  b.owner_id,
  u.display_name AS owner_name,
  b.planned_quantity,
  b.status AS batch_status,
  b.plan_start_date,
  b.plan_end_date,
  b.actual_start_at,
  b.actual_end_at,
  b.remark,
  b.created_at,
  b.updated_at
FROM production_batches b
INNER JOIN work_orders wo
  ON wo.id = b.work_order_id
  AND wo.is_deleted = 0
INNER JOIN products p
  ON p.id = wo.product_id
  AND p.is_deleted = 0
LEFT JOIN process_routes r
  ON r.id = b.route_id
  AND r.is_deleted = 0
LEFT JOIN users u
  ON u.id = b.owner_id
  AND u.deleted_at IS NULL
WHERE b.is_deleted = 0;
