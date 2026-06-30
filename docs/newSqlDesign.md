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
特别说明：`docs/仓库表新方案.md` 已推翻之前的 `material_batch`、`material_demand`、`material_allocation`、`inbound_order`、`inbound_detail`、`outbound_order`、`outbound_detail` 旧仓库方案。方案二以后以统一库存对象模型为准：库存对象使用 `item_info`，库存批次使用 `item_batch`，出入库业务统一使用 `stock_order`、`stock_order_detail`，库存数量事实来源为 `inventory_transaction`。

## 三、生产库存管理数据库表设计｜统一库存对象版本

## 0. 设计说明

本方案用于管理生产过程中的物料需求、物料分配、生产领料出库、退料、报废补料、半成品入库、成品入库、库存流水和盘点。

核心设计原则：

1. 物料、半成品、成品统一作为库存对象管理。
2. 所有库存对象统一使用 `item_info` 表维护基础信息。
3. 所有库存批次统一使用 `item_batch` 表维护。
4. 生产批次 `production_batches` 不等于库存批次 `item_batch`。
5. 库存流水 `inventory_transaction.batch_id` 统一关联 `item_batch.id`。
6. 生产领料分配代表业务预留，已分配数量不能被其他生产批次抢占。
7. 需求、分配、出库、退料、报废的累计数量通过视图汇总，不建议写回主表。
8. 入库、出库、退料、报废、盘点调整等影响库存数量的动作都应生成库存流水。

## 0.1 库存单据收敛边界

为避免后续开发边界不明确，本方案对 `stock_order` 的适用范围做如下约束：

1. `stock_order`、`stock_order_detail` 只收敛普通入库和普通出库单据。
2. 采购入库、生产入库、委外入库、成品入库、半成品入库、生产领料出库、销售出库等库存动作，可以使用 `stock_order`、`stock_order_detail` 表达业务单据。
3. 退料、报废、盘点需要保留独立业务单据表，不应被强行迁入 `stock_order_detail`。
4. `return_order`、`return_detail` 负责记录退料业务过程、退料数量、退回库存状态、是否释放原预留等操作明细。
5. `item_scrap` 负责记录报废场景、报废原因、报废数量、是否触发补料等操作明细。
6. `stock_check_order`、`stock_check_detail` 负责记录盘点任务、账面数量快照、实盘数量、差异数量和是否已调整等操作明细。
7. 退料、报废、盘点确认后必须生成 `inventory_transaction`，但来源明细应分别指向 `return_detail`、`item_scrap`、`stock_check_detail`。
8. 入库、出库流水可以填写 `stock_order_id`、`stock_order_detail_id`；退料、报废、盘点流水不要求生成 `stock_order`，除非后续有统一单据号展示的明确需求。

简化关系：

```text
普通入库/普通出库
  stock_order -> stock_order_detail -> inventory_transaction

退料
  return_order -> return_detail -> inventory_transaction

报废
  item_scrap -> inventory_transaction

盘点
  stock_check_order -> stock_check_detail -> inventory_transaction
```

---

# 一、基础资料表

---

### 1. `item_type`

职责：维护库存对象分类，用于区分物料、半成品、成品等对象类型。

| 字段           | 类型             | 说明                                                   |
| ------------ | -------------- | ---------------------------------------------------- |
| `id`         | `BIGINT`       | 主键                                                   |
| `item_kind`  | `VARCHAR(30)`  | 库存对象大类：`material`、`semi_finished`、`finished_product` |
| `type_name`  | `VARCHAR(100)` | 类型名称，例如粘合剂、焊膏、腔体、微带环形器                               |
| `remark`     | `TEXT`         | 备注                                                   |
| `created_at` | `TIMESTAMP`    | 创建时间，默认 `CURRENT_TIMESTAMP`                          |
| `updated_at` | `TIMESTAMP`    | 更新时间，默认 `CURRENT_TIMESTAMP`                          |

约束：

* 主键：`id`
* 检查约束：`CHECK (item_kind IN ('material', 'semi_finished', 'finished_product'))`
* 唯一约束：`UNIQUE (item_kind, type_name)`

说明：

* `material` 表示原材料、辅料、零部件等。
* `semi_finished` 表示生产过程中产生的半成品。
* `finished_product` 表示最终成品。
* 后续如果要扩展外购成品、包装材料等，也可以继续放在该体系内。

---

### 2. `item_info`

职责：维护所有可库存对象的基础信息，包括物料、半成品、成品。

| 字段             | 类型             | 说明                          |
| -------------- | -------------- | --------------------------- |
| `id`           | `BIGINT`       | 主键                          |
| `item_code`    | `VARCHAR(100)` | 库存对象编码                      |
| `item_name`    | `VARCHAR(200)` | 库存对象名称                      |
| `type_id`      | `BIGINT`       | 类型 ID，关联 `item_type.id`     |
| `default_unit` | `VARCHAR(20)`  | 默认单位，例如 `g`、`kg`、`个`        |
| `status`       | `VARCHAR(20)`  | 状态，默认 `启用`；可选：`启用`、`停用`     |
| `remark`       | `TEXT`         | 备注                          |
| `created_at`   | `TIMESTAMP`    | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at`   | `TIMESTAMP`    | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

* 主键：`id`
* 唯一约束：`UNIQUE (item_code)`
* 外键：`FOREIGN KEY (type_id) REFERENCES item_type(id)`
* 检查约束：`CHECK (status IN ('启用', '停用'))`

说明：

* 该表统一替代原来的 `product_material_info`。
* 物料、半成品、成品都进入该表。
* 是否是物料、半成品或成品，通过 `type_id -> item_type.item_kind` 判断。

示例：

| id  | item_name      | item_kind        | default_unit |
| --- | -------------- | ---------------- | ------------ |
| pi2 | 粘合-h822        | material         | g            |
| pi3 | 6g-20g微带环形器半成品 | semi_finished    | 个            |
| pi4 | 10g-30g微带环形器成品 | finished_product | 个            |
| pi5 | 焊膏-md422       | material         | g            |
| pi6 | 腔体-10*10       | material         | 个            |

---

### 3. `product_bom`

职责：维护产品或半成品的物料清单，记录生产一个目标对象需要消耗哪些库存对象。

| 字段           | 类型              | 说明                          |
| ------------ | --------------- | --------------------------- |
| `id`         | `BIGINT`        | 主键                          |
| `product_id` | `BIGINT`        | 被生产对象 ID，关联 `item_info.id`  |
| `item_id`    | `BIGINT`        | 消耗对象 ID，关联 `item_info.id`   |
| `per_unit`   | `DECIMAL(12,4)` | 生产一个目标对象需要消耗的数量             |
| `unit`       | `VARCHAR(20)`   | 用量单位                        |
| `bom_status` | `VARCHAR(20)`   | BOM 状态，默认 `启用`；可选：`启用`、`停用` |
| `remark`     | `TEXT`          | 备注                          |
| `created_at` | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at` | `TIMESTAMP`     | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (product_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 检查约束：`CHECK (per_unit > 0)`
* 检查约束：`CHECK (bom_status IN ('启用', '停用'))`
* 唯一约束：`UNIQUE (product_id, item_id)`
* 唯一约束：`UNIQUE (id, item_id)`

说明：

* `product_id` 可以是成品，也可以是半成品。
* `item_id` 可以是物料，也可以是半成品。
* `production_item_demand` 中建议保存 `bom_id`，用于追溯需求来源。
* 若 BOM 后续会变更，历史需求仍可通过 `bom_id` 追溯原始来源。
* 若需要更强历史还原能力，可在需求表中增加 BOM 快照字段，例如 `bom_per_unit_snapshot`、`bom_unit_snapshot`。

---

# 二、生产执行表

---

### 4. `work_orders`

职责：维护生产工单，记录某个产品的整体生产计划。

| 字段                 | 类型              | 说明                          |
| ------------------ | --------------- | --------------------------- |
| `id`               | `BIGINT`        | 主键                          |
| `work_order_no`    | `VARCHAR(100)`  | 工单编号                        |
| `product_id`       | `BIGINT`        | 计划生产对象 ID，关联 `item_info.id` |
| `planned_quantity` | `DECIMAL(12,4)` | 工单计划生产数量                    |
| `status`           | `VARCHAR(30)`   | 工单状态，默认 `pending`           |
| `remark`           | `TEXT`          | 备注                          |
| `created_at`       | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at`       | `TIMESTAMP`     | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

* 主键：`id`
* 唯一约束：`UNIQUE (work_order_no)`
* 外键：`FOREIGN KEY (product_id) REFERENCES item_info(id)`
* 检查约束：`CHECK (planned_quantity > 0)`
* 检查约束：`CHECK (status IN ('pending', 'doing', 'completed', 'cancelled', 'closed'))`

说明：

* 工单表示整体生产计划。
* 一个工单可以拆分为多个生产批次。
* 生产领料、生产入库、半成品入库等动作建议落到 `production_batches` 维度。

---

### 5. `production_batches`

职责：维护生产批次，表示某个工单被拆分后的实际生产批次。

| 字段                 | 类型              | 说明                                 |
| ------------------ | --------------- | ---------------------------------- |
| `id`               | `BIGINT`        | 主键，生产批次 ID                         |
| `work_order_id`    | `BIGINT`        | 工单 ID，关联 `work_orders.id`          |
| `batch_no`         | `VARCHAR(100)`  | 生产批号                               |
| `route_id`         | `BIGINT`        | 工艺路线 ID，关联 `process_routes.id`，可为空 |
| `planned_quantity` | `DECIMAL(12,4)` | 本生产批次计划生产数量                        |
| `status`           | `VARCHAR(40)`   | 生产批次状态                             |
| `owner_id`         | `BIGINT`        | 负责人 ID，关联 `users.id`               |
| `remark`           | `TEXT`          | 备注                                 |
| `created_at`       | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`        |
| `updated_at`       | `TIMESTAMP`     | 更新时间，默认 `CURRENT_TIMESTAMP`        |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (work_order_id) REFERENCES work_orders(id)`
* 外键：`FOREIGN KEY (route_id) REFERENCES process_routes(id)`
* 外键：`FOREIGN KEY (owner_id) REFERENCES users(id)`
* 检查约束：`CHECK (planned_quantity > 0)`
* 唯一约束：`UNIQUE (work_order_id, batch_no)`
* 检查约束：`CHECK (status IN ('pending', 'material_pending', 'material_assigned', 'material_outbound', 'doing', 'completed', 'cancelled'))`

状态说明：

| 状态                  | 含义          |
| ------------------- | ----------- |
| `pending`           | 待开始         |
| `material_pending`  | 待生成或待确认物料需求 |
| `material_assigned` | 物料已分配       |
| `material_outbound` | 物料已领料出库     |
| `doing`             | 生产中         |
| `completed`         | 生产完成        |
| `cancelled`         | 已取消         |

说明：

* `production_batches` 是生产执行批次，不是库存批次。
* 生产批次负责表达“这一批怎么生产”。
* 成品或半成品入库后，应生成 `item_batch` 库存批次，并通过 `item_batch.source_production_batch_id` 关联回生产批次。
* 一个生产批次可以产生多个库存批次，例如半成品批次、成品批次、待检批次。

---

# 三、库存批次与库存流水表

---

### 6. `item_batch`

职责：维护所有库存对象的库存批次，包括物料批次、半成品批次、成品批次。

| 字段                           | 类型             | 说明                                     |
| ---------------------------- | -------------- | -------------------------------------- |
| `id`                         | `BIGINT`       | 主键，库存批次 ID                             |
| `item_id`                    | `BIGINT`       | 库存对象 ID，关联 `item_info.id`              |
| `batch_code`                 | `VARCHAR(100)` | 库存批次号                                  |
| `source_type`                | `VARCHAR(30)`  | 来源类型：`自产`、`外购`、`委外`、`退货入库`、`盘点生成`、`其他` |
| `provider`                   | `VARCHAR(100)` | 供应商或委外方，自产时可为空                         |
| `source_work_order_id`       | `BIGINT`       | 来源工单 ID，自产或委外时可填                       |
| `source_production_batch_id` | `BIGINT`       | 来源生产批次 ID，自产半成品或成品时可填                  |
| `production_date`            | `DATE`         | 生产日期或批次日期                              |
| `batch_status`               | `VARCHAR(20)`  | 批次业务状态，默认 `可用`                         |
| `remark`                     | `TEXT`         | 备注                                     |
| `created_at`                 | `TIMESTAMP`    | 创建时间，默认 `CURRENT_TIMESTAMP`            |
| `updated_at`                 | `TIMESTAMP`    | 更新时间，默认 `CURRENT_TIMESTAMP`            |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (source_work_order_id) REFERENCES work_orders(id)`
* 外键：`FOREIGN KEY (source_production_batch_id) REFERENCES production_batches(id)`
* 唯一约束：`UNIQUE (item_id, batch_code)`
* 唯一约束：`UNIQUE (id, item_id)`
* 检查约束：`CHECK (source_type IN ('自产', '外购', '委外', '退货入库', '盘点生成', '其他'))`
* 检查约束：`CHECK (batch_status IN ('可用', '冻结', '停用'))`

说明：

* `item_batch` 是统一库存批次表。
* 物料、半成品、成品都使用该表。
* `batch_status` 只表示批次业务状态，不表示库存是否用完。
* 库存是否用完应通过 `inventory_transaction` 汇总判断。
* `source_production_batch_id` 用于追溯自产半成品或成品来自哪个生产批次。
* 不建议将 `production_batches.id` 直接作为库存流水的 `batch_id`。

示例：

| batch_id | item_id | 类型    | source_type | source_production_batch_id |
| -------- | ------- | ----- | ----------- | -------------------------- |
| ib1      | pi2     | 物料批次  | 外购          | NULL                       |
| ib6      | pi3     | 半成品批次 | 自产          | pb1                        |
| ib7      | pi4     | 成品批次  | 自产          | pb1                        |

---

### 7. `inventory_transaction`

职责：维护统一库存流水，记录所有会影响库存对象数量或库存状态的变动明细。物料、半成品、成品共用该表。

库存现存量、可分配库存、批次是否用完等结果应从该表按库存对象、批次和库存状态汇总得出，而不是写回批次表。

| 字段                    | 类型              | 说明                           |
| --------------------- | --------------- | ---------------------------- |
| `id`                  | `BIGINT`        | 主键                           |
| `item_id`             | `BIGINT`        | 库存对象 ID，关联 `item_info.id`    |
| `batch_id`            | `BIGINT`        | 库存批次 ID，关联 `item_batch.id`   |
| `transaction_type`    | `VARCHAR(30)`   | 库存变动类型                       |
| `quantity`            | `DECIMAL(12,4)` | 库存变动数量。正数表示增加，负数表示减少，不能为 `0` |
| `stock_status`        | `VARCHAR(20)`   | 库存状态，默认 `可用`                 |
| `stock_order_id`      | `BIGINT`        | 库存单据主表 ID，出入库流水应填写           |
| `stock_order_detail_id` | `BIGINT`      | 库存单据明细 ID，出入库流水应填写           |
| `reference_type`      | `VARCHAR(50)`   | 来源明细类型                       |
| `reference_detail_id` | `BIGINT`        | 来源明细 ID，建议指向明细行，不要只指向主单      |
| `idempotency_key`     | `VARCHAR(150)`  | 幂等键，防止同一业务动作重复生成库存流水         |
| `remark`              | `TEXT`          | 备注                           |
| `created_at`          | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`  |

`transaction_type` 可选语义：

| 值        | 说明                |
| -------- | ----------------- |
| `采购入库`   | 外购物料、外购半成品、外购成品入库 |
| `生产入库`   | 自产半成品或成品入库        |
| `委外入库`   | 委外加工完成入库          |
| `生产领料出库` | 生产批次领料出库          |
| `销售出库`   | 成品销售出库，后续可扩展      |
| `退料入库`   | 生产退料回仓            |
| `报废出库`   | 报废扣减库存            |
| `盘点调整`   | 盘点差异调整            |
| `状态转入`   | 库存状态转入            |
| `状态转出`   | 库存状态转出            |

`stock_status` 可选语义：

| 值    | 说明      |
| ---- | ------- |
| `可用` | 可分配、可出库 |
| `待检` | 暂不可用    |
| `冻结` | 被业务冻结   |
| `不良` | 不良品     |

`reference_type` 可选语义：

| 值                    | 说明     |
| -------------------- | ------ |
| `STOCK_ORDER_DETAIL` | 库存单据明细 |
| `RETURN_DETAIL`      | 退料明细   |
| `SCRAP`              | 报废记录   |
| `STOCK_CHECK_DETAIL` | 盘点明细   |
| `STATUS_TRANSFER`    | 库存状态转换 |
| `MANUAL`             | 手工调整   |

约束：

* 主键：`id`
* 检查约束：`CHECK (quantity <> 0)`
* 唯一约束：`UNIQUE (idempotency_key)`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (batch_id, item_id) REFERENCES item_batch(id, item_id)`

说明：

* 库存流水是库存数量的事实来源。
* 入库、出库、退料、报废、盘点调整都应产生对应流水。
* 出入库流水应通过 `stock_order_id`、`stock_order_detail_id` 关联统一库存单据。
* `reference_detail_id` 保留为兼容字段；出入库场景统一指向 `stock_order_detail.id`，`reference_type = STOCK_ORDER_DETAIL`。
* 不建议直接修改库存余额字段来表达库存变化。

---

# 四、库存单据表

---

### 8. `stock_order`

职责：维护库存单据主表，统一承载入库和出库主单。入库、生产领料出库、销售出库、委外入库、生产入库等业务都使用该表表达“一次库存业务动作”。

| 字段                    | 类型             | 说明                                     |
| --------------------- | -------------- | -------------------------------------- |
| `id`                  | `BIGINT`       | 主键                                     |
| `order_no`            | `VARCHAR(100)` | 库存单据号                                  |
| `order_direction`     | `VARCHAR(20)`  | 单据方向：`入库`、`出库`                         |
| `business_type`       | `VARCHAR(30)`  | 业务类型：`采购入库`、`生产入库`、`委外入库`、`退货入库`、`盘点生成`、`生产领料出库`、`销售出库`、`其他入库`、`其他出库` |
| `provider`            | `VARCHAR(100)` | 供应商、委外方或来源方                            |
| `work_order_id`       | `BIGINT`       | 来源或服务工单 ID                              |
| `production_batch_id` | `BIGINT`       | 来源或服务生产批次 ID                            |
| `status`              | `VARCHAR(30)`  | 单据状态，默认 `待确认`                           |
| `operated_at`         | `TIMESTAMP`    | 实际确认时间                                  |
| `operator_id`         | `BIGINT`       | 操作人 ID                                 |
| `version`             | `INT`          | 乐观锁版本号，默认 `0`                          |
| `remark`              | `TEXT`         | 备注                                     |
| `created_at`          | `TIMESTAMP`    | 创建时间，默认 `CURRENT_TIMESTAMP`            |
| `updated_at`          | `TIMESTAMP`    | 更新时间，默认 `CURRENT_TIMESTAMP`            |

约束：

* 主键：`id`
* 唯一约束：`UNIQUE (order_no)`
* 唯一约束：`UNIQUE (id, order_direction)`
* 外键：`FOREIGN KEY (work_order_id) REFERENCES work_orders(id)`
* 外键：`FOREIGN KEY (production_batch_id) REFERENCES production_batches(id)`
* 外键：`FOREIGN KEY (operator_id) REFERENCES users(id)`
* 检查约束：`CHECK (order_direction IN ('入库', '出库'))`
* 检查约束：`CHECK (business_type IN ('采购入库', '生产入库', '委外入库', '退货入库', '盘点生成', '生产领料出库', '销售出库', '其他入库', '其他出库'))`
* 检查约束：`CHECK (status IN ('待确认', '已拣货', '已完成', '已取消'))`

说明：

* `order_direction` 决定这张单据是增加库存还是减少库存。
* `business_type` 决定库存流水的业务类型。
* 入库单、出库单不再拆成两套主表，统一由该表承载。
* 对外接口可以继续按入库、出库分路由，但底层表必须统一。
* 该表不替代 `return_order`、`item_scrap`、`stock_check_order` 等需要明确操作日志明细的业务单据。

---

### 9. `stock_order_detail`

职责：维护库存单据明细，统一记录入库或出库时涉及的库存对象、库存批次、数量、库存状态和生产分配关联。

| 字段                    | 类型              | 说明                                      |
| --------------------- | --------------- | --------------------------------------- |
| `id`                  | `BIGINT`        | 主键                                      |
| `order_id`            | `BIGINT`        | 库存单据主表 ID，关联 `stock_order.id`          |
| `item_id`             | `BIGINT`        | 库存对象 ID，关联 `item_info.id`               |
| `batch_id`            | `BIGINT`        | 库存批次 ID，关联 `item_batch.id`              |
| `quantity`            | `DECIMAL(12,4)` | 业务数量，始终保存正数；库存增减由库存流水正负表达           |
| `stock_status`        | `VARCHAR(20)`   | 本次入库后的库存状态或本次出库扣减的库存状态，默认 `可用`      |
| `production_batch_id` | `BIGINT`        | 服务生产批次 ID，生产领料出库和退料时可填              |
| `demand_id`           | `BIGINT`        | 生产投入需求 ID                              |
| `allocation_id`       | `BIGINT`        | 生产投入分配 ID                              |
| `source_stage`        | `VARCHAR(100)`  | 来源工序或生产阶段，半成品入库时有用                  |
| `release_after_return` | `TINYINT`      | 退料后是否释放给公共库存，默认 `0`                  |
| `remark`              | `TEXT`          | 备注                                      |
| `created_at`          | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`             |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (order_id) REFERENCES stock_order(id)`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (batch_id, item_id) REFERENCES item_batch(id, item_id)`
* 外键：`FOREIGN KEY (demand_id, production_batch_id) REFERENCES production_item_demand(id, production_batch_id)`
* 外键：`FOREIGN KEY (allocation_id, demand_id) REFERENCES production_item_allocation(id, demand_id)`
* 检查约束：`CHECK (quantity > 0)`
* 检查约束：`CHECK (stock_status IN ('可用', '待检', '冻结', '不良', '报废'))`
* 检查约束：`CHECK (release_after_return IN (0, 1))`
* 唯一约束：`UNIQUE (order_id, batch_id, item_id, allocation_id)`

说明：

* `stock_order_detail` 是出入库业务事实明细。
* 入库时 `quantity` 仍为正数，确认后生成正数 `inventory_transaction.quantity`。
* 出库时 `quantity` 仍为正数，确认后生成负数 `inventory_transaction.quantity`。
* 生产领料出库应填写 `demand_id`、`allocation_id`，确保和分配明细可追溯。
* 入库数量和出库数量不建议写回 `item_batch`，应通过库存流水汇总。

---

# 五、生产物料需求与分配表

---

### 10. `production_item_demand`

职责：维护生产批次的投入需求，是物料、半成品、辅料等生产投入对象的需求来源表。

视图汇总版本中，该表只保存需求事实，不保存累计分配、累计出库、累计退料、累计报废等缓存字段。

| 字段                    | 类型              | 说明                                 |
| --------------------- | --------------- | ---------------------------------- |
| `id`                  | `BIGINT`        | 主键                                 |
| `production_batch_id` | `BIGINT`        | 生产批次 ID，关联 `production_batches.id` |
| `bom_id`              | `BIGINT`        | BOM 行 ID，正常需求建议保存                  |
| `item_id`             | `BIGINT`        | 需求对象 ID，关联 `item_info.id`          |
| `need_number`         | `DECIMAL(12,4)` | 需求数量                               |
| `demand_type`         | `TINYINT`       | 需求类型，默认 `0`                        |
| `parent_demand_id`    | `BIGINT`        | 补料需求关联的原始需求 ID                     |
| `source_scrap_id`     | `BIGINT`        | 报废补料关联的报废记录 ID                     |
| `reason_type`         | `VARCHAR(50)`   | 补料原因                               |
| `business_status`     | `VARCHAR(30)`   | 业务状态，默认 `正常`                       |
| `version`             | `INT`           | 乐观锁版本号，默认 `0`                      |
| `remark`              | `TEXT`          | 备注                                 |
| `created_at`          | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`        |
| `updated_at`          | `TIMESTAMP`     | 更新时间，默认 `CURRENT_TIMESTAMP`        |

字段说明：

| 字段                 | 说明                         |
| ------------------ | -------------------------- |
| `bom_id`           | 正常需求建议保存，用于追溯需求来源于哪条 BOM   |
| `item_id`          | 即使有 `bom_id`，也建议保留，便于查询和约束 |
| `need_number`      | 需求事实，不应因为出库、退料、报废而直接修改     |
| `demand_type`      | `0` 正常需求，`1` 追加补料，`2` 报废补料 |
| `parent_demand_id` | 补料需求关联的原始需求                |
| `source_scrap_id`  | 报废补料来源，用于防止同一报废记录重复生成补料    |
| `business_status`  | 业务状态，不表达数量进度               |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (production_batch_id) REFERENCES production_batches(id)`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (bom_id, item_id) REFERENCES product_bom(id, item_id)`
* 外键：`FOREIGN KEY (parent_demand_id) REFERENCES production_item_demand(id)`
* 外键：`FOREIGN KEY (source_scrap_id) REFERENCES item_scrap(id)`
* 检查约束：`CHECK (need_number > 0)`
* 检查约束：`CHECK (demand_type IN (0, 1, 2))`
* 检查约束：`CHECK (business_status IN ('正常', '已取消', '已关闭', '冻结', '异常'))`
* 检查约束：正常需求 `demand_type = 0` 时，建议要求 `bom_id IS NOT NULL`
* 唯一约束：`UNIQUE (source_scrap_id)`
* 唯一约束：`UNIQUE (id, item_id)`
* 唯一约束：`UNIQUE (id, production_batch_id)`

视图版本删除字段：

| 删除字段                 | 删除原因                                              |
| -------------------- | ------------------------------------------------- |
| `allocated_quantity` | 由 `production_item_allocation.assigned_number` 汇总 |
| `outbound_quantity`  | 由 `stock_order_detail.quantity` 按生产领料出库汇总       |
| `returned_quantity`  | 由 `return_detail.return_number` 汇总                |
| `scrapped_quantity`  | 由 `item_scrap.scrap_number` 汇总                    |

说明：

* 半成品也可以作为生产投入需求。
* 如果某个生产批次需要领用上一个生产批次产出的半成品，也应通过该表生成需求。
* 补料不建议直接修改原需求的 `need_number`，应新增一条需求记录。

---

### 11. `production_item_allocation`

职责：维护生产批次的物料分配明细，记录某条需求分配到了哪个库存批次以及分配数量。

分配代表业务预留。已分配但未出库的数量，应从可分配库存中扣除，避免其他生产批次抢占。

| 字段                    | 类型              | 说明                                   |
| --------------------- | --------------- | ------------------------------------ |
| `id`                  | `BIGINT`        | 主键                                   |
| `demand_id`           | `BIGINT`        | 需求 ID，关联 `production_item_demand.id` |
| `production_batch_id` | `BIGINT`        | 生产批次 ID，冗余保存，便于查询和约束                 |
| `item_id`             | `BIGINT`        | 库存对象 ID，冗余保存，用于约束需求对象与批次对象一致         |
| `batch_id`            | `BIGINT`        | 分配的库存批次 ID，关联 `item_batch.id`        |
| `assigned_number`     | `DECIMAL(12,4)` | 分配数量                                 |
| `allocation_status`   | `VARCHAR(30)`   | 分配业务状态，默认 `正常`                       |
| `version`             | `INT`           | 乐观锁版本号，默认 `0`                        |
| `remark`              | `TEXT`          | 备注                                   |
| `created_at`          | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`          |
| `updated_at`          | `TIMESTAMP`     | 更新时间，默认 `CURRENT_TIMESTAMP`          |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (demand_id, item_id) REFERENCES production_item_demand(id, item_id)`
* 外键：`FOREIGN KEY (demand_id, production_batch_id) REFERENCES production_item_demand(id, production_batch_id)`
* 外键：`FOREIGN KEY (batch_id, item_id) REFERENCES item_batch(id, item_id)`
* 检查约束：`CHECK (assigned_number > 0)`
* 检查约束：`CHECK (allocation_status IN ('正常', '已释放', '已取消', '冻结', '异常'))`
* 唯一约束：`UNIQUE (id, demand_id)`
* 唯一约束：`UNIQUE (id, production_batch_id)`
* 唯一约束：`UNIQUE (id, item_id)`

视图版本删除字段：

| 删除字段                | 删除原因                   |
| ------------------- | ---------------------- |
| `outbound_quantity` | 由 `stock_order_detail` 按生产领料出库汇总 |
| `returned_quantity` | 由 `return_detail` 汇总   |
| `scrapped_quantity` | 由 `item_scrap` 汇总      |

说明：

* `assigned_number` 是分配事实，不是缓存字段，应保留。
* 分配创建后，应影响可分配库存。
* 分配不等于出库，库存流水不会因为分配而扣减。
* 分配只代表业务预留，实际库存减少发生在出库时。
* `allocation_status = 已释放` 或 `已取消` 时，不应继续占用可分配库存。

---

# 六、生产领料出库说明

---

生产领料出库不再单独创建 `outbound_order`、`outbound_detail`。

统一规则：

* 主单使用 `stock_order`。
* 明细使用 `stock_order_detail`。
* 生产领料出库主单：`stock_order.order_direction = '出库'`，`stock_order.business_type = '生产领料出库'`。
* 生产领料出库明细应填写 `stock_order_detail.production_batch_id`、`demand_id`、`allocation_id`、`item_id`、`batch_id`、`quantity`。
* `stock_order_detail.quantity` 始终为正数；确认出库时生成 `inventory_transaction.quantity` 负数流水。
* 出库流水应填写 `inventory_transaction.stock_order_id`、`stock_order_detail_id`，同时兼容写入 `reference_type = STOCK_ORDER_DETAIL`、`reference_detail_id = stock_order_detail.id`。
* 旧字段语义映射：`outbound_order.outbound_no` -> `stock_order.order_no`，`outbound_detail.outbound_number` -> `stock_order_detail.quantity`。

---

# 七、退料表

---

### 14. `return_order`

职责：维护生产退料主单，记录某个生产批次的一次退料动作。

| 字段                    | 类型             | 说明                                 |
| --------------------- | -------------- | ---------------------------------- |
| `id`                  | `BIGINT`       | 主键                                 |
| `return_no`           | `VARCHAR(100)` | 退料单号                               |
| `production_batch_id` | `BIGINT`       | 生产批次 ID，关联 `production_batches.id` |
| `work_order_id`       | `BIGINT`       | 工单 ID，冗余保存                         |
| `status`              | `VARCHAR(30)`  | 退料单状态，默认 `待处理`                     |
| `return_at`           | `TIMESTAMP`    | 实际退料时间                             |
| `operator_id`         | `BIGINT`       | 操作人 ID                             |
| `version`             | `INT`          | 乐观锁版本号，默认 `0`                      |
| `remark`              | `TEXT`         | 备注                                 |
| `created_at`          | `TIMESTAMP`    | 创建时间，默认 `CURRENT_TIMESTAMP`        |
| `updated_at`          | `TIMESTAMP`    | 更新时间，默认 `CURRENT_TIMESTAMP`        |

约束：

* 主键：`id`
* 唯一约束：`UNIQUE (return_no)`
* 唯一约束：`UNIQUE (id, production_batch_id)`
* 外键：`FOREIGN KEY (production_batch_id) REFERENCES production_batches(id)`
* 外键：`FOREIGN KEY (work_order_id) REFERENCES work_orders(id)`
* 外键：`FOREIGN KEY (operator_id) REFERENCES users(id)`
* 检查约束：`CHECK (status IN ('待处理', '已入库', '已报废', '已取消'))`

说明：

* 退料主单表达一次退料动作。
* 具体退回哪个分配行、哪个批次、多少数量，由 `return_detail` 记录。
* 退料后是否继续占用原生产批次，需要由明细字段控制。

---

### 15. `return_detail`

职责：维护生产退料明细，记录某个分配行本次退回数量、退回后的库存状态，以及是否释放给公共库存。

| 字段                     | 类型              | 说明                           |
| ---------------------- | --------------- | ---------------------------- |
| `id`                   | `BIGINT`        | 主键                           |
| `return_id`            | `BIGINT`        | 退料主单 ID，关联 `return_order.id` |
| `production_batch_id`  | `BIGINT`        | 生产批次 ID，冗余保存                 |
| `demand_id`            | `BIGINT`        | 需求 ID                        |
| `allocation_id`        | `BIGINT`        | 分配明细 ID                      |
| `item_id`              | `BIGINT`        | 退料对象 ID                      |
| `batch_id`             | `BIGINT`        | 退料库存批次 ID                    |
| `return_number`        | `DECIMAL(12,4)` | 本次退料数量                       |
| `return_stock_status`  | `VARCHAR(20)`   | 退回后的库存状态，默认 `可用`             |
| `release_after_return` | `TINYINT`       | 是否退回后释放给公共库存：`0` 否，`1` 是     |
| `remark`               | `TEXT`          | 备注                           |
| `created_at`           | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`  |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (return_id, production_batch_id) REFERENCES return_order(id, production_batch_id)`
* 外键：`FOREIGN KEY (demand_id, production_batch_id) REFERENCES production_item_demand(id, production_batch_id)`
* 外键：`FOREIGN KEY (allocation_id, demand_id) REFERENCES production_item_allocation(id, demand_id)`
* 外键：`FOREIGN KEY (batch_id, item_id) REFERENCES item_batch(id, item_id)`
* 检查约束：`CHECK (return_number > 0)`
* 检查约束：`CHECK (return_stock_status IN ('可用', '待检', '冻结', '不良', '报废'))`
* 检查约束：`CHECK (release_after_return IN (0, 1))`
* 唯一约束：`UNIQUE (return_id, allocation_id)`

说明：

* `return_stock_status = 可用` 的退料会增加库存流水中的可用库存。
* `release_after_return = 0` 表示退回后仍绑定原生产批次，可再次出给该批次。
* `release_after_return = 1` 表示退回后释放给公共库存，不再继续占用原生产批次。
* 退料入库应生成 `inventory_transaction`，类型为 `退料入库`。

---

# 八、报废表

---

### 16. `item_scrap`

职责：维护报废记录，支持生产消耗报废、仓库侧报废、退料后报废、库存内报废等场景。

| 字段                    | 类型              | 说明                          |
| --------------------- | --------------- | --------------------------- |
| `id`                  | `BIGINT`        | 主键                          |
| `scrap_no`            | `VARCHAR(100)`  | 报废单号                        |
| `production_batch_id` | `BIGINT`        | 生产批次 ID，可为空                 |
| `demand_id`           | `BIGINT`        | 需求 ID，可为空                   |
| `allocation_id`       | `BIGINT`        | 分配明细 ID，可为空                 |
| `item_id`             | `BIGINT`        | 报废对象 ID                     |
| `batch_id`            | `BIGINT`        | 报废库存批次 ID，可为空               |
| `scrap_scene`         | `VARCHAR(40)`   | 报废场景                        |
| `scrap_number`        | `DECIMAL(12,4)` | 报废数量                        |
| `reason_type`         | `VARCHAR(50)`   | 报废原因                        |
| `status`              | `VARCHAR(30)`   | 状态，默认 `已确认`                 |
| `remark`              | `TEXT`          | 备注                          |
| `created_at`          | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at`          | `TIMESTAMP`     | 更新时间，默认 `CURRENT_TIMESTAMP` |

`scrap_scene` 可选语义：

| 值                       | 含义                 | 是否影响 allocation 可再次出库量 |
| ----------------------- | ------------------ | ---------------------- |
| `WAREHOUSE_ALLOCATED`   | 已分配但未出库，在仓库侧报废     | 是                      |
| `RETURN_AFTER_OUTBOUND` | 出库后退回，再发生报废        | 是                      |
| `PRODUCTION_CONSUMED`   | 已出库到生产后，在生产过程中消耗报废 | 否                      |
| `IN_STOCK`              | 库存内直接报废，例如成品库存报废   | 不涉及 allocation         |

约束：

* 主键：`id`
* 唯一约束：`UNIQUE (scrap_no)`
* 外键：`FOREIGN KEY (production_batch_id) REFERENCES production_batches(id)`
* 外键：`FOREIGN KEY (demand_id) REFERENCES production_item_demand(id)`
* 外键：`FOREIGN KEY (allocation_id) REFERENCES production_item_allocation(id)`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (batch_id, item_id) REFERENCES item_batch(id, item_id)`
* 检查约束：`CHECK (scrap_number > 0)`
* 检查约束：`CHECK (scrap_scene IN ('WAREHOUSE_ALLOCATED', 'RETURN_AFTER_OUTBOUND', 'PRODUCTION_CONSUMED', 'IN_STOCK'))`
* 检查约束：`CHECK (status IN ('待确认', '已确认', '已取消'))`

说明：

* 生产消耗报废不应直接扣减原 allocation 的可再次出库量。
* 生产消耗报废如果需要补料，应新增 `production_item_demand`，并设置：

  * `demand_type = 2`
  * `parent_demand_id = 原始需求 ID`
  * `source_scrap_id = 报废记录 ID`
* 库存内报废应生成 `inventory_transaction`，类型为 `报废出库`。
* 只有 `status = 已确认` 的报废记录参与视图汇总。

---

# 九、盘点表

---

### 17. `stock_check_order`

职责：维护库存盘点主单，记录一次盘点任务的基本信息。

| 字段            | 类型             | 说明                          |
| ------------- | -------------- | --------------------------- |
| `id`          | `BIGINT`       | 主键                          |
| `check_no`    | `VARCHAR(100)` | 盘点单号                        |
| `status`      | `VARCHAR(30)`  | 盘点状态，默认 `待盘点`               |
| `check_at`    | `TIMESTAMP`    | 实际盘点时间                      |
| `operator_id` | `BIGINT`       | 操作人 ID                      |
| `remark`      | `TEXT`         | 备注                          |
| `created_at`  | `TIMESTAMP`    | 创建时间，默认 `CURRENT_TIMESTAMP` |
| `updated_at`  | `TIMESTAMP`    | 更新时间，默认 `CURRENT_TIMESTAMP` |

约束：

* 主键：`id`
* 唯一约束：`UNIQUE (check_no)`
* 外键：`FOREIGN KEY (operator_id) REFERENCES users(id)`
* 检查约束：`CHECK (status IN ('待盘点', '盘点中', '已完成', '已取消'))`

说明：

* 盘点主单表达一次盘点动作。
* 具体盘点了哪些库存对象、哪些批次、账面数量和实盘数量，由 `stock_check_detail` 记录。

---

### 18. `stock_check_detail`

职责：维护库存盘点明细，记录某个库存对象某个批次的账面数量、实盘数量和差异数量。

| 字段                    | 类型              | 说明                                |
| --------------------- | --------------- | --------------------------------- |
| `id`                  | `BIGINT`        | 主键                                |
| `stock_check_id`      | `BIGINT`        | 盘点主单 ID，关联 `stock_check_order.id` |
| `item_id`             | `BIGINT`        | 库存对象 ID                           |
| `batch_id`            | `BIGINT`        | 库存批次 ID                           |
| `stock_status`        | `VARCHAR(20)`   | 盘点的库存状态，例如 `可用`、`待检`              |
| `system_quantity`     | `DECIMAL(12,4)` | 盘点时系统账面数量                         |
| `actual_quantity`     | `DECIMAL(12,4)` | 实盘数量                              |
| `difference_quantity` | `DECIMAL(12,4)` | 差异数量，实盘数量 - 系统数量                  |
| `result`              | `VARCHAR(20)`   | 盘点结果：`盘盈`、`盘亏`、`一致`               |
| `adjusted`            | `TINYINT`       | 是否已生成盘点调整流水：`0` 否，`1` 是           |
| `remark`              | `TEXT`          | 备注                                |
| `created_at`          | `TIMESTAMP`     | 创建时间，默认 `CURRENT_TIMESTAMP`       |

约束：

* 主键：`id`
* 外键：`FOREIGN KEY (stock_check_id) REFERENCES stock_check_order(id)`
* 外键：`FOREIGN KEY (item_id) REFERENCES item_info(id)`
* 外键：`FOREIGN KEY (batch_id, item_id) REFERENCES item_batch(id, item_id)`
* 检查约束：`CHECK (system_quantity >= 0)`
* 检查约束：`CHECK (actual_quantity >= 0)`
* 检查约束：`CHECK (result IN ('盘盈', '盘亏', '一致'))`
* 检查约束：`CHECK (adjusted IN (0, 1))`
* 唯一约束：`UNIQUE (stock_check_id, item_id, batch_id, stock_status)`

说明：

* `difference_quantity = actual_quantity - system_quantity`。
* 盘盈时，`difference_quantity > 0`。
* 盘亏时，`difference_quantity < 0`。
* 盘点调整应生成 `inventory_transaction`，类型为 `盘点调整`。
* 盘点明细应记录盘点时的系统数量快照，避免后续库存变动影响盘点结果。

---

# 十、核心汇总视图

---

### 19. `v_item_batch_stock`

职责：按库存批次、库存对象和库存状态汇总现存量。

| 字段                           | 类型              | 说明        |
| ---------------------------- | --------------- | --------- |
| `batch_id`                   | `BIGINT`        | 库存批次 ID   |
| `item_id`                    | `BIGINT`        | 库存对象 ID   |
| `item_name`                  | `VARCHAR(200)`  | 库存对象名称    |
| `item_kind`                  | `VARCHAR(30)`   | 库存对象大类    |
| `batch_code`                 | `VARCHAR(100)`  | 库存批次号     |
| `source_type`                | `VARCHAR(30)`   | 来源类型      |
| `provider`                   | `VARCHAR(100)`  | 供应商或委外方   |
| `source_work_order_id`       | `BIGINT`        | 来源工单 ID   |
| `source_production_batch_id` | `BIGINT`        | 来源生产批次 ID |
| `batch_status`               | `VARCHAR(20)`   | 批次业务状态    |
| `available_quantity`         | `DECIMAL(12,4)` | 可用库存数量    |
| `pending_quantity`           | `DECIMAL(12,4)` | 待检库存数量    |
| `frozen_quantity`            | `DECIMAL(12,4)` | 冻结库存数量    |
| `defective_quantity`         | `DECIMAL(12,4)` | 不良库存数量    |
| `total_quantity`             | `DECIMAL(12,4)` | 总库存数量     |

汇总口径：

| 字段                   | 计算来源                         |
| -------------------- | ---------------------------- |
| `available_quantity` | 汇总 `stock_status = 可用` 的库存流水 |
| `pending_quantity`   | 汇总 `stock_status = 待检` 的库存流水 |
| `frozen_quantity`    | 汇总 `stock_status = 冻结` 的库存流水 |
| `defective_quantity` | 汇总 `stock_status = 不良` 的库存流水 |
| `total_quantity`     | 汇总该批次所有库存流水                  |

说明：

* 该视图只表达账面库存。
* 是否可被新生产批次分配，还需要结合预留数量，通过 `v_item_batch_available_to_allocate` 判断。
* 批次是否用完不写回 `item_batch.batch_status`。

---

### 20. `v_production_item_allocation_summary`

职责：按分配明细维度汇总出库、退料、报废和可再次出库数量。

| 字段                             | 类型              | 说明              |
| ------------------------------ | --------------- | --------------- |
| `allocation_id`                | `BIGINT`        | 分配明细 ID         |
| `demand_id`                    | `BIGINT`        | 需求 ID           |
| `production_batch_id`          | `BIGINT`        | 生产批次 ID         |
| `item_id`                      | `BIGINT`        | 库存对象 ID         |
| `batch_id`                     | `BIGINT`        | 库存批次 ID         |
| `assigned_number`              | `DECIMAL(12,4)` | 分配数量            |
| `outbound_quantity`            | `DECIMAL(12,4)` | 累计出库数量          |
| `returned_quantity`            | `DECIMAL(12,4)` | 累计退料数量          |
| `returned_available_quantity`  | `DECIMAL(12,4)` | 退回后可用且未释放的数量    |
| `released_return_quantity`     | `DECIMAL(12,4)` | 退回后已释放给公共库存的数量  |
| `stock_scrapped_quantity`      | `DECIMAL(12,4)` | 仓库侧或退料后的报废数量    |
| `production_scrapped_quantity` | `DECIMAL(12,4)` | 生产消耗报废数量        |
| `available_outbound_quantity`  | `DECIMAL(12,4)` | 当前对原生产批次可再次出库数量 |
| `is_quantity_abnormal`         | `TINYINT`       | 数量是否异常          |

核心计算口径：

| 字段                             | 计算来源                                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| `outbound_quantity`            | 汇总生产领料出库对应的 `stock_order_detail.quantity`                  |
| `returned_quantity`            | 汇总 `return_detail.return_number`                                  |
| `returned_available_quantity`  | 汇总 `return_stock_status = 可用` 且 `release_after_return = 0` 的退料数量  |
| `released_return_quantity`     | 汇总 `release_after_return = 1` 的退料数量                               |
| `stock_scrapped_quantity`      | 汇总 `WAREHOUSE_ALLOCATED`、`RETURN_AFTER_OUTBOUND` 且状态为 `已确认` 的报废数量 |
| `production_scrapped_quantity` | 汇总 `PRODUCTION_CONSUMED` 且状态为 `已确认` 的报废数量                         |
| `available_outbound_quantity`  | 分配数量 - 已出库数量 + 未释放可用退料数量 - 库存侧报废数量                                |

说明：

* `PRODUCTION_CONSUMED` 不扣减 `available_outbound_quantity`。
* `release_after_return = 1` 的退料不再属于原生产批次的可再次出库量。
* 如果 `available_outbound_quantity < 0`，表示该分配行存在数量异常。

---

### 21. `v_production_item_demand_summary`

职责：按需求维度汇总分配、出库、退料、报废、缺料和数量进度状态。

| 字段                             | 类型              | 说明        |
| ------------------------------ | --------------- | --------- |
| `demand_id`                    | `BIGINT`        | 需求 ID     |
| `production_batch_id`          | `BIGINT`        | 生产批次 ID   |
| `bom_id`                       | `BIGINT`        | BOM 行 ID  |
| `item_id`                      | `BIGINT`        | 需求对象 ID   |
| `need_number`                  | `DECIMAL(12,4)` | 需求数量      |
| `demand_type`                  | `TINYINT`       | 需求类型      |
| `parent_demand_id`             | `BIGINT`        | 原始需求 ID   |
| `source_scrap_id`              | `BIGINT`        | 来源报废记录 ID |
| `business_status`              | `VARCHAR(30)`   | 业务状态      |
| `allocated_quantity`           | `DECIMAL(12,4)` | 累计已分配数量   |
| `unallocated_quantity`         | `DECIMAL(12,4)` | 未分配数量     |
| `outbound_quantity`            | `DECIMAL(12,4)` | 累计已出库数量   |
| `not_outbound_quantity`        | `DECIMAL(12,4)` | 未出库数量     |
| `returned_quantity`            | `DECIMAL(12,4)` | 累计退料数量    |
| `stock_scrapped_quantity`      | `DECIMAL(12,4)` | 库存侧报废数量   |
| `production_scrapped_quantity` | `DECIMAL(12,4)` | 生产消耗报废数量  |
| `available_outbound_quantity`  | `DECIMAL(12,4)` | 当前可再次出库数量 |
| `is_shortage`                  | `TINYINT`       | 是否缺料      |
| `is_quantity_abnormal`         | `TINYINT`       | 是否数量异常    |
| `progress_status`              | `VARCHAR(30)`   | 数量进度状态    |

核心计算口径：

| 字段                      | 计算来源                                         |
| ----------------------- | -------------------------------------------- |
| `allocated_quantity`    | 汇总该需求下所有有效分配的 `assigned_number`              |
| `unallocated_quantity`  | `need_number - allocated_quantity`，小于 0 时按 0 |
| `outbound_quantity`     | 汇总该需求下所有出库明细数量                               |
| `not_outbound_quantity` | `need_number - outbound_quantity`，小于 0 时按 0  |
| `returned_quantity`     | 汇总该需求下所有退料数量                                 |
| `is_shortage`           | 当 `unallocated_quantity > 0` 时为 1            |

`progress_status` 推荐规则：

| 条件                                        | 状态       |
| ----------------------------------------- | -------- |
| `business_status` 为 `已取消`、`已关闭`、`冻结`、`异常` | 直接显示业务状态 |
| 已分配数量 = 0                                 | `待分配`    |
| 已分配数量 < 需求数量，且已出库数量 = 0                   | `部分分配`   |
| 已分配数量 >= 需求数量，且已出库数量 = 0                  | `已分配`    |
| 已出库数量 > 0，已出库数量 < 需求数量，且已分配数量 < 需求数量      | `缺料待补`   |
| 已出库数量 > 0，已出库数量 < 需求数量                    | `部分出库`   |
| 已出库数量 >= 需求数量                             | `已出库`    |
| 其他情况                                      | `未知`     |

说明：

* `progress_status` 是视图计算字段，不建议写入需求表。
* `business_status` 是业务流程状态，应该存入基础表。
* 该视图适合生产批次详情、领料进度、缺料提醒使用。

---

### 22. `v_item_batch_available_to_allocate`

职责：按库存批次计算可继续分配给新生产批次的数量。

| 字段                               | 类型              | 说明       |
| -------------------------------- | --------------- | -------- |
| `batch_id`                       | `BIGINT`        | 库存批次 ID  |
| `item_id`                        | `BIGINT`        | 库存对象 ID  |
| `item_name`                      | `VARCHAR(200)`  | 库存对象名称   |
| `item_kind`                      | `VARCHAR(30)`   | 库存对象大类   |
| `batch_code`                     | `VARCHAR(100)`  | 批次号      |
| `on_hand_available_quantity`     | `DECIMAL(12,4)` | 账面可用库存数量 |
| `reserved_quantity`              | `DECIMAL(12,4)` | 已预留未释放数量 |
| `available_to_allocate_quantity` | `DECIMAL(12,4)` | 可继续分配数量  |

核心计算口径：

| 字段                               | 计算来源                                             |
| -------------------------------- | ------------------------------------------------ |
| `on_hand_available_quantity`     | 来自 `v_item_batch_stock.available_quantity`       |
| `reserved_quantity`              | 来自有效分配行的未出库、未释放占用数量                              |
| `available_to_allocate_quantity` | `on_hand_available_quantity - reserved_quantity` |

说明：

* 该视图用于新生产批次分配物料时判断可用量。
* 不能只看账面库存，因为已分配但未出库的数量已经被预留。
* `allocation_status IN ('已释放', '已取消')` 的分配不应继续占用库存。
* 退料后如果 `release_after_return = 1`，退回数量应释放给公共库存，不继续占用原生产批次。

---

### 23. `v_production_batch_item_summary`

职责：按生产批次和投入对象汇总需求、分配、出库、退料、报废和实际消耗。

| 字段                                   | 类型              | 说明                    |
| ------------------------------------ | --------------- | --------------------- |
| `production_batch_id`                | `BIGINT`        | 生产批次 ID               |
| `item_id`                            | `BIGINT`        | 投入对象 ID               |
| `item_name`                          | `VARCHAR(200)`  | 投入对象名称                |
| `total_need_number`                  | `DECIMAL(12,4)` | 总需求数量                 |
| `total_allocated_quantity`           | `DECIMAL(12,4)` | 总分配数量                 |
| `total_unallocated_quantity`         | `DECIMAL(12,4)` | 总未分配数量                |
| `total_outbound_quantity`            | `DECIMAL(12,4)` | 总出库数量                 |
| `total_returned_quantity`            | `DECIMAL(12,4)` | 总退料数量                 |
| `actual_consumed_quantity`           | `DECIMAL(12,4)` | 实际消耗数量，建议为出库数量 - 退料数量 |
| `total_stock_scrapped_quantity`      | `DECIMAL(12,4)` | 总库存侧报废数量              |
| `total_production_scrapped_quantity` | `DECIMAL(12,4)` | 总生产消耗报废数量             |
| `is_shortage`                        | `TINYINT`       | 是否存在缺料                |
| `is_quantity_abnormal`               | `TINYINT`       | 是否存在数量异常              |

说明：

* 该视图适合生产批次投入汇总。
* 生产报废补料会让同一 `item_id` 的总需求增加。
* `actual_consumed_quantity` 可用于生产成本、用料分析和损耗分析。

---

### 24. `v_production_batch_output_summary`

职责：按生产批次汇总半成品和成品入库产出。

| 字段                    | 类型              | 说明            |
| --------------------- | --------------- | ------------- |
| `production_batch_id` | `BIGINT`        | 生产批次 ID       |
| `work_order_id`       | `BIGINT`        | 工单 ID         |
| `item_id`             | `BIGINT`        | 产出对象 ID       |
| `item_name`           | `VARCHAR(200)`  | 产出对象名称        |
| `item_kind`           | `VARCHAR(30)`   | 产出对象类型：半成品或成品 |
| `batch_id`            | `BIGINT`        | 产出库存批次 ID     |
| `batch_code`          | `VARCHAR(100)`  | 产出库存批次号       |
| `inbound_quantity`    | `DECIMAL(12,4)` | 生产入库数量        |
| `stock_status`        | `VARCHAR(20)`   | 入库库存状态        |
| `source_stage`        | `VARCHAR(100)`  | 来源工序或阶段       |

说明：

* 该视图适合查看某个生产批次产出了哪些半成品和成品。
* 半成品和成品都来自入库方向的 `stock_order_detail`。
* 当前库存数量不一定等于生产入库数量，因为后续可能发生销售出库、盘点调整、报废出库等。

---

# 十一、外部依赖表说明

以下表在本设计中被引用，但不在本文档中展开设计：

| 表名                     | 用途         |
| ---------------------- | ---------- |
| `users`                | 用户、负责人、操作人 |
| `process_routes`       | 工艺路线       |
| `process_steps`        | 工序步骤，可选    |
| `quality_check_order`  | 质检单，可选     |
| `quality_check_detail` | 质检明细，可选    |

---

# 十二、关键业务规则汇总

## 12.1 生产批次和库存批次必须分离

| 类型   | 表                    | 含义          |
| ---- | -------------------- | ----------- |
| 生产批次 | `production_batches` | 这一批怎么生产     |
| 库存批次 | `item_batch`         | 入库后怎么存、怎么追溯 |

说明：

* `production_batches.id` 不应直接作为库存流水的 `batch_id`。
* 库存流水的 `batch_id` 应统一指向 `item_batch.id`。
* `item_batch.source_production_batch_id` 用来追溯库存批次来源于哪个生产批次。

---

## 12.2 分配等于预留

创建 `production_item_allocation` 后，分配数量应视为被该生产批次占用。

可分配库存计算：

```text
可分配数量 = 账面可用库存 - 已预留未释放数量
```

说明：

* 分配不会生成库存流水。
* 出库才会生成库存流水。
* 新生产批次分配时，应查 `v_item_batch_available_to_allocate`，不能只查账面库存。

---

## 12.3 出库明细是业务事实，库存流水是库存事实

| 表                       | 职责                     |
| ----------------------- | ---------------------- |
| `stock_order_detail`    | 记录业务上出了什么、从哪个分配行出、出了多少 |
| `inventory_transaction` | 记录库存账面如何变化             |

说明：

* `inventory_transaction.stock_order_detail_id` 应指向 `stock_order_detail.id`。
* 一张出库方向的 `stock_order` 可以有多条 `stock_order_detail`。
* `stock_order.production_batch_id` 表示本次出库服务哪个生产批次。

---

## 12.4 入库明细是业务事实，库存流水是库存事实

| 表                       | 职责                   |
| ----------------------- | -------------------- |
| `stock_order_detail`    | 记录业务上入库了什么、哪个批次、多少数量 |
| `inventory_transaction` | 记录库存账面如何增加           |

说明：

* 物料采购入库、半成品入库、成品入库都走入库方向的 `stock_order` + `stock_order_detail`。
* `inventory_transaction.stock_order_detail_id` 应指向 `stock_order_detail.id`。

---

## 12.5 报废补料不修改原需求

生产消耗报废后，如果需要补料，应新增需求：

| 字段                 | 值       |
| ------------------ | ------- |
| `demand_type`      | `2`     |
| `parent_demand_id` | 原始需求 ID |
| `source_scrap_id`  | 报废记录 ID |
| `need_number`      | 补料数量    |

说明：

* 不建议直接修改原始需求的 `need_number`。
* 这样可以形成清晰链路：原始需求 → 报废记录 → 补料需求 → 分配 → 出库。

---

## 12.6 退料是否释放库存要明确

退料后有两种处理：

| 场景       | 字段设置                       | 含义             |
| -------- | -------------------------- | -------------- |
| 仍属于原生产批次 | `release_after_return = 0` | 原生产批次后续可再次领用   |
| 释放给公共库存  | `release_after_return = 1` | 新生产批次可以分配这部分库存 |

说明：

* 如果生产已经结束，多领退料通常建议释放给公共库存。
* 如果只是临时退回，后续还可能继续领用，则不释放。

---

## 12.7 盘点调整必须生成库存流水

盘点明细记录账面数量和实盘数量。
若存在差异，应生成 `inventory_transaction`：

| 差异 | 库存流水      |
| -- | --------- |
| 盘盈 | `盘点调整` 正数 |
| 盘亏 | `盘点调整` 负数 |

说明：

* 盘点不应直接修改库存余额。
* 盘点调整应通过库存流水体现。
* `stock_check_detail.adjusted` 用于标记是否已经生成调整流水，防止重复调整。

---

# 十三、最终表关系简图

```text
item_type
  ↓
item_info
  ↓
product_bom

work_orders
  ↓
production_batches
  ↓
production_item_demand
  ↓
production_item_allocation
  ↓
stock_order（出库方向）
  ↓
stock_order_detail
  ↓
inventory_transaction

production_batches
  ↓
stock_order（入库方向）
  ↓
stock_order_detail
  ↓
item_batch
  ↓
inventory_transaction

production_item_allocation
  ↓
return_order
  ↓
return_detail
  ↓
inventory_transaction

production_item_demand
  ↓
item_scrap
  ↓
production_item_demand 报废补料

stock_check_order
  ↓
stock_check_detail
  ↓
inventory_transaction
```

---

# 十四、方案总结

本方案的核心是：

```text
生产批次管生产执行。
库存批次管库存追溯。
库存流水管数量变化。
分配明细管预留占用。
出入库明细管业务动作。
视图负责汇总结果。
```

主要优点：

* 物料、半成品、成品统一库存模型。
* 生产批次和库存批次语义清晰，不互相混用。
* 可支持半成品入库、成品入库、外购入库、委外入库。
* 可支持生产领料、退料、报废补料、盘点调整。
* 主表不保存累计缓存字段，减少数据不一致风险。
* 后续如性能不足，可在视图基础上增加汇总表或物化视图。

## 四、生产过程追溯保留表

以下生产过程追溯表继续保留，用于记录生产批次内的工序派工、报工和过程节点。生产批次与库存批次的关系以第三章统一库存方案为准。

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
