USE company_test;

SET @column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_routes'
    AND COLUMN_NAME = 'product_category_id'
);
SET @sql := IF(
  @column_exists = 0,
  'ALTER TABLE process_routes ADD COLUMN product_category_id BIGINT UNSIGNED NULL AFTER route_name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_routes'
    AND INDEX_NAME = 'idx_process_routes_product_category_id'
);
SET @sql := IF(
  @index_exists = 0,
  'ALTER TABLE process_routes ADD KEY idx_process_routes_product_category_id (product_category_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE process_routes r
INNER JOIN (
  SELECT default_route_id AS route_id, MIN(category_id) AS product_category_id
  FROM products
  WHERE default_route_id IS NOT NULL
    AND category_id IS NOT NULL
    AND is_deleted = 0
  GROUP BY default_route_id
) p ON p.route_id = r.id
SET r.product_category_id = p.product_category_id
WHERE r.product_category_id IS NULL;

SET @fk_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'process_routes'
    AND CONSTRAINT_NAME = 'fk_process_routes_product_category_id'
);
SET @sql := IF(
  @fk_exists = 0,
  'ALTER TABLE process_routes ADD CONSTRAINT fk_process_routes_product_category_id FOREIGN KEY (product_category_id) REFERENCES product_categories (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS product_materials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  material_product_id BIGINT UNSIGNED NOT NULL,
  quantity_per_unit DECIMAL(12,4) NOT NULL,
  unit VARCHAR(50) NULL,
  is_key_material TINYINT NOT NULL DEFAULT 1,
  need_batch_record TINYINT NOT NULL DEFAULT 1,
  remark TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_by BIGINT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_materials_product_material_deleted (
    product_id,
    material_product_id,
    is_deleted
  ),
  KEY idx_product_materials_product_id (product_id),
  KEY idx_product_materials_material_product_id (material_product_id),
  KEY idx_product_materials_is_deleted (is_deleted),
  KEY idx_product_materials_created_by (created_by),
  KEY idx_product_materials_updated_by (updated_by),
  KEY idx_product_materials_deleted_by (deleted_by),
  CONSTRAINT fk_product_materials_product_id
    FOREIGN KEY (product_id) REFERENCES products (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_product_materials_material_product_id
    FOREIGN KEY (material_product_id) REFERENCES products (id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_product_materials_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_product_materials_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_product_materials_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS route_step_materials (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_step_id BIGINT UNSIGNED NOT NULL,
  product_material_id BIGINT UNSIGNED NOT NULL,
  remark TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by BIGINT UNSIGNED NULL,
  updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  is_deleted TINYINT NOT NULL DEFAULT 0,
  deleted_by BIGINT UNSIGNED NULL,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_route_step_materials_step_material_deleted (
    route_step_id,
    product_material_id,
    is_deleted
  ),
  KEY idx_route_step_materials_route_step_id (route_step_id),
  KEY idx_route_step_materials_product_material_id (product_material_id),
  KEY idx_route_step_materials_is_deleted (is_deleted),
  KEY idx_route_step_materials_created_by (created_by),
  KEY idx_route_step_materials_updated_by (updated_by),
  KEY idx_route_step_materials_deleted_by (deleted_by),
  CONSTRAINT fk_route_step_materials_route_step_id
    FOREIGN KEY (route_step_id) REFERENCES process_route_steps (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_route_step_materials_product_material_id
    FOREIGN KEY (product_material_id) REFERENCES product_materials (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_route_step_materials_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_route_step_materials_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_route_step_materials_deleted_by
    FOREIGN KEY (deleted_by) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
