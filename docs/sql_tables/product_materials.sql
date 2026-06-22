-- Table structure for `product_materials`
SET NAMES utf8mb4;
USE `company_test`;

DROP TABLE IF EXISTS `product_materials`;
CREATE TABLE `product_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `material_product_id` bigint unsigned NOT NULL COMMENT '物料产品ID',
  `quantity_per_unit` decimal(12,4) NOT NULL COMMENT '单件用量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `is_key_material` tinyint NOT NULL DEFAULT '1' COMMENT '是否关键物料',
  `need_batch_record` tinyint NOT NULL DEFAULT '1' COMMENT '是否记录物料批次',
  `remark` text COMMENT '备注',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_materials_product_material_deleted` (`product_id`,`material_product_id`,`is_deleted`),
  KEY `idx_product_materials_product_id` (`product_id`),
  KEY `idx_product_materials_material_product_id` (`material_product_id`),
  KEY `idx_product_materials_is_deleted` (`is_deleted`),
  KEY `idx_product_materials_created_by` (`created_by`),
  KEY `idx_product_materials_updated_by` (`updated_by`),
  KEY `idx_product_materials_deleted_by` (`deleted_by`),
  CONSTRAINT `fk_product_materials_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_materials_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_product_materials_material_product_id` FOREIGN KEY (`material_product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_materials_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_materials_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_product_materials_quantity_per_unit` CHECK (`quantity_per_unit` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='产品物料清单表';
