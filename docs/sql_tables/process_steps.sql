-- Table structure for `process_steps`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `process_steps`;
CREATE TABLE `process_steps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `step_code` varchar(100) DEFAULT NULL COMMENT '工序编码',
  `step_name` varchar(100) NOT NULL COMMENT '工序名称',
  `sop_file_id` bigint unsigned DEFAULT NULL COMMENT '默认SOP文件ID',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：1启用，0停用',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_process_steps_code_deleted` (`step_code`,`is_deleted`),
  KEY `idx_process_steps_sop_file_id` (`sop_file_id`),
  KEY `idx_process_steps_status` (`status`),
  KEY `idx_process_steps_is_deleted` (`is_deleted`),
  KEY `idx_process_steps_created_by` (`created_by`),
  KEY `idx_process_steps_updated_by` (`updated_by`),
  KEY `idx_process_steps_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_process_steps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_steps_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_steps_sop_file_id` FOREIGN KEY (`sop_file_id`) REFERENCES `technical_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_process_steps_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='标准工序表';
