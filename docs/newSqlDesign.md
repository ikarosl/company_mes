# 当前数据库设计说明

本文档根据 `docs/init_rbac.sql` 与 `docs/company_test_latest.sql` 整理，仅描述当前数据库表结构、字段含义与表职责，不包含任何 `INSERT` 初始化或测试数据。

特别说明：`batch_material_usages` 虽然存在于当前 SQL 中，但本分支会重做物料使用/分配模块，因此该表设计已废弃，不作为后续开发和联调依据。

## 一、系统与 RBAC

### 1. `departments`

职责：维护组织部门基础信息，用于用户归属部门、部门树和启停用管理。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `parent_id` | `bigint unsigned` | 父部门 ID，默认 `0` 表示顶级部门 |
| `name` | `varchar(64)` | 部门名称 |
| `code` | `varchar(64)` | 部门编码，唯一 |
| `sort_order` | `int` | 排序号 |
| `status` | `tinyint` | 状态，默认 `1` |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |
| `deleted_at` | `datetime` | 删除时间，空表示未删除 |

### 2. `users`

职责：维护系统用户账号、登录凭证、部门归属和账号状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `department_id` | `bigint unsigned` | 所属部门 ID，关联 `departments.id` |
| `username` | `varchar(64)` | 登录用户名，唯一 |
| `password_hash` | `varchar(255)` | 密码哈希 |
| `display_name` | `varchar(64)` | 显示名称 |
| `email` | `varchar(128)` | 邮箱 |
| `mobile` | `varchar(32)` | 手机号 |
| `status` | `tinyint` | 账号状态，默认 `1` |
| `last_login_at` | `datetime` | 最近登录时间 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |
| `deleted_at` | `datetime` | 删除时间，空表示未删除 |

### 3. `roles`

职责：维护 RBAC 角色基础信息，用于给用户分配角色。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `name` | `varchar(64)` | 角色名称 |
| `code` | `varchar(64)` | 角色编码，唯一 |
| `description` | `varchar(255)` | 角色说明 |
| `status` | `tinyint` | 状态，默认 `1` |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |
| `deleted_at` | `datetime` | 删除时间，空表示未删除 |

### 4. `permissions`

职责：维护菜单、页面和接口权限点，支持父子层级、路由路径和接口路径配置。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `parent_id` | `bigint unsigned` | 父权限 ID，默认 `0` 表示顶级权限 |
| `name` | `varchar(64)` | 权限名称 |
| `code` | `varchar(128)` | 权限编码，唯一 |
| `type` | `varchar(32)` | 权限类型，如页面、接口等 |
| `route_path` | `varchar(255)` | 前端路由路径 |
| `api_method` | `varchar(16)` | 接口请求方法 |
| `api_path` | `varchar(255)` | 接口路径 |
| `sort_order` | `int` | 排序号 |
| `status` | `tinyint` | 状态，默认 `1` |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |
| `deleted_at` | `datetime` | 删除时间，空表示未删除 |

### 5. `user_roles`

职责：维护用户与角色的多对多关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `user_id` | `bigint unsigned` | 用户 ID，关联 `users.id` |
| `role_id` | `bigint unsigned` | 角色 ID，关联 `roles.id` |
| `created_at` | `datetime` | 创建时间 |

### 6. `role_permissions`

职责：维护角色与权限的多对多关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `role_id` | `bigint unsigned` | 角色 ID，关联 `roles.id` |
| `permission_id` | `bigint unsigned` | 权限 ID，关联 `permissions.id` |
| `created_at` | `datetime` | 创建时间 |

### 7. `refresh_tokens`

职责：维护登录刷新令牌，用于会话续期和令牌失效控制。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `user_id` | `bigint unsigned` | 用户 ID，关联 `users.id` |
| `jti` | `char(36)` | 令牌唯一标识，唯一 |
| `expires_at` | `datetime` | 过期时间 |
| `created_at` | `datetime` | 创建时间 |

### 8. `operation_logs`

职责：记录系统登录、接口操作和业务动作日志，用于审计、排查和追踪操作结果。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `log_type` | `varchar(32)` | 日志类型 |
| `module` | `varchar(64)` | 所属模块 |
| `action` | `varchar(128)` | 操作动作或接口 |
| `user_id` | `bigint unsigned` | 操作用户 ID，关联 `users.id` |
| `target_id` | `bigint unsigned` | 被操作对象 ID |
| `target_type` | `varchar(64)` | 被操作对象类型 |
| `result` | `varchar(32)` | 操作结果，默认 `success` |
| `before_data` | `json` | 操作前数据 |
| `after_data` | `json` | 操作后数据 |
| `ip` | `varchar(64)` | 操作 IP |
| `remark` | `varchar(255)` | 备注或错误信息 |
| `created_at` | `datetime` | 创建时间 |

## 二、产品、文件与工艺

### 9. `product_categories`

职责：维护产品分类信息，按产品属性和产品类型组织产品资料。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `product_attribute` | `varchar(64)` | 产品属性，如成品、半成品等 |
| `product_type` | `varchar(64)` | 产品类型 |
| `status` | `tinyint` | 状态，默认 `1` |
| `remark` | `varchar(255)` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 10. `products`

职责：维护产品和物料主数据。原材料、半成品、成品均通过产品表统一表达，并通过 `product_materials` 建立用料关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `product_model` | `varchar(128)` | 产品型号，结合软删除标记唯一 |
| `product_name` | `varchar(128)` | 产品名称 |
| `category_id` | `bigint unsigned` | 产品分类 ID，关联 `product_categories.id` |
| `default_route_id` | `bigint unsigned` | 默认工艺路线 ID，关联 `process_routes.id` |
| `unit` | `varchar(32)` | 单位，默认 `pcs` |
| `acquire_method` | `varchar(32)` | 获取方式：`self_made`、`outsourced`、`purchased` |
| `spec_values` | `json` | 产品规格参数 |
| `status` | `tinyint` | 状态，默认 `1` |
| `remark` | `varchar(255)` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 11. `technical_files`

职责：维护 SOP、工艺文件等技术文件元数据，供工序、工艺路线等业务引用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `file_name` | `varchar(255)` | 文件名称 |
| `file_url` | `varchar(500)` | 文件访问路径 |
| `file_type` | `varchar(64)` | 文件类型，默认 `sop` |
| `version` | `varchar(64)` | 文件版本 |
| `status` | `tinyint` | 状态，默认 `1` |
| `remark` | `varchar(255)` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 12. `processes`

职责：维护生产工序主数据，包含工序编码、名称、说明、SOP 文件和状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `process_code` | `varchar(64)` | 工序编码，结合软删除标记唯一 |
| `process_name` | `varchar(128)` | 工序名称 |
| `description` | `varchar(255)` | 工序说明 |
| `sop_file_id` | `bigint unsigned` | SOP 文件 ID，关联 `technical_files.id` |
| `sop_file_name` | `varchar(255)` | SOP 文件名 |
| `sop_file_url` | `varchar(500)` | SOP 文件路径 |
| `status` | `tinyint` | 状态，默认 `1` |
| `remark` | `varchar(255)` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 13. `process_steps`

职责：维护轻量工序步骤主数据，供工艺路线步骤引用。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `step_code` | `varchar(100)` | 工序步骤编码，结合软删除标记唯一 |
| `step_name` | `varchar(100)` | 工序步骤名称 |
| `sop_file_id` | `bigint unsigned` | SOP 文件 ID，关联 `technical_files.id` |
| `remark` | `text` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 14. `process_routes`

职责：维护工艺路线主表，描述某类产品可执行的工艺路线版本和状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `route_code` | `varchar(64)` | 工艺路线编码，结合软删除标记唯一 |
| `route_name` | `varchar(128)` | 工艺路线名称 |
| `product_category_id` | `bigint unsigned` | 适用产品分类 ID，关联 `product_categories.id` |
| `version` | `varchar(64)` | 版本号 |
| `applicable_product_type` | `varchar(100)` | 适用产品类型 |
| `status` | `tinyint` | 状态，默认 `1` |
| `remark` | `varchar(255)` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 15. `process_route_steps`

职责：维护工艺路线下的工序明细，记录路线中的工序顺序、工序信息、默认负责人和 SOP 文件。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `route_id` | `bigint unsigned` | 工艺路线 ID，关联 `process_routes.id` |
| `process_step_id` | `bigint unsigned` | 工序步骤 ID，关联 `process_steps.id` |
| `process_id` | `bigint unsigned` | 工序 ID，关联 `processes.id` |
| `step_order` | `int` | 工序顺序 |
| `process_code` | `varchar(64)` | 工序编码快照 |
| `process_name` | `varchar(128)` | 工序名称快照 |
| `description` | `varchar(255)` | 工序说明快照 |
| `default_owner_id` | `bigint unsigned` | 默认负责人，关联 `users.id` |
| `sop_file_id` | `bigint unsigned` | SOP 文件 ID，关联 `technical_files.id` |
| `sop_file_name` | `varchar(255)` | SOP 文件名快照 |
| `sop_file_url` | `varchar(500)` | SOP 文件路径快照 |
| `status` | `tinyint` | 状态，默认 `1` |
| `remark` | `varchar(255)` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 16. `product_materials`

职责：维护产品物料清单，是 `products` 到 `products` 的自关联表，用于说明某个产品需要哪些物料产品。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `product_id` | `bigint unsigned` | 产品 ID，关联 `products.id` |
| `material_product_id` | `bigint unsigned` | 物料产品 ID，关联 `products.id` |
| `unit` | `varchar(50)` | 单位 |
| `is_key_material` | `tinyint` | 是否关键物料，默认 `1` |
| `need_batch_record` | `tinyint` | 是否需要记录批次，默认 `1` |
| `remark` | `text` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 17. `route_step_materials`

职责：维护工艺路线工序与产品物料清单的关联，说明某个路线工序需要消耗哪些物料及单件用量。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `route_step_id` | `bigint unsigned` | 工艺路线工序明细 ID，关联 `process_route_steps.id` |
| `product_material_id` | `bigint unsigned` | 产品物料清单 ID，关联 `product_materials.id` |
| `quantity_per_unit` | `decimal(12,4)` | 单件用量，必须大于 `0` |
| `remark` | `text` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

## 三、仓储物料

### 18. `material_batch`物料批次表

职责：维护物料批次基础信息，记录某个物料的批次号、供应商、生产日期和批次业务状态。该表只表达批次是否可用、冻结或停用，不表达库存是否用完；库存是否用完应由库存流水汇总判断。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` | 主键 |
| `material_id` | `BIGINT` | 物料 ID |
| `batch_code` | `VARCHAR(100)` | 批次号，展示和追溯使用 |
| `provider` | `VARCHAR(100)` | 供应商 |
| `production_date` | `DATE` | 生产日期 |
| `batch_status` | `VARCHAR(20)` | 批次业务状态，默认 `可用`；可选语义：`可用`、`冻结`、`停用`，不要用它表示用完 |
| `created_at` | `TIMESTAMP` | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

- 主键：`id`
- 唯一约束：`UNIQUE (material_id, batch_code)`
- 唯一约束：`UNIQUE (id, material_id)`

### 19. `inventory_transaction`

职责：维护库存流水，记录所有会影响库存数量或库存状态的变动明细。库存现存量、可分配库存、批次是否用完等结果应从该表按物料、批次和库存状态汇总得出，而不是写回物料批次表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` | 主键 |
| `material_id` | `BIGINT` | 物料 ID，冗余保存，便于按物料汇总库存 |
| `batch_id` | `BIGINT` | 批次 ID |
| `transaction_type` | `VARCHAR(30)` | 库存变动类型：`入库`、`出库`、`退料入库`、`报废出库`、`盘点调整`、`状态转入`、`状态转出` |
| `quantity` | `DECIMAL(12,4)` | 库存变动数量。正数表示增加，负数表示减少，不能为 `0` |
| `stock_status` | `VARCHAR(20)` | 库存状态，默认 `可用`；可选语义：`可用`、`待检`、`冻结`、`不良`。可分配库存只统计 `stock_status = 可用` |
| `reference_type` | `VARCHAR(50)` | 来源明细类型：`PO_DETAIL`、`OUTBOUND_DETAIL`、`RETURN_DETAIL`、`SCRAP`、`STOCK_CHECK`、`STATUS_TRANSFER` |
| `reference_detail_id` | `BIGINT` | 来源明细 ID。建议指向明细行，不要只指向主单 |
| `idempotency_key` | `VARCHAR(100)` | 幂等键，防止同一业务动作重复生成库存流水 |
| `remark` | `TEXT` | 备注 |
| `created_at` | `TIMESTAMP` | 创建时间，默认 `CURRENT_TIMESTAMP` |

约束：

- 检查约束：`CHECK (quantity <> 0)`
- 唯一约束：`UNIQUE (idempotency_key)`
- 外键：`FOREIGN KEY (batch_id, material_id) REFERENCES material_batch(id, material_id)`

### 20. `material_demand`

职责：维护生产任务的物料需求，是物料分配、出库、退料和报废补料的需求来源表。正常需求直接关联生产任务和物料；追加补料、报废补料通过 `parent_demand_id` 关联原始需求，报废补料还可通过 `source_scrap_id` 防止同一报废单重复生成补料需求。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` | 主键 |
| `task_id` | `BIGINT` | 生产任务 ID |
| `material_id` | `BIGINT` | 物料 ID |
| `need_number` | `DECIMAL(12,4)` | 需求数量，必须大于 `0` |
| `demand_type` | `INT` | 需求类型，默认 `0`；`0` 正常需求、`1` 追加补料、`2` 报废补料 |
| `parent_demand_id` | `BIGINT` | 补料需求关联的原始需求 ID，正常需求为空，关联 `material_demand.id` |
| `source_scrap_id` | `BIGINT` | 报废补料关联的报废单 ID，唯一，避免同一报废单重复生成补料需求 |
| `reason_type` | `VARCHAR(50)` | 补料原因：`生产损耗`、`物料不良`、`返工补料`、`其他` |
| `status` | `VARCHAR(30)` | 状态，默认 `待分配`；可选语义：`待分配`、`部分分配`、`已分配`、`部分出库`、`已出库`、`退料处理中`、`报废处理中`、`已关闭`、`已取消` |
| `allocated_quantity` | `DECIMAL(12,4)` | 累计已分配数量，默认 `0`，来自 `material_allocation.assigned_number` 汇总 |
| `outbound_quantity` | `DECIMAL(12,4)` | 累计出库数量，默认 `0`，来自 `outbound_detail.outbound_number` 汇总 |
| `returned_quantity` | `DECIMAL(12,4)` | 累计退料数量，默认 `0`，来自 `return_detail.return_number` 汇总 |
| `scrapped_quantity` | `DECIMAL(12,4)` | 累计报废数量，默认 `0`，来自 `material_scrap.scrap_number` 汇总 |
| `version` | `INT` | 乐观锁版本号，默认 `0` |
| `remark` | `TEXT` | 备注 |
| `created_at` | `TIMESTAMP` | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

- 检查约束：`CHECK (need_number > 0)`
- 检查约束：`CHECK (allocated_quantity >= 0)`
- 检查约束：`CHECK (outbound_quantity >= 0)`
- 检查约束：`CHECK (returned_quantity >= 0)`
- 检查约束：`CHECK (scrapped_quantity >= 0)`
- 检查约束：`CHECK (allocated_quantity <= need_number)`
- 检查约束：`CHECK (returned_quantity <= outbound_quantity)`
- 唯一约束：`UNIQUE (source_scrap_id)`
- 外键：`FOREIGN KEY (parent_demand_id) REFERENCES material_demand(id)`

### 21. `material_allocation`

职责：维护物料需求的分配明细，记录某条需求分配到了哪些物料批次以及每个分配行后续出库、退料、报废的累计数量。该表是需求与批次之间的业务关联表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` | 主键 |
| `demand_id` | `BIGINT` | 需求 ID，关联 `material_demand.id` |
| `material_batch_id` | `BIGINT` | 分配的物料批次 ID，关联 `material_batch.id` |
| `assigned_number` | `DECIMAL(12,4)` | 分配数量，必须大于 `0` |
| `outbound_quantity` | `DECIMAL(12,4)` | 本分配行累计出库数量，默认 `0` |
| `returned_quantity` | `DECIMAL(12,4)` | 本分配行累计退料数量，默认 `0` |
| `scrapped_quantity` | `DECIMAL(12,4)` | 本分配行累计报废数量，默认 `0`；包括已分配未出库报废，以及退料后报废 |
| `version` | `INT` | 乐观锁版本号，默认 `0` |
| `created_at` | `TIMESTAMP` | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP` | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

- 检查约束：`CHECK (assigned_number > 0)`
- 检查约束：`CHECK (outbound_quantity >= 0)`
- 检查约束：`CHECK (returned_quantity >= 0)`
- 检查约束：`CHECK (scrapped_quantity >= 0)`
- 检查约束：`CHECK (returned_quantity <= outbound_quantity)`
- 检查约束：`CHECK (outbound_quantity + scrapped_quantity <= assigned_number + returned_quantity)`
- 可出库量公式：`assigned_number - outbound_quantity + returned_quantity - scrapped_quantity`
- 外键：`FOREIGN KEY (demand_id) REFERENCES material_demand(id)`
- 外键：`FOREIGN KEY (material_batch_id) REFERENCES material_batch(id)`

### 22. `outbound_order`

职责：维护物料出库主单，记录一次出库动作对应的需求、出库单号、单据状态和实际出库时间。具体出库批次和数量应由出库明细表承接。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` | 主键 |
| `outbound_no` | `VARCHAR(50)` | 出库单号，唯一 |
| `demand_id` | `BIGINT` | 本次出库对应的需求 ID，关联 `material_demand.id` |
| `status` | `VARCHAR(20)` | 状态，默认 `待拣货`；可选语义：`待拣货`、`已拣货`、`部分出库`、`已出库`、`已取消` |
| `version` | `INT` | 乐观锁版本号，默认 `0` |
| `created_at` | `TIMESTAMP` | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `outbound_at` | `TIMESTAMP` | 实际出库时间 |

约束：

- 唯一约束：`UNIQUE (outbound_no)`
- 外键：`FOREIGN KEY (demand_id) REFERENCES material_demand(id)`

### 23. `outbound_detail`

职责：维护出库明细，记录出库主单中每个分配明细行的本次出库数量。该表通过 `allocation_id` 追溯到具体需求分配和物料批次。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `BIGINT` | 主键 |
| `outbound_id` | `BIGINT` | 出库主表 ID，关联 `outbound_order.id` |
| `allocation_id` | `BIGINT` | 分配明细 ID，关联 `material_allocation.id` |
| `outbound_number` | `DECIMAL(12,4)` | 本次出库数量，必须大于 `0` |
| `created_at` | `TIMESTAMP` | 创建时间，默认 `CURRENT_TIMESTAMP` |

约束：

- 检查约束：`CHECK (outbound_number > 0)`
- 唯一约束：`UNIQUE (outbound_id, allocation_id)`
- 外键：`FOREIGN KEY (outbound_id) REFERENCES outbound_order(id)`
- 外键：`FOREIGN KEY (allocation_id) REFERENCES material_allocation(id)`

### 废弃表：`batch_material_usages`

说明：该表原用于记录生产批次与物料批次之间的预留和实际使用情况，但本分支的主要任务是重做物料使用/分配模块，因此该表设计已抛弃。后续物料预留、领用、消耗、退料和追溯关系应以新模块设计为准，本文档不再展开其字段设计。

## 四、生产执行

### 24. `work_orders`

职责：维护生产工单，记录产品、执行工艺路线、计划数量、负责人、计划日期和工单状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `order_no` | `varchar(100)` | 工单号，结合软删除标记唯一 |
| `product_id` | `bigint unsigned` | 产品 ID，关联 `products.id` |
| `route_id` | `bigint unsigned` | 本工单执行工艺路线 ID，关联 `process_routes.id` |
| `planned_quantity` | `decimal(12,4)` | 计划生产数量，必须大于 `0` |
| `unit` | `varchar(50)` | 单位，默认 `pcs` |
| `owner_id` | `bigint unsigned` | 工单负责人，关联 `users.id` |
| `status` | `varchar(50)` | 状态：`draft`、`released`、`doing`、`completed`、`closed`、`cancelled` |
| `plan_start_date` | `date` | 计划开始日期 |
| `plan_end_date` | `date` | 计划完成日期 |
| `actual_start_at` | `datetime` | 实际开始时间 |
| `actual_end_at` | `datetime` | 实际完成时间 |
| `remark` | `text` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 25. `production_batches`

职责：维护生产批次，承接工单并拆分具体批次，记录批次计划、工艺路线、负责人以及物料、派工、生产、检验等状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `work_order_id` | `bigint unsigned` | 工单 ID，关联 `work_orders.id` |
| `batch_no` | `varchar(100)` | 生产批次号，结合软删除标记唯一 |
| `product_id` | `bigint unsigned` | 产品 ID，冗余工单产品便于追溯，关联 `products.id` |
| `route_id` | `bigint unsigned` | 执行工艺路线 ID，关联 `process_routes.id` |
| `planned_quantity` | `decimal(12,4)` | 批次计划数量，必须大于 `0` |
| `status` | `varchar(50)` | 批次主状态：`pending`、`assigned`、`doing`、`completed`、`cancelled` |
| `material_status` | `varchar(50)` | 物料状态：`ungenerated`、`unassigned`、`partial_assigned`、`assigned`、`ready`、`outbound`、`shortage`、`returned` |
| `dispatch_status` | `varchar(50)` | 派工状态：`pending`、`assigned` |
| `production_status` | `varchar(50)` | 生产状态：`pending`、`doing`、`completed` |
| `inspection_status` | `varchar(50)` | 检验状态：`pending`、`inspecting`、`passed`、`failed`、`partial_pass` |
| `owner_id` | `bigint unsigned` | 批次负责人，关联 `users.id` |
| `plan_start_date` | `date` | 计划开始日期 |
| `plan_end_date` | `date` | 计划完成日期 |
| `actual_start_at` | `datetime` | 实际开始时间 |
| `actual_end_at` | `datetime` | 实际完成时间 |
| `remark` | `text` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 26. `batch_step_records`

职责：记录生产批次中每个工艺路线工序的派工与报工情况，是批次生产过程追溯的关键节点记录表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `batch_id` | `bigint unsigned` | 生产批次 ID，关联 `production_batches.id` |
| `route_step_id` | `bigint unsigned` | 工艺路线工序明细 ID，关联 `process_route_steps.id` |
| `step_order` | `int` | 工序顺序快照 |
| `step_name` | `varchar(100)` | 工序名称快照 |
| `sop_file_id` | `bigint unsigned` | SOP 文件 ID，关联 `technical_files.id` |
| `responsible_user_id` | `bigint unsigned` | 工序负责人，关联 `users.id` |
| `output_quantity` | `decimal(12,4)` | 完成数量 |
| `abnormal_quantity` | `decimal(12,4)` | 异常数量 |
| `return_quantity` | `decimal(12,4)` | 返工数量 |
| `status` | `varchar(50)` | 状态：`pending`、`doing`、`completed`、`abnormal`、`skipped` |
| `started_at` | `datetime` | 开始时间 |
| `completed_at` | `datetime` | 完成时间 |
| `remark` | `text` | 报工备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |
