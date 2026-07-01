-- Table structure for `material_batches`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `material_batches`;
CREATE TABLE `material_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_id` bigint unsigned NOT NULL COMMENT '物料对应的产品ID',
  `material_batch_no` varchar(100) NOT NULL COMMENT '物料批次号',
  `supplier_name` varchar(255) DEFAULT NULL COMMENT '供应商名称',
  `protocol_code` varchar(50) DEFAULT NULL COMMENT '技术协议编码，作为来料检测依据',
  `received_date` date DEFAULT NULL COMMENT '入库/接收日期',
  `initial_quantity` decimal(12,4) DEFAULT NULL COMMENT '初始入库数量',
  `quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '当前库存台账数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位快照',
  `status` varchar(50) NOT NULL DEFAULT 'available' COMMENT 'available/partial_used/used_up/disabled',
  `location` varchar(100) DEFAULT NULL COMMENT '存放位置',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_material_batches_no_deleted` (`material_batch_no`,`is_deleted`),
  KEY `idx_material_batches_product_id` (`product_id`),
  KEY `idx_material_batches_supplier_name` (`supplier_name`),
  KEY `idx_material_batches_protocol_code` (`protocol_code`),
  KEY `idx_material_batches_status` (`status`),
  KEY `idx_material_batches_is_deleted` (`is_deleted`),
  KEY `idx_material_batches_created_by` (`created_by`),
  KEY `idx_material_batches_updated_by` (`updated_by`),
  KEY `idx_material_batches_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_material_batches_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_material_batches_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_material_batches_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_material_batches_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_material_batches_quantity` CHECK (`quantity` >= 0),
  CONSTRAINT `chk_material_batches_status` CHECK (`status` in ('available','partial_used','used_up','disabled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物料批次表';
