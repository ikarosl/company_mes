import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { WorkOrderController } from './orders/work-order.controller.js';
import { WorkOrderRepository } from './orders/work-order.repository.js';
import { MaterialAllocationController } from './material-allocation/material-allocation.controller.js';
import { MaterialAllocationRepository } from './material-allocation/material-allocation.repository.js';
import { ProductionReportController } from './reports/production-report.controller.js';
import { ProductionTaskController } from './tasks/production-task.controller.js';
import { WorkerTaskController } from './tasks/worker-task.controller.js';
import { ProductionTaskRepository } from './tasks/production-task.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [
    WorkOrderController,
    ProductionTaskController,
    WorkerTaskController,
    MaterialAllocationController,
    ProductionReportController,
  ],
  providers: [WorkOrderRepository, ProductionTaskRepository, MaterialAllocationRepository],
})
export class ProductionModule {}
