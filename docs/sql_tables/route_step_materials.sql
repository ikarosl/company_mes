-- Table structure for `route_step_materials`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `route_step_materials`;
CREATE TABLE `route_step_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `process_route_step_id` bigint unsigned NOT NULL COMMENT '工艺路线工序明细ID',
  `product_material_id` bigint unsigned NOT NULL COMMENT '产品物料清单ID',
  `quantity_per_unit` decimal(12,4) NOT NULL COMMENT '该工序单件用量',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_route_step_materials_step_material_deleted` (`process_route_step_id`,`product_material_id`,`is_deleted`),
  KEY `idx_route_step_materials_process_route_step_id` (`process_route_step_id`),
  KEY `idx_route_step_materials_product_material_id` (`product_material_id`),
  KEY `idx_route_step_materials_is_deleted` (`is_deleted`),
  KEY `idx_route_step_materials_created_by` (`created_by`),
  KEY `idx_route_step_materials_updated_by` (`updated_by`),
  KEY `idx_route_step_materials_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_route_step_materials_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_route_step_materials_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_route_step_materials_product_material_id` FOREIGN KEY (`product_material_id`) REFERENCES `product_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_step_materials_process_route_step_id` FOREIGN KEY (`process_route_step_id`) REFERENCES `process_route_steps` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_route_step_materials_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_route_step_materials_quantity` CHECK (`quantity_per_unit` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工序用料关联表';
