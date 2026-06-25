-- Split material demand snapshots from reserve/issue/return operation history.
SET NAMES utf8mb4;
USE `company_test`;

CREATE TABLE IF NOT EXISTS `batch_material_requirements` (
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

-- Existing rows represent one requirement summary each. Preserve their demand snapshot first.
INSERT INTO batch_material_requirements (
  batch_id, product_materials_id, plan_quantity, unit,
  created_by, created_at, updated_by, updated_at, is_deleted, deleted_by, deleted_at
)
SELECT
  batch_id, product_materials_id, plan_quantity, unit,
  created_by, created_at, updated_by, updated_at, is_deleted, deleted_by, deleted_at
FROM batch_material_usages
WHERE batch_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  plan_quantity = VALUES(plan_quantity),
  unit = VALUES(unit),
  updated_at = VALUES(updated_at);

-- Views depend on the old summary columns and must be rebuilt after the table migration.
DROP VIEW IF EXISTS `v_batch_material_allocation`;
DROP VIEW IF EXISTS `v_material_batch_available`;

RENAME TABLE batch_material_usages TO batch_material_usages_legacy;

CREATE TABLE `batch_material_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '物料操作流水ID',
  `batch_id` bigint unsigned NOT NULL COMMENT '生产批次ID',
  `material_batch_id` bigint unsigned NOT NULL COMMENT '物料批次ID',
  `reserved_quantity` decimal(12,4) NOT NULL DEFAULT '0.0000' COMMENT '本次预留数量，仅reserve使用',
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
  CONSTRAINT `chk_batch_material_usage_ops_operation_type`
    CHECK (`operation_type` IN ('reserve','issue','return')),
  CONSTRAINT `chk_batch_material_usage_ops_operation_quantity` CHECK (
    (`operation_type` = 'reserve' AND `reserved_quantity` > 0 AND `used_quantity` = 0)
    OR (`operation_type` IN ('issue','return') AND `reserved_quantity` = 0 AND `used_quantity` > 0)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次物料预留、领料与退料流水表';

-- The legacy table only stores cumulative values. Convert them into reserve and net issue rows.
INSERT INTO batch_material_usages (
  batch_id, material_batch_id, reserved_quantity, product_materials_id,
  operation_type, used_quantity, unit, recorded_by, recorded_at, remark,
  created_by, created_at, updated_by, updated_at
)
SELECT
  batch_id, material_batch_id, reserved_quantity, product_materials_id,
  'reserve', 0, unit, recorded_by, COALESCE(recorded_at, created_at), remark,
  created_by, created_at, updated_by, updated_at
FROM batch_material_usages_legacy
WHERE is_deleted = 0
  AND status <> 'cancelled'
  AND material_batch_id IS NOT NULL
  AND reserved_quantity > 0;

INSERT INTO batch_material_usages (
  batch_id, material_batch_id, reserved_quantity, product_materials_id,
  operation_type, used_quantity, unit, recorded_by, recorded_at, remark,
  created_by, created_at, updated_by, updated_at
)
SELECT
  batch_id, material_batch_id, 0, product_materials_id,
  'issue', used_quantity, unit, recorded_by, COALESCE(recorded_at, updated_at), remark,
  created_by, created_at, updated_by, updated_at
FROM batch_material_usages_legacy
WHERE is_deleted = 0
  AND status <> 'cancelled'
  AND material_batch_id IS NOT NULL
  AND used_quantity > 0;

DROP TABLE batch_material_usages_legacy;

-- Recreate the two affected views after the new tables and migrated rows are ready.
SOURCE docs/sql_views/v_batch_material_allocation.sql;
SOURCE docs/sql_views/v_material_batch_available.sql;
