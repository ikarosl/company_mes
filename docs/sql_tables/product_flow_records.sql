-- Table structure for `product_flow_records`
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE `product_flow_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '流转记录ID',
  `flow_no` varchar(100) DEFAULT NULL COMMENT '入库单号、出库单号或调整单号',
  `inventory_id` bigint unsigned NOT NULL COMMENT '产品库存ID',
  `batch_id` bigint unsigned DEFAULT NULL COMMENT '生产批次ID冗余',
  `product_id` bigint unsigned NOT NULL COMMENT '产品ID冗余',
  `object_type` varchar(50) NOT NULL COMMENT '对象类型：semi_finished/finished',
  `flow_type` varchar(50) NOT NULL COMMENT '流转类型：inbound/outbound/adjustment',
  `flow_reason` varchar(100) DEFAULT NULL COMMENT '流转原因',
  `quantity` int NOT NULL COMMENT '本次流转数量，始终为正数',
  `partner_name` varchar(255) DEFAULT NULL COMMENT '客户或供应商名称',
  `partner_type` varchar(50) DEFAULT NULL COMMENT '合作类型：customer/supplier',
  `external_doc_no` varchar(100) DEFAULT NULL COMMENT '客户单号、发货单或退货单',
  `related_stocktake_id` bigint unsigned DEFAULT NULL COMMENT '盘点调整关联的盘点ID',
  `related_flow_id` bigint unsigned DEFAULT NULL COMMENT '退回时关联的原流转ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '经办人ID',
  `flow_date` date NOT NULL COMMENT '流转日期',
  `file_url` varchar(500) DEFAULT NULL COMMENT '入库单、发货单或退货单附件',
  `remark` text COMMENT '说明',
  `created_by` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_by` bigint unsigned DEFAULT NULL COMMENT '更新人ID',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `is_deleted` tinyint NOT NULL DEFAULT '0' COMMENT '软删除标记：0未删除，1已删除',
  `deleted_by` bigint unsigned DEFAULT NULL COMMENT '删除人ID',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_flow_records_inventory_id` (`inventory_id`),
  KEY `idx_product_flow_records_batch_id` (`batch_id`),
  KEY `idx_product_flow_records_product_id` (`product_id`),
  KEY `idx_product_flow_records_flow_type` (`flow_type`),
  KEY `idx_product_flow_records_flow_date` (`flow_date`),
  KEY `idx_product_flow_records_related_stocktake_id` (`related_stocktake_id`),
  KEY `idx_product_flow_records_related_flow_id` (`related_flow_id`),
  KEY `idx_product_flow_records_is_deleted` (`is_deleted`),
  CONSTRAINT `fk_product_flow_records_inventory_id`
    FOREIGN KEY (`inventory_id`) REFERENCES `product_inventory_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_batch_id`
    FOREIGN KEY (`batch_id`) REFERENCES `production_batches` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_product_id`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_related_stocktake_id`
    FOREIGN KEY (`related_stocktake_id`) REFERENCES `inventory_stocktakes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_product_flow_records_related_flow_id`
    FOREIGN KEY (`related_flow_id`) REFERENCES `product_flow_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_product_flow_records_object_type`
    CHECK (`object_type` IN ('semi_finished','finished')),
  CONSTRAINT `chk_product_flow_records_flow_type`
    CHECK (`flow_type` IN ('inbound','outbound','adjustment')),
  CONSTRAINT `chk_product_flow_records_partner_type`
    CHECK (`partner_type` IS NULL OR `partner_type` IN ('customer','supplier')),
  CONSTRAINT `chk_product_flow_records_quantity`
    CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='成品和半成品入库、出库、退回与调整流水表';
