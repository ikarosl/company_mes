-- Table structure for `work_orders`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `work_orders`;
CREATE TABLE `work_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no` varchar(100) NOT NULL COMMENT '工单号',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `planned_quantity` decimal(12,4) NOT NULL COMMENT '计划生产数量',
  `customer_order_no` varchar(100) DEFAULT NULL COMMENT '客户订单号',
  `customer_name` varchar(255) DEFAULT NULL COMMENT '客户名称',
  `quality_level` varchar(50) DEFAULT NULL COMMENT '质量等级：military_grade/standard_military_grade/industrial_grade',
  `owner_id` bigint unsigned DEFAULT NULL COMMENT '工单负责人',
  `status` varchar(50) NOT NULL DEFAULT 'draft' COMMENT 'draft/released/doing/completed/closed/cancelled',
  `plan_start_date` date DEFAULT NULL COMMENT '计划开始日期',
  `plan_end_date` date DEFAULT NULL COMMENT '计划完成日期',
  `actual_start_at` datetime DEFAULT NULL COMMENT '实际开始时间',
  `actual_end_at` datetime DEFAULT NULL COMMENT '实际完成时间',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_orders_no_deleted` (`order_no`,`is_deleted`),
  KEY `idx_work_orders_product_id` (`product_id`),
  KEY `idx_work_orders_owner_id` (`owner_id`),
  KEY `idx_work_orders_status` (`status`),
  KEY `idx_work_orders_plan_dates` (`plan_start_date`,`plan_end_date`),
  KEY `idx_work_orders_is_deleted` (`is_deleted`),
  KEY `idx_work_orders_created_by` (`created_by`),
  KEY `idx_work_orders_updated_by` (`updated_by`),
  KEY `idx_work_orders_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_work_orders_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_work_orders_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_work_orders_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_work_orders_quantity` CHECK (`planned_quantity` > 0),
  CONSTRAINT `chk_work_orders_quality_level`
    CHECK (`quality_level` IS NULL OR `quality_level` in ('military_grade','standard_military_grade','industrial_grade')),
  CONSTRAINT `chk_work_orders_status` CHECK (`status` in ('draft','released','doing','completed','closed','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单表';
