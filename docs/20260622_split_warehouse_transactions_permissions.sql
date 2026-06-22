-- Split the old warehouse transaction permission set into finished-goods and material transaction scopes.
-- This migration only adjusts RBAC metadata; it does not change business tables.

START TRANSACTION;

UPDATE permissions
SET status = 0,
    deleted_at = COALESCE(deleted_at, NOW()),
    updated_at = NOW()
WHERE code LIKE 'warehouse:transactions:%';

SET @warehouse_parent_id := (SELECT id FROM permissions WHERE code = 'warehouse:page' LIMIT 1);

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT @warehouse_parent_id, '成品出入库管理', 'warehouse:finished-transactions:view', 'page',
       '/warehouse/finished-transactions', 'GET', '/warehouse/finished-transactions', 330, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:finished-transactions:view');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '成品出入库详情', 'warehouse:finished-transactions:detail', 'api',
       NULL, 'GET', '/warehouse/finished-transactions/{id}', 331, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:finished-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:finished-transactions:detail');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '成品入库', 'warehouse:finished-transactions:inbound', 'api',
       NULL, 'POST', '/warehouse/finished-transactions/inbound', 332, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:finished-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:finished-transactions:inbound');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '成品出库', 'warehouse:finished-transactions:outbound', 'api',
       NULL, 'POST', '/warehouse/finished-transactions/outbound', 333, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:finished-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:finished-transactions:outbound');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '成品发运', 'warehouse:finished-transactions:shipment', 'api',
       NULL, 'POST', '/warehouse/finished-transactions/shipment', 334, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:finished-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:finished-transactions:shipment');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT @warehouse_parent_id, '物料出入库管理', 'warehouse:material-transactions:view', 'page',
       '/warehouse/material-transactions', 'GET', '/warehouse/material-transactions', 340, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:material-transactions:view');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '物料出入库详情', 'warehouse:material-transactions:detail', 'api',
       NULL, 'GET', '/warehouse/material-transactions/{id}', 341, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:material-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:material-transactions:detail');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '物料入库', 'warehouse:material-transactions:inbound', 'api',
       NULL, 'POST', '/warehouse/material-transactions/inbound', 342, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:material-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:material-transactions:inbound');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '物料出库', 'warehouse:material-transactions:outbound', 'api',
       NULL, 'POST', '/warehouse/material-transactions/outbound', 343, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:material-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:material-transactions:outbound');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '物料退料', 'warehouse:material-transactions:return', 'api',
       NULL, 'POST', '/warehouse/material-transactions/return', 344, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:material-transactions:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:material-transactions:return');

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
INNER JOIN permissions p_old ON p_old.id = rp.permission_id
INNER JOIN permissions p_new ON p_new.code IN ('warehouse:finished-transactions:view', 'warehouse:material-transactions:view')
WHERE p_old.code = 'warehouse:transactions:view';

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
INNER JOIN permissions p_old ON p_old.id = rp.permission_id
INNER JOIN permissions p_new ON p_new.code IN ('warehouse:finished-transactions:detail', 'warehouse:material-transactions:detail')
WHERE p_old.code = 'warehouse:transactions:detail';

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
INNER JOIN permissions p_old ON p_old.id = rp.permission_id
INNER JOIN permissions p_new ON p_new.code IN ('warehouse:finished-transactions:inbound', 'warehouse:material-transactions:inbound')
WHERE p_old.code = 'warehouse:transactions:inbound';

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
INNER JOIN permissions p_old ON p_old.id = rp.permission_id
INNER JOIN permissions p_new ON p_new.code IN ('warehouse:finished-transactions:outbound', 'warehouse:material-transactions:outbound')
WHERE p_old.code = 'warehouse:transactions:outbound';

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
INNER JOIN permissions p_old ON p_old.id = rp.permission_id
INNER JOIN permissions p_new ON p_new.code = 'warehouse:finished-transactions:shipment'
WHERE p_old.code = 'warehouse:transactions:shipment';

INSERT IGNORE INTO role_permissions (role_id, permission_id, created_at)
SELECT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
INNER JOIN permissions p_old ON p_old.id = rp.permission_id
INNER JOIN permissions p_new ON p_new.code = 'warehouse:material-transactions:return'
WHERE p_old.code = 'warehouse:transactions:return';

COMMIT;
