-- Create the first three core query views.
-- The script is idempotent and does not change table structures or data.
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_batch_material_allocation`;
DROP VIEW IF EXISTS `v_material_batch_available`;
DROP VIEW IF EXISTS `v_production_batch_overview`;

CREATE VIEW `v_production_batch_overview` AS
SELECT
  b.id AS batch_id,
  b.batch_no,
  b.work_order_id,
  wo.order_no,
  wo.customer_order_no,
  wo.customer_name,
  wo.product_id,
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

CREATE VIEW `v_material_batch_available` AS
SELECT
  mb.id AS material_batch_id,
  mb.material_batch_no,
  mb.product_id AS material_product_id,
  p.product_model AS material_model,
  p.product_name AS material_name,
  p.unit,
  mb.supplier_name,
  mb.protocol_code,
  mb.received_date,
  mb.quantity AS stock_quantity,
  COALESCE(usage_summary.reserved_quantity, 0) AS reserved_quantity,
  COALESCE(usage_summary.used_quantity, 0) AS used_quantity,
  COALESCE(usage_summary.reserved_not_used_quantity, 0) AS reserved_not_used_quantity,
  GREATEST(
    mb.quantity - COALESCE(usage_summary.reserved_not_used_quantity, 0),
    0
  ) AS available_quantity,
  mb.status AS material_batch_status,
  mb.remark,
  mb.created_at,
  mb.updated_at
FROM material_batches mb
INNER JOIN products p
  ON p.id = mb.product_id
  AND p.is_deleted = 0
LEFT JOIN (
  SELECT
    material_batch_id,
    SUM(reserved_quantity) AS reserved_quantity,
    SUM(used_quantity) AS used_quantity,
    SUM(GREATEST(reserved_quantity - used_quantity, 0)) AS reserved_not_used_quantity
  FROM batch_material_usages
  WHERE is_deleted = 0
    AND material_batch_id IS NOT NULL
    AND status <> 'cancelled'
  GROUP BY material_batch_id
) usage_summary
  ON usage_summary.material_batch_id = mb.id
WHERE mb.is_deleted = 0;

CREATE VIEW `v_batch_material_allocation` AS
SELECT
  bmu.id AS usage_id,
  overview.batch_id,
  overview.batch_no,
  overview.work_order_id,
  overview.order_no,
  overview.product_id,
  overview.product_model,
  overview.product_name,
  overview.planned_quantity,
  pm.id AS product_material_id,
  pm.material_product_id,
  material.product_model AS material_model,
  material.product_name AS material_name,
  pm.quantity_per_unit,
  CAST(pm.quantity_per_unit * overview.planned_quantity AS DECIMAL(12,4)) AS current_bom_required_quantity,
  bmu.plan_quantity AS required_quantity,
  bmu.reserved_quantity,
  bmu.used_quantity,
  GREATEST(bmu.plan_quantity - bmu.reserved_quantity, 0) AS unfulfilled_quantity,
  COALESCE(bmu.unit, pm.unit, material.unit) AS unit,
  pm.is_key_material,
  pm.need_batch_record,
  bmu.material_batch_id,
  mb.material_batch_no,
  CASE
    WHEN bmu.status = 'cancelled' THEN 'cancelled'
    WHEN bmu.used_quantity >= bmu.plan_quantity THEN 'used'
    WHEN bmu.used_quantity > 0 THEN 'partial_used'
    WHEN bmu.reserved_quantity >= bmu.plan_quantity THEN 'allocated'
    WHEN bmu.reserved_quantity > 0 THEN 'partial_allocated'
    ELSE 'unallocated'
  END AS material_status,
  bmu.status AS usage_status,
  bmu.recorded_by,
  bmu.recorded_at,
  bmu.remark,
  bmu.created_at,
  bmu.updated_at
FROM batch_material_usages bmu
INNER JOIN v_production_batch_overview overview
  ON overview.batch_id = bmu.batch_id
INNER JOIN product_materials pm
  ON pm.id = bmu.product_materials_id
  AND pm.is_deleted = 0
INNER JOIN products material
  ON material.id = pm.material_product_id
  AND material.is_deleted = 0
LEFT JOIN material_batches mb
  ON mb.id = bmu.material_batch_id
  AND mb.is_deleted = 0
WHERE bmu.is_deleted = 0;
