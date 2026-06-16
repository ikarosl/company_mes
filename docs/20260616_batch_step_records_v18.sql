-- Align batch_step_records with V1.8 report schema.
-- Existing values are migrated as:
-- actual_owner_id -> responsible_user_id
-- process_name -> step_name
-- finished_at -> completed_at
-- total_quantity -> output_quantity
-- defective_quantity -> abnormal_quantity

CREATE TABLE IF NOT EXISTS batch_step_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'report record id',
  batch_id BIGINT UNSIGNED NOT NULL COMMENT 'production batch id',
  route_step_id BIGINT UNSIGNED NOT NULL COMMENT 'process route step id',
  step_order INT NOT NULL COMMENT 'copied route step order',
  step_name VARCHAR(100) NOT NULL COMMENT 'copied route step name',
  sop_file_id BIGINT UNSIGNED NULL COMMENT 'copied SOP file id',
  responsible_user_id BIGINT UNSIGNED NULL COMMENT 'responsible user for this step',
  output_quantity DECIMAL(12,4) NULL COMMENT '完成数',
  abnormal_quantity DECIMAL(12,4) NULL COMMENT '异常数量',
  return_quantity DECIMAL(12,4) NULL COMMENT '返工数量',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending/doing/completed/abnormal/skipped',
  started_at DATETIME NULL COMMENT 'started time',
  completed_at DATETIME NULL COMMENT 'completed time',
  remark TEXT NULL COMMENT 'process remark',
  created_by BIGINT UNSIGNED NULL COMMENT 'created by',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'created time',
  updated_by BIGINT UNSIGNED NULL COMMENT 'updated by',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'updated time',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'soft delete flag',
  deleted_by BIGINT UNSIGNED NULL COMMENT 'deleted by',
  deleted_at DATETIME NULL COMMENT 'deleted time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_batch_step_records_batch_step_deleted (batch_id, route_step_id, is_deleted),
  KEY idx_batch_step_records_batch_id (batch_id),
  KEY idx_batch_step_records_route_step_id (route_step_id),
  KEY idx_batch_step_records_responsible_user_id (responsible_user_id),
  KEY idx_batch_step_records_status (status),
  KEY idx_batch_step_records_is_deleted (is_deleted),
  KEY idx_batch_step_records_created_by (created_by),
  KEY idx_batch_step_records_updated_by (updated_by),
  KEY idx_batch_step_records_deleted_by (deleted_by),
  CONSTRAINT fk_batch_step_records_batch_id FOREIGN KEY (batch_id) REFERENCES production_batches (id) ON DELETE CASCADE,
  CONSTRAINT fk_batch_step_records_route_step_id FOREIGN KEY (route_step_id) REFERENCES process_route_steps (id) ON DELETE RESTRICT,
  CONSTRAINT fk_batch_step_records_sop_file_id FOREIGN KEY (sop_file_id) REFERENCES technical_files (id) ON DELETE SET NULL,
  CONSTRAINT fk_batch_step_records_responsible_user_id FOREIGN KEY (responsible_user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_batch_step_records_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_batch_step_records_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_batch_step_records_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_batch_step_records_status CHECK (status IN ('pending', 'doing', 'completed', 'abnormal', 'skipped')),
  CONSTRAINT chk_batch_step_records_input_quantity CHECK (output_quantity IS NULL OR output_quantity >= 0),
  CONSTRAINT chk_batch_step_records_output_quantity CHECK (abnormal_quantity IS NULL OR abnormal_quantity >= 0),
  CONSTRAINT chk_batch_step_records_abnormal_quantity CHECK (return_quantity IS NULL OR return_quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='batch step report records';

SET @has_actual_owner := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'actual_owner_id'
);
SET @has_responsible_user := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'responsible_user_id'
);
SET @sql := IF(
  @has_actual_owner > 0 AND @has_responsible_user = 0,
  'ALTER TABLE batch_step_records CHANGE COLUMN actual_owner_id responsible_user_id BIGINT UNSIGNED NULL COMMENT ''responsible user for this step''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_process_name := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'process_name'
);
SET @has_step_name := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'step_name'
);
SET @sql := IF(
  @has_process_name > 0 AND @has_step_name = 0,
  'ALTER TABLE batch_step_records CHANGE COLUMN process_name step_name VARCHAR(100) NOT NULL COMMENT ''copied route step name''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_finished_at := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'finished_at'
);
SET @has_completed_at := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'completed_at'
);
SET @sql := IF(
  @has_finished_at > 0 AND @has_completed_at = 0,
  'ALTER TABLE batch_step_records CHANGE COLUMN finished_at completed_at DATETIME NULL COMMENT ''completed time''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_total_quantity := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'total_quantity'
);
SET @has_output_quantity := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'output_quantity'
);
SET @sql := IF(
  @has_total_quantity > 0 AND @has_output_quantity = 0,
  'ALTER TABLE batch_step_records CHANGE COLUMN total_quantity output_quantity DECIMAL(12,4) NULL COMMENT ''finished quantity''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_defective_quantity := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'defective_quantity'
);
SET @has_abnormal_quantity := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'batch_step_records'
    AND column_name = 'abnormal_quantity'
);
SET @sql := IF(
  @has_defective_quantity > 0 AND @has_abnormal_quantity = 0,
  'ALTER TABLE batch_step_records CHANGE COLUMN defective_quantity abnormal_quantity DECIMAL(12,4) NULL COMMENT ''abnormal quantity''',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE batch_step_records
  ADD COLUMN IF NOT EXISTS sop_file_id BIGINT UNSIGNED NULL COMMENT 'copied SOP file id' AFTER step_name,
  ADD COLUMN IF NOT EXISTS input_quantity DECIMAL(12,4) NULL COMMENT 'input quantity' AFTER responsible_user_id;

UPDATE batch_step_records
SET status = 'pending'
WHERE status = 'assigned';
