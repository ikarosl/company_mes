-- Table structure for `batch_material_requirements`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `batch_material_requirements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '批次物料需求ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `product_materials_id` bigint unsigned NOT NULL COMMENT '产品物料清单ID',
  `plan_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '需求数量快照',
  `unit` varchar(50) DEFAULT NULL COMMENT '需求单位快照',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_material_requirements_batch_material` (`batch_id`,`product_materials_id`),
  KEY `idx_batch_material_requirements_batch_id` (`batch_id`),
  KEY `idx_batch_material_requirements_product_materials_id` (`product_materials_id`),
  KEY `idx_batch_material_requirements_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_batch_material_requirements_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_requirements_product_materials_id`
    FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_material_requirements_plan_quantity` CHECK (`plan_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料需求快照表';
