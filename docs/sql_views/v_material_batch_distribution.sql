-- View structure for `v_material_batch_distribution`
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_material_batch_distribution`;
CREATE VIEW `v_material_batch_distribution` AS
SELECT
  operation.id AS usage_id,
  operation.material_batch_id,
  mb.material_batch_no,
  mb.product_id AS material_product_id,
  material.product_code AS material_code,
  material.product_model AS material_model,
  material.product_name AS material_name,
  mb.supplier_name,
  mb.protocol_code,
  operation.operation_type,
  CASE operation.operation_type
    WHEN 'reserve' THEN '预留'
    WHEN 'unreserve' THEN '取消预留'
    WHEN 'issue' THEN '领料'
    WHEN 'return' THEN '退料'
    ELSE operation.operation_type
  END AS operation_type_text,
  CASE
    WHEN operation.operation_type = 'reserve'
      THEN COALESCE(NULLIF(operation.operation_quantity, 0), operation.reserved_quantity, 0)
    ELSE 0
  END AS reserved_quantity,
  CASE
    WHEN operation.operation_type IN ('issue','return')
      THEN COALESCE(NULLIF(operation.operation_quantity, 0), operation.used_quantity, 0)
    ELSE 0
  END AS used_quantity,
  COALESCE(operation.unit, material.unit) AS unit,
  operation.recorded_at,
  operation.recorded_by,
  recorder.display_name AS recorded_by_name,
  batch.id AS batch_id,
  batch.batch_no,
  work_order.id AS work_order_id,
  work_order.order_no,
  work_order.product_id,
  product.product_model AS product_model,
  product.product_name AS product_name,
  work_order.customer_name,
  work_order.customer_order_no,
  operation.remark
FROM batch_material_usages operation
INNER JOIN material_batches mb
  ON mb.id = operation.material_batch_id
  AND mb.is_deleted = 0
INNER JOIN products material
  ON material.id = mb.product_id
  AND material.is_deleted = 0
INNER JOIN production_batches batch
  ON batch.id = operation.batch_id
  AND batch.is_deleted = 0
INNER JOIN work_orders work_order
  ON work_order.id = batch.work_order_id
  AND work_order.is_deleted = 0
INNER JOIN products product
  ON product.id = work_order.product_id
  AND product.is_deleted = 0
LEFT JOIN users recorder
  ON recorder.id = operation.recorded_by
  AND recorder.deleted_at IS NULL
WHERE operation.is_deleted = 0;
