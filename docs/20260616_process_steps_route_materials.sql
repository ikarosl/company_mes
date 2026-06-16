USE company_test;

CREATE TABLE IF NOT EXISTS process_steps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  step_code VARCHAR(100) NULL,
  step_name VARCHAR(100) NOT NULL,
  sop_file_id BIGINT UNSIGNED NULL,
  remark TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_by BIGINT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_process_steps_code_deleted (step_code, is_deleted),
  KEY idx_process_steps_sop_file_id (sop_file_id),
  KEY idx_process_steps_is_deleted (is_deleted),
  KEY idx_process_steps_created_by (created_by),
  KEY idx_process_steps_updated_by (updated_by),
  KEY idx_process_steps_deleted_by (deleted_by),
  CONSTRAINT fk_process_steps_sop_file_id FOREIGN KEY (sop_file_id) REFERENCES technical_files (id) ON DELETE SET NULL,
  CONSTRAINT fk_process_steps_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_process_steps_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_process_steps_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO process_steps (
  id, step_code, step_name, sop_file_id, remark,
  created_by, created_at, updated_by, updated_at, is_deleted, deleted_by, deleted_at
)
SELECT
  p.id, p.process_code, p.process_name, p.sop_file_id, p.remark,
  p.created_by, p.created_at, p.updated_by, p.updated_at, p.is_deleted, p.deleted_by, p.deleted_at
FROM processes p
LEFT JOIN process_steps ps ON ps.id = p.id
WHERE ps.id IS NULL;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_route_steps'
    AND COLUMN_NAME = 'process_step_id'
);
SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE process_route_steps ADD COLUMN process_step_id BIGINT UNSIGNED NULL AFTER route_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE process_route_steps
SET process_step_id = process_id
WHERE process_step_id IS NULL
  AND process_id IS NOT NULL;

SET @index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_route_steps'
    AND INDEX_NAME = 'idx_process_route_steps_process_step_id'
);
SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE process_route_steps ADD KEY idx_process_route_steps_process_step_id (process_step_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_route_steps'
    AND CONSTRAINT_NAME = 'fk_process_route_steps_process_step_id'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE process_route_steps ADD CONSTRAINT fk_process_route_steps_process_step_id FOREIGN KEY (process_step_id) REFERENCES process_steps (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'route_step_materials'
    AND COLUMN_NAME = 'quantity_per_unit'
);
SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE route_step_materials ADD COLUMN quantity_per_unit DECIMAL(12,4) NULL AFTER product_material_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @pm_quantity_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_materials'
    AND COLUMN_NAME = 'quantity_per_unit'
);
SET @sql := IF(
  @pm_quantity_exists > 0,
  'UPDATE route_step_materials rsm INNER JOIN product_materials pm ON pm.id = rsm.product_material_id SET rsm.quantity_per_unit = COALESCE(rsm.quantity_per_unit, pm.quantity_per_unit) WHERE rsm.is_deleted = 0',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE route_step_materials
SET quantity_per_unit = 1.0000
WHERE quantity_per_unit IS NULL;

ALTER TABLE route_step_materials
  MODIFY COLUMN quantity_per_unit DECIMAL(12,4) NOT NULL;

SET @constraint_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'route_step_materials'
    AND CONSTRAINT_NAME = 'chk_route_step_materials_quantity'
);
SET @sql := IF(
  @constraint_exists = 0,
  'ALTER TABLE route_step_materials ADD CONSTRAINT chk_route_step_materials_quantity CHECK (quantity_per_unit > 0)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'product_materials'
    AND COLUMN_NAME = 'quantity_per_unit'
);
SET @sql := IF(
  @column_exists > 0,
  'ALTER TABLE product_materials DROP COLUMN quantity_per_unit',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_routes'
    AND COLUMN_NAME = 'applicable_product_type'
);
SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE process_routes ADD COLUMN applicable_product_type VARCHAR(100) NULL AFTER version',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE process_routes r
LEFT JOIN product_categories c ON c.id = r.product_category_id
SET r.applicable_product_type = COALESCE(r.applicable_product_type, c.product_type)
WHERE r.applicable_product_type IS NULL;
