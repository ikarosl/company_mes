-- 方案二：统一库存对象模型的仓储权限迁移脚本
-- 用途：补齐新仓库菜单、接口权限，并停用已推翻的成品/物料出入库拆分权限。

SET NAMES utf8mb4;

USE `company_mes_v2`;

SET @warehouse_parent_id := (SELECT id FROM permissions WHERE code = 'warehouse:page' LIMIT 1);

-- 旧仓库交易拆分模型已被统一库存对象模型替代，保留历史记录但不再作为菜单和授权依据。
UPDATE permissions
SET status = 0,
    updated_at = NOW()
WHERE code IN (
  'warehouse:transactions:view',
  'warehouse:transactions:detail',
  'warehouse:transactions:inbound',
  'warehouse:transactions:outbound',
  'warehouse:transactions:shipment',
  'warehouse:transactions:return',
  'warehouse:finished-transactions:view',
  'warehouse:finished-transactions:detail',
  'warehouse:finished-transactions:inbound',
  'warehouse:finished-transactions:outbound',
  'warehouse:finished-transactions:shipment',
  'warehouse:material-transactions:view',
  'warehouse:material-transactions:detail',
  'warehouse:material-transactions:inbound',
  'warehouse:material-transactions:outbound',
  'warehouse:material-transactions:return'
);

-- 库存对象管理：统一维护物料、半成品、成品基础信息。
INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT @warehouse_parent_id, '库存对象管理', 'warehouse:items:view', 'page', '/warehouse/items', 'GET', '/warehouse/items', 301, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:items:view');

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, api.name, api.code, 'api', NULL, api.method, api.path, api.sort_order, 1, NOW(), NOW()
FROM permissions p
JOIN (
  SELECT '库存对象详情' AS name, 'warehouse:items:detail' AS code, 'GET' AS method, '/warehouse/items/{id}' AS path, 302 AS sort_order
  UNION ALL SELECT '新增库存对象', 'warehouse:items:create', 'POST', '/warehouse/items', 303
  UNION ALL SELECT '编辑库存对象', 'warehouse:items:update', 'PUT', '/warehouse/items/{id}', 304
  UNION ALL SELECT '启用库存对象', 'warehouse:items:enable', 'PUT', '/warehouse/items/{id}/enable', 305
  UNION ALL SELECT '停用库存对象', 'warehouse:items:disable', 'PUT', '/warehouse/items/{id}/disable', 306
) api
WHERE p.code = 'warehouse:items:view'
  AND NOT EXISTS (SELECT 1 FROM permissions exists_p WHERE exists_p.code = api.code);

-- 库存批次与现存量：按 item_batch 和 inventory_transaction 汇总查询。
INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT p.id, '库存详情', 'warehouse:inventory:detail', 'api', NULL, 'GET', '/warehouse/inventory/{id}', 315, 1, NOW(), NOW()
FROM permissions p
WHERE p.code = 'warehouse:inventory:view'
  AND NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'warehouse:inventory:detail');

-- 入库、出库、退料、报废、盘点单据。
INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT @warehouse_parent_id, page.name, page.code, 'page', page.route_path, 'GET', page.api_path, page.sort_order, 1, NOW(), NOW()
FROM (
  SELECT '入库管理' AS name, 'warehouse:inbound-orders:view' AS code, '/warehouse/inbound-orders' AS route_path, '/warehouse/inbound-orders' AS api_path, 320 AS sort_order
  UNION ALL SELECT '出库管理', 'warehouse:outbound-orders:view', '/warehouse/outbound-orders', '/warehouse/outbound-orders', 340
  UNION ALL SELECT '退料管理', 'warehouse:return-orders:view', '/warehouse/return-orders', '/warehouse/return-orders', 360
  UNION ALL SELECT '报废管理', 'warehouse:scraps:view', '/warehouse/scraps', '/warehouse/scraps', 380
  UNION ALL SELECT '库存盘点', 'warehouse:stock-checks:view', '/warehouse/stock-checks', '/warehouse/stock-checks', 400
) page
WHERE NOT EXISTS (SELECT 1 FROM permissions exists_p WHERE exists_p.code = page.code);

INSERT INTO permissions (parent_id, name, code, type, route_path, api_method, api_path, sort_order, status, created_at, updated_at)
SELECT parent_p.id, api.name, api.code, 'api', NULL, api.method, api.path, api.sort_order, 1, NOW(), NOW()
FROM (
  SELECT 'warehouse:inbound-orders:view' AS parent_code, '入库单详情' AS name, 'warehouse:inbound-orders:detail' AS code, 'GET' AS method, '/warehouse/inbound-orders/{id}' AS path, 321 AS sort_order
  UNION ALL SELECT 'warehouse:inbound-orders:view', '新增入库单', 'warehouse:inbound-orders:create', 'POST', '/warehouse/inbound-orders', 322
  UNION ALL SELECT 'warehouse:inbound-orders:view', '确认入库', 'warehouse:inbound-orders:confirm', 'PUT', '/warehouse/inbound-orders/{id}/confirm', 323
  UNION ALL SELECT 'warehouse:inbound-orders:view', '取消入库', 'warehouse:inbound-orders:cancel', 'PUT', '/warehouse/inbound-orders/{id}/cancel', 324
  UNION ALL SELECT 'warehouse:outbound-orders:view', '出库单详情', 'warehouse:outbound-orders:detail', 'GET', '/warehouse/outbound-orders/{id}', 341
  UNION ALL SELECT 'warehouse:outbound-orders:view', '新增出库单', 'warehouse:outbound-orders:create', 'POST', '/warehouse/outbound-orders', 342
  UNION ALL SELECT 'warehouse:outbound-orders:view', '拣货', 'warehouse:outbound-orders:pick', 'PUT', '/warehouse/outbound-orders/{id}/pick', 343
  UNION ALL SELECT 'warehouse:outbound-orders:view', '确认出库', 'warehouse:outbound-orders:confirm', 'PUT', '/warehouse/outbound-orders/{id}/confirm', 344
  UNION ALL SELECT 'warehouse:outbound-orders:view', '取消出库', 'warehouse:outbound-orders:cancel', 'PUT', '/warehouse/outbound-orders/{id}/cancel', 345
  UNION ALL SELECT 'warehouse:return-orders:view', '退料单详情', 'warehouse:return-orders:detail', 'GET', '/warehouse/return-orders/{id}', 361
  UNION ALL SELECT 'warehouse:return-orders:view', '新增退料单', 'warehouse:return-orders:create', 'POST', '/warehouse/return-orders', 362
  UNION ALL SELECT 'warehouse:return-orders:view', '确认退料入库', 'warehouse:return-orders:confirm-inbound', 'PUT', '/warehouse/return-orders/{id}/confirm-inbound', 363
  UNION ALL SELECT 'warehouse:return-orders:view', '确认退料报废', 'warehouse:return-orders:confirm-scrap', 'PUT', '/warehouse/return-orders/{id}/confirm-scrap', 364
  UNION ALL SELECT 'warehouse:return-orders:view', '取消退料', 'warehouse:return-orders:cancel', 'PUT', '/warehouse/return-orders/{id}/cancel', 365
  UNION ALL SELECT 'warehouse:scraps:view', '报废详情', 'warehouse:scraps:detail', 'GET', '/warehouse/scraps/{id}', 381
  UNION ALL SELECT 'warehouse:scraps:view', '新增报废单', 'warehouse:scraps:create', 'POST', '/warehouse/scraps', 382
  UNION ALL SELECT 'warehouse:scraps:view', '确认报废', 'warehouse:scraps:confirm', 'PUT', '/warehouse/scraps/{id}/confirm', 383
  UNION ALL SELECT 'warehouse:scraps:view', '取消报废', 'warehouse:scraps:cancel', 'PUT', '/warehouse/scraps/{id}/cancel', 384
  UNION ALL SELECT 'warehouse:stock-checks:view', '盘点详情', 'warehouse:stock-checks:detail', 'GET', '/warehouse/stock-checks/{id}', 401
  UNION ALL SELECT 'warehouse:stock-checks:view', '新增盘点单', 'warehouse:stock-checks:create', 'POST', '/warehouse/stock-checks', 402
  UNION ALL SELECT 'warehouse:stock-checks:view', '编辑盘点单', 'warehouse:stock-checks:update', 'PUT', '/warehouse/stock-checks/{id}', 403
  UNION ALL SELECT 'warehouse:stock-checks:view', '完成盘点', 'warehouse:stock-checks:complete', 'PUT', '/warehouse/stock-checks/{id}/complete', 404
  UNION ALL SELECT 'warehouse:stock-checks:view', '生成盘点调整', 'warehouse:stock-checks:adjust', 'POST', '/warehouse/stock-checks/{id}/adjust', 405
  UNION ALL SELECT 'warehouse:stock-checks:view', '取消盘点', 'warehouse:stock-checks:cancel', 'PUT', '/warehouse/stock-checks/{id}/cancel', 406
) api
JOIN permissions parent_p ON parent_p.code = api.parent_code
WHERE NOT EXISTS (SELECT 1 FROM permissions exists_p WHERE exists_p.code = api.code);

-- 已拥有仓储根权限的角色自动获得新仓库权限，避免菜单升级后管理员丢失入口。
INSERT INTO role_permissions (role_id, permission_id, created_at)
SELECT DISTINCT rp.role_id, p_new.id, NOW()
FROM role_permissions rp
JOIN permissions p_root ON p_root.id = rp.permission_id AND p_root.code = 'warehouse:page'
JOIN permissions p_new ON p_new.code LIKE 'warehouse:items:%'
  OR p_new.code LIKE 'warehouse:inbound-orders:%'
  OR p_new.code LIKE 'warehouse:outbound-orders:%'
  OR p_new.code LIKE 'warehouse:return-orders:%'
  OR p_new.code LIKE 'warehouse:scraps:%'
  OR p_new.code LIKE 'warehouse:stock-checks:%'
  OR p_new.code = 'warehouse:inventory:detail'
LEFT JOIN role_permissions exists_rp ON exists_rp.role_id = rp.role_id AND exists_rp.permission_id = p_new.id
WHERE exists_rp.role_id IS NULL;
