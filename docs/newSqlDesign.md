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

### 18. `material_batches`

职责：维护物料批次库存台账，记录某个物料产品的批次号、供应商、接收日期、当前数量和批次状态。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `bigint unsigned` | 主键，自增 |
| `product_id` | `bigint unsigned` | 物料对应的产品 ID，关联 `products.id` |
| `material_batch_no` | `varchar(100)` | 物料批次号，结合软删除标记唯一 |
| `supplier_name` | `varchar(255)` | 供应商名称 |
| `received_date` | `date` | 入库或接收日期 |
| `quantity` | `decimal(12,4)` | 当前库存台账数量，默认 `0.0000` |
| `status` | `varchar(50)` | 状态：`available`、`partial_used`、`used_up`、`disabled` |
| `remark` | `text` | 备注 |
| `created_by` | `bigint unsigned` | 创建人，关联 `users.id` |
| `created_at` | `datetime` | 创建时间 |
| `updated_by` | `bigint unsigned` | 更新人，关联 `users.id` |
| `updated_at` | `datetime` | 更新时间 |
| `is_deleted` | `tinyint` | 软删除标记，默认 `0` |
| `deleted_by` | `bigint unsigned` | 删除人，关联 `users.id` |
| `deleted_at` | `datetime` | 删除时间 |

### 废弃表：`batch_material_usages`

说明：该表原用于记录生产批次与物料批次之间的预留和实际使用情况，但本分支的主要任务是重做物料使用/分配模块，因此该表设计已抛弃。后续物料预留、领用、消耗、退料和追溯关系应以新模块设计为准，本文档不再展开其字段设计。

## 四、生产执行

### 19. `work_orders`

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

### 20. `production_batches`

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

### 21. `batch_step_records`

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
