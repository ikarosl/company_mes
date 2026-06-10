import { PERMISSIONS } from '@company/constants';
import type { RouteRecordRaw } from 'vue-router';
import AdminLayout from '../views/AdminLayout.vue';
// import BatchStepExecutionPage from '../views/BatchStepExecutionPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
// import InspectionReworkPage from '../views/InspectionReworkPage.vue';
import LoginPage from '../views/LoginPage.vue';
// import MaterialBatchesPage from '../views/MaterialBatchesPage.vue';
import NoPermissionPage from '../views/NoPermissionPage.vue';
import OperationLogsPage from '../views/OperationLogsPage.vue';
import PlannedBlankPage from '../views/PlannedBlankPage.vue';
// import ProcessTemplatesPage from '../views/ProcessTemplatesPage.vue';
// import ProductionBatchDetailPage from '../views/ProductionBatchDetailPage.vue';
// import ProductionBatchesPage from '../views/ProductionBatchesPage.vue';
// import ProductionTasksPage from '../views/ProductionTasksPage.vue';
// import StorageShipmentPage from '../views/StorageShipmentPage.vue';
import SystemPermissionsPage from '../views/SystemPermissionsPage.vue';
import SystemRolesPage from '../views/SystemRolesPage.vue';
import SystemUsersPage from '../views/SystemUsersPage.vue';
// import TraceQueryPage from '../views/TraceQueryPage.vue';

const plannedPage = (
  path: string,
  name: string,
  title: string,
  section: string,
  operations: string[] = ['查看'],
  permission?: string,
  description: string = '页面结构已预留，后续根据接口实现补充表格、表单和操作流程。',
): RouteRecordRaw => ({
  path,
  name,
  component: PlannedBlankPage,
  meta: {
    title,
    section,
    operations,
    permission,
    description,
  },
});

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage,
        meta: { title: '首页', permission: PERMISSIONS.dashboard.page },
      },

      {
        path: 'system/users',
        name: 'system-users',
        component: SystemUsersPage,
        meta: { title: '用户管理', section: '系统管理', permission: PERMISSIONS.system.users.page },
      },
      {
        path: 'system/roles',
        name: 'system-roles',
        component: SystemRolesPage,
        meta: { title: '角色管理', section: '系统管理', permission: PERMISSIONS.system.roles.page },
      },
      {
        path: 'system/permissions',
        name: 'system-permissions',
        component: SystemPermissionsPage,
        meta: {
          title: '权限管理',
          section: '系统管理',
          permission: PERMISSIONS.system.permissions.page,
        },
      },
      {
        path: 'system/logs',
        name: 'system-logs',
        component: OperationLogsPage,
        meta: { title: '日志管理', section: '系统管理', permission: PERMISSIONS.system.logs.page },
      },

      plannedPage(
        'warehouse/inventory',
        'warehouse-inventory',
        '库存管理',
        '仓储管理',
        ['查看库存', '新增入库', '出库', '发运', '退料', '查看出入库记录'],
        PERMISSIONS.warehouse.inventory.page,
      ),
      plannedPage(
        'warehouse/transactions',
        'warehouse-transactions',
        '出入库管理',
        '仓储管理',
        ['入库', '出库', '发运', '退料', '查看出入库记录'],
        PERMISSIONS.warehouse.transactions.page,
      ),

      plannedPage(
        'product/processes',
        'product-processes',
        '生产工序管理',
        '产品管理',
        ['查看', '新增', '编辑', '启停', '上传工序文件'],
        PERMISSIONS.product.processes.page,
      ),
      plannedPage(
        'product/categories',
        'product-categories',
        '产品分类管理',
        '产品管理',
        ['查看', '新增', '编辑', '启停', '配置规格参数'],
        PERMISSIONS.product.categories.page,
      ),
      plannedPage(
        'product/products',
        'product-products',
        '产品信息管理',
        '产品管理',
        ['查看', '新增', '编辑', '启停', '维护规格参数', '绑定默认工艺路线', '维护产品用料清单'],
        PERMISSIONS.product.products.page,
      ),
      plannedPage(
        'product/routes',
        'product-routes',
        '工艺路线',
        '产品管理',
        ['查看', '新增', '编辑', '删除', '启停', '配置工序顺序'],
        PERMISSIONS.product.routes.page,
      ),
      plannedPage(
        'product/products/:id/materials',
        'product-product-materials',
        '产品用料清单',
        '产品管理',
        ['查看', '新增', '编辑', '删除', '设置单位用量', '设置关键物料', '设置是否记录批次'],
        PERMISSIONS.product.products.configBom,
      ),

      plannedPage(
        'production/orders',
        'production-orders',
        '工单管理',
        '生产管理',
        ['查看', '新增', '编辑', '保存草稿', '下达工单', '关闭工单', '取消工单'],
        PERMISSIONS.production.orders.page,
      ),
      plannedPage(
        'production/tasks',
        'production-tasks',
        '任务管理',
        '生产管理',
        [
          '查看',
          '新增任务',
          '编辑任务',
          '生成物料需求',
          '分配物料',
          '派工',
          '开始生产',
          '完成生产',
          '创建返工',
          '查看追溯',
          '跳转入库',
        ],
        PERMISSIONS.production.tasks.page,
      ),
      plannedPage(
        'production/orders/:id/tasks',
        'production-order-tasks',
        '分配生产任务',
        '生产管理',
        ['查看', '新增任务', '编辑任务', '生成物料需求', '立即分配物料'],
        PERMISSIONS.production.orders.tasks.view,
      ),
      // plannedPage(
      //   'production/material-requirements',
      //   'production-material-requirements',
      //   '物料需求管理',
      //   '生产管理',
      //   ['查看', '生成物料需求', '查看缺料情况', '分配物料', '查看分配明细'],
      // ),
      plannedPage(
        'production/material-allocation',
        'production-material-allocation',
        '物料分配',
        '生产管理',
        ['查看', '分配物料', '确认齐套', '确认出库', '退料', '查看物料批次'],
        PERMISSIONS.production.materialAllocation.page,
      ),
      plannedPage(
        'production/dispatch',
        'production-dispatch',
        '派工管理',
        '生产管理',
        ['查看', '派工', '改派', '一键按默认派工', '清除全部派工'],
        PERMISSIONS.production.tasks.dispatch,
      ),
      plannedPage(
        'production/execution-records',
        'production-execution-records',
        '生产执行记录',
        '生产管理',
        ['查看', '开始生产', '填写完成数量', '填写不合格数量', '上传文件', '完成生产', '记录异常'],
        PERMISSIONS.production.tasks.start,
      ),

      plannedPage(
        'quality/inspections',
        'quality-inspections',
        '检验记录',
        '质量管理',
        ['查看', '新增', '编辑', '查看详情', '上传检测文件', '创建返工', '确认合格入库'],
        PERMISSIONS.quality.inspections.page,
      ),
      plannedPage(
        'quality/reworks',
        'quality-reworks',
        '返工记录',
        '质量管理',
        ['查看', '新增', '编辑', '分配返工负责人', '填写返工结果', '返工后重新检验'],
        PERMISSIONS.quality.reworks.page,
      ),

      plannedPage(
        'production/orders/:id/complete',
        'production-order-complete',
        '工单完工',
        '生产管理',
        ['查看完工汇总', '确认完工', '关闭工单'],
        PERMISSIONS.production.orders.close,
      ),

      // {
      //   path: 'trace/forward',
      //   name: 'trace-forward',
      //   component: TraceQueryPage,
      //   meta: { title: '正向追溯', section: '追溯中心', permission: PERMISSIONS.trace.page },
      // },
      // plannedPage('trace/backward', 'trace-backward', '逆向追溯', '追溯中心', [
      //   '按工单查询',
      //   '按生产批次查询',
      //   '按产品型号查询',
      //   '查看完整链路',
      // ]),

      plannedPage(
        'worker/tasks',
        'worker-tasks',
        '我的任务',
        '员工端',
        ['查看我的任务', '查看当前工序', '查看SOP', '开始生产', '提交完成'],
        PERMISSIONS.worker.tasks.page,
      ),
      plannedPage(
        'inspector/tasks',
        'inspector-tasks',
        '检测任务',
        '检测端',
        ['查看待检测任务', '查看规格书', '填写检测结果', '上传检测文件', '创建返工记录'],
        PERMISSIONS.inspector.tasks.page,
      ),

      // plannedPage('reports/order-progress', 'reports-order-progress', '工单进度报表', '报表管理', [
      //   '查看',
      //   '按状态筛选',
      //   '按负责人筛选',
      //   '按时间筛选',
      // ]),
      // plannedPage('reports/task-progress', 'reports-task-progress', '生产任务报表', '报表管理', [
      //   '查看',
      //   '查看任务状态',
      //   '查看完成数量',
      //   '查看不合格数量',
      // ]),
      // plannedPage(
      //   'reports/inventory-records',
      //   'reports-inventory-records',
      //   '库存流水报表',
      //   '报表管理',
      //   ['查看', '按物料筛选', '按批次筛选', '按出入库类型筛选'],
      // ),

      {
        path: 'no-permission',
        name: 'no-permission',
        component: NoPermissionPage,
        meta: { title: '无权限' },
      },
    ],
  },
];
