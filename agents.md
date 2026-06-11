<!--
AI 开发助手使用要求（必须优先遵守）

1. 开始任何代码生成、页面生成、接口生成、数据库调整前，必须先阅读并理解本文件。
2. UI 相关内容必须参考 design.md，不允许自行改成抽屉、大屏、营销页或其他风格。
3. 业务功能必须参考最新需求说明书，不允许凭经验扩展完整 MES、完整 ERP、完整仓库、复杂排产、扫码过站等功能。
4. 数据库和字段必须参考最新数据库设计文档，不允许随意新增表、删字段或改变核心关系。
5. 如发现 design.md、需求说明书、数据库设计文档之间存在冲突，应先指出冲突并等待确认，不要自行选择其中一个版本继续开发。
6. 一期以管理端为主，员工端、检测端可作为测试页面或后续扩展，不应抢先做成完整复杂系统。
7. 表单交互统一使用弹窗 Modal，不使用抽屉 Drawer。
8. n 对 n 关系必须使用中间表，不允许用逗号分隔 ID、数组字段或 JSON ID 列表代替。
9. 所有涉及生产、物料、检验、返工、成品流转的关键操作都应考虑日志和审计字段。
10. 输出代码或方案时，必须说明：改了哪些文件、涉及哪些模块、是否影响数据库、是否符合 design.md 和需求说明书。
11. 按功能模块开发时，数据库可按模块逐步建设。开发某个模块时，如果该模块依赖其他基础表或关联表，应先补齐必要的依赖表、基础字段和外键关系，保证当前模块可以完整开发、联调和测试。
12. 补齐依赖表时必须遵守最新数据库设计文档，不允许为了当前模块方便而私自简化、绕开或改变核心关系。
13. 如果当前模块开发需要新增表、调整字段、改变关系、改变状态流转，或者发现实现方式与现有设计存在冲突，必须先明确指出冲突点，并向用户确认后再继续。
14. 遇到冲突时，应优先给出至少两种处理方案，例如：按现有设计实现、局部调整设计、重新设计该关系，并说明各自影响，等待用户选择。
-->

# 生产工艺流程追溯系统 Agents Guidelines

> 本文档用于约束 AI 编程助手、代码生成工具和开发协作者在本项目中的工作方式。  
> 本文件不负责 UI 视觉设计，UI 风格请参考 `design.md`。

---

## 1. 项目定位

本项目是一个轻量生产工艺流程追溯系统。

系统一期目标不是完整 MES、完整 ERP 或完整仓库系统，而是优先实现：

- 生产过程关键节点记录
- 产品资料和工艺路线维护
- 物料批次预留与实际使用记录
- 工单与生产批次管理
- 报工记录
- 检验记录
- 返工记录
- 成品流转记录
- 客户审核展示所需的追溯链路

核心原则：

```text
现场照常生产，系统记录关键节点。
```

---

## 2. 技术栈约定

### 2.1 前端

- Vue 3
- TypeScript
- Element Plus
- Pinia
- Vue Router
- Vite

### 2.2 后端

- NestJS
- TypeScript
- MySQL
- Redis，可选
- RBAC 权限模型

### 2.3 包管理与环境

- Node.js >= 22.18.0
- pnpm
- Windows 11 开发环境

---

## 3. 前端目录建议

```text
apps/admin-web
  src
    api
    assets
    components
    composables
    layouts
    router
    stores
    styles
    utils
    views
      system
      product
      warehouse
      production
      quality
```

管理端页面优先按以下模块组织：

```text
system
  users
  roles
  logs

product
  products
  categories
  processes
  routes

warehouse
  inventory
  transactions

production
  orders
  tasks
  material-allocation
  dispatch
  reports

quality
  inspections
  reworks
```

员工端、检测端可以作为前期测试页面，但不作为管理端主线。  
追溯中心和报表管理一期可暂不实现，除非需求明确要求。

---

## 4. UI 开发规则

UI 实现必须遵守 `design.md`。

关键约束：

1. 管理端使用左侧菜单 + 顶部栏 + 内容区结构。
2. 新增、编辑、分配、确认等操作统一使用弹窗 Modal。
3. 不使用抽屉 Drawer 作为主要交互方式。
4. 表格优先，详情通过弹窗展示。
5. 状态标签、按钮颜色、表单布局必须遵守 `design.md`。
6. 页面不要做大屏炫酷风，不要做官网展示风。
7. 页面目录和功能以管理端为主。

---

## 5. 数据库设计依据

数据库设计以最新数据库设计文档为准。

关键表包括：

- users
- departments
- roles
- permissions
- user_roles
- role_permissions
- logs
- product_categories
- products
- technical_files
- process_routes
- process_route_steps
- product_materials
- route_step_materials
- material_batches
- work_orders
- production_batches
- batch_step_records
- batch_material_usages
- inspection_records
- rework_records
- finished_flow_records

开发时不要随意新增表。  
如确实需要新增表，必须说明新增原因、替代方案、是否会使系统变重。

---

---

## 6. 模块化开发与数据库建表规则

本项目按功能模块逐步开发，数据库也可以在开发过程中按模块逐步建设，不要求一开始一次性建完全部表。

### 6.1 当前模块优先

开发某个功能模块时，应优先保证当前模块可以完整运行、联调和测试。

如果当前模块依赖其他表，应先创建必要的依赖表，例如：

```text
开发产品资料时，可能需要先建 product_categories、products、technical_files、process_routes。
开发工艺路线时，可能需要先建 process_routes、process_route_steps、technical_files、users。
开发生产批次时，可能需要先建 work_orders、production_batches、process_routes、batch_step_records。
开发物料分配时，可能需要先建 products、product_materials、material_batches、batch_material_usages。
开发检验返工时，可能需要先建 production_batches、inspection_records、rework_records。
```

### 6.2 可以先建依赖表，但不能乱改设计

为了保证当前模块开发，可以提前创建当前模块需要依赖的表、字段、索引和外键。

但必须遵守以下规则：

1. 依赖表应优先按最新数据库设计文档创建。
2. 不允许为了当前页面方便，把 n 对 n 关系改成数组、逗号 ID 或 JSON ID 列表。
3. 不允许为了少建表，合并已经明确拆分的核心表。
4. 不允许为了当前模块方便，跳过关键追溯关系。
5. 不允许私自删除审计字段、状态字段和关键外键字段。
6. 如果暂时只用到表的一部分字段，可以先建必要字段，但必须说明后续需要补齐哪些字段。

### 6.3 遇到冲突必须暂停确认

开发过程中如果发现以下情况，必须先找用户确认：

1. 现有数据库设计与当前功能实现冲突。
2. 页面需求与数据库字段无法对应。
3. 当前模块需要新增表或新增关键字段。
4. 当前模块需要修改已有表关系。
5. 当前模块需要调整状态流转。
6. 当前模块需要改变业务流程。
7. 当前模块需要把一期暂不做的功能提前纳入。
8. 实现方式会导致后续追溯链路不完整。

确认时不要只说“有问题”，而应说明：

```text
冲突点是什么
涉及哪些表/字段/页面
按原设计做会有什么影响
调整设计会有什么影响
推荐方案是什么
需要用户确认的问题是什么
```

### 6.4 冲突处理输出格式

遇到冲突时，AI 或开发助手应按以下格式输出：

```text
发现一个设计冲突：

冲突位置：
- 模块：
- 页面：
- 涉及表：
- 涉及字段/关系：

当前设计：
-

当前开发需求：
-

冲突原因：
-

可选方案：
方案 A：按现有设计实现
影响：

方案 B：局部调整设计
影响：

方案 C：重新设计该关系
影响：

建议：
-

需要你确认：
-
```

### 6.5 建表顺序建议

按模块开发时，推荐使用以下建表顺序：

```text
1. 系统基础表
users / departments / roles / permissions / user_roles / role_permissions / logs

2. 产品与文件基础表
product_categories / products / technical_files

3. 工艺基础表
process_routes / process_route_steps / product_materials / route_step_materials

4. 物料批次与库存台账
material_batches / batch_material_usages

5. 工单与生产批次
work_orders / production_batches / batch_step_records

6. 质量闭环
inspection_records / rework_records

7. 成品流转
finished_flow_records
```

说明：实际开发时可以根据当前模块提前创建依赖表，但不能破坏上述关系逻辑。


## 7. 关系建模规则

### 6.1 n 对 n 必须使用中间表

不要在主表中保存数组、逗号分隔 ID 或 JSON ID 列表。

正确示例：

```text
users <-> roles
使用 user_roles

roles <-> permissions
使用 role_permissions

process_route_steps <-> product_materials
使用 route_step_materials
```

### 6.2 自关联设计

`product_materials` 是 `products` 的自关联表。

含义：

```text
product_id            表示哪个产品
material_product_id   表示这个产品需要哪种物料
```

不要为原材料、半成品、外购件另建一套独立物料主表，除非后续明确升级为完整库存系统。

### 6.3 报工记录

`batch_step_records` 是生产批次和工序明细之间的业务记录表。

不要额外新增“批次-工序关联表”。

### 6.4 物料预留与使用

`batch_material_usages` 用于记录生产批次与物料批次之间的预留和实际使用。

建议字段语义：

```text
reserved_quantity   预留数量
used_quantity       实际使用数量
status              reserved / part_used / used / cancelled
```

不要为了轻量预留单独创建完整库存预留表，除非后续明确要做完整仓储。

### 6.5 检验与返工

检测记录按生产批次产生：

```text
production_batches 1 -> n inspection_records
```

返工记录只关联检测记录：

```text
inspection_records 1 -> n rework_records
```

返工需要查询生产批次时，通过：

```text
rework_records.source_inspection_id -> inspection_records.batch_id
```

---

## 8. 审计字段规则

业务核心表建议统一包含：

```text
created_by
created_at
updated_by
updated_at
is_deleted
deleted_by
deleted_at
```

说明：

- `logs` 表记录详细操作流水。
- 审计字段记录当前数据的创建、更新、软删除状态。
- 两者不冲突。

纯关联表可以简化为：

```text
created_by
created_at
remark
```

例如：

- user_roles
- role_permissions

---

## 9. API 设计规则

### 8.1 REST 路径

建议使用模块化 REST 风格：

```text
/system/users
/system/roles
/system/logs

/product/products
/product/categories
/product/processes
/product/routes

/warehouse/inventory
/warehouse/transactions

/production/orders
/production/tasks
/production/material-allocation
/production/dispatch
/production/reports

/quality/inspections
/quality/reworks
```

### 8.2 操作命名

常见动作：

```text
create
update
delete
enable
disable
submit
release
close
cancel
assign
confirm
upload
export
```

业务动作 API 应使用明确语义，例如：

```text
POST /production/orders/:id/release
POST /production/tasks/:id/generate-materials
POST /production/tasks/:id/assign-materials
POST /production/tasks/:id/dispatch
POST /production/tasks/:id/start
POST /production/tasks/:id/finish
POST /quality/inspections/:id/create-rework
```

---

## 10. 权限规则

系统采用 RBAC：

```text
users
roles
permissions
user_roles
role_permissions
```

权限建议粒度：

```text
module:action
```

示例：

```text
system:user:view
system:user:create
product:product:update
production:order:release
quality:inspection:create
warehouse:inventory:adjust
```

前端控制菜单可见性和按钮可见性。  
后端必须实际校验接口权限和业务动作权限，不能只依赖前端隐藏按钮。

---

## 11. 一期不做内容

AI 和开发人员不要主动扩展以下功能：

- 完整 MES 排产
- 设备采集
- 扫码过站
- 完整 ERP
- 财务、采购、销售、成本核算
- 完整仓库锁库系统
- 复杂领料审批
- 自动派工算法
- 工资绩效
- 复杂报表大屏
- 单件级全流程追溯

如用户明确要求，再另行设计。

---

## 12. 代码生成要求

需要有清楚的注释说明

### 11.1 前端代码

1. 组件应可复用。
2. 表格页结构保持统一。
3. 弹窗表单组件应拆分清楚。
4. API 调用集中放在 `api` 目录。
5. 状态字典集中维护。
6. 不在页面里硬编码大量状态颜色。

### 11.2 后端代码

1. 使用模块化结构。
2. DTO、Entity、Service、Controller 分离。
3. 权限使用统一 Guard。
4. 业务操作写日志。
5. 软删除不要物理删除业务数据。
6. 状态流转要校验，不允许随意跳状态。

---

## 13. 开发输出规则

当 AI 生成代码或方案时，应优先说明：

1. 改了哪些文件
2. 新增了哪些组件或接口
3. 影响哪些模块
4. 是否涉及数据库变更
5. 是否需要迁移脚本
6. 是否符合 `design.md`

不要只给零散代码片段。

---

## 14. 文档边界

本文件只描述项目级开发规则和 AI 协作规则。

以下内容不放在本文件：

- 视觉颜色和页面 UI 细节，放 `design.md`
- 数据库完整字段，放数据库设计文档
- 业务需求详述，放需求说明书
- SEO 或官网内容规则，放对应 Skill
