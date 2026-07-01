-- Table structure for `batch_material_requirement`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `batch_material_requirement` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '需求ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `product_materials_id` bigint unsigned DEFAULT NULL COMMENT '产品物料清单ID，普通需求来源于BOM',
  `material_product_id` bigint unsigned NOT NULL COMMENT '物料ID快照，避免历史追溯反复绕BOM',
  `plan_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '计划需求数量快照',
  `unit` varchar(50) DEFAULT NULL COMMENT '需求单位快照',
  `demand_type` varchar(50) NOT NULL DEFAULT 'normal' COMMENT '需求类型：normal/extra/scrap_replenish',
  `parent_require_id` bigint unsigned DEFAULT NULL COMMENT '补料需求关联的原需求ID',
  `source_scrap_id` bigint unsigned DEFAULT NULL COMMENT '报废补料来源报废记录ID',
  `status` varchar(50) NOT NULL DEFAULT 'normal' COMMENT '需求状态：normal/cancelled/closed',
  `remark` text COMMENT '缺料、部分领料或实际差异说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batch_material_requirement_batch_material` (`batch_id`,`product_materials_id`,`demand_type`),
  KEY `idx_batch_material_requirement_batch_id` (`batch_id`),
  KEY `idx_batch_material_requirement_product_materials_id` (`product_materials_id`),
  KEY `idx_batch_material_requirement_material_product_id` (`material_product_id`),
  KEY `idx_batch_material_requirement_parent_require_id` (`parent_require_id`),
  KEY `idx_batch_material_requirement_source_scrap_id` (`source_scrap_id`),
  KEY `idx_batch_material_requirement_status` (`status`),
  KEY `idx_batch_material_requirement_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_batch_material_requirement_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_requirement_product_materials_id`
    FOREIGN KEY (`product_materials_id`) REFERENCES `product_materials` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_requirement_material_product_id`
    FOREIGN KEY (`material_product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_batch_material_requirement_parent_require_id`
    FOREIGN KEY (`parent_require_id`) REFERENCES `batch_material_requirement` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_batch_material_requirement_plan_quantity` CHECK (`plan_quantity` >= 0),
  CONSTRAINT `chk_batch_material_requirement_demand_type`
    CHECK (`demand_type` IN ('normal','extra','scrap_replenish')),
  CONSTRAINT `chk_batch_material_requirement_status`
    CHECK (`status` IN ('normal','cancelled','closed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料需求计划事实表';
