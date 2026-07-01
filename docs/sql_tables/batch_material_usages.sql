-- Table structure for `batch_material_usages`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `batch_material_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '物料操作ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `require_id` bigint unsigned DEFAULT NULL COMMENT '需求ID，关联batch_material_requirement.id',
  `material_batch_id` bigint unsigned NOT NULL COMMENT '物料批次ID',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型：reserve/unreserve/issue/return',
  `operation_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次操作数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位快照',
  `related_usage_id` bigint unsigned DEFAULT NULL COMMENT '取消预留或退料时关联的原操作ID',
  `product_materials_id` bigint unsigned DEFAULT NULL COMMENT '兼容字段：历史代码按BOM项聚合时使用',
  `reserved_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '兼容字段：旧reserve数量',
  `used_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '兼容字段：旧issue/return数量',
  `recorded_by` bigint unsigned DEFAULT NULL COMMENT '记录人ID',
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  `remark` text COMMENT '缺料、部分领料、退料原因或差异说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_batch_material_usages_batch_require` (`batch_id`,`require_id`),
  KEY `idx_batch_material_usages_batch_material` (`batch_id`,`product_materials_id`),
  KEY `idx_batch_material_usages_material_batch_id` (`material_batch_id`),
  KEY `idx_batch_material_usages_operation_type` (`operation_type`),
  KEY `idx_batch_material_usages_related_usage_id` (`related_usage_id`),
  KEY `idx_batch_material_usages_recorded_at` (`recorded_at`),
  KEY `idx_batch_material_usages_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_batch_material_usages_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usages_require_id`
    FOREIGN KEY (`require_id`) REFERENCES `batch_material_requirement` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usages_material_batch_id`
    FOREIGN KEY (`material_batch_id`) REFERENCES `material_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usages_product_materials_id`
    FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_usages_related_usage_id`
    FOREIGN KEY (`related_usage_id`) REFERENCES `batch_material_usages` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_material_usages_operation_type`
    CHECK (`operation_type` IN ('reserve','unreserve','issue','return')),
  CONSTRAINT `chk_batch_material_usages_operation_quantity` CHECK (`operation_quantity` >= 0),
  CONSTRAINT `chk_batch_material_usages_reserved_quantity` CHECK (`reserved_quantity` >= 0),
  CONSTRAINT `chk_batch_material_usages_used_quantity` CHECK (`used_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料预留、取消预留、领料与退料流水表';
