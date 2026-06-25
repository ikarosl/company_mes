-- Align generated material requirement snapshots with the current BOM.
-- Requirements with operation history are intentionally left unchanged.
SET NAMES utf8mb4;
USE `company_test`;

UPDATE batch_material_requirements requirement
INNER JOIN product_materials pm
  ON pm.id = requirement.product_materials_id
  AND pm.is_deleted = 0
INNER JOIN production_batches b
  ON b.id = requirement.batch_id
  AND b.is_deleted = 0
SET requirement.plan_quantity = pm.quantity_per_unit * b.planned_quantity,
  requirement.unit = COALESCE(pm.unit, requirement.unit),
  requirement.updated_at = NOW()
WHERE requirement.is_deleted = 0
  AND NOT EXISTS (
    SELECT 1
    FROM batch_material_usages operation
    WHERE operation.batch_id = requirement.batch_id
      AND operation.product_materials_id = requirement.product_materials_id
      AND operation.is_deleted = 0
  );
