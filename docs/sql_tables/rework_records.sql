-- Table structure for `rework_records`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `rework_records`;
CREATE TABLE `rework_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '返工记录ID',
  `rework_no` varchar(100) NOT NULL COMMENT '返工单号',
  `source_inspection_id` bigint unsigned NOT NULL COMMENT '来源检验记录ID',
  `recheck_inspection_id` bigint unsigned DEFAULT NULL COMMENT '返工完成后的复检记录ID',
  `product_identifier` varchar(100) DEFAULT NULL COMMENT '产品标识或序号',
  `defect_item` varchar(255) NOT NULL COMMENT '不合格项',
  `defect_desc` text COMMENT '问题描述',
  `return_step_name` varchar(100) DEFAULT NULL COMMENT '返工退回工序名称',
  `handler_id` bigint unsigned DEFAULT NULL COMMENT '返工处理人ID',
  `handling_desc` text COMMENT '处理说明',
  `status` varchar(50) NOT NULL DEFAULT 'pending' COMMENT '状态：pending/doing/wait_recheck/completed/closed',
  `result` varchar(50) NOT NULL DEFAULT 'fail' COMMENT '返工结果：pass/fail/partial_pass',
  `closed_at` datetime DEFAULT NULL COMMENT '关闭时间',
  `remark` text COMMENT '补充说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rework_records_no` (`rework_no`),
  KEY `idx_rework_records_source_inspection_id` (`source_inspection_id`),
  KEY `idx_rework_records_recheck_inspection_id` (`recheck_inspection_id`),
  KEY `idx_rework_records_handler_id` (`handler_id`),
  KEY `idx_rework_records_status` (`status`),
  KEY `idx_rework_records_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_rework_records_source_inspection_id`
    FOREIGN KEY (`source_inspection_id`) REFERENCES `inspection_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rework_records_recheck_inspection_id`
    FOREIGN KEY (`recheck_inspection_id`) REFERENCES `inspection_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_rework_records_handler_id`
    FOREIGN KEY (`handler_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rework_records_created_by`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rework_records_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rework_records_deleted_by`
    FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_rework_records_status`
    CHECK (`status` IN ('pending','doing','wait_recheck','completed','closed')),
  CONSTRAINT `chk_rework_records_result`
    CHECK (`result` IN ('pass','fail','partial_pass'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='检验问题返工闭环记录表';
