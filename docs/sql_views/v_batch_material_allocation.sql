-- View structure for `v_batch_material_allocation`
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_batch_material_allocation`;
CREATE VIEW `v_batch_material_allocation` AS
SELECT
  requirement.id AS requirement_id,
  requirement.id AS usage_id,
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
  requirement.plan_quantity AS required_quantity,
  COALESCE(summary.reserved_quantity, 0) AS reserved_quantity,
  COALESCE(summary.issued_quantity, 0) AS issued_quantity,
  COALESCE(summary.returned_quantity, 0) AS returned_quantity,
  COALESCE(summary.issued_quantity, 0) - COALESCE(summary.returned_quantity, 0) AS used_quantity,
  GREATEST(requirement.plan_quantity - COALESCE(summary.reserved_quantity, 0), 0) AS unfulfilled_quantity,
  COALESCE(requirement.unit, pm.unit, material.unit) AS unit,
  pm.is_key_material,
  pm.need_batch_record,
  summary.material_batch_id,
  summary.material_batch_no,
  CASE
    WHEN COALESCE(summary.issued_quantity, 0) - COALESCE(summary.returned_quantity, 0)
      >= requirement.plan_quantity THEN 'used'
    WHEN COALESCE(summary.issued_quantity, 0) - COALESCE(summary.returned_quantity, 0) > 0
      THEN 'partial_used'
    WHEN COALESCE(summary.reserved_quantity, 0) >= requirement.plan_quantity THEN 'allocated'
    WHEN COALESCE(summary.reserved_quantity, 0) > 0 THEN 'partial_allocated'
    ELSE 'unallocated'
  END AS material_status,
  summary.recorded_by,
  summary.recorded_at,
  summary.remark,
  requirement.created_at,
  requirement.updated_at
FROM batch_material_requirements requirement
INNER JOIN v_production_batch_overview overview ON overview.batch_id = requirement.batch_id
INNER JOIN product_materials pm
  ON pm.id = requirement.product_materials_id AND pm.is_deleted = 0
INNER JOIN products material
  ON material.id = pm.material_product_id AND material.is_deleted = 0
LEFT JOIN (
  SELECT
    operation.batch_id,
    operation.product_materials_id,
    CASE
      WHEN COUNT(DISTINCT CASE WHEN operation.operation_type = 'reserve' THEN operation.material_batch_id END) = 1
      THEN MAX(CASE WHEN operation.operation_type = 'reserve' THEN operation.material_batch_id END)
      ELSE NULL
    END AS material_batch_id,
    GROUP_CONCAT(
      DISTINCT CASE WHEN operation.operation_type = 'reserve' THEN mb.material_batch_no END
      ORDER BY mb.material_batch_no SEPARATOR '、'
    ) AS material_batch_no,
    SUM(CASE WHEN operation.operation_type = 'reserve' THEN operation.reserved_quantity ELSE 0 END)
      AS reserved_quantity,
    SUM(CASE WHEN operation.operation_type = 'issue' THEN operation.used_quantity ELSE 0 END)
      AS issued_quantity,
    SUM(CASE WHEN operation.operation_type = 'return' THEN operation.used_quantity ELSE 0 END)
      AS returned_quantity,
    MAX(operation.recorded_by) AS recorded_by,
    MAX(operation.recorded_at) AS recorded_at,
    SUBSTRING_INDEX(GROUP_CONCAT(operation.remark ORDER BY operation.id DESC SEPARATOR '\n'), '\n', 1)
      AS remark
  FROM batch_material_usages operation
  LEFT JOIN material_batches mb
    ON mb.id = operation.material_batch_id
    AND mb.is_deleted = 0
  WHERE operation.is_deleted = 0
  GROUP BY operation.batch_id, operation.product_materials_id
) summary
  ON summary.batch_id = requirement.batch_id
  AND summary.product_materials_id = requirement.product_materials_id
WHERE requirement.is_deleted = 0;
