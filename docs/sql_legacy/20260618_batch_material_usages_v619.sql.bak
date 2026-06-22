USE company_test;

-- V1.8 / 6.19 批次物料使用表调整：
-- 1. 任务管理的物料需求按产品物料清单生成，不再依赖工序用料关联表。
-- 2. batch_material_usages 同时承载“需求数量”和后续“物料批次分配/实际使用”。
-- 3. material_batch_id 允许为空，空值表示尚未分配具体物料批次的需求行。

ALTER TABLE batch_material_usages
  MODIFY COLUMN batch_id BIGINT UNSIGNED NOT NULL COMMENT '生产批次ID',
  MODIFY COLUMN material_batch_id BIGINT UNSIGNED NULL COMMENT '物料批次ID，未分配批次时为空';

SET @has_product_materials_id := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND COLUMN_NAME = 'product_materials_id'
);
SET @sql := IF(
  @has_product_materials_id = 0,
  'ALTER TABLE batch_material_usages ADD COLUMN product_materials_id BIGINT UNSIGNED NULL COMMENT ''产品物料清单ID'' AFTER material_batch_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_plan_quantity := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND COLUMN_NAME = 'plan_quantity'
);
SET @sql := IF(
  @has_plan_quantity = 0,
  'ALTER TABLE batch_material_usages ADD COLUMN plan_quantity DECIMAL(12,4) NOT NULL DEFAULT 0 COMMENT ''预留/需求数量'' AFTER product_materials_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_reserved_quantity := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND COLUMN_NAME = 'reserved_quantity'
);
SET @sql := IF(
  @has_reserved_quantity > 0,
  'UPDATE batch_material_usages SET plan_quantity = reserved_quantity WHERE plan_quantity = 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_idx_product_materials_id := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND INDEX_NAME = 'idx_batch_material_usages_product_materials_id'
);
SET @sql := IF(
  @has_idx_product_materials_id = 0,
  'ALTER TABLE batch_material_usages ADD KEY idx_batch_material_usages_product_materials_id (product_materials_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_fk_product_materials_id := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND CONSTRAINT_NAME = 'fk_batch_material_usages_product_materials_id'
);
SET @sql := IF(
  @has_fk_product_materials_id = 0,
  'ALTER TABLE batch_material_usages ADD CONSTRAINT fk_batch_material_usages_product_materials_id FOREIGN KEY (product_materials_id) REFERENCES product_materials (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_chk_plan_quantity := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND CONSTRAINT_NAME = 'chk_batch_material_usages_plan_quantity'
);
SET @sql := IF(
  @has_chk_plan_quantity = 0,
  'ALTER TABLE batch_material_usages ADD CONSTRAINT chk_batch_material_usages_plan_quantity CHECK (plan_quantity >= 0)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
