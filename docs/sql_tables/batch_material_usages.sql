-- Table structure for `batch_material_usages`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `batch_material_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '物料操作流水ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `material_batch_id` bigint unsigned NOT NULL COMMENT '物料批次ID',
  `reserved_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次预留数量',
  `product_materials_id` bigint unsigned NOT NULL COMMENT '产品物料清单ID',
  `operation_type` varchar(50) NOT NULL COMMENT 'reserve/issue/return',
  `used_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次领料或退料数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `recorded_by` bigint unsigned DEFAULT NULL COMMENT '记录人ID',
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_batch_material_usages_batch_material` (`batch_id`,`product_materials_id`),
  KEY `idx_batch_material_usages_material_batch_id` (`material_batch_id`),
  KEY `idx_batch_material_usages_operation_type` (`operation_type`),
  KEY `idx_batch_material_usages_recorded_at` (`recorded_at`),
  KEY `idx_batch_material_usages_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_batch_material_usage_ops_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usage_ops_material_batch_id`
    FOREIGN KEY (`material_batch_id`) REFERENCES `material_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usage_ops_product_materials_id`
    FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_material_usage_ops_reserved_quantity` CHECK (`reserved_quantity` >= 0),
  CONSTRAINT `chk_batch_material_usage_ops_used_quantity` CHECK (`used_quantity` >= 0),
  CONSTRAINT `chk_batch_material_usages_operation_type`
    CHECK (`operation_type` IN ('reserve','issue','return')),
  CONSTRAINT `chk_batch_material_usage_ops_operation_quantity` CHECK (
    (`operation_type` = 'reserve' AND `reserved_quantity` > 0 AND `used_quantity` = 0)
    OR (`operation_type` IN ('issue','return') AND `reserved_quantity` = 0 AND `used_quantity` > 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料预留、领料与退料流水表';
