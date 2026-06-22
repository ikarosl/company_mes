-- Table structure for `process_route_steps`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `process_route_steps`;
CREATE TABLE `process_route_steps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `route_id` bigint unsigned NOT NULL COMMENT '工艺路线ID',
  `process_step_id` bigint unsigned NOT NULL COMMENT '标准工序ID',
  `step_order` int NOT NULL COMMENT '工序顺序',
  `default_owner_id` bigint unsigned DEFAULT NULL COMMENT '默认负责人ID',
  `sop_file_id` bigint unsigned DEFAULT NULL COMMENT 'SOP文件ID',
  `need_inspection` tinyint NOT NULL DEFAULT '0' COMMENT '是否需要检验：1是，0否',
  `need_record` tinyint NOT NULL DEFAULT '1' COMMENT '是否必须报工：1是，0否',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1启用，0停用',
  `remark` varchar(255) DEFAULT NULL COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_process_route_steps_order_deleted` (`route_id`,`step_order`,`is_deleted`),
  KEY `idx_process_route_steps_route_id` (`route_id`),
  KEY `idx_process_route_steps_process_step_id` (`process_step_id`),
  KEY `idx_process_route_steps_default_owner_id` (`default_owner_id`),
  KEY `idx_process_route_steps_sop_file_id` (`sop_file_id`),
  KEY `idx_process_route_steps_need_inspection` (`need_inspection`),
  KEY `idx_process_route_steps_need_record` (`need_record`),
  KEY `idx_process_route_steps_status` (`status`),
  KEY `idx_process_route_steps_is_deleted` (`is_deleted`),
  KEY `idx_process_route_steps_created_by` (`created_by`),
  KEY `idx_process_route_steps_updated_by` (`updated_by`),
  KEY `idx_process_route_steps_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_process_route_steps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_default_owner_id` FOREIGN KEY (`default_owner_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_process_step_id` FOREIGN KEY (`process_step_id`) REFERENCES `process_steps` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_process_route_steps_route_id` FOREIGN KEY (`route_id`) REFERENCES `process_routes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_process_route_steps_sop_file_id` FOREIGN KEY (`sop_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_route_steps_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工艺路线工序表';
