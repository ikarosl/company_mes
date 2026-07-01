-- Table structure for `inspection_records`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `inspection_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '检验记录ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `inspection_no` varchar(100) DEFAULT NULL COMMENT '检验单号',
  `inspection_type` varchar(50) NOT NULL COMMENT '检验类型：process/final/package/test/recheck',
  `inspection_name` varchar(100) DEFAULT NULL COMMENT '检验名称',
  `inspect_quantity` int DEFAULT NULL COMMENT '检测数量',
  `pass_quantity` int DEFAULT NULL COMMENT '合格数量',
  `fail_quantity` int DEFAULT NULL COMMENT '不合格数量',
  `result` varchar(50) NOT NULL DEFAULT 'pass' COMMENT '检验结论：pass/fail/partial_pass',
  `inspector_id` bigint unsigned DEFAULT NULL COMMENT '检验人ID',
  `inspected_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '检验时间',
  `file_url` varchar(500) DEFAULT NULL COMMENT '报告、图片或测试文件地址',
  `result_summary` text COMMENT '不合格明细摘要',
  `remark` text COMMENT '补充说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspection_records_no` (`inspection_no`),
  KEY `idx_inspection_records_batch_id` (`batch_id`),
  KEY `idx_inspection_records_type` (`inspection_type`),
  KEY `idx_inspection_records_result` (`result`),
  KEY `idx_inspection_records_inspected_at` (`inspected_at`),
  KEY `idx_inspection_records_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_inspection_records_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_inspection_records_type`
    CHECK (`inspection_type` IN ('process','final','package','test','recheck')),
  CONSTRAINT `chk_inspection_records_result`
    CHECK (`result` IN ('pass','fail','partial_pass')),
  CONSTRAINT `chk_inspection_records_quantities`
    CHECK (
      (`inspect_quantity` IS NULL OR `inspect_quantity` >= 0)
      AND (`pass_quantity` IS NULL OR `pass_quantity` >= 0)
      AND (`fail_quantity` IS NULL OR `fail_quantity` >= 0)
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次检验与测试记录表';
