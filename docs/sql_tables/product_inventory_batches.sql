-- Table structure for `product_inventory_batches`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `product_inventory_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '产品库存ID',
  `inventory_batch_no` varchar(100) DEFAULT NULL COMMENT '产品库存批号',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '来源生产批次ID',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID',
  `source_type` varchar(50) NOT NULL DEFAULT 'production' COMMENT '来源类型：production/purchase/outsourcing/stocktake/other',
  `object_type` varchar(50) NOT NULL COMMENT '对象类型：semi_finished/finished',
  `quantity` int NOT NULL DEFAULT '0' COMMENT '当前库存数量',
  `unit` varchar(50) DEFAULT NULL COMMENT '单位',
  `received_date` date NOT NULL COMMENT '首次入库日期',
  `location` varchar(100) DEFAULT NULL COMMENT '存放位置',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_inventory_batches_batch_product_type` (`batch_id`,`product_id`,`object_type`),
  KEY `idx_product_inventory_batches_inventory_batch_no` (`inventory_batch_no`),
  KEY `idx_product_inventory_batches_product_id` (`product_id`),
  KEY `idx_product_inventory_batches_object_type` (`object_type`),
  KEY `idx_product_inventory_batches_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_product_inventory_batches_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_inventory_batches_product_id`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_product_inventory_batches_source_type`
    CHECK (`source_type` IN ('production','purchase','outsourcing','stocktake','other')),
  CONSTRAINT `chk_product_inventory_batches_object_type`
    CHECK (`object_type` IN ('semi_finished','finished')),
  CONSTRAINT `chk_product_inventory_batches_quantity`
    CHECK (`quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成品和半成品当前库存批次表';
