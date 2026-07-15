-- Table structure for `inspection_records`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `inspection_records`;
CREATE TABLE `inspection_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '检验记录ID',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '生产批次ID；来料检验可为空',
  `material_batch_id` bigint unsigned DEFAULT NULL COMMENT '物料批次ID；来料检验必填',
  `product_inventory_id` bigint unsigned DEFAULT NULL COMMENT '产品库存ID；库存复检或包装检验可用',
  `product_id_snapshot` bigint unsigned DEFAULT NULL COMMENT '检验时产品或物料ID快照',
  `related_inspection_id` bigint unsigned DEFAULT NULL COMMENT '复检关联的原检验记录ID',
  `inspection_no` varchar(100) DEFAULT NULL COMMENT '检验单号',
  `inspection_object_type` varchar(50) NOT NULL COMMENT 'material_batch/production_batch/batch_step/product_inventory',
  `inspection_type` varchar(50) NOT NULL COMMENT 'incoming_material/first_article/process/final/package/test/recheck',
  `inspection_name` varchar(100) DEFAULT NULL COMMENT '检验名称',
  `batch_step_record_id` bigint unsigned DEFAULT NULL COMMENT '首检或过程检验关联的批次工序记录ID',
  `inspect_quantity` decimal(12,4) DEFAULT NULL COMMENT '检验数量',
  `pass_quantity` decimal(12,4) DEFAULT NULL COMMENT '合格数量',
  `fail_quantity` decimal(12,4) DEFAULT NULL COMMENT '不合格数量',
  `result` varchar(50) NOT NULL DEFAULT 'pass' COMMENT 'pass/fail/partial_pass',
  `disposition` varchar(50) DEFAULT NULL COMMENT 'accept/reject/conditional_accept/rework/scrap/return_supplier/hold',
  `inspector_id` bigint unsigned DEFAULT NULL COMMENT '检验人ID',
  `inspected_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '检验时间',
  `file_url` varchar(500) DEFAULT NULL COMMENT '报告、图片或测试文件地址',
  `result_summary` text COMMENT '结果说明或不合格明细摘要',
  `remark` text COMMENT '补充说明；首检时记录首检原因',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  `incoming_material_batch_unique` bigint unsigned GENERATED ALWAYS AS (
    CASE WHEN `inspection_type` = 'incoming_material' AND `is_deleted` = 0 THEN `material_batch_id` ELSE NULL END
  ) STORED COMMENT '有效来料检验批次唯一键',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inspection_records_no` (`inspection_no`),
  UNIQUE KEY `uk_inspection_records_active_incoming` (`incoming_material_batch_unique`),
  KEY `idx_inspection_records_batch_type` (`batch_id`,`inspection_type`),
  KEY `idx_inspection_records_material_type` (`material_batch_id`,`inspection_type`),
  KEY `idx_inspection_records_step_id` (`batch_step_record_id`),
  KEY `idx_inspection_records_product_inventory_id` (`product_inventory_id`),
  KEY `idx_inspection_records_related_id` (`related_inspection_id`),
  KEY `idx_inspection_records_result` (`result`),
  KEY `idx_inspection_records_inspector_id` (`inspector_id`),
  KEY `idx_inspection_records_inspected_at` (`inspected_at`),
  KEY `idx_inspection_records_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_inspection_records_batch_id` FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inspection_records_material_batch_id` FOREIGN KEY (`material_batch_id`) REFERENCES `material_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inspection_records_product_inventory_id` FOREIGN KEY (`product_inventory_id`) REFERENCES `product_inventory_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inspection_records_product_snapshot` FOREIGN KEY (`product_id_snapshot`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspection_records_related_id` FOREIGN KEY (`related_inspection_id`) REFERENCES `inspection_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inspection_records_step_id` FOREIGN KEY (`batch_step_record_id`) REFERENCES `batch_step_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_inspection_records_inspector_id` FOREIGN KEY (`inspector_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspection_records_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspection_records_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inspection_records_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_inspection_records_object_type` CHECK (`inspection_object_type` IN ('material_batch','production_batch','batch_step','product_inventory')),
  CONSTRAINT `chk_inspection_records_type` CHECK (`inspection_type` IN ('incoming_material','first_article','process','final','package','test','recheck')),
  CONSTRAINT `chk_inspection_records_result` CHECK (`result` IN ('pass','fail','partial_pass')),
  CONSTRAINT `chk_inspection_records_disposition` CHECK (`disposition` IS NULL OR `disposition` IN ('accept','reject','conditional_accept','rework','scrap','return_supplier','hold')),
  CONSTRAINT `chk_inspection_records_quantities` CHECK (
    `inspect_quantity` IS NOT NULL AND `inspect_quantity` > 0
    AND `pass_quantity` IS NOT NULL AND `pass_quantity` >= 0
    AND `fail_quantity` IS NOT NULL AND `fail_quantity` >= 0
    AND `pass_quantity` + `fail_quantity` = `inspect_quantity`
  ),
  CONSTRAINT `chk_inspection_records_target` CHECK (
    (`inspection_type` = 'incoming_material' AND `material_batch_id` IS NOT NULL AND `batch_id` IS NULL AND `product_inventory_id` IS NULL AND `related_inspection_id` IS NULL)
    OR (`inspection_type` = 'recheck' AND `related_inspection_id` IS NOT NULL)
    OR (`inspection_type` IN ('first_article','process','final','test') AND `batch_id` IS NOT NULL AND `material_batch_id` IS NULL AND `product_inventory_id` IS NULL AND `related_inspection_id` IS NULL)
    OR (`inspection_type` = 'package' AND `material_batch_id` IS NULL AND `related_inspection_id` IS NULL AND (`batch_id` IS NOT NULL OR `product_inventory_id` IS NOT NULL))
  ),
  CONSTRAINT `chk_inspection_records_incoming_result` CHECK (`inspection_type` <> 'incoming_material' OR `result` IN ('pass','partial_pass')),
  CONSTRAINT `chk_inspection_records_process_step` CHECK (`inspection_type` <> 'process' OR `batch_step_record_id` IS NOT NULL),
  CONSTRAINT `chk_inspection_records_first_reason` CHECK (`inspection_type` <> 'first_article' OR CHAR_LENGTH(TRIM(COALESCE(`remark`, ''))) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='来料、首检、过程、成品、包装及复检记录';
