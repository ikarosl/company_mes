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
  warehouseItems: '/warehouse/items',
  warehouseInventory: '/warehouse/inventory',
  warehouseInboundOrders: '/warehouse/inbound-orders',
  warehouseOutboundOrders: '/warehouse/outbound-orders',
  warehouseReturnOrders: '/warehouse/return-orders',
  warehouseScraps: '/warehouse/scraps',
  warehouseStockChecks: '/warehouse/stock-checks',
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

export const WAREHOUSE_API = {
  items: {
    root: BUSINESS_API.warehouseItems,
    detail: (id: string) => `${BUSINESS_API.warehouseItems}/${id}`,
    typeOptions: `${BUSINESS_API.warehouseItems}/types/options`,
    enable: (id: string) => `${BUSINESS_API.warehouseItems}/${id}/enable`,
    disable: (id: string) => `${BUSINESS_API.warehouseItems}/${id}/disable`,
  },
  inventory: {
    root: BUSINESS_API.warehouseInventory,
    detail: (id: string) => `${BUSINESS_API.warehouseInventory}/${id}`,
    available: `${BUSINESS_API.warehouseInventory}/available`,
    reserved: `${BUSINESS_API.warehouseInventory}/reserved`,
    stocktake: (id: string) => `${BUSINESS_API.warehouseInventory}/${id}/stocktake`,
    enable: (id: string) => `${BUSINESS_API.warehouseInventory}/${id}/enable`,
    disable: (id: string) => `${BUSINESS_API.warehouseInventory}/${id}/disable`,
  },
  inboundOrders: {
    root: BUSINESS_API.warehouseInboundOrders,
    detail: (id: string) => `${BUSINESS_API.warehouseInboundOrders}/${id}`,
    confirm: (id: string) => `${BUSINESS_API.warehouseInboundOrders}/${id}/confirm`,
    cancel: (id: string) => `${BUSINESS_API.warehouseInboundOrders}/${id}/cancel`,
  },
  outboundOrders: {
    root: BUSINESS_API.warehouseOutboundOrders,
    detail: (id: string) => `${BUSINESS_API.warehouseOutboundOrders}/${id}`,
    pick: (id: string) => `${BUSINESS_API.warehouseOutboundOrders}/${id}/pick`,
    confirm: (id: string) => `${BUSINESS_API.warehouseOutboundOrders}/${id}/confirm`,
    cancel: (id: string) => `${BUSINESS_API.warehouseOutboundOrders}/${id}/cancel`,
  },
  returnOrders: {
    root: BUSINESS_API.warehouseReturnOrders,
    detail: (id: string) => `${BUSINESS_API.warehouseReturnOrders}/${id}`,
    confirmInbound: (id: string) => `${BUSINESS_API.warehouseReturnOrders}/${id}/confirm-inbound`,
    confirmScrap: (id: string) => `${BUSINESS_API.warehouseReturnOrders}/${id}/confirm-scrap`,
    cancel: (id: string) => `${BUSINESS_API.warehouseReturnOrders}/${id}/cancel`,
  },
  scraps: {
    root: BUSINESS_API.warehouseScraps,
    detail: (id: string) => `${BUSINESS_API.warehouseScraps}/${id}`,
    confirm: (id: string) => `${BUSINESS_API.warehouseScraps}/${id}/confirm`,
    cancel: (id: string) => `${BUSINESS_API.warehouseScraps}/${id}/cancel`,
  },
  stockChecks: {
    root: BUSINESS_API.warehouseStockChecks,
    detail: (id: string) => `${BUSINESS_API.warehouseStockChecks}/${id}`,
    complete: (id: string) => `${BUSINESS_API.warehouseStockChecks}/${id}/complete`,
    adjust: (id: string) => `${BUSINESS_API.warehouseStockChecks}/${id}/adjust`,
    cancel: (id: string) => `${BUSINESS_API.warehouseStockChecks}/${id}/cancel`,
  },
} as const;
