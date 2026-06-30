-- 统一库存对象与产品资料表融合迁移脚本
-- 将 item_type → product_categories，item_info → products
-- 执行前请先备份数据库
-- 执行方式：mysql --default-character-set=utf8mb4 --execute="SOURCE ..."

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 扩展 product_categories（替代 item_type）
-- =====================================================
ALTER TABLE `product_categories`
  ADD COLUMN `item_kind` VARCHAR(30) NULL COMMENT '库存对象大类：material/semi_finished/finished_product' AFTER `product_type`;

-- 将现有产品分类的 item_kind 映射为 material（生产侧原有的产品默认归物料类）
UPDATE `product_categories`
SET `item_kind` = CASE
  WHEN `product_attribute` LIKE '%成品%' THEN 'finished_product'
  WHEN `product_attribute` LIKE '%半成品%' THEN 'semi_finished'
  ELSE 'material'
END
WHERE `item_kind` IS NULL;

-- =====================================================
-- 2. 扩展 products（替代 item_info）
-- =====================================================
ALTER TABLE `products`
  ADD COLUMN `item_code` VARCHAR(100) NULL COMMENT '库存对象编码（兼容统一库存方案）' AFTER `id`,
  ADD COLUMN `default_unit` VARCHAR(20) NULL COMMENT '库存默认单位' AFTER `unit`,
  MODIFY COLUMN `status` VARCHAR(20) NOT NULL DEFAULT '启用' COMMENT '启用/停用';

-- 迁移数据：item_code = product_model，default_unit = unit
UPDATE `products`
SET `item_code` = `product_model`,
  `default_unit` = COALESCE(NULLIF(`unit`, ''), '个'),
  `status` = CASE WHEN `status` = 1 OR `status` = '1' THEN '启用' ELSE '停用' END;

ALTER TABLE `products`
  MODIFY COLUMN `item_code` VARCHAR(100) NOT NULL COMMENT '库存对象编码',
  ADD UNIQUE KEY `uk_products_item_code` (`item_code`);

-- =====================================================
-- 3. 重建外键引用：从 item_info → products
-- =====================================================

-- 3a. 删除所有引用 item_info/item_type 的外键
ALTER TABLE `product_bom` DROP FOREIGN KEY `fk_product_bom_product_id`;
ALTER TABLE `product_bom` DROP FOREIGN KEY `fk_product_bom_item_id`;

ALTER TABLE `item_batch` DROP FOREIGN KEY `fk_item_batch_item_id`;
ALTER TABLE `inventory_transaction` DROP FOREIGN KEY `fk_inventory_transaction_item_id`;
ALTER TABLE `stock_order_detail` DROP FOREIGN KEY `fk_stock_order_detail_item_id`;
ALTER TABLE `production_item_demand` DROP FOREIGN KEY `fk_production_item_demand_item_id`;
ALTER TABLE `item_scrap` DROP FOREIGN KEY `fk_item_scrap_item_id`;
ALTER TABLE `stock_check_detail` DROP FOREIGN KEY `fk_stock_check_detail_item_id`;

-- 如果存在 item_info 自身的外键
ALTER TABLE `item_info` DROP FOREIGN KEY IF EXISTS `fk_item_info_type_id`;
-- 如果存在 inventory_transaction 的 stock_order 外键（在 20260630 中添加）
ALTER TABLE `inventory_transaction` DROP FOREIGN KEY IF EXISTS `fk_inventory_transaction_stock_order_id`;
ALTER TABLE `inventory_transaction` DROP FOREIGN KEY IF EXISTS `fk_inventory_transaction_stock_order_detail_id`;
-- stock_order_detail 的生产批次外键
ALTER TABLE `stock_order_detail` DROP FOREIGN KEY IF EXISTS `fk_stock_order_detail_demand_batch`;
ALTER TABLE `stock_order_detail` DROP FOREIGN KEY IF EXISTS `fk_stock_order_detail_allocation_demand`;
ALTER TABLE `stock_order_detail` DROP FOREIGN KEY IF EXISTS `fk_stock_order_detail_batch_item`;

-- 3b. 重建外键：指向 products 和 product_categories
-- product_bom
ALTER TABLE `product_bom`
  ADD CONSTRAINT `fk_product_bom_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_product_bom_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

-- item_batch（已不依赖 item_type，但保留该表继续使用）
-- item_batch.item_id → products.id
ALTER TABLE `item_batch`
  ADD CONSTRAINT `fk_item_batch_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

-- 重建 item_batch 的复合外键用于 stock_order_detail 等表
ALTER TABLE `item_batch`
  DROP INDEX IF EXISTS `uk_item_batch_id_item`,
  ADD UNIQUE KEY `uk_item_batch_id_item` (`id`, `item_id`);

-- inventory_transaction
ALTER TABLE `inventory_transaction`
  ADD CONSTRAINT `fk_inventory_transaction_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

-- stock_order_detail
ALTER TABLE `stock_order_detail`
  ADD CONSTRAINT `fk_stock_order_detail_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`),
  ADD CONSTRAINT `fk_stock_order_detail_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`);

-- production_item_demand
ALTER TABLE `production_item_demand`
  ADD CONSTRAINT `fk_production_item_demand_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

-- item_scrap
ALTER TABLE `item_scrap`
  ADD CONSTRAINT `fk_item_scrap_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

-- stock_check_detail
ALTER TABLE `stock_check_detail`
  ADD CONSTRAINT `fk_stock_check_detail_item_id` FOREIGN KEY (`item_id`) REFERENCES `products` (`id`);

-- =====================================================
-- 4. 删除 item_info 和 item_type 表
-- =====================================================
DROP TABLE IF EXISTS `item_info`;
DROP TABLE IF EXISTS `item_type`;

-- 注意：product_bom 中的 uk 约束也需要重建
ALTER TABLE `product_bom`
  DROP INDEX IF EXISTS `uk_product_bom_product_item`,
  ADD UNIQUE KEY `uk_product_bom_product_item` (`product_id`, `item_id`);

ALTER TABLE `product_bom`
  DROP INDEX IF EXISTS `uk_product_bom_id_item`,
  ADD UNIQUE KEY `uk_product_bom_id_item` (`id`, `item_id`);

-- =====================================================
-- 5. 重建所有视图（替换 item_info → products, item_type → product_categories）
-- =====================================================

DROP VIEW IF EXISTS `v_item_batch_stock`;
CREATE VIEW `v_item_batch_stock` AS
SELECT
  ib.id AS batch_id,
  ib.item_id,
  COALESCE(p.item_code, p.product_model) AS item_code,
  p.product_name AS item_name,
  pc.item_kind,
  ib.batch_code,
  ib.source_type,
  ib.provider,
  ib.source_work_order_id,
  ib.source_production_batch_id,
  ib.batch_status,
  COALESCE(SUM(CASE WHEN trx.stock_status = '可用' THEN trx.quantity ELSE 0 END), 0) AS available_quantity,
  COALESCE(SUM(CASE WHEN trx.stock_status = '待检' THEN trx.quantity ELSE 0 END), 0) AS pending_quantity,
  COALESCE(SUM(CASE WHEN trx.stock_status = '冻结' THEN trx.quantity ELSE 0 END), 0) AS frozen_quantity,
  COALESCE(SUM(CASE WHEN trx.stock_status = '不良' THEN trx.quantity ELSE 0 END), 0) AS defective_quantity,
  COALESCE(SUM(trx.quantity), 0) AS total_quantity
FROM `item_batch` ib
INNER JOIN `products` p ON p.id = ib.item_id
LEFT JOIN `product_categories` pc ON pc.id = p.category_id
LEFT JOIN `inventory_transaction` trx ON trx.batch_id = ib.id AND trx.item_id = ib.item_id
GROUP BY ib.id, ib.item_id, p.product_name, pc.item_kind, ib.batch_code, ib.source_type, ib.provider,
  ib.source_work_order_id, ib.source_production_batch_id, ib.batch_status;

DROP VIEW IF EXISTS `v_production_item_allocation_summary`;
CREATE VIEW `v_production_item_allocation_summary` AS
SELECT
  pia.id AS allocation_id,
  pia.demand_id,
  pia.production_batch_id,
  pia.item_id,
  pia.batch_id,
  pia.assigned_number,
  COALESCE(od.outbound_quantity, 0) AS outbound_quantity,
  COALESCE(rd.returned_quantity, 0) AS returned_quantity,
  COALESCE(rd.returned_available_quantity, 0) AS returned_available_quantity,
  COALESCE(rd.released_return_quantity, 0) AS released_return_quantity,
  COALESCE(isc.stock_scrapped_quantity, 0) AS stock_scrapped_quantity,
  COALESCE(isc.production_scrapped_quantity, 0) AS production_scrapped_quantity,
  pia.assigned_number
    - COALESCE(od.outbound_quantity, 0)
    + COALESCE(rd.returned_available_quantity, 0)
    - COALESCE(isc.stock_scrapped_quantity, 0) AS available_outbound_quantity,
  CASE
    WHEN pia.assigned_number
      - COALESCE(od.outbound_quantity, 0)
      + COALESCE(rd.returned_available_quantity, 0)
      - COALESCE(isc.stock_scrapped_quantity, 0) < 0
    THEN 1 ELSE 0
  END AS is_quantity_abnormal
FROM `production_item_allocation` pia
LEFT JOIN (
  SELECT sod.allocation_id, SUM(sod.quantity) AS outbound_quantity
  FROM `stock_order_detail` sod
  INNER JOIN `stock_order` so ON so.id = sod.order_id
  WHERE so.order_direction = '出库'
    AND so.business_type = '生产领料出库'
    AND so.status = '已完成'
  GROUP BY sod.allocation_id
) od ON od.allocation_id = pia.id
LEFT JOIN (
  SELECT
    allocation_id,
    SUM(return_number) AS returned_quantity,
    SUM(CASE WHEN return_stock_status = '可用' AND release_after_return = 0 THEN return_number ELSE 0 END) AS returned_available_quantity,
    SUM(CASE WHEN release_after_return = 1 THEN return_number ELSE 0 END) AS released_return_quantity
  FROM `return_detail`
  GROUP BY allocation_id
) rd ON rd.allocation_id = pia.id
LEFT JOIN (
  SELECT
    allocation_id,
    SUM(CASE WHEN scrap_scene IN ('WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND') AND status = '已确认' THEN scrap_number ELSE 0 END) AS stock_scrapped_quantity,
    SUM(CASE WHEN scrap_scene = 'PRODUCTION_CONSUMED' AND status = '已确认' THEN scrap_number ELSE 0 END) AS production_scrapped_quantity
  FROM `item_scrap`
  GROUP BY allocation_id
) isc ON isc.allocation_id = pia.id;

DROP VIEW IF EXISTS `v_production_item_demand_summary`;
CREATE VIEW `v_production_item_demand_summary` AS
SELECT
  pid.id AS demand_id,
  pid.production_batch_id,
  pid.bom_id,
  pid.item_id,
  pid.need_number,
  pid.demand_type,
  pid.parent_demand_id,
  pid.source_scrap_id,
  pid.business_status,
  COALESCE(SUM(pia.assigned_number), 0) AS allocated_quantity,
  GREATEST(pid.need_number - COALESCE(SUM(pia.assigned_number), 0), 0) AS unallocated_quantity,
  COALESCE(SUM(pias.outbound_quantity), 0) AS outbound_quantity,
  GREATEST(pid.need_number - COALESCE(SUM(pias.outbound_quantity), 0), 0) AS not_outbound_quantity,
  COALESCE(SUM(pias.returned_quantity), 0) AS returned_quantity,
  COALESCE(SUM(pias.stock_scrapped_quantity), 0) AS stock_scrapped_quantity,
  COALESCE(SUM(pias.production_scrapped_quantity), 0) AS production_scrapped_quantity,
  COALESCE(SUM(pias.available_outbound_quantity), 0) AS available_outbound_quantity,
  CASE WHEN GREATEST(pid.need_number - COALESCE(SUM(pia.assigned_number), 0), 0) > 0 THEN 1 ELSE 0 END AS is_shortage,
  CASE WHEN COALESCE(SUM(pias.is_quantity_abnormal), 0) > 0 THEN 1 ELSE 0 END AS is_quantity_abnormal,
  CASE
    WHEN pid.business_status IN ('已取消', '已关闭', '冻结', '异常') THEN pid.business_status
    WHEN COALESCE(SUM(pia.assigned_number), 0) = 0 THEN '待分配'
    WHEN COALESCE(SUM(pia.assigned_number), 0) < pid.need_number AND COALESCE(SUM(pias.outbound_quantity), 0) = 0 THEN '部分分配'
    WHEN COALESCE(SUM(pia.assigned_number), 0) >= pid.need_number AND COALESCE(SUM(pias.outbound_quantity), 0) = 0 THEN '已分配'
    WHEN COALESCE(SUM(pias.outbound_quantity), 0) > 0 AND COALESCE(SUM(pias.outbound_quantity), 0) < pid.need_number AND COALESCE(SUM(pia.assigned_number), 0) < pid.need_number THEN '缺料待补'
    WHEN COALESCE(SUM(pias.outbound_quantity), 0) > 0 AND COALESCE(SUM(pias.outbound_quantity), 0) < pid.need_number THEN '部分出库'
    WHEN COALESCE(SUM(pias.outbound_quantity), 0) >= pid.need_number THEN '已出库'
    ELSE '未知'
  END AS progress_status
FROM `production_item_demand` pid
LEFT JOIN `production_item_allocation` pia ON pia.demand_id = pid.id AND pia.allocation_status NOT IN ('已取消')
LEFT JOIN `v_production_item_allocation_summary` pias ON pias.allocation_id = pia.id
GROUP BY pid.id, pid.production_batch_id, pid.bom_id, pid.item_id, pid.need_number, pid.demand_type,
  pid.parent_demand_id, pid.source_scrap_id, pid.business_status;

DROP VIEW IF EXISTS `v_item_batch_available_to_allocate`;
CREATE VIEW `v_item_batch_available_to_allocate` AS
SELECT
  stock.batch_id,
  stock.item_id,
  stock.item_code,
  stock.item_name,
  stock.item_kind,
  stock.batch_code,
  stock.available_quantity AS on_hand_available_quantity,
  COALESCE(SUM(CASE
    WHEN pia.allocation_status NOT IN ('已释放', '已取消')
    THEN GREATEST(pia.assigned_number - COALESCE(pias.outbound_quantity, 0) + COALESCE(pias.returned_available_quantity, 0) - COALESCE(pias.stock_scrapped_quantity, 0), 0)
    ELSE 0
  END), 0) AS reserved_quantity,
  stock.available_quantity - COALESCE(SUM(CASE
    WHEN pia.allocation_status NOT IN ('已释放', '已取消')
    THEN GREATEST(pia.assigned_number - COALESCE(pias.outbound_quantity, 0) + COALESCE(pias.returned_available_quantity, 0) - COALESCE(pias.stock_scrapped_quantity, 0), 0)
    ELSE 0
  END), 0) AS available_to_allocate_quantity
FROM `v_item_batch_stock` stock
LEFT JOIN `production_item_allocation` pia ON pia.batch_id = stock.batch_id AND pia.item_id = stock.item_id
LEFT JOIN `v_production_item_allocation_summary` pias ON pias.allocation_id = pia.id
GROUP BY stock.batch_id, stock.item_id, stock.item_code, stock.item_name, stock.item_kind, stock.batch_code, stock.available_quantity;

DROP VIEW IF EXISTS `v_production_batch_item_summary`;
CREATE VIEW `v_production_batch_item_summary` AS
SELECT
  pids.production_batch_id,
  pids.item_id,
  p.product_name AS item_name,
  SUM(pids.need_number) AS total_need_number,
  SUM(pids.allocated_quantity) AS total_allocated_quantity,
  SUM(pids.unallocated_quantity) AS total_unallocated_quantity,
  SUM(pids.outbound_quantity) AS total_outbound_quantity,
  SUM(pids.returned_quantity) AS total_returned_quantity,
  SUM(pids.outbound_quantity - pids.returned_quantity) AS actual_consumed_quantity,
  SUM(pids.stock_scrapped_quantity) AS total_stock_scrapped_quantity,
  SUM(pids.production_scrapped_quantity) AS total_production_scrapped_quantity,
  MAX(pids.is_shortage) AS is_shortage,
  MAX(pids.is_quantity_abnormal) AS is_quantity_abnormal
FROM `v_production_item_demand_summary` pids
INNER JOIN `products` p ON p.id = pids.item_id
GROUP BY pids.production_batch_id, pids.item_id, p.product_name;

DROP VIEW IF EXISTS `v_production_batch_output_summary`;
CREATE VIEW `v_production_batch_output_summary` AS
SELECT
  so.production_batch_id,
  so.work_order_id,
  sod.item_id,
  p.product_name AS item_name,
  pc.item_kind,
  sod.batch_id,
  ib.batch_code,
  sod.quantity AS inbound_quantity,
  sod.stock_status,
  sod.source_stage
FROM `stock_order` so
INNER JOIN `stock_order_detail` sod ON sod.order_id = so.id
INNER JOIN `products` p ON p.id = sod.item_id
LEFT JOIN `product_categories` pc ON pc.id = p.category_id
INNER JOIN `item_batch` ib ON ib.id = sod.batch_id AND ib.item_id = sod.item_id
WHERE so.order_direction = '入库'
  AND so.business_type = '生产入库'
  AND so.status = '已完成'
  AND pc.item_kind IN ('semi_finished', 'finished_product');

SET FOREIGN_KEY_CHECKS = 1;
