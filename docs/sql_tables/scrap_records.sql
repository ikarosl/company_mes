-- Table structure for `scrap_records`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `scrap_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '废品ID',
  `scrap_no` varchar(100) DEFAULT NULL COMMENT '报废编号',
  `product_id` bigint unsigned NOT NULL COMMENT '产品或物料ID',
  `scrap_object_type` varchar(50) NOT NULL COMMENT '报废对象类型：material/semi_finished/product',
  `inventory_type` varchar(50) DEFAULT NULL COMMENT '库存类型：material/product',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '生产批次ID',
  `material_batch_id` bigint unsigned DEFAULT NULL COMMENT '物料批次ID',
  `product_inventory_id` bigint unsigned DEFAULT NULL COMMENT '产品库存ID',
  `related_stocktake_id` bigint unsigned DEFAULT NULL COMMENT '盘点发现报废时关联的盘点ID',
  `related_flow_id` bigint unsigned DEFAULT NULL COMMENT '产品报废关联的流转ID',
  `scrap_quantity` decimal(12,4) NOT NULL COMMENT '报废数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `scrap_stage` varchar(50) NOT NULL COMMENT '发生阶段：production/inspection/stocktake/warehouse',
  `scrap_scene` varchar(50) DEFAULT NULL COMMENT '报废场景：in_stock/after_issue/after_return/production_consumed',
  `affects_inventory` tinyint NOT NULL DEFAULT '0' COMMENT '是否影响库存：1是，0否',
  `handling_method` varchar(50) DEFAULT NULL COMMENT '处理方式：报废、返修、隔离、退供应商等',
  `reason_type` varchar(255) DEFAULT NULL COMMENT '报废原因',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '报废时间',
  `file_url` varchar(500) DEFAULT NULL COMMENT '图片或文件地址',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scrap_records_no` (`scrap_no`),
  KEY `idx_scrap_records_product_id` (`product_id`),
  KEY `idx_scrap_records_batch_id` (`batch_id`),
  KEY `idx_scrap_records_material_batch_id` (`material_batch_id`),
  KEY `idx_scrap_records_product_inventory_id` (`product_inventory_id`),
  KEY `idx_scrap_records_related_stocktake_id` (`related_stocktake_id`),
  KEY `idx_scrap_records_related_flow_id` (`related_flow_id`),
  KEY `idx_scrap_records_operated_at` (`operated_at`),
  KEY `idx_scrap_records_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_scrap_records_product_id`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_scrap_records_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_scrap_records_material_batch_id`
    FOREIGN KEY (`material_batch_id`) REFERENCES `material_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_scrap_records_product_inventory_id`
    FOREIGN KEY (`product_inventory_id`) REFERENCES `product_inventory_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_scrap_records_related_stocktake_id`
    FOREIGN KEY (`related_stocktake_id`) REFERENCES `inventory_stocktakes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_scrap_records_related_flow_id`
    FOREIGN KEY (`related_flow_id`) REFERENCES `product_flow_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_scrap_records_object_type`
    CHECK (`scrap_object_type` IN ('material','semi_finished','product')),
  CONSTRAINT `chk_scrap_records_inventory_type`
    CHECK (`inventory_type` IS NULL OR `inventory_type` IN ('material','product')),
  CONSTRAINT `chk_scrap_records_stage`
    CHECK (`scrap_stage` IN ('production','inspection','stocktake','warehouse')),
  CONSTRAINT `chk_scrap_records_scene`
    CHECK (`scrap_scene` IS NULL OR `scrap_scene` IN ('in_stock','after_issue','after_return','production_consumed')),
  CONSTRAINT `chk_scrap_records_quantity` CHECK (`scrap_quantity` > 0),
  CONSTRAINT `chk_scrap_records_affects_inventory` CHECK (`affects_inventory` IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物料、半成品和成品报废事实台账';
