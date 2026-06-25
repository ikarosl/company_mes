-- View structure for `v_material_batch_available`
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_material_batch_available`;
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
    operation_summary.material_batch_id,
    SUM(operation_summary.reserved_quantity) AS reserved_quantity,
    SUM(operation_summary.net_used_quantity) AS used_quantity,
    SUM(GREATEST(operation_summary.reserved_quantity - operation_summary.net_used_quantity, 0))
      AS reserved_not_used_quantity
  FROM (
    SELECT
      material_batch_id,
      batch_id,
      product_materials_id,
      SUM(CASE WHEN operation_type = 'reserve' THEN reserved_quantity ELSE 0 END)
        AS reserved_quantity,
      SUM(CASE WHEN operation_type = 'issue' THEN used_quantity ELSE 0 END)
        - SUM(CASE WHEN operation_type = 'return' THEN used_quantity ELSE 0 END)
        AS net_used_quantity
    FROM batch_material_usages
    WHERE is_deleted = 0
    GROUP BY material_batch_id, batch_id, product_materials_id
  ) operation_summary
  GROUP BY operation_summary.material_batch_id
) usage_summary
  ON usage_summary.material_batch_id = mb.id
WHERE mb.is_deleted = 0;
