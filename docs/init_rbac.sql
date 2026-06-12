CREATE DATABASE IF NOT EXISTS company_test
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE company_test;

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_departments_code (code),
  KEY idx_departments_parent_id (parent_id),
  KEY idx_departments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NULL,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  email VARCHAR(128) NULL,
  mobile VARCHAR(32) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_department_id (department_id),
  KEY idx_users_status (status),
  CONSTRAINT fk_users_department_id
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(64) NOT NULL,
  description VARCHAR(255) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_code (code),
  KEY idx_roles_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(128) NOT NULL,
  type VARCHAR(32) NOT NULL,
  route_path VARCHAR(255) NULL,
  api_method VARCHAR(16) NULL,
  api_path VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissions_code (code),
  KEY idx_permissions_parent_id (parent_id),
  KEY idx_permissions_type (type),
  KEY idx_permissions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role_id
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_permission_id (permission_id),
  CONSTRAINT fk_role_permissions_role_id
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission_id
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  log_type VARCHAR(32) NOT NULL,
  module VARCHAR(64) NOT NULL,
  action VARCHAR(128) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  target_id BIGINT UNSIGNED NULL,
  target_type VARCHAR(64) NULL,
  result VARCHAR(32) NOT NULL DEFAULT 'success',
  before_data JSON NULL,
  after_data JSON NULL,
  ip VARCHAR(64) NULL,
  remark VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_operation_logs_log_type (log_type),
  KEY idx_operation_logs_module (module),
  KEY idx_operation_logs_action (action),
  KEY idx_operation_logs_user_id (user_id),
  KEY idx_operation_logs_result (result),
  KEY idx_operation_logs_created_at (created_at),
  CONSTRAINT fk_operation_logs_user_id
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO departments (id, parent_id, name, code, sort_order, status)
VALUES
  (1, 0, '公司总部', 'company', 0, 1),
  (2, 1, '生产部', 'production', 10, 1),
  (3, 1, '质量部', 'quality', 20, 1)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  name = VALUES(name),
  code = VALUES(code),
  sort_order = VALUES(sort_order),
  status = VALUES(status),
  deleted_at = NULL;

INSERT INTO users (id, department_id, username, password_hash, display_name, email, mobile, status)
VALUES
  (1, 1, 'admin', '$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO', '系统管理员', 'admin@company.local', NULL, 1),
  (2, 2, 'production_manager', '$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO', '生产主管', 'production.manager@company.local', NULL, 1),
  (3, 2, 'production_operator', '$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO', '生产操作员', 'production.operator@company.local', NULL, 1),
  (4, 3, 'quality_inspector', '$2a$10$lBhLsLyMmRFaviyRy6aiO.DZInv6MAHrm7qSp5OO.yyzD.zvsZgsO', '质量检验员', 'quality.inspector@company.local', NULL, 1)
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  username = VALUES(username),
  password_hash = VALUES(password_hash),
  display_name = VALUES(display_name),
  email = VALUES(email),
  mobile = VALUES(mobile),
  status = VALUES(status),
  deleted_at = NULL;

INSERT INTO roles (id, name, code, description, status)
VALUES
  (1, '超级管理员', 'admin', '系统内置超级管理员角色', 1),
  (2, '生产管理', 'production_manager', '生产部业务管理角色', 1),
  (3, '生产执行', 'production_operator', '生产部工序执行角色', 1),
  (4, '质量检验', 'quality_inspector', '质量部检验与返工处理角色', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  code = VALUES(code),
  description = VALUES(description),
  status = VALUES(status),
  deleted_at = NULL;

DELETE FROM role_permissions;
DELETE FROM permissions;

INSERT INTO permissions (id, parent_id, name, code, type, route_path, api_method, api_path, sort_order, status)
VALUES
  (1, 0, '首页', 'dashboard:page', 'page', '/', NULL, NULL, 10, 1),
  (10, 0, '系统管理', 'system:page', 'page', '/system', NULL, NULL, 100, 1),
  (11, 10, '用户管理', 'system:users:view', 'page', '/system/users', 'GET', '/system/users', 110, 1),
  (12, 11, '用户详情', 'system:users:detail', 'api', NULL, 'GET', '/system/users/{id}', 111, 1),
  (13, 11, '新增用户', 'system:users:create', 'api', NULL, 'POST', '/system/users', 112, 1),
  (14, 11, '编辑用户', 'system:users:update', 'api', NULL, 'PUT', '/system/users/{id}', 113, 1),
  (15, 11, '启用用户', 'system:users:enable', 'api', NULL, 'PUT', '/system/users/{id}/enable', 114, 1),
  (16, 11, '停用用户', 'system:users:disable', 'api', NULL, 'PUT', '/system/users/{id}/disable', 115, 1),
  (17, 11, '重置密码', 'system:users:reset-password', 'api', NULL, 'PUT', '/system/users/{id}/reset-password', 116, 1),
  (18, 11, '分配角色', 'system:users:assign-role', 'api', NULL, 'PUT', '/system/users/{id}/roles', 117, 1),
  (20, 10, '角色管理', 'system:roles:view', 'page', '/system/roles', 'GET', '/system/roles', 120, 1),
  (21, 20, '角色详情', 'system:roles:detail', 'api', NULL, 'GET', '/system/roles/{id}', 121, 1),
  (22, 20, '新增角色', 'system:roles:create', 'api', NULL, 'POST', '/system/roles', 122, 1),
  (23, 20, '编辑角色', 'system:roles:update', 'api', NULL, 'PUT', '/system/roles/{id}', 123, 1),
  (24, 20, '删除角色', 'system:roles:delete', 'api', NULL, 'DELETE', '/system/roles/{id}', 124, 1),
  (25, 20, '启用角色', 'system:roles:enable', 'api', NULL, 'PUT', '/system/roles/{id}/enable', 125, 1),
  (26, 20, '停用角色', 'system:roles:disable', 'api', NULL, 'PUT', '/system/roles/{id}/disable', 126, 1),
  (27, 20, '分配权限', 'system:roles:assign-permissions', 'api', NULL, 'PUT', '/system/roles/{id}/permissions', 127, 1),
  (30, 10, '权限管理', 'system:permissions:view', 'page', '/system/permissions', 'GET', '/system/permissions', 130, 1),
  (31, 30, '权限详情', 'system:permissions:detail', 'api', NULL, 'GET', '/system/permissions/{id}', 131, 1),
  (32, 30, '新增权限', 'system:permissions:create', 'api', NULL, 'POST', '/system/permissions', 132, 1),
  (33, 30, '编辑权限', 'system:permissions:update', 'api', NULL, 'PUT', '/system/permissions/{id}', 133, 1),
  (34, 30, '删除权限', 'system:permissions:delete', 'api', NULL, 'DELETE', '/system/permissions/{id}', 134, 1),
  (35, 30, '启用权限', 'system:permissions:enable', 'api', NULL, 'PUT', '/system/permissions/{id}/enable', 135, 1),
  (36, 30, '停用权限', 'system:permissions:disable', 'api', NULL, 'PUT', '/system/permissions/{id}/disable', 136, 1),
  (40, 10, '日志管理', 'system:logs:view', 'page', '/system/logs', 'GET', '/system/logs', 140, 1),
  (41, 40, '日志详情', 'system:logs:detail', 'api', NULL, 'GET', '/system/logs/{id}', 141, 1),
  (45, 40, '导出日志', 'system:logs:export', 'api', NULL, 'GET', '/system/logs/export', 145, 1),
  (50, 0, '产品管理', 'product:page', 'page', '/product', NULL, NULL, 200, 1),
  (51, 50, '产品资料', 'product:products:view', 'page', '/product/products', 'GET', '/products', 210, 1),
  (52, 51, '产品详情', 'product:products:detail', 'api', NULL, 'GET', '/products/{id}', 211, 1),
  (53, 51, '新增产品', 'product:products:create', 'api', NULL, 'POST', '/products', 212, 1),
  (54, 51, '编辑产品', 'product:products:update', 'api', NULL, 'PUT', '/products/{id}', 213, 1),
  (55, 51, '启用产品', 'product:products:enable', 'api', NULL, 'PUT', '/products/{id}/enable', 214, 1),
  (56, 51, '停用产品', 'product:products:disable', 'api', NULL, 'PUT', '/products/{id}/disable', 215, 1),
  (57, 51, '查看产品库存', 'product:products:view-inventory', 'api', NULL, 'GET', '/products/{id}/inventory', 216, 1),
  (58, 51, '查看产品工艺路线', 'product:products:view-route', 'api', NULL, 'GET', '/products/{id}/routes', 217, 1),
  (59, 51, '配置产品用料清单', 'product:products:config-bom', 'api', NULL, 'PUT', '/products/{id}/bom', 218, 1),
  (60, 51, '绑定默认工艺路线', 'product:products:bind-route', 'api', NULL, 'PUT', '/products/{id}/route', 219, 1),
  (70, 50, '产品分类', 'product:categories:view', 'page', '/product/categories', 'GET', '/product-categories', 230, 1),
  (71, 70, '产品分类详情', 'product:categories:detail', 'api', NULL, 'GET', '/product-categories/{id}', 231, 1),
  (72, 70, '新增产品分类', 'product:categories:create', 'api', NULL, 'POST', '/product-categories', 232, 1),
  (73, 70, '编辑产品分类', 'product:categories:update', 'api', NULL, 'PUT', '/product-categories/{id}', 233, 1),
  (74, 70, '启用产品分类', 'product:categories:enable', 'api', NULL, 'PUT', '/product-categories/{id}/enable', 234, 1),
  (75, 70, '停用产品分类', 'product:categories:disable', 'api', NULL, 'PUT', '/product-categories/{id}/disable', 235, 1),
  (80, 50, '生产工序', 'product:processes:view', 'page', '/product/processes', 'GET', '/processes', 250, 1),
  (81, 80, '生产工序详情', 'product:processes:detail', 'api', NULL, 'GET', '/processes/{id}', 251, 1),
  (82, 80, '新增生产工序', 'product:processes:create', 'api', NULL, 'POST', '/processes', 252, 1),
  (83, 80, '编辑生产工序', 'product:processes:update', 'api', NULL, 'PUT', '/processes/{id}', 253, 1),
  (84, 80, '启用生产工序', 'product:processes:enable', 'api', NULL, 'PUT', '/processes/{id}/enable', 254, 1),
  (85, 80, '停用生产工序', 'product:processes:disable', 'api', NULL, 'PUT', '/processes/{id}/disable', 255, 1),
  (86, 80, '上传工序SOP', 'product:processes:upload-sop', 'api', NULL, 'POST', '/processes/{id}/sop', 256, 1),
  (90, 50, '工艺路线', 'product:routes:view', 'page', '/product/routes', 'GET', '/routes', 270, 1),
  (91, 90, '工艺路线详情', 'product:routes:detail', 'api', NULL, 'GET', '/routes/{id}', 271, 1),
  (92, 90, '新增工艺路线', 'product:routes:create', 'api', NULL, 'POST', '/routes', 272, 1),
  (93, 90, '编辑工艺路线', 'product:routes:update', 'api', NULL, 'PUT', '/routes/{id}', 273, 1),
  (94, 90, '删除工艺路线', 'product:routes:delete', 'api', NULL, 'DELETE', '/routes/{id}', 274, 1),
  (95, 90, '启用工艺路线', 'product:routes:enable', 'api', NULL, 'PUT', '/routes/{id}/enable', 275, 1),
  (96, 90, '停用工艺路线', 'product:routes:disable', 'api', NULL, 'PUT', '/routes/{id}/disable', 276, 1),
  (97, 90, '配置工艺路线工序', 'product:routes:config-processes', 'api', NULL, 'PUT', '/routes/{id}/processes', 277, 1),
  (100, 0, '仓储管理', 'warehouse:page', 'page', '/warehouse', NULL, NULL, 300, 1),
  (101, 100, '库存管理', 'warehouse:inventory:view', 'page', '/warehouse/inventory', 'GET', '/warehouse/inventory', 310, 1),
  (102, 101, '查看可用库存', 'warehouse:inventory:view-available', 'api', NULL, 'GET', '/warehouse/inventory/available', 311, 1),
  (103, 101, '查看预留库存', 'warehouse:inventory:view-reserved', 'api', NULL, 'GET', '/warehouse/inventory/reserved', 312, 1),
  (104, 101, '库存盘点', 'warehouse:inventory:stocktake', 'api', NULL, 'POST', '/warehouse/inventory/stocktake', 313, 1),
  (105, 101, '库存调整', 'warehouse:inventory:adjust', 'api', NULL, 'PUT', '/warehouse/inventory/adjust', 314, 1),
  (110, 100, '出入库管理', 'warehouse:transactions:view', 'page', '/warehouse/transactions', 'GET', '/warehouse/transactions', 330, 1),
  (111, 110, '出入库详情', 'warehouse:transactions:detail', 'api', NULL, 'GET', '/warehouse/transactions/{id}', 331, 1),
  (112, 110, '入库', 'warehouse:transactions:inbound', 'api', NULL, 'POST', '/warehouse/transactions/inbound', 332, 1),
  (113, 110, '出库', 'warehouse:transactions:outbound', 'api', NULL, 'POST', '/warehouse/transactions/outbound', 333, 1),
  (114, 110, '发运', 'warehouse:transactions:shipment', 'api', NULL, 'POST', '/warehouse/transactions/shipment', 334, 1),
  (115, 110, '退料', 'warehouse:transactions:return', 'api', NULL, 'POST', '/warehouse/transactions/return', 335, 1),
  (130, 0, '生产管理', 'production:page', 'page', '/production', NULL, NULL, 400, 1),
  (131, 130, '工单管理', 'production:orders:view', 'page', '/production/orders', 'GET', '/orders', 410, 1),
  (132, 131, '工单详情', 'production:orders:detail', 'api', NULL, 'GET', '/orders/{id}', 411, 1),
  (133, 131, '新增工单', 'production:orders:create', 'api', NULL, 'POST', '/orders', 412, 1),
  (134, 131, '编辑工单', 'production:orders:update', 'api', NULL, 'PUT', '/orders/{id}', 413, 1),
  (135, 131, '保存草稿', 'production:orders:draft', 'api', NULL, 'PUT', '/orders/{id}/draft', 414, 1),
  (136, 131, '下达工单', 'production:orders:release', 'api', NULL, 'PUT', '/orders/{id}/release', 415, 1),
  (137, 131, '关闭工单', 'production:orders:close', 'api', NULL, 'PUT', '/orders/{id}/close', 416, 1),
  (138, 131, '取消工单', 'production:orders:cancel', 'api', NULL, 'PUT', '/orders/{id}/cancel', 417, 1),
  (139, 131, '查看工单任务', 'production:orders:tasks:view', 'api', NULL, 'GET', '/orders/{id}/tasks', 418, 1),
  (140, 131, '新增工单任务', 'production:orders:tasks:create', 'api', NULL, 'POST', '/orders/{id}/tasks', 419, 1),
  (141, 131, '编辑工单任务', 'production:orders:tasks:update', 'api', NULL, 'PUT', '/orders/{id}/tasks/{taskId}', 420, 1),
  (142, 131, '生成工单物料需求', 'production:orders:generate-material-demand', 'api', NULL, 'POST', '/orders/{id}/material-demand', 421, 1),
  (143, 131, '分配工单物料', 'production:orders:allocate-material', 'api', NULL, 'POST', '/orders/{id}/material-allocation', 422, 1),
  (150, 130, '任务管理', 'production:tasks:view', 'page', '/production/tasks', 'GET', '/tasks', 440, 1),
  (151, 150, '任务详情', 'production:tasks:detail', 'api', NULL, 'GET', '/tasks/{id}', 441, 1),
  (152, 150, '新增任务', 'production:tasks:create', 'api', NULL, 'POST', '/tasks', 442, 1),
  (153, 150, '编辑任务', 'production:tasks:update', 'api', NULL, 'PUT', '/tasks/{id}', 443, 1),
  (154, 150, '生成任务物料需求', 'production:tasks:generate-material-demand', 'api', NULL, 'POST', '/tasks/{id}/material-demand', 444, 1),
  (155, 150, '分配任务物料', 'production:tasks:allocate-material', 'api', NULL, 'POST', '/tasks/{id}/material-allocation', 445, 1),
  (156, 150, '任务派工', 'production:tasks:dispatch', 'api', NULL, 'POST', '/tasks/{id}/dispatch', 446, 1),
  (157, 150, '开始生产', 'production:tasks:start', 'api', NULL, 'PUT', '/tasks/{id}/start', 447, 1),
  (158, 150, '完成生产', 'production:tasks:finish', 'api', NULL, 'PUT', '/tasks/{id}/finish', 448, 1),
  (159, 150, '创建返工', 'production:tasks:create-rework', 'api', NULL, 'POST', '/tasks/{id}/rework', 449, 1),
  (160, 150, '查看追溯', 'production:tasks:view-trace', 'api', NULL, 'GET', '/tasks/{id}/trace', 450, 1),
  (170, 130, '物料分配', 'production:material-allocation:view', 'page', '/production/material-allocation', 'GET', '/material-allocation', 470, 1),
  (171, 170, '生成物料需求', 'production:material-allocation:generate-demand', 'api', NULL, 'POST', '/material-allocation/generate-demand', 471, 1),
  (172, 170, '分配物料', 'production:material-allocation:allocate', 'api', NULL, 'POST', '/material-allocation/allocate', 472, 1),
  (173, 170, '确认齐套', 'production:material-allocation:confirm-kit', 'api', NULL, 'PUT', '/material-allocation/{id}/confirm-kit', 473, 1),
  (174, 170, '确认出库', 'production:material-allocation:confirm-outbound', 'api', NULL, 'PUT', '/material-allocation/{id}/confirm-outbound', 474, 1),
  (175, 170, '退料', 'production:material-allocation:return-material', 'api', NULL, 'POST', '/material-allocation/{id}/return', 475, 1),
  (180, 0, '质量管理', 'quality:page', 'page', '/quality', NULL, NULL, 500, 1),
  (181, 180, '检验记录', 'quality:inspections:view', 'page', '/quality/inspections', 'GET', '/quality/inspections', 510, 1),
  (182, 181, '检验详情', 'quality:inspections:detail', 'api', NULL, 'GET', '/quality/inspections/{id}', 511, 1),
  (183, 181, '新增检验记录', 'quality:inspections:create', 'api', NULL, 'POST', '/quality/inspections', 512, 1),
  (184, 181, '编辑检验记录', 'quality:inspections:update', 'api', NULL, 'PUT', '/quality/inspections/{id}', 513, 1),
  (185, 181, '上传检测文件', 'quality:inspections:upload-file', 'api', NULL, 'POST', '/quality/inspections/{id}/files', 514, 1),
  (186, 181, '创建检验返工', 'quality:inspections:create-rework', 'api', NULL, 'POST', '/quality/inspections/{id}/rework', 515, 1),
  (187, 181, '确认合格入库', 'quality:inspections:confirm-inbound', 'api', NULL, 'PUT', '/quality/inspections/{id}/confirm-inbound', 516, 1),
  (190, 180, '返工记录', 'quality:reworks:view', 'page', '/quality/reworks', 'GET', '/quality/reworks', 530, 1),
  (191, 190, '返工详情', 'quality:reworks:detail', 'api', NULL, 'GET', '/quality/reworks/{id}', 531, 1),
  (192, 190, '新增返工记录', 'quality:reworks:create', 'api', NULL, 'POST', '/quality/reworks', 532, 1),
  (193, 190, '编辑返工记录', 'quality:reworks:update', 'api', NULL, 'PUT', '/quality/reworks/{id}', 533, 1),
  (194, 190, '分配返工负责人', 'quality:reworks:assign-owner', 'api', NULL, 'PUT', '/quality/reworks/{id}/owner', 534, 1),
  (195, 190, '填写返工结果', 'quality:reworks:submit-result', 'api', NULL, 'PUT', '/quality/reworks/{id}/result', 535, 1),
  (196, 190, '返工后重新检验', 'quality:reworks:reinspect', 'api', NULL, 'POST', '/quality/reworks/{id}/reinspect', 536, 1),
  (210, 0, '员工端', 'worker:page', 'page', '/worker', NULL, NULL, 600, 1),
  (211, 210, '我的任务', 'worker:tasks:view', 'page', '/worker/tasks', 'GET', '/worker/tasks', 610, 1),
  (212, 211, '我的任务详情', 'worker:tasks:detail', 'api', NULL, 'GET', '/worker/tasks/{id}', 611, 1),
  (213, 211, '查看SOP', 'worker:tasks:view-sop', 'api', NULL, 'GET', '/worker/tasks/{id}/sop', 612, 1),
  (214, 211, '开始我的任务', 'worker:tasks:start', 'api', NULL, 'PUT', '/worker/tasks/{id}/start', 613, 1),
  (215, 211, '完成我的任务', 'worker:tasks:complete', 'api', NULL, 'PUT', '/worker/tasks/{id}/complete', 614, 1),
  (216, 211, '查看我的任务历史', 'worker:tasks:history', 'api', NULL, 'GET', '/worker/tasks/{id}/history', 615, 1),
  (220, 0, '检测端', 'inspector:page', 'page', '/inspector', NULL, NULL, 700, 1),
  (221, 220, '检测任务', 'inspector:tasks:view', 'page', '/inspector/tasks', 'GET', '/inspector/tasks', 710, 1),
  (222, 221, '检测任务详情', 'inspector:tasks:detail', 'api', NULL, 'GET', '/inspector/tasks/{id}', 711, 1),
  (223, 221, '查看规格书', 'inspector:tasks:view-spec', 'api', NULL, 'GET', '/inspector/tasks/{id}/spec', 712, 1),
  (224, 221, '填写检测结果', 'inspector:tasks:submit-result', 'api', NULL, 'PUT', '/inspector/tasks/{id}/result', 713, 1),
  (225, 221, '上传检测文件', 'inspector:tasks:upload-file', 'api', NULL, 'POST', '/inspector/tasks/{id}/files', 714, 1),
  (226, 221, '创建检测返工', 'inspector:tasks:create-rework', 'api', NULL, 'POST', '/inspector/tasks/{id}/rework', 715, 1),
  (230, 130, '派工管理', 'production:dispatch:view', 'page', '/production/dispatch', 'GET', '/dispatch', 480, 1),
  (231, 230, '派工详情', 'production:dispatch:detail', 'api', NULL, 'GET', '/dispatch/{batchId}', 481, 1),
  (232, 230, '工序派工', 'production:dispatch:assign', 'api', NULL, 'POST', '/dispatch/{batchId}/steps/{stepId}/assign', 482, 1),
  (233, 230, '改派', 'production:dispatch:reassign', 'api', NULL, 'PUT', '/dispatch/{batchId}/steps/{stepId}/reassign', 483, 1),
  (234, 230, '一键按默认派工', 'production:dispatch:batch-default', 'api', NULL, 'POST', '/dispatch/{batchId}/batch-default', 484, 1),
  (235, 230, '清除全部派工', 'production:dispatch:clear', 'api', NULL, 'DELETE', '/dispatch/{batchId}/clear', 485, 1),
  (240, 130, '生产报工', 'production:reports:view', 'page', '/production/execution-records', 'GET', '/execution-records', 490, 1),
  (241, 240, '报工详情', 'production:reports:detail', 'api', NULL, 'GET', '/execution-records/{batchId}', 491, 1),
  (242, 240, '开工', 'production:reports:start', 'api', NULL, 'POST', '/execution-records/{batchId}/steps/{stepId}/start', 492, 1),
  (243, 240, '完工报工', 'production:reports:finish', 'api', NULL, 'POST', '/execution-records/{batchId}/steps/{stepId}/finish', 493, 1),
  (244, 240, '开工并报工', 'production:reports:start-and-finish', 'api', NULL, 'POST', '/execution-records/{batchId}/steps/{stepId}/start-and-finish', 494, 1),
  (245, 240, '批量报工', 'production:reports:batch-finish', 'api', NULL, 'POST', '/execution-records/batch-finish', 495, 1)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  name = VALUES(name),
  code = VALUES(code),
  type = VALUES(type),
  route_path = VALUES(route_path),
  api_method = VALUES(api_method),
  api_path = VALUES(api_path),
  sort_order = VALUES(sort_order),
  status = VALUES(status),
  deleted_at = NULL;

INSERT IGNORE INTO user_roles (user_id, role_id)
VALUES
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 4);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT role_id, permission_id
FROM (
  SELECT 2 AS role_id, 1 AS permission_id
  UNION ALL SELECT 3, 1
  UNION ALL SELECT 4, 1
) AS base_role_permissions;
