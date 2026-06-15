import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { WorkOrderController } from './orders/work-order.controller.js';
import { WorkOrderRepository } from './orders/work-order.repository.js';
import { ProductionTaskController } from './tasks/production-task.controller.js';
import { ProductionTaskRepository } from './tasks/production-task.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [WorkOrderController, ProductionTaskController],
  providers: [WorkOrderRepository, ProductionTaskRepository],
})
export class ProductionModule {}
