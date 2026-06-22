-- Table structure for `production_batches`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `production_batches`;
CREATE TABLE `production_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `work_order_id` bigint unsigned NOT NULL COMMENT '工单ID',
  `batch_no` varchar(100) NOT NULL COMMENT '生产批次号',
  `route_id` bigint unsigned DEFAULT NULL COMMENT '执行工艺路线ID',
  `planned_quantity` decimal(12,4) NOT NULL COMMENT '批次计划数量',
  `status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT 'pending/material_pending/material_assigned/doing/completed/cancelled',
  `owner_id` bigint unsigned DEFAULT NULL COMMENT '批次负责人',
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
  UNIQUE KEY `uk_production_batches_no_deleted` (`batch_no`,`is_deleted`),
  KEY `idx_production_batches_work_order_id` (`work_order_id`),
  KEY `idx_production_batches_route_id` (`route_id`),
  KEY `idx_production_batches_status` (`status`),
  KEY `idx_production_batches_owner_id` (`owner_id`),
  KEY `idx_production_batches_is_deleted` (`is_deleted`),
  KEY `idx_production_batches_created_by` (`created_by`),
  KEY `idx_production_batches_updated_by` (`updated_by`),
  KEY `idx_production_batches_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_production_batches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_owner_id` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_route_id` FOREIGN KEY (`route_id`) REFERENCES `process_routes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_production_batches_work_order_id` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`),
  CONSTRAINT `chk_production_batches_quantity` CHECK (`planned_quantity` > 0),
  CONSTRAINT `chk_production_batches_status` CHECK (`status` in ('pending','material_pending','material_assigned','doing','completed','cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次表';
