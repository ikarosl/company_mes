import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { MaterialInventoryController } from './inventory/material-inventory.controller.js';
import { MaterialInventoryRepository } from './inventory/material-inventory.repository.js';
import { MaterialTransactionController } from './material-transactions/material-transaction.controller.js';
import { MaterialTransactionRepository } from './material-transactions/material-transaction.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [MaterialInventoryController, MaterialTransactionController],
  providers: [MaterialInventoryRepository, MaterialTransactionRepository],
})
export class WarehouseModule {}
