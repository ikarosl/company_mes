-- Align generated, unallocated material demand snapshots with the current BOM.
-- Allocated, reserved, or used records are intentionally left unchanged.
SET NAMES utf8mb4;
USE `company_test`;

UPDATE batch_material_usages bmu
INNER JOIN product_materials pm
  ON pm.id = bmu.product_materials_id
  AND pm.is_deleted = 0
INNER JOIN production_batches b
  ON b.id = bmu.batch_id
  AND b.is_deleted = 0
SET bmu.plan_quantity = pm.quantity_per_unit * b.planned_quantity,
  bmu.unit = COALESCE(pm.unit, bmu.unit),
  bmu.updated_at = NOW()
WHERE bmu.is_deleted = 0
  AND bmu.material_batch_id IS NULL
  AND bmu.reserved_quantity = 0
  AND bmu.used_quantity = 0;
