import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { MaterialInventoryController } from './inventory/material-inventory.controller.js';
import { MaterialInventoryRepository } from './inventory/material-inventory.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [MaterialInventoryController],
  providers: [MaterialInventoryRepository],
})
export class WarehouseModule {}
