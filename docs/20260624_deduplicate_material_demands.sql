-- Keep one material requirement snapshot per production batch and BOM item.
SET NAMES utf8mb4;
USE `company_test`;

DELETE duplicate_row
FROM batch_material_requirements duplicate_row
INNER JOIN (
  SELECT
    grouped.batch_id,
    grouped.product_materials_id,
    COALESCE(
      MAX(CASE WHEN grouped.is_deleted = 0 THEN grouped.id END),
      MAX(grouped.id)
    ) AS keep_id
  FROM (
    SELECT id, batch_id, product_materials_id, is_deleted
    FROM batch_material_requirements
    WHERE batch_id IS NOT NULL
  ) grouped
  GROUP BY grouped.batch_id, grouped.product_materials_id
  HAVING COUNT(*) > 1
) retained
  ON retained.batch_id = duplicate_row.batch_id
  AND retained.product_materials_id = duplicate_row.product_materials_id
  AND retained.keep_id <> duplicate_row.id;

ALTER TABLE batch_material_requirements
  ADD UNIQUE KEY `uk_batch_material_requirements_batch_material` (`batch_id`, `product_materials_id`);
