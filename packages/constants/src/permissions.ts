export const PERMISSIONS = {
  dashboard: {
    page: 'dashboard:page',
  },
  system: {
    page: 'system:page',
    users: {
      page: 'system:users:page',
      view: 'system:users:view',
      write: 'system:users:write',
    },
    roles: {
      page: 'system:roles:page',
      view: 'system:roles:view',
      write: 'system:roles:write',
    },
    permissions: {
      page: 'system:permissions:page',
      view: 'system:permissions:view',
      write: 'system:permissions:write',
    },
    logs: {
      page: 'system:logs:page',
      view: 'system:logs:view',
    },
  },
  warehouse: {
    page: 'warehouse:page',
    categories: {
      page: 'warehouse:categories:page',
      view: 'warehouse:categories:view',
      write: 'warehouse:categories:write',
    },
    inventory: {
      page: 'warehouse:inventory:page',
      view: 'warehouse:inventory:view',
      inbound: 'warehouse:inventory:inbound',
      outbound: 'warehouse:inventory:outbound',
      ship: 'warehouse:inventory:ship',
      return: 'warehouse:inventory:return',
      records: 'warehouse:inventory:records',
    },
    materialBatches: {
      page: 'warehouse:material-batches:page',
      view: 'warehouse:material-batches:view',
      write: 'warehouse:material-batches:write',
      stock: 'warehouse:material-batches:stock',
      trace: 'warehouse:material-batches:trace',
    },
  },
  production: {
    page: 'production:page',
    orders: {
      page: 'production:orders:page',
      view: 'production:orders:view',
      write: 'production:orders:write',
      draft: 'production:orders:draft',
      release: 'production:orders:release',
      close: 'production:orders:close',
      cancel: 'production:orders:cancel',
      complete: 'production:orders:complete',
    },
    processes: {
      page: 'production:processes:page',
      view: 'production:processes:view',
      write: 'production:processes:write',
      upload: 'production:processes:upload',
    },
    productCategories: {
      page: 'production:product-categories:page',
      view: 'production:product-categories:view',
      write: 'production:product-categories:write',
      configureSpecs: 'production:product-categories:configure-specs',
    },
    products: {
      page: 'production:products:page',
      view: 'production:products:view',
      write: 'production:products:write',
      specs: 'production:products:specs',
      route: 'production:products:route',
      materials: 'production:products:materials',
    },
    routeTemplates: {
      page: 'production:route-templates:page',
      view: 'production:route-templates:view',
      write: 'production:route-templates:write',
      configureSteps: 'production:route-templates:configure-steps',
    },
    productMaterials: {
      page: 'production:product-materials:page',
      view: 'production:product-materials:view',
      write: 'production:product-materials:write',
      delete: 'production:product-materials:delete',
      configure: 'production:product-materials:configure',
    },
    tasks: {
      page: 'production:tasks:page',
      view: 'production:tasks:view',
      write: 'production:tasks:write',
      generateRequirements: 'production:tasks:generate-requirements',
      allocateMaterials: 'production:tasks:allocate-materials',
      dispatch: 'production:tasks:dispatch',
      start: 'production:tasks:start',
      complete: 'production:tasks:complete',
      rework: 'production:tasks:rework',
      trace: 'production:tasks:trace',
    },
    materialRequirements: {
      page: 'production:material-requirements:page',
      view: 'production:material-requirements:view',
      generate: 'production:material-requirements:generate',
      shortage: 'production:material-requirements:shortage',
      allocate: 'production:material-requirements:allocate',
    },
    materialAllocations: {
      page: 'production:material-allocations:page',
      view: 'production:material-allocations:view',
      allocate: 'production:material-allocations:allocate',
      completeSet: 'production:material-allocations:complete-set',
      outbound: 'production:material-allocations:outbound',
      return: 'production:material-allocations:return',
    },
    dispatch: {
      page: 'production:dispatch:page',
      view: 'production:dispatch:view',
      assign: 'production:dispatch:assign',
      reassign: 'production:dispatch:reassign',
      cancel: 'production:dispatch:cancel',
    },
    executionRecords: {
      page: 'production:execution-records:page',
      view: 'production:execution-records:view',
      start: 'production:execution-records:start',
      write: 'production:execution-records:write',
      upload: 'production:execution-records:upload',
      complete: 'production:execution-records:complete',
      exception: 'production:execution-records:exception',
    },
    finishedInbound: {
      page: 'production:finished-inbound:page',
      view: 'production:finished-inbound:view',
      inbound: 'production:finished-inbound:inbound',
      write: 'production:finished-inbound:write',
    },
  },
  quality: {
    page: 'quality:page',
    inspections: {
      page: 'quality:inspections:page',
      view: 'quality:inspections:view',
      write: 'quality:inspections:write',
      upload: 'quality:inspections:upload',
      result: 'quality:inspections:result',
      rework: 'quality:inspections:rework',
      inbound: 'quality:inspections:inbound',
    },
    reworks: {
      page: 'quality:reworks:page',
      view: 'quality:reworks:view',
      write: 'quality:reworks:write',
      assign: 'quality:reworks:assign',
      result: 'quality:reworks:result',
      reinspect: 'quality:reworks:reinspect',
    },
  },
  traceCenter: {
    page: 'trace:center:page',
    forward: {
      page: 'trace:forward:page',
      view: 'trace:forward:view',
    },
    backward: {
      page: 'trace:backward:page',
      view: 'trace:backward:view',
    },
  },
  worker: {
    tasks: {
      page: 'worker:tasks:page',
      view: 'worker:tasks:view',
      start: 'worker:tasks:start',
      complete: 'worker:tasks:complete',
      exception: 'worker:tasks:exception',
    },
  },
  inspector: {
    tasks: {
      page: 'inspector:tasks:page',
      view: 'inspector:tasks:view',
      result: 'inspector:tasks:result',
      upload: 'inspector:tasks:upload',
      rework: 'inspector:tasks:rework',
    },
  },
  reports: {
    page: 'reports:page',
    orderProgress: {
      page: 'reports:order-progress:page',
      view: 'reports:order-progress:view',
    },
    taskProgress: {
      page: 'reports:task-progress:page',
      view: 'reports:task-progress:view',
    },
    inventoryRecords: {
      page: 'reports:inventory-records:page',
      view: 'reports:inventory-records:view',
    },
  },
  // Legacy permission codes kept for implemented pages and existing RBAC seed data.
  technicalDocuments: {
    page: 'technical-documents:page',
    view: 'technical-documents:view',
    write: 'technical-documents:write',
  },
  processTemplates: {
    page: 'process-templates:page',
    view: 'process-templates:view',
    write: 'process-templates:write',
  },
  productionTasks: {
    page: 'production-tasks:page',
    view: 'production-tasks:view',
    write: 'production-tasks:write',
  },
  productionBatches: {
    page: 'production-batches:page',
    view: 'production-batches:view',
    write: 'production-batches:write',
  },
  batchStepRecords: {
    page: 'batch-step-records:page',
    view: 'batch-step-records:view',
    write: 'batch-step-records:write',
    assign: 'batch-step-records:assign',
    start: 'batch-step-records:start',
    complete: 'batch-step-records:complete',
    inspect: 'batch-step-records:inspect',
    manage: 'batch-step-records:manage',
  },
  inspections: {
    page: 'inspections:page',
    view: 'inspections:view',
    write: 'inspections:write',
  },
  reworks: {
    page: 'reworks:page',
    view: 'reworks:view',
    write: 'reworks:write',
    handle: 'reworks:handle',
    confirm: 'reworks:confirm',
  },
  storageShipments: {
    page: 'storage-shipments:page',
    view: 'storage-shipments:view',
    write: 'storage-shipments:write',
  },
  materialBatches: {
    page: 'material-batches:page',
    view: 'material-batches:view',
    write: 'material-batches:write',
  },
  batchMaterialUsages: {
    view: 'batch-material-usages:view',
    write: 'batch-material-usages:write',
  },
  trace: {
    page: 'trace:page',
    view: 'trace:view',
  },
} as const;

type PermissionValue<T> = T extends string
  ? T
  : T extends Record<string, unknown>
    ? PermissionValue<T[keyof T]>
    : never;

export type PermissionCode = PermissionValue<typeof PERMISSIONS>;
