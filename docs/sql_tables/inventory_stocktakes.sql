-- Table structure for `inventory_stocktakes`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `inventory_stocktakes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '盘点ID',
  `stocktake_no` varchar(100) DEFAULT NULL COMMENT '盘点单号',
  `inventory_type` varchar(50) NOT NULL COMMENT '盘点对象类型：material/product',
  `inventory_batch_id` bigint unsigned NOT NULL COMMENT '库存批次ID，根据inventory_type指向不同表',
  `batch_no_snapshot` varchar(100) DEFAULT NULL COMMENT '盘点时批号快照',
  `product_id_snapshot` bigint unsigned DEFAULT NULL COMMENT '盘点时产品或物料ID快照',
  `before_quantity` decimal(12,4) NOT NULL COMMENT '账面数量',
  `counted_quantity` decimal(12,4) NOT NULL COMMENT '实盘数量',
  `difference_quantity` decimal(12,4) NOT NULL COMMENT '差异数量：实盘-账面',
  `difference_type` varchar(50) NOT NULL COMMENT '差异类型：surplus/shortage/equal',
  `reason_type` varchar(255) DEFAULT NULL COMMENT '差异原因',
  `status` varchar(50) NOT NULL DEFAULT 'draft' COMMENT '状态：draft/confirmed/adjusted/voided',
  `after_quantity` decimal(12,4) DEFAULT NULL COMMENT '调整后数量，通常等于实盘数量',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '盘点人ID',
  `operated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '盘点时间',
  `adjusted_by` bigint unsigned DEFAULT NULL COMMENT '调整人ID',
  `adjusted_at` datetime DEFAULT NULL COMMENT '调整时间',
  `file_url` varchar(500) DEFAULT NULL COMMENT '盘点图片或文件',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_inventory_stocktakes_no` (`stocktake_no`),
  KEY `idx_inventory_stocktakes_inventory` (`inventory_type`,`inventory_batch_id`),
  KEY `idx_inventory_stocktakes_status` (`status`),
  KEY `idx_inventory_stocktakes_operated_at` (`operated_at`),
  KEY `idx_inventory_stocktakes_is_deleted` (`is_deleted`),
  CONSTRAINT `chk_inventory_stocktakes_inventory_type`
    CHECK (`inventory_type` IN ('material','product')),
  CONSTRAINT `chk_inventory_stocktakes_difference_type`
    CHECK (`difference_type` IN ('surplus','shortage','equal')),
  CONSTRAINT `chk_inventory_stocktakes_status`
    CHECK (`status` IN ('draft','confirmed','adjusted','voided')),
  CONSTRAINT `chk_inventory_stocktakes_quantities`
    CHECK (`before_quantity` >= 0 AND `counted_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='物料、半成品和成品库存盘点台账';
