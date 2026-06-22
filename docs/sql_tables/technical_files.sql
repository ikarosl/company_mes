-- Table structure for `technical_files`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `technical_files`;
CREATE TABLE `technical_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_code` varchar(100) NOT NULL COMMENT '文件编号',
  `file_name` varchar(255) NOT NULL COMMENT '文件名称',
  `file_url` varchar(500) DEFAULT NULL COMMENT '文件地址',
  `file_type` varchar(64) NOT NULL DEFAULT 'sop' COMMENT '文件类型：spec/sop/inspection/other',
  `version` varchar(64) DEFAULT NULL COMMENT '版本',
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
  UNIQUE KEY `uk_technical_files_code_version_deleted` (`file_code`,`version`,`is_deleted`),
  KEY `idx_technical_files_file_type` (`file_type`),
  KEY `idx_technical_files_status` (`status`),
  KEY `idx_technical_files_is_deleted` (`is_deleted`),
  KEY `idx_technical_files_created_by` (`created_by`),
  KEY `idx_technical_files_updated_by` (`updated_by`),
  KEY `idx_technical_files_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_technical_files_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_technical_files_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_technical_files_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技术文件表';
