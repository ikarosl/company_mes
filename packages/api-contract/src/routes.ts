export const AUTH_API = {
  login: '/auth/login',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  me: '/auth/me',
  validate: '/auth/validate',
} as const;

export const SYSTEM_API = {
  users: '/system/users',
  departmentOptions: '/system/departments/options',
  roleOptions: '/system/roles/options',
  roles: '/system/roles',
  permissions: '/system/permissions',
  logs: '/system/logs',
} as const;

export const BUSINESS_API = {
  products: '/products',
  productCategories: '/product-categories',
  processes: '/processes',
  routes: '/routes',
  warehouseInventory: '/warehouse/inventory',
  warehouseTransactions: '/warehouse/transactions',
  orders: '/orders',
  tasks: '/tasks',
  materialAllocation: '/material-allocation',
  dispatch: '/dispatch',
  executionRecords: '/execution-records',
  qualityInspections: '/quality/inspections',
  qualityReworks: '/quality/reworks',
  workerTasks: '/worker/tasks',
  inspectorTasks: '/inspector/tasks',
} as const;
