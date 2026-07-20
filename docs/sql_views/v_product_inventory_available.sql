-- 成品/半成品库存明细：统一库存批次、产品、分类和来源生产批次信息
SET NAMES utf8mb4;
USE `company_test`;

DROP VIEW IF EXISTS `v_product_inventory_available`;
CREATE VIEW `v_product_inventory_available` AS
SELECT
  inventory.id AS product_inventory_id,
  inventory.inventory_batch_no,
  inventory.product_id,
  product.product_code,
  product.product_model,
  product.product_name,
  COALESCE(inventory.unit, product.unit) AS unit,
  product.category_id,
  category.product_attribute,
  category.product_type,
  inventory.batch_id,
  batch.batch_no,
  batch.work_order_id,
  batch.order_no,
  batch.customer_order_no,
  batch.customer_name,
  inventory.source_type,
  inventory.object_type,
  inventory.quantity AS stock_quantity,
  inventory.quantity AS available_quantity,
  inventory.received_date,
  inventory.location,
  inventory.remark,
  inventory.created_by,
  inventory.created_at,
  inventory.updated_by,
  inventory.updated_at
FROM product_inventory_batches inventory
INNER JOIN products product ON product.id = inventory.product_id AND product.is_deleted = 0
LEFT JOIN product_categories category ON category.id = product.category_id AND category.is_deleted = 0
LEFT JOIN v_production_batch_overview batch ON batch.batch_id = inventory.batch_id
WHERE inventory.is_deleted = 0;
