-- 方案二：统一库存对象与仓储物料模块迁移脚本
-- 注意：本脚本会替换旧仓储物料方案中的 material_batch / material_demand / material_allocation / outbound_* / inventory_transaction。
-- 执行 SQL 文件时请使用 mysql --default-character-set=utf8mb4 并通过 SOURCE 执行，避免中文备注和枚举值乱码。

SET NAMES utf8mb4;

USE `company_mes_v2`;

SET FOREIGN_KEY_CHECKS = 0;
DROP VIEW IF EXISTS `v_production_batch_output_summary`;
DROP VIEW IF EXISTS `v_production_batch_item_summary`;
DROP VIEW IF EXISTS `v_item_batch_available_to_allocate`;
DROP VIEW IF EXISTS `v_production_item_demand_summary`;
DROP VIEW IF EXISTS `v_production_item_allocation_summary`;
DROP VIEW IF EXISTS `v_item_batch_stock`;

DROP TABLE IF EXISTS `stock_check_detail`;
DROP TABLE IF EXISTS `stock_check_order`;
DROP TABLE IF EXISTS `item_scrap`;
DROP TABLE IF EXISTS `return_detail`;
DROP TABLE IF EXISTS `return_order`;
DROP TABLE IF EXISTS `outbound_detail`;
DROP TABLE IF EXISTS `outbound_order`;
DROP TABLE IF EXISTS `production_item_allocation`;
DROP TABLE IF EXISTS `production_item_demand`;
DROP TABLE IF EXISTS `inbound_detail`;
DROP TABLE IF EXISTS `inbound_order`;
DROP TABLE IF EXISTS `inventory_transaction`;
DROP TABLE IF EXISTS `item_batch`;
DROP TABLE IF EXISTS `product_bom`;
DROP TABLE IF EXISTS `item_info`;
DROP TABLE IF EXISTS `item_type`;

DROP TABLE IF EXISTS `material_allocation`;
DROP TABLE IF EXISTS `material_demand`;
DROP TABLE IF EXISTS `material_batch`;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `item_type` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `item_kind` VARCHAR(30) NOT NULL COMMENT '库存对象大类：material/semi_finished/finished_product',
  `type_name` VARCHAR(100) NOT NULL COMMENT '类型名称',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_type_kind_name` (`item_kind`, `type_name`),
  CONSTRAINT `chk_item_type_kind` CHECK (`item_kind` IN ('material', 'semi_finished', 'finished_product'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存对象分类表';

CREATE TABLE `item_info` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `item_code` VARCHAR(100) NOT NULL COMMENT '库存对象编码',
  `item_name` VARCHAR(200) NOT NULL COMMENT '库存对象名称',
  `type_id` BIGINT UNSIGNED NOT NULL COMMENT '类型ID',
  `default_unit` VARCHAR(20) NOT NULL COMMENT '默认单位',
  `status` VARCHAR(20) NOT NULL DEFAULT '启用' COMMENT '状态：启用/停用',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_info_code` (`item_code`),
  KEY `idx_item_info_type_id` (`type_id`),
  CONSTRAINT `fk_item_info_type_id` FOREIGN KEY (`type_id`) REFERENCES `item_type` (`id`),
  CONSTRAINT `chk_item_info_status` CHECK (`status` IN ('启用', '停用'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一库存对象基础信息表';

CREATE TABLE `product_bom` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_id` BIGINT UNSIGNED NOT NULL COMMENT '被生产对象ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '消耗对象ID',
  `per_unit` DECIMAL(12,4) NOT NULL COMMENT '生产一个目标对象需要消耗的数量',
  `unit` VARCHAR(20) NOT NULL COMMENT '用量单位',
  `bom_status` VARCHAR(20) NOT NULL DEFAULT '启用' COMMENT 'BOM状态：启用/停用',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_bom_product_item` (`product_id`, `item_id`),
  UNIQUE KEY `uk_product_bom_id_item` (`id`, `item_id`),
  KEY `idx_product_bom_item_id` (`item_id`),
  CONSTRAINT `fk_product_bom_product_id` FOREIGN KEY (`product_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_product_bom_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `chk_product_bom_per_unit` CHECK (`per_unit` > 0),
  CONSTRAINT `chk_product_bom_status` CHECK (`bom_status` IN ('启用', '停用'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='产品或半成品BOM表';

CREATE TABLE `item_batch` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键，库存批次ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '库存对象ID',
  `batch_code` VARCHAR(100) NOT NULL COMMENT '库存批次号',
  `source_type` VARCHAR(30) NOT NULL DEFAULT '外购' COMMENT '来源类型：自产/外购/委外/退货入库/盘点生成/其他',
  `provider` VARCHAR(100) NULL COMMENT '供应商或委外方',
  `source_work_order_id` BIGINT UNSIGNED NULL COMMENT '来源工单ID',
  `source_production_batch_id` BIGINT UNSIGNED NULL COMMENT '来源生产批次ID',
  `production_date` DATE NULL COMMENT '生产日期或批次日期',
  `batch_status` VARCHAR(20) NOT NULL DEFAULT '可用' COMMENT '批次业务状态：可用/冻结/停用',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_batch_item_code` (`item_id`, `batch_code`),
  UNIQUE KEY `uk_item_batch_id_item` (`id`, `item_id`),
  KEY `idx_item_batch_source_work_order_id` (`source_work_order_id`),
  KEY `idx_item_batch_source_production_batch_id` (`source_production_batch_id`),
  CONSTRAINT `fk_item_batch_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_item_batch_source_work_order_id` FOREIGN KEY (`source_work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `fk_item_batch_source_production_batch_id` FOREIGN KEY (`source_production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `chk_item_batch_source_type` CHECK (`source_type` IN ('自产', '外购', '委外', '退货入库', '盘点生成', '其他')),
  CONSTRAINT `chk_item_batch_status` CHECK (`batch_status` IN ('可用', '冻结', '停用'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一库存批次表';

CREATE TABLE `inventory_transaction` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '库存对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '库存批次ID',
  `transaction_type` VARCHAR(30) NOT NULL COMMENT '库存变动类型',
  `quantity` DECIMAL(12,4) NOT NULL COMMENT '库存变动数量，正数增加，负数减少',
  `stock_status` VARCHAR(20) NOT NULL DEFAULT '可用' COMMENT '库存状态：可用/待检/冻结/不良',
  `reference_type` VARCHAR(50) NULL COMMENT '来源明细类型',
  `reference_detail_id` BIGINT UNSIGNED NULL COMMENT '来源明细ID',
  `idempotency_key` VARCHAR(150) NOT NULL COMMENT '幂等键',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_transaction_idempotency` (`idempotency_key`),
  KEY `idx_inventory_transaction_item_batch` (`item_id`, `batch_id`),
  KEY `idx_inventory_transaction_reference` (`reference_type`, `reference_detail_id`),
  CONSTRAINT `fk_inventory_transaction_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_inventory_transaction_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `chk_inventory_transaction_quantity` CHECK (`quantity` <> 0),
  CONSTRAINT `chk_inventory_transaction_stock_status` CHECK (`stock_status` IN ('可用', '待检', '冻结', '不良'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一库存流水表';

CREATE TABLE `inbound_order` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `inbound_no` VARCHAR(100) NOT NULL COMMENT '入库单号',
  `source_type` VARCHAR(30) NOT NULL COMMENT '来源类型',
  `provider` VARCHAR(100) NULL COMMENT '供应商、委外方或来源方',
  `work_order_id` BIGINT UNSIGNED NULL COMMENT '来源工单ID',
  `production_batch_id` BIGINT UNSIGNED NULL COMMENT '来源生产批次ID',
  `status` VARCHAR(30) NOT NULL DEFAULT '待入库' COMMENT '入库单状态：待入库/已入库/已取消',
  `inbound_at` TIMESTAMP NULL COMMENT '实际入库时间',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inbound_order_no` (`inbound_no`),
  UNIQUE KEY `uk_inbound_order_id_source` (`id`, `source_type`),
  KEY `idx_inbound_order_work_order_id` (`work_order_id`),
  KEY `idx_inbound_order_production_batch_id` (`production_batch_id`),
  CONSTRAINT `fk_inbound_order_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `fk_inbound_order_production_batch_id` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `fk_inbound_order_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_inbound_order_source_type` CHECK (`source_type` IN ('自产', '外购', '委外', '退货入库', '盘点生成', '其他')),
  CONSTRAINT `chk_inbound_order_status` CHECK (`status` IN ('待入库', '已入库', '已取消'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='入库主单表';

CREATE TABLE `inbound_detail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `inbound_id` BIGINT UNSIGNED NOT NULL COMMENT '入库主单ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '入库对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '入库批次ID',
  `inbound_number` DECIMAL(12,4) NOT NULL COMMENT '入库数量',
  `stock_status` VARCHAR(20) NOT NULL DEFAULT '可用' COMMENT '入库后的库存状态',
  `source_stage` VARCHAR(100) NULL COMMENT '来源工序或阶段',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inbound_detail_order_batch_item` (`inbound_id`, `batch_id`, `item_id`),
  KEY `idx_inbound_detail_item_batch` (`item_id`, `batch_id`),
  CONSTRAINT `fk_inbound_detail_inbound_id` FOREIGN KEY (`inbound_id`) REFERENCES `inbound_order` (`id`),
  CONSTRAINT `fk_inbound_detail_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_inbound_detail_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `chk_inbound_detail_number` CHECK (`inbound_number` > 0),
  CONSTRAINT `chk_inbound_detail_stock_status` CHECK (`stock_status` IN ('可用', '待检', '冻结', '不良'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='入库明细表';

CREATE TABLE `production_item_demand` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `production_batch_id` BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  `bom_id` BIGINT UNSIGNED NULL COMMENT 'BOM行ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '需求对象ID',
  `need_number` DECIMAL(12,4) NOT NULL COMMENT '需求数量',
  `demand_type` TINYINT NOT NULL DEFAULT 0 COMMENT '需求类型：0正常/1追加补料/2报废补料',
  `parent_demand_id` BIGINT UNSIGNED NULL COMMENT '原始需求ID',
  `source_scrap_id` BIGINT UNSIGNED NULL COMMENT '来源报废记录ID',
  `reason_type` VARCHAR(50) NULL COMMENT '补料原因',
  `business_status` VARCHAR(30) NOT NULL DEFAULT '正常' COMMENT '业务状态',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_item_demand_source_scrap` (`source_scrap_id`),
  UNIQUE KEY `uk_production_item_demand_id_item` (`id`, `item_id`),
  UNIQUE KEY `uk_production_item_demand_id_batch` (`id`, `production_batch_id`),
  KEY `idx_production_item_demand_batch` (`production_batch_id`),
  KEY `idx_production_item_demand_bom_item` (`bom_id`, `item_id`),
  CONSTRAINT `fk_production_item_demand_batch_id` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `fk_production_item_demand_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_production_item_demand_bom_item` FOREIGN KEY (`bom_id`, `item_id`) REFERENCES `product_bom` (`id`, `item_id`),
  CONSTRAINT `fk_production_item_demand_parent_id` FOREIGN KEY (`parent_demand_id`) REFERENCES `production_item_demand` (`id`),
  CONSTRAINT `chk_production_item_demand_need` CHECK (`need_number` > 0),
  CONSTRAINT `chk_production_item_demand_type` CHECK (`demand_type` IN (0, 1, 2)),
  CONSTRAINT `chk_production_item_demand_status` CHECK (`business_status` IN ('正常', '已取消', '已关闭', '冻结', '异常'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产投入需求表';

CREATE TABLE `production_item_allocation` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `demand_id` BIGINT UNSIGNED NOT NULL COMMENT '需求ID',
  `production_batch_id` BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '库存对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '分配库存批次ID',
  `assigned_number` DECIMAL(12,4) NOT NULL COMMENT '分配数量',
  `allocation_status` VARCHAR(30) NOT NULL DEFAULT '正常' COMMENT '分配业务状态',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_production_item_allocation_id_demand` (`id`, `demand_id`),
  UNIQUE KEY `uk_production_item_allocation_id_batch` (`id`, `production_batch_id`),
  UNIQUE KEY `uk_production_item_allocation_id_item` (`id`, `item_id`),
  KEY `idx_production_item_allocation_demand` (`demand_id`),
  KEY `idx_production_item_allocation_batch_item` (`batch_id`, `item_id`),
  CONSTRAINT `fk_production_item_allocation_demand_item` FOREIGN KEY (`demand_id`, `item_id`) REFERENCES `production_item_demand` (`id`, `item_id`),
  CONSTRAINT `fk_production_item_allocation_demand_batch` FOREIGN KEY (`demand_id`, `production_batch_id`) REFERENCES `production_item_demand` (`id`, `production_batch_id`),
  CONSTRAINT `fk_production_item_allocation_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `chk_production_item_allocation_assigned` CHECK (`assigned_number` > 0),
  CONSTRAINT `chk_production_item_allocation_status` CHECK (`allocation_status` IN ('正常', '已释放', '已取消', '冻结', '异常'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产投入分配表';

CREATE TABLE `outbound_order` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `outbound_no` VARCHAR(100) NOT NULL COMMENT '出库单号',
  `production_batch_id` BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  `work_order_id` BIGINT UNSIGNED NULL COMMENT '工单ID',
  `status` VARCHAR(20) NOT NULL DEFAULT '待拣货' COMMENT '状态：待拣货/已拣货/部分出库/已出库/已取消',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `outbound_at` TIMESTAMP NULL COMMENT '实际出库时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_order_no` (`outbound_no`),
  UNIQUE KEY `uk_outbound_order_id_batch` (`id`, `production_batch_id`),
  CONSTRAINT `fk_outbound_order_batch_id` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `fk_outbound_order_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `fk_outbound_order_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_outbound_order_status` CHECK (`status` IN ('待拣货', '已拣货', '部分出库', '已出库', '已取消'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产领料出库主单表';

CREATE TABLE `outbound_detail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `outbound_id` BIGINT UNSIGNED NOT NULL COMMENT '出库主单ID',
  `production_batch_id` BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  `demand_id` BIGINT UNSIGNED NOT NULL COMMENT '需求ID',
  `allocation_id` BIGINT UNSIGNED NOT NULL COMMENT '分配明细ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '出库对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '出库库存批次ID',
  `outbound_number` DECIMAL(12,4) NOT NULL COMMENT '本次出库数量',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbound_detail_order_allocation` (`outbound_id`, `allocation_id`),
  KEY `idx_outbound_detail_allocation` (`allocation_id`, `demand_id`),
  CONSTRAINT `fk_outbound_detail_order_batch` FOREIGN KEY (`outbound_id`, `production_batch_id`) REFERENCES `outbound_order` (`id`, `production_batch_id`),
  CONSTRAINT `fk_outbound_detail_demand_batch` FOREIGN KEY (`demand_id`, `production_batch_id`) REFERENCES `production_item_demand` (`id`, `production_batch_id`),
  CONSTRAINT `fk_outbound_detail_allocation_demand` FOREIGN KEY (`allocation_id`, `demand_id`) REFERENCES `production_item_allocation` (`id`, `demand_id`),
  CONSTRAINT `fk_outbound_detail_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `chk_outbound_detail_number` CHECK (`outbound_number` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产领料出库明细表';

CREATE TABLE `return_order` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `return_no` VARCHAR(100) NOT NULL COMMENT '退料单号',
  `production_batch_id` BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  `work_order_id` BIGINT UNSIGNED NULL COMMENT '工单ID',
  `status` VARCHAR(20) NOT NULL DEFAULT '待处理' COMMENT '状态：待处理/已入库/已报废/已取消',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `version` INT NOT NULL DEFAULT 0 COMMENT '乐观锁版本号',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `return_at` TIMESTAMP NULL COMMENT '实际退料时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_return_order_no` (`return_no`),
  UNIQUE KEY `uk_return_order_id_batch` (`id`, `production_batch_id`),
  CONSTRAINT `fk_return_order_batch_id` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `fk_return_order_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `fk_return_order_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_return_order_status` CHECK (`status` IN ('待处理', '已入库', '已报废', '已取消'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产退料主单表';

CREATE TABLE `return_detail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `return_id` BIGINT UNSIGNED NOT NULL COMMENT '退料主单ID',
  `production_batch_id` BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  `demand_id` BIGINT UNSIGNED NOT NULL COMMENT '需求ID',
  `allocation_id` BIGINT UNSIGNED NOT NULL COMMENT '分配明细ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '退料对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '退料库存批次ID',
  `return_number` DECIMAL(12,4) NOT NULL COMMENT '本次退料数量',
  `return_stock_status` VARCHAR(20) NOT NULL DEFAULT '可用' COMMENT '退回后的库存状态',
  `release_after_return` TINYINT NOT NULL DEFAULT 0 COMMENT '退回后是否释放给公共库存',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_return_detail_order_allocation` (`return_id`, `allocation_id`),
  CONSTRAINT `fk_return_detail_order_batch` FOREIGN KEY (`return_id`, `production_batch_id`) REFERENCES `return_order` (`id`, `production_batch_id`),
  CONSTRAINT `fk_return_detail_demand_batch` FOREIGN KEY (`demand_id`, `production_batch_id`) REFERENCES `production_item_demand` (`id`, `production_batch_id`),
  CONSTRAINT `fk_return_detail_allocation_demand` FOREIGN KEY (`allocation_id`, `demand_id`) REFERENCES `production_item_allocation` (`id`, `demand_id`),
  CONSTRAINT `fk_return_detail_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `chk_return_detail_number` CHECK (`return_number` > 0),
  CONSTRAINT `chk_return_detail_stock_status` CHECK (`return_stock_status` IN ('可用', '待检', '冻结', '不良', '报废')),
  CONSTRAINT `chk_return_detail_release` CHECK (`release_after_return` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产退料明细表';

CREATE TABLE `item_scrap` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `scrap_no` VARCHAR(100) NOT NULL COMMENT '报废单号',
  `production_batch_id` BIGINT UNSIGNED NULL COMMENT '生产批次ID',
  `demand_id` BIGINT UNSIGNED NULL COMMENT '需求ID',
  `allocation_id` BIGINT UNSIGNED NULL COMMENT '分配明细ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '报废对象ID',
  `batch_id` BIGINT UNSIGNED NULL COMMENT '报废库存批次ID',
  `scrap_scene` VARCHAR(40) NOT NULL COMMENT '报废场景',
  `scrap_number` DECIMAL(12,4) NOT NULL COMMENT '报废数量',
  `status` VARCHAR(20) NOT NULL DEFAULT '待确认' COMMENT '状态：待确认/已确认/已取消',
  `reason` VARCHAR(200) NULL COMMENT '报废原因',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `confirmed_at` TIMESTAMP NULL COMMENT '确认时间',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_scrap_no` (`scrap_no`),
  CONSTRAINT `fk_item_scrap_batch_id` FOREIGN KEY (`production_batch_id`) REFERENCES `production_batches` (`id`),
  CONSTRAINT `fk_item_scrap_demand_id` FOREIGN KEY (`demand_id`) REFERENCES `production_item_demand` (`id`),
  CONSTRAINT `fk_item_scrap_allocation_id` FOREIGN KEY (`allocation_id`) REFERENCES `production_item_allocation` (`id`),
  CONSTRAINT `fk_item_scrap_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_item_scrap_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `fk_item_scrap_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_item_scrap_number` CHECK (`scrap_number` > 0),
  CONSTRAINT `chk_item_scrap_scene` CHECK (`scrap_scene` IN ('WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND', 'PRODUCTION_CONSUMED', 'IN_STOCK')),
  CONSTRAINT `chk_item_scrap_status` CHECK (`status` IN ('待确认', '已确认', '已取消'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='报废记录表';

ALTER TABLE `production_item_demand`
  ADD CONSTRAINT `fk_production_item_demand_source_scrap_id`
  FOREIGN KEY (`source_scrap_id`) REFERENCES `item_scrap` (`id`);

CREATE TABLE `stock_check_order` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `check_no` VARCHAR(100) NOT NULL COMMENT '盘点单号',
  `status` VARCHAR(20) NOT NULL DEFAULT '待盘点' COMMENT '状态：待盘点/盘点中/已完成/已取消',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `started_at` TIMESTAMP NULL COMMENT '开始时间',
  `completed_at` TIMESTAMP NULL COMMENT '完成时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stock_check_order_no` (`check_no`),
  CONSTRAINT `fk_stock_check_order_operator_id` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_stock_check_order_status` CHECK (`status` IN ('待盘点', '盘点中', '已完成', '已取消'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存盘点主单表';

CREATE TABLE `stock_check_detail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `stock_check_id` BIGINT UNSIGNED NOT NULL COMMENT '盘点主单ID',
  `item_id` BIGINT UNSIGNED NOT NULL COMMENT '库存对象ID',
  `batch_id` BIGINT UNSIGNED NOT NULL COMMENT '库存批次ID',
  `stock_status` VARCHAR(20) NOT NULL COMMENT '盘点库存状态',
  `system_quantity` DECIMAL(12,4) NOT NULL COMMENT '账面数量快照',
  `actual_quantity` DECIMAL(12,4) NOT NULL COMMENT '实盘数量',
  `difference_quantity` DECIMAL(12,4) NOT NULL COMMENT '差异数量',
  `result` VARCHAR(20) NOT NULL COMMENT '盘点结果：盘盈/盘亏/一致',
  `adjusted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否已生成调整流水',
  `remark` TEXT NULL COMMENT '备注',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stock_check_detail_object` (`stock_check_id`, `item_id`, `batch_id`, `stock_status`),
  CONSTRAINT `fk_stock_check_detail_order_id` FOREIGN KEY (`stock_check_id`) REFERENCES `stock_check_order` (`id`),
  CONSTRAINT `fk_stock_check_detail_item_id` FOREIGN KEY (`item_id`) REFERENCES `item_info` (`id`),
  CONSTRAINT `fk_stock_check_detail_batch_item` FOREIGN KEY (`batch_id`, `item_id`) REFERENCES `item_batch` (`id`, `item_id`),
  CONSTRAINT `chk_stock_check_detail_system_qty` CHECK (`system_quantity` >= 0),
  CONSTRAINT `chk_stock_check_detail_actual_qty` CHECK (`actual_quantity` >= 0),
  CONSTRAINT `chk_stock_check_detail_result` CHECK (`result` IN ('盘盈', '盘亏', '一致')),
  CONSTRAINT `chk_stock_check_detail_adjusted` CHECK (`adjusted` IN (0, 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存盘点明细表';

CREATE OR REPLACE VIEW `v_item_batch_stock` AS
SELECT
  ib.id AS batch_id,
  ib.item_id,
  ii.item_name,
  it.item_kind,
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
INNER JOIN `item_info` ii ON ii.id = ib.item_id
INNER JOIN `item_type` it ON it.id = ii.type_id
LEFT JOIN `inventory_transaction` trx ON trx.batch_id = ib.id AND trx.item_id = ib.item_id
GROUP BY ib.id, ib.item_id, ii.item_name, it.item_kind, ib.batch_code, ib.source_type, ib.provider,
  ib.source_work_order_id, ib.source_production_batch_id, ib.batch_status;

CREATE OR REPLACE VIEW `v_production_item_allocation_summary` AS
SELECT
  pia.id AS allocation_id,
  pia.demand_id,
  pia.production_batch_id,
  pia.item_id,
  pia.batch_id,
  pia.assigned_number,
  COALESCE(SUM(od.outbound_number), 0) AS outbound_quantity,
  COALESCE(SUM(rd.return_number), 0) AS returned_quantity,
  COALESCE(SUM(CASE WHEN rd.return_stock_status = '可用' AND rd.release_after_return = 0 THEN rd.return_number ELSE 0 END), 0) AS returned_available_quantity,
  COALESCE(SUM(CASE WHEN rd.release_after_return = 1 THEN rd.return_number ELSE 0 END), 0) AS released_return_quantity,
  COALESCE(SUM(CASE WHEN isc.scrap_scene IN ('WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND') AND isc.status = '已确认' THEN isc.scrap_number ELSE 0 END), 0) AS stock_scrapped_quantity,
  COALESCE(SUM(CASE WHEN isc.scrap_scene = 'PRODUCTION_CONSUMED' AND isc.status = '已确认' THEN isc.scrap_number ELSE 0 END), 0) AS production_scrapped_quantity,
  pia.assigned_number
    - COALESCE(SUM(od.outbound_number), 0)
    + COALESCE(SUM(CASE WHEN rd.return_stock_status = '可用' AND rd.release_after_return = 0 THEN rd.return_number ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN isc.scrap_scene IN ('WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND') AND isc.status = '已确认' THEN isc.scrap_number ELSE 0 END), 0) AS available_outbound_quantity,
  CASE
    WHEN pia.assigned_number
      - COALESCE(SUM(od.outbound_number), 0)
      + COALESCE(SUM(CASE WHEN rd.return_stock_status = '可用' AND rd.release_after_return = 0 THEN rd.return_number ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN isc.scrap_scene IN ('WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND') AND isc.status = '已确认' THEN isc.scrap_number ELSE 0 END), 0) < 0
    THEN 1 ELSE 0
  END AS is_quantity_abnormal
FROM `production_item_allocation` pia
LEFT JOIN `outbound_detail` od ON od.allocation_id = pia.id
LEFT JOIN `return_detail` rd ON rd.allocation_id = pia.id
LEFT JOIN `item_scrap` isc ON isc.allocation_id = pia.id
GROUP BY pia.id, pia.demand_id, pia.production_batch_id, pia.item_id, pia.batch_id, pia.assigned_number;

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
  io.production_batch_id,
  io.work_order_id,
  idt.item_id,
  ii.item_name,
  it.item_kind,
  idt.batch_id,
  ib.batch_code,
  idt.inbound_number AS inbound_quantity,
  idt.stock_status,
  idt.source_stage
FROM `inbound_order` io
INNER JOIN `inbound_detail` idt ON idt.inbound_id = io.id
INNER JOIN `item_info` ii ON ii.id = idt.item_id
INNER JOIN `item_type` it ON it.id = ii.type_id
INNER JOIN `item_batch` ib ON ib.id = idt.batch_id AND ib.item_id = idt.item_id
WHERE io.source_type = '自产' AND it.item_kind IN ('semi_finished', 'finished_product');
