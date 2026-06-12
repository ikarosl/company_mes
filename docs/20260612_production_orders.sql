USE company_test;

CREATE TABLE IF NOT EXISTS work_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  order_no VARCHAR(100) NOT NULL COMMENT '工单号',
  product_id BIGINT UNSIGNED NOT NULL COMMENT '产品ID',
  route_id BIGINT UNSIGNED NULL COMMENT '本工单执行工艺路线ID',
  planned_quantity DECIMAL(12,4) NOT NULL COMMENT '计划生产数量',
  unit VARCHAR(50) NOT NULL DEFAULT 'pcs' COMMENT '单位',
  owner_id BIGINT UNSIGNED NULL COMMENT '工单负责人',
  status VARCHAR(50) NOT NULL DEFAULT 'draft' COMMENT 'draft/released/doing/completed/closed/cancelled',
  plan_start_date DATE NULL COMMENT '计划开始日期',
  plan_end_date DATE NULL COMMENT '计划完成日期',
  actual_start_at DATETIME NULL COMMENT '实际开始时间',
  actual_end_at DATETIME NULL COMMENT '实际完成时间',
  remark TEXT NULL COMMENT '备注',
  created_by BIGINT UNSIGNED NULL COMMENT '创建人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新人',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  deleted_by BIGINT UNSIGNED NULL COMMENT '删除人',
  deleted_at DATETIME NULL COMMENT '删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_work_orders_no_deleted (order_no, is_deleted),
  KEY idx_work_orders_product_id (product_id),
  KEY idx_work_orders_route_id (route_id),
  KEY idx_work_orders_owner_id (owner_id),
  KEY idx_work_orders_status (status),
  KEY idx_work_orders_plan_dates (plan_start_date, plan_end_date),
  KEY idx_work_orders_is_deleted (is_deleted),
  KEY idx_work_orders_created_by (created_by),
  KEY idx_work_orders_updated_by (updated_by),
  KEY idx_work_orders_deleted_by (deleted_by),
  CONSTRAINT fk_work_orders_product_id FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_work_orders_route_id FOREIGN KEY (route_id) REFERENCES process_routes (id) ON DELETE SET NULL,
  CONSTRAINT fk_work_orders_owner_id FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_work_orders_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_work_orders_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_work_orders_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_work_orders_status CHECK (status IN ('draft', 'released', 'doing', 'completed', 'closed', 'cancelled')),
  CONSTRAINT chk_work_orders_quantity CHECK (planned_quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='工单表';

CREATE TABLE IF NOT EXISTS production_batches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  work_order_id BIGINT UNSIGNED NOT NULL COMMENT '工单ID',
  batch_no VARCHAR(100) NOT NULL COMMENT '生产批次号',
  product_id BIGINT UNSIGNED NOT NULL COMMENT '产品ID，冗余工单产品便于查询追溯',
  route_id BIGINT UNSIGNED NULL COMMENT '执行工艺路线ID',
  planned_quantity DECIMAL(12,4) NOT NULL COMMENT '批次计划数量',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending/assigned/doing/completed/cancelled',
  material_status VARCHAR(50) NOT NULL DEFAULT 'ungenerated' COMMENT '物料状态',
  dispatch_status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '派工状态',
  production_status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '生产状态',
  inspection_status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT '检验状态',
  owner_id BIGINT UNSIGNED NULL COMMENT '批次负责人',
  plan_start_date DATE NULL COMMENT '计划开始日期',
  plan_end_date DATE NULL COMMENT '计划完成日期',
  actual_start_at DATETIME NULL COMMENT '实际开始时间',
  actual_end_at DATETIME NULL COMMENT '实际完成时间',
  remark TEXT NULL COMMENT '备注',
  created_by BIGINT UNSIGNED NULL COMMENT '创建人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_by BIGINT UNSIGNED NULL COMMENT '更新人',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  deleted_by BIGINT UNSIGNED NULL COMMENT '删除人',
  deleted_at DATETIME NULL COMMENT '删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_production_batches_no_deleted (batch_no, is_deleted),
  KEY idx_production_batches_work_order_id (work_order_id),
  KEY idx_production_batches_product_id (product_id),
  KEY idx_production_batches_route_id (route_id),
  KEY idx_production_batches_status (status),
  KEY idx_production_batches_owner_id (owner_id),
  KEY idx_production_batches_is_deleted (is_deleted),
  KEY idx_production_batches_created_by (created_by),
  KEY idx_production_batches_updated_by (updated_by),
  KEY idx_production_batches_deleted_by (deleted_by),
  CONSTRAINT fk_production_batches_work_order_id FOREIGN KEY (work_order_id) REFERENCES work_orders (id),
  CONSTRAINT fk_production_batches_product_id FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_production_batches_route_id FOREIGN KEY (route_id) REFERENCES process_routes (id) ON DELETE SET NULL,
  CONSTRAINT fk_production_batches_owner_id FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_production_batches_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_production_batches_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_production_batches_deleted_by FOREIGN KEY (deleted_by) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_production_batches_status CHECK (status IN ('pending', 'assigned', 'doing', 'completed', 'cancelled')),
  CONSTRAINT chk_production_batches_material_status CHECK (material_status IN ('ungenerated', 'unassigned', 'partial_assigned', 'assigned', 'ready', 'outbound', 'shortage', 'returned')),
  CONSTRAINT chk_production_batches_dispatch_status CHECK (dispatch_status IN ('pending', 'assigned')),
  CONSTRAINT chk_production_batches_production_status CHECK (production_status IN ('pending', 'doing', 'completed')),
  CONSTRAINT chk_production_batches_inspection_status CHECK (inspection_status IN ('pending', 'inspecting', 'passed', 'failed', 'partial_pass')),
  CONSTRAINT chk_production_batches_quantity CHECK (planned_quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='生产批次表';

SET @batch_usage_fk_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'batch_material_usages'
    AND CONSTRAINT_NAME = 'fk_batch_material_usages_batch_id'
);

SET @batch_usage_fk_sql := IF(
  @batch_usage_fk_exists = 0,
  'ALTER TABLE batch_material_usages ADD CONSTRAINT fk_batch_material_usages_batch_id FOREIGN KEY (batch_id) REFERENCES production_batches (id) ON DELETE SET NULL',
  'SELECT 1'
);

PREPARE batch_usage_fk_stmt FROM @batch_usage_fk_sql;
EXECUTE batch_usage_fk_stmt;
DEALLOCATE PREPARE batch_usage_fk_stmt;
