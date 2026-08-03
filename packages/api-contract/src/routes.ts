/** 认证模块 API 路径。 */
export const AUTH_API = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  validate: '/auth/validate',
} as const;

/** 系统管理模块 API 路径。 */
export const SYSTEM_API = {
  users: '/system/users',
  departmentOptions: '/system/departments/options',
  roleOptions: '/system/roles/options',
  roles: '/system/roles',
  permissions: '/system/permissions',
  logs: '/system/logs',
} as const;

/** 生产业务模块 API 路径。 */
export const BUSINESS_API = {
  products: '/products',
  productCategories: '/product-categories',
  processes: '/processes',
  routes: '/routes',
  warehouseInventory: '/warehouse/inventory',
  warehouseStocktakes: '/warehouse/stocktakes',
  warehouseFinishedTransactions: '/warehouse/finished-transactions',
  warehouseMaterialTransactions: '/warehouse/material-transactions',
  orders: '/orders',
  tasks: '/tasks',
  materialAllocation: '/material-allocation',
  dispatch: '/dispatch',
  executionRecords: '/execution-records',
  qualityInspections: '/quality/inspections',
  qualityReworks: '/quality/reworks',
  workerTasks: '/worker/tasks',
  inspectorTasks: '/inspector/tasks',
  trace: '/trace',
} as const;
