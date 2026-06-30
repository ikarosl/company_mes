-- 统一库存单据迁移脚本：将 inbound_order/inbound_detail/outbound_order/outbound_detail 合并为 stock_order/stock_order_detail。
-- 适用场景：已经执行过 docs/20260629_apply_unified_inventory.sql 的本地库。
-- 执行前请先备份数据库。

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS `v_production_batch_output_summary`;
DROP VIEW IF EXISTS `v_item_batch_available_to_allocate`;
DROP VIEW IF EXISTS `v_production_batch_item_summary`;
DROP VIEW IF EXISTS `v_production_item_demand_summary`;
DROP VIEW IF EXISTS `v_production_item_allocation_summary`;

CREATE TABLE IF NOT EXISTS `stock_order` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` VARCHAR(100) NOT NULL COMMENT '库存单据号',
  `order_direction` VARCHAR(20) NOT NULL COMMENT '单据方向：入库/出库',
  `business_type` VARCHAR(30) NOT NULL COMMENT '业务类型',
  `provider` VARCHAR(100) NULL COMMENT '供应商、委外方或来源方',
  `work_order_id` BIGINT UNSIGNED NULL COMMENT '来源或服务工单ID',
  `production_batch_id` BIGINT UNSIGNED NULL COMMENT '来源或服务生产批次ID',
  `status` VARCHAR(30) NOT NULL DEFAULT '待确认' COMMENT '状态：待确认/已拣货/已完成/已取消',
  `operated_at` TIMESTAMP NULL COMMENT '实际确认时间',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stock_order_no` (`order_no`),
  UNIQUE KEY `uk_stock_order_id_direction` (`id`, `order_direction`),
  KEY `idx_stock_order_direction_status` (`order_direction`, `status`),
  KEY `idx_stock_order_work_order_id` (`work_order_id`),
  KEY `idx_stock_order_production_batch_id` (`production_batch_id`),
  CONSTRAINT `fk_stock_order_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `fk_stock_order_production_batch_id` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `fk_stock_order_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_stock_order_direction` CHECK (`order_direction` IN ('入库', '出库')),
  CONSTRAINT `chk_stock_order_business_type` CHECK (`business_type` IN ('采购入库', '生产入库', '委外入库', '退货入库', '盘点生成', '生产领料出库', '销售出库', '其他入库', '其他出库')),
  CONSTRAINT `chk_stock_order_status` CHECK (`status` IN ('待确认', '已拣货', '已完成', '已取消'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存单据主表';

CREATE TABLE IF NOT EXISTS `stock_order_detail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '库存单据主表ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '库存对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '库存批次ID',
  `quantity` DECIMAL(12,4) NOT NULL COMMENT '业务数量，始终为正数，流水表决定正负',
  `stock_status` VARCHAR(20) NOT NULL DEFAULT '可用' COMMENT '库存状态',
  `production_batch_id` BIGINT UNSIGNED NULL COMMENT '服务生产批次ID',
  `demand_id` BIGINT UNSIGNED NULL COMMENT '生产投入需求ID',
  `allocation_id` BIGINT UNSIGNED NULL COMMENT '生产投入分配ID',
  `source_stage` VARCHAR(100) NULL COMMENT '来源工序或阶段',
  `release_after_return` TINYINT NOT NULL DEFAULT 0 COMMENT '退料后是否释放给公共库存',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stock_order_detail_order_batch_item` (`order_id`, `batch_id`, `item_id`, `allocation_id`),
  KEY `idx_stock_order_detail_item_batch` (`item_id`, `batch_id`),
  KEY `idx_stock_order_detail_allocation` (`allocation_id`, `demand_id`),
  CONSTRAINT `fk_stock_order_detail_order_id` FOREIGN KEY (`order_id`) REFERENCES `stock_order` (`id`),
  CONSTRAINT `fk_stock_order_detail_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_stock_order_detail_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `fk_stock_order_detail_demand_batch` FOREIGN KEY (`demand_id`, `production_batch_id`) REFERENCES `production_item_demand` (`id`, `production_batch_id`),
  CONSTRAINT `fk_stock_order_detail_allocation_demand` FOREIGN KEY (`allocation_id`, `demand_id`) REFERENCES `production_item_allocation` (`id`, `demand_id`),
  CONSTRAINT `chk_stock_order_detail_quantity` CHECK (`quantity` > 0),
  CONSTRAINT `chk_stock_order_detail_stock_status` CHECK (`stock_status` IN ('可用', '待检', '冻结', '不良', '报废')),
  CONSTRAINT `chk_stock_order_detail_release` CHECK (`release_after_return` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存单据明细表';

INSERT IGNORE INTO `stock_order` (
  `id`, `order_no`, `order_direction`, `business_type`, `provider`, `work_order_id`, `production_batch_id`,
  `status`, `operated_at`, `operator_id`, `version`, `remark`, `created_at`, `updated_at`
)
SELECT
  io.id,
  io.inbound_no,
  '入库',
  CASE io.source_type
    WHEN '自产' THEN '生产入库'
    WHEN '委外' THEN '委外入库'
    WHEN '退货入库' THEN '退货入库'
    WHEN '盘点生成' THEN '盘点生成'
    WHEN '其他' THEN '其他入库'
    ELSE '采购入库'
  END,
  io.provider,
  io.work_order_id,
  io.production_batch_id,
  CASE io.status
    WHEN '已入库' THEN '已完成'
    WHEN '已取消' THEN '已取消'
    ELSE '待确认'
  END,
  io.inbound_at,
  io.operator_id,
  io.version,
  io.remark,
  io.created_at,
  io.updated_at
FROM `inbound_order` io;

INSERT IGNORE INTO `stock_order_detail` (
  `id`, `order_id`, `item_id`, `batch_id`, `quantity`, `stock_status`, `source_stage`, `remark`, `created_at`
)
SELECT
  idt.id,
  idt.inbound_id,
  idt.item_id,
  idt.batch_id,
  idt.inbound_number,
  idt.stock_status,
  idt.source_stage,
  idt.remark,
  idt.created_at
FROM `inbound_detail` idt;

INSERT IGNORE INTO `stock_order` (
  `order_no`, `order_direction`, `business_type`, `provider`, `work_order_id`, `production_batch_id`,
  `status`, `operated_at`, `operator_id`, `version`, `remark`, `created_at`, `updated_at`
)
SELECT
  oo.outbound_no,
  '出库',
  '生产领料出库',
  NULL,
  oo.work_order_id,
  oo.production_batch_id,
  CASE oo.status
    WHEN '已拣货' THEN '已拣货'
    WHEN '已出库' THEN '已完成'
    WHEN '部分出库' THEN '已完成'
    WHEN '已取消' THEN '已取消'
    ELSE '待确认'
  END,
  oo.outbound_at,
  oo.operator_id,
  oo.version,
  oo.remark,
  oo.created_at,
  oo.created_at
FROM `outbound_order` oo;

INSERT IGNORE INTO `stock_order_detail` (
  `order_id`, `item_id`, `batch_id`, `quantity`, `stock_status`, `production_batch_id`,
  `demand_id`, `allocation_id`, `created_at`
)
SELECT
  so.id,
  od.item_id,
  od.batch_id,
  od.outbound_number,
  '可用',
  od.production_batch_id,
  od.demand_id,
  od.allocation_id,
  od.created_at
FROM `outbound_detail` od
INNER JOIN `outbound_order` oo ON oo.id = od.outbound_id
INNER JOIN `stock_order` so ON so.order_no = oo.outbound_no AND so.order_direction = '出库';

ALTER TABLE `inventory_transaction`
  ADD COLUMN `stock_order_id` BIGINT UNSIGNED NULL COMMENT '库存单据主表ID' AFTER `stock_status`,
  ADD COLUMN `stock_order_detail_id` BIGINT UNSIGNED NULL COMMENT '库存单据明细ID' AFTER `stock_order_id`,
  ADD KEY `idx_inventory_transaction_stock_order` (`stock_order_id`, `stock_order_detail_id`);

UPDATE `inventory_transaction` trx
INNER JOIN `inbound_detail` idt ON trx.reference_type = 'INBOUND_DETAIL' AND trx.reference_detail_id = idt.id
INNER JOIN `stock_order_detail` sod ON sod.id = idt.id
INNER JOIN `stock_order` so ON so.id = sod.order_id
SET trx.stock_order_id = so.id,
  trx.stock_order_detail_id = sod.id,
  trx.reference_type = 'STOCK_ORDER_DETAIL',
  trx.reference_detail_id = sod.id,
  trx.idempotency_key = CONCAT('STOCK_ORDER_DETAIL:', sod.id);

UPDATE `inventory_transaction` trx
INNER JOIN `outbound_detail` od ON trx.reference_type = 'OUTBOUND_DETAIL' AND trx.reference_detail_id = od.id
INNER JOIN `outbound_order` oo ON oo.id = od.outbound_id
INNER JOIN `stock_order` so ON so.order_no = oo.outbound_no AND so.order_direction = '出库'
INNER JOIN `stock_order_detail` sod
  ON sod.order_id = so.id
  AND sod.allocation_id = od.allocation_id
  AND sod.item_id = od.item_id
  AND sod.batch_id = od.batch_id
SET trx.stock_order_id = so.id,
  trx.stock_order_detail_id = sod.id,
  trx.reference_type = 'STOCK_ORDER_DETAIL',
  trx.reference_detail_id = sod.id,
  trx.idempotency_key = CONCAT('STOCK_ORDER_DETAIL:', sod.id);

ALTER TABLE `inventory_transaction`
  ADD CONSTRAINT `fk_inventory_transaction_stock_order_id` FOREIGN KEY (`stock_order_id`) REFERENCES `stock_order` (`id`),
  ADD CONSTRAINT `fk_inventory_transaction_stock_order_detail_id` FOREIGN KEY (`stock_order_detail_id`) REFERENCES `stock_order_detail` (`id`);

DROP TABLE IF EXISTS `outbound_detail`;
DROP TABLE IF EXISTS `outbound_order`;
DROP TABLE IF EXISTS `inbound_detail`;
DROP TABLE IF EXISTS `inbound_order`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE OR REPLACE VIEW `v_production_item_allocation_summary` AS
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

CREATE OR REPLACE VIEW `v_production_item_demand_summary` AS
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

CREATE OR REPLACE VIEW `v_item_batch_available_to_allocate` AS
SELECT
  stock.batch_id,
  stock.item_id,
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
GROUP BY stock.batch_id, stock.item_id, stock.item_name, stock.item_kind, stock.batch_code, stock.available_quantity;

CREATE OR REPLACE VIEW `v_production_batch_item_summary` AS
SELECT
  pids.production_batch_id,
  pids.item_id,
  ii.item_name,
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
INNER JOIN `item_info` ii ON ii.id = pids.item_id
GROUP BY pids.production_batch_id, pids.item_id, ii.item_name;

CREATE OR REPLACE VIEW `v_production_batch_output_summary` AS
SELECT
  so.production_batch_id,
  so.work_order_id,
  sod.item_id,
  ii.item_name,
  it.item_kind,
  sod.batch_id,
  ib.batch_code,
  sod.quantity AS inbound_quantity,
  sod.stock_status,
  sod.source_stage
FROM `stock_order` so
INNER JOIN `stock_order_detail` sod ON sod.order_id = so.id
INNER JOIN `item_info` ii ON ii.id = sod.item_id
INNER JOIN `item_type` it ON it.id = ii.type_id
INNER JOIN `item_batch` ib ON ib.id = sod.batch_id AND ib.item_id = sod.item_id
WHERE so.order_direction = '入库'
  AND so.business_type = '生产入库'
  AND so.status = '已完成'
  AND it.item_kind IN ('semi_finished', 'finished_product');
