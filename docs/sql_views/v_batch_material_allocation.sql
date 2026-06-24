-- View structure for `v_batch_material_allocation`
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_batch_material_allocation`;
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
