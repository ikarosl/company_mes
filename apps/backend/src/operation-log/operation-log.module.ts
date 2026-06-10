import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogService } from './operation-log.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [OperationLogService],
  exports: [OperationLogService],
})
export class OperationLogModule {}
