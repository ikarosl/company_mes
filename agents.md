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
- 产品/半成品库存流转记录
- 库存盘点与报废事实记录
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

### 2.4 公共类型与接口契约

项目中前后端共用的类型、接口契约、状态枚举、字典值应统一放在公共包中。

推荐目录：

```text
packages/api-contract
  src
    common
    system
    product
    warehouse
    production
    quality
```

说明：

- 如果当前项目已命名为 `api-contact`，可以沿用现有目录名，但语义上应作为 `api-contract` 使用。
- 前后端都会使用的接口类型、分页类型、响应类型、状态枚举，放在公共包。
- 只服务于前端页面展示的类型，放在 `apps/admin-web/src/types`。
- 只服务于后端数据库、DTO、Entity、Service 的类型，放在 `apps/backend` 内。
- 不允许为了方便把后端 Entity 直接作为前端页面类型使用。

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
  material-batches
  product-inventory
  product-flows
  stocktakes
  scraps

production
  orders
  batches
  material-demands
  material-allocation
  reports

quality
  inspections
  reworks
```

员工端、检测端可以作为前期测试页面，但不作为管理端主线。  
追溯中心和报表管理一期可暂不实现，除非需求明确要求。

---

## 4. 代码注释与可读性规则（必须执行）

前端和后端代码都必须包含必要注释。注释不是可选项，生成或修改代码时必须同步补充。注释必须写在实际代码附近，不能只在回答说明里说“已添加注释”。

### 4.1 注释覆盖范围

必须添加注释的位置：

1. **变量 / 常量注释**：业务含义不明显的变量、状态变量、枚举值、数量字段、状态字段必须说明用途。
2. **类型 / 接口 / DTO 注释**：接口入参、响应类型、DTO 字段、公共枚举需要说明业务含义。
3. **关键逻辑块注释**：新增、编辑、删除、分配、派工、提交、检验、返工、入库、出库、状态流转等业务逻辑块必须有块级注释。
4. **复杂计算注释**：物料需求、库存可用量、预留数量、已用数量、工单剩余数量、状态汇总等计算必须写明公式。
5. **数据库 / SQL 注释**：复杂 SQL、联表查询、聚合统计、事务锁定、`FOR UPDATE` 查询必须说明查询目的和锁定原因。
6. **异常处理注释**：业务异常、权限异常、状态不允许变更、库存不足等判断要说明原因。

不要求给每一行都写注释，但不允许出现整段业务代码完全没有注释。

### 4.2 前端注释要求

前端代码至少应包含以下注释：

```ts
// 查询条件：用于列表筛选，不直接作为接口参数提交，提交前需要格式化时间范围
const searchForm = reactive<SearchForm>({});

// 物料分配弹窗状态：用于控制弹窗显示和当前操作的生产批次
const allocationDialog = reactive({
  visible: false,
  batchId: undefined as number | undefined,
});

/**
 * 提交物料分配
 * 1. 校验本次分配数量
 * 2. 调用后端分配接口
 * 3. 成功后提示并刷新列表
 */
async function handleSubmitAllocation() {
  // ...
}
```

要求：

1. 页面级状态、弹窗状态、表单对象、枚举字典必须说明用途。
2. 关键事件方法必须有块级注释或 JSDoc 注释。
3. 涉及数量、状态、权限、接口调用的代码必须说明业务含义。
4. 不允许只写 `// TODO`、`// fix` 这类没有业务含义的注释。

### 4.3 后端注释要求

后端代码至少应包含以下注释：

```ts
/** 创建生产批次请求参数 */
export class CreateProductionBatchDto {
  /** 工单 ID：用于校验该批次数量不能超过工单剩余数量 */
  workOrderId: number;

  /** 本次生成的生产批次数量 */
  batchQuantity: number;
}

/**
 * 生成生产批次
 * 1. 锁定工单，防止多人同时拆批导致数量超出
 * 2. 校验剩余可分配数量
 * 3. 创建 production_batches
 * 4. 按工艺路线生成 batch_step_records
 */
async createBatch(dto: CreateProductionBatchDto, userId: number) {
  // ...
}
```

要求：

1. DTO 字段必须写清楚业务用途。
2. Service 中关键业务方法必须有整体步骤说明。
3. Repository 中复杂 SQL 必须说明用途。
4. 事务、锁、状态机、库存扣减、软删除必须写块级注释。
5. 不允许生成无注释的 Service / Repository / Controller 业务代码。

### 4.4 注释交付检查

AI 或开发人员交付代码前必须自查：

```text
是否有变量/字段注释
是否有 DTO/接口/枚举注释
是否有关键业务块注释
是否有复杂计算公式说明
是否有 SQL/事务/锁说明
是否存在整段无注释的业务代码
```

## 5. UI 开发规则

UI 实现必须遵守 `design.md`。

关键约束：

1. 管理端使用左侧菜单 + 顶部栏 + 内容区结构。
2. 新增、编辑、分配、确认等操作统一使用弹窗 Modal。
3. 不使用抽屉 Drawer 作为主要交互方式。
4. 表格优先，详情通过弹窗展示。
5. 状态标签、按钮颜色、表单布局必须遵守 `design.md`。
6. 页面不要做大屏炫酷风，不要做官网展示风。
7. 页面目录和功能以管理端为主。
8. 所有业务操作必须有明确反馈提示，不允许点击后无提示、失败无提示或静默失败。

### 5.1 前端交互提示规则

前端操作反馈统一使用 `EMessage`。如果项目尚未封装 `EMessage`，应先封装一个统一消息工具，再由该工具内部调用 Element Plus 的 `ElMessage`。

必须提示的操作包括：

```text
新增 / 编辑 / 删除 / 启用 / 禁用 / 分配 / 改派 / 确认 / 提交 / 取消 / 关闭 / 上传 / 下载 / 导出 / 导入
```

成功提示示例：

```ts
EMessage.success('保存成功');
EMessage.success('分配成功');
EMessage.success('提交成功');
```

失败提示示例：

```ts
EMessage.error(error?.message || '操作失败，请稍后重试');
EMessage.error('物料可用数量不足，分配失败');
```

前端要求：

1. 接口调用成功后必须给出成功提示，除非该操作只是静默查询列表数据。
2. 接口调用失败后必须给出失败提示。
3. 表单校验失败应提示明确字段或原因。
4. 删除、关闭、取消、状态流转等高风险操作必须二次确认。
5. 列表刷新、弹窗关闭、表单重置等动作应在成功后执行，不应在接口失败时提前执行。

---

## 6. 数据库与 SQL 文件规则

数据库设计以**最新数据库设计文档**和当前 SQL 文件为准。  
`agents.md` 不维护完整表清单、完整字段清单、完整视图清单或频繁变化的状态字典，避免规则文档与真实数据库不同步。

### 6.1 数据库设计依据

开发时必须遵守以下原则：

1. 以最新数据库设计文档为业务依据。
2. 以 `docs/sql_tables` 和 `docs/sql_views` 中的 SQL 文件作为当前最终结构依据。
3. 不要根据旧截图、旧聊天记录、旧迁移文件猜测当前表结构。
4. 不要在 `agents.md` 中补写具体字段定义；字段变化应改数据库设计文档和对应 SQL 文件。
5. 如确实需要新增表、删表、改字段或新增视图，必须说明业务原因、影响范围、替代方案，以及是否会使系统变重。

### 6.2 SQL 目录约定

SQL 文件按最终结果组织，不再用零散改动文件记录每次变化。

推荐目录：

```text
docs
  sql_legacy
  sql_tables
  sql_views

company_test_lastest.sql
```

说明：

| 路径/文件                  | 用途             | 规则                                                                        |
| -------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `docs/sql_legacy`          | 历史备份         | 仅作为旧版本备份，不作为当前开发依据；AI 默认不要读取、修改或新增该目录文件 |
| `docs/sql_tables`          | 建表 SQL         | 每个数据表一个最终版建表 SQL 文件                                           |
| `docs/sql_views`           | 建视图 SQL       | 每个数据库视图一个最终版建视图 SQL 文件                                     |
| `company_test_lastest.sql` | 最新完整测试数据 | 保留当前系统可用的完整测试数据，不再拆分多个种子或变更数据 SQL              |

### 6.3 SQL 输出规则

生成或修改 SQL 时必须遵守：

1. **只输出最终状态 SQL**，不要新增按日期命名的改动脚本。
2. 不再生成类似 `20260622_xxx.sql`、`add_xxx.sql`、`sync_xxx.sql`、`expand_xxx.sql` 这类过程型 SQL。
3. 建表变化只更新 `docs/sql_tables` 下对应表文件。
4. 视图变化只更新 `docs/sql_views` 下对应视图文件。
5. 测试数据变化只更新 `company_test_lastest.sql`。
6. `docs/sql_legacy` 只保留备份，不参与当前 SQL 输出。
7. 如果需要完整初始化数据库，应由当前建表 SQL、当前建视图 SQL 和 `company_test_lastest.sql` 组成，不依赖历史改动文件。
8. SQL 文件必须使用 UTF-8 保存，并保持 `SET NAMES utf8mb4;` 或等效字符集处理。

### 6.4 禁止写入本文件的内容

以下内容不要放进 `agents.md`：

- 完整数据表字段定义
- 完整视图 SQL
- 完整测试数据
- 频繁变化的枚举字典明细
- 临时迁移步骤
- 按日期记录的数据库改动历史
- 某一次开发任务的临时 SQL 文件名

这些内容应分别放在数据库设计文档、`docs/sql_tables`、`docs/sql_views` 和 `company_test_lastest.sql` 中。

---

## 7. 中文编码与乱码检查规则（必须执行）

本项目存在中文页面文案、中文数据库备注、中文枚举标签、中文导入导出内容。所有代码、SQL、页面、接口和导出文件必须避免中文乱码。编码检查必须作为交付前检查项写入输出说明，不能只在规则顶部简单提一句。

### 7.1 基础编码要求

1. 所有源码文件、Markdown、SQL、JSON、TS、Vue 文件默认使用 `UTF-8` 保存。
2. MySQL 数据库、数据表和中文字段建议使用 `utf8mb4` 字符集。
3. MySQL 连接必须显式支持 `utf8mb4`。
4. 前端页面必须保持 UTF-8，不允许出现中文显示为问号、方块或乱码。
5. 接口返回 JSON 应使用 UTF-8 编码。
6. 导入导出文件如 CSV 面向 Excel 使用时，优先使用 `UTF-8 with BOM`，避免 Excel 打开乱码。

### 7.2 数据库与 SQL 要求

数据库初始化和迁移脚本应明确字符集，例如：

```sql
CREATE DATABASE IF NOT EXISTS company_mes
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

SET NAMES utf8mb4;
```

建表时如涉及中文备注或中文种子数据，必须确认 SQL 文件本身为 UTF-8 编码。

不允许提交包含以下乱码痕迹的 SQL 或种子数据：

```text
�
æ
ä¸
å
ç
????
```

### 7.3 前端页面要求

1. 页面中文标题、按钮、表格列名、状态标签、表单校验提示必须显示为正常中文。
2. 不允许把乱码内容硬编码到 Vue、TS、JSON 或字典文件里。
3. 状态枚举建议分离为英文值 + 中文 label，例如：

```ts
/** 生产批次状态中文标签 */
export const BatchStatusLabel = {
  pending: '待开始',
  doing: '生产中',
  completed: '已完成',
};
```

### 7.4 后端接口要求

1. 后端返回的中文错误信息、成功提示、导出内容必须保持 UTF-8。
2. NestJS 全局响应、异常过滤器、导出接口应避免编码丢失。
3. 不允许接口返回乱码中文给前端再由前端兜底修复。

### 7.5 交付前乱码检查

每次生成或修改以下内容后，都必须检查乱码：

```text
数据库 SQL / 建表文件 / 视图文件 / 测试数据文件
Vue 页面文案
TypeScript 枚举 label
后端错误信息
接口响应消息
导入导出文件
Markdown 文档
```

交付前必须自查：

```text
是否使用 UTF-8 保存文件
SQL 是否包含 SET NAMES utf8mb4 或数据库连接是否指定 utf8mb4
页面中文是否正常显示
接口中文 message 是否正常
是否搜索过 � / æ / ä¸ / å / ç / ???? 等乱码特征
导出文件是否能被 Excel 正常打开中文
```

## 8. 关系建模规则

### 8.1 n 对 n 必须使用中间表

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

### 8.2 自关联设计

`product_materials` 是 `products` 的自关联表。

含义：

```text
product_id            表示哪个产品
material_product_id   表示这个产品需要哪种物料
```

不要为物料、半成品、外购件另建一套独立物料主表，除非后续明确升级为完整库存系统。

### 8.3 报工记录

`batch_step_records` 是生产批次和工序明细之间的业务记录表。

不要额外新增“批次-工序关联表”。

### 8.4 物料需求、预留、领料与退料

物料需求和物料操作分开建模：

```text
batch_material_requirement   记录生产批次的计划物料需求
batch_material_usages        记录预留、取消预留、领料、退料等操作过程
material_batches             保存物料库存批次当前数量
```

核心口径：

```text
reserve    预留，不扣 material_batches.quantity
unreserve  取消预留，不改 material_batches.quantity
issue      领料，减少 material_batches.quantity
return     退料，增加 material_batches.quantity
```

不要为了轻量预留单独创建完整库存预留表，除非后续明确要做完整仓储。  
复杂统计优先通过 `docs/sql_views` 中的视图实现，不要在多个 Service 中重复手写不同口径。

### 8.5 产品库存、盘点与报废

产品/半成品库存和物料库存分开建模：

```text
product_inventory_batches   保存成品/半成品当前库存
product_flow_records        记录成品/半成品入库、出库、退回、调整等流转
inventory_stocktakes        记录物料、成品、半成品盘点与调账依据
scrap_records               记录物料、半成品、成品报废事实
```

核心口径：

```text
库存表保存当前数量。
操作表记录变化过程。
盘点表作为调账依据。
报废表记录报废事实。
```

库存调整、领料、退料、产品出入库、盘点确认、库存内报废必须由后端事务保证“写记录 + 更新库存”一致完成。

### 8.6 检验与返工

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

## 9. 审计字段规则

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

## 10. API 设计规则

### 10.1 REST 路径

建议使用模块化 REST 风格。以下路径是模块划分示例，不作为固定接口清单；具体接口以当前后端路由和 API 契约为准。

```text
/system/users
/system/roles
/system/logs

/product/products
/product/categories
/product/processes
/product/routes

/warehouse/material-batches
/warehouse/product-inventory
/warehouse/product-flows
/warehouse/stocktakes
/warehouse/scraps

/production/orders
/production/batches
/production/material-demands
/production/material-allocation
/production/reports

/quality/inspections
/quality/reworks
```

### 10.2 操作命名

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
POST /production/batches/:id/generate-material-demands
POST /production/batches/:id/reserve-materials
POST /production/batches/:id/issue-materials
POST /production/batches/:id/return-materials
POST /warehouse/product-flows
POST /warehouse/stocktakes/:id/adjust
POST /quality/inspections/:id/create-rework
```

---

## 11. 权限规则

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

## 12. 一期不做内容

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

## 13. 代码生成要求

代码生成必须同时满足“可运行、可读、可维护”。不得只追求功能可跑而忽略注释、提示、统一响应和中文编码。

### 13.1 前端代码

1. 组件应可复用。
2. 表格页结构保持统一。
3. 弹窗表单组件应拆分清楚。
4. API 调用集中放在 `api` 目录。
5. 状态字典集中维护。
6. 不在页面里硬编码大量状态颜色。
7. 变量、表单对象、弹窗状态、业务方法必须添加必要注释。
8. 新增、编辑、删除、分配、确认、提交、上传、导出等操作必须使用 `EMessage` 提示成功或失败。
9. 页面中文文案、状态标签、校验提示必须检查乱码。

### 13.2 后端代码

1. 使用模块化结构。
2. DTO、Entity、Service、Controller 分离。
3. 权限使用统一 Guard。
4. 业务操作写日志。
5. 软删除不要物理删除业务数据。
6. 状态流转要校验，不允许随意跳状态。
7. DTO、枚举、关键变量、Service 业务块、Repository 复杂 SQL 必须添加必要注释。
8. 接口返回必须走统一响应格式，不允许 Controller 随意返回多种结构。
9. 后端中文错误信息、日志信息、SQL 种子数据必须检查乱码。

---

## 14. 开发输出规则

当 AI 生成代码或方案时，应优先说明：

1. 改了哪些文件
2. 新增了哪些组件或接口
3. 影响哪些模块
4. 是否涉及数据库变更
5. 如涉及 SQL，是否只更新 `docs/sql_tables`、`docs/sql_views` 或 `company_test_lastest.sql` 的最终版文件
6. 是否避免新增过程型、日期型、补丁型 SQL 文件
7. 是否符合 `design.md`
8. 是否已添加变量/字段注释、DTO/类型注释、关键业务块注释、复杂 SQL/计算注释
9. 是否已处理前端成功/失败 `EMessage` 提示
10. 是否使用后端统一响应格式
11. 是否已检查 SQL、页面、接口、导入导出中的中文编码和乱码风险
12. 是否已搜索并排除 `�`、`æ`、`ä¸`、`å`、`ç`、`????` 等乱码特征
13. 公共类型是否放在 `packages/api-contract`

不要只给零散代码片段。

---

## 15. 文档边界

本文件只描述项目级开发规则和 AI 协作规则。

以下内容不放在本文件：

- 视觉颜色和页面 UI 细节，放 `design.md`
- 数据库完整字段，放数据库设计文档
- 建表 SQL，放 `docs/sql_tables`
- 建视图 SQL，放 `docs/sql_views`
- 最新完整测试数据，放 `company_test_lastest.sql`
- 业务需求详述，放需求说明书
- SEO 或官网内容规则，放对应 Skill
