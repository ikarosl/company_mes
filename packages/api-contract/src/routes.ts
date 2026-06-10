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
  operationLogs: '/system/operation-logs',
} as const;

export const BUSINESS_API = {
  technicalDocuments: '/technical-documents',
  processTemplates: '/process-templates',
  productionTasks: '/production-tasks',
  productionBatches: '/production-batches',
  batchStepRecords: '/batch-step-records',
  inspections: '/inspections',
  reworks: '/reworks',
  storageShipments: '/storage-shipments',
  materialBatches: '/material-batches',
  batchMaterialUsages: '/batch-material-usages',
  trace: '/trace',
} as const;
