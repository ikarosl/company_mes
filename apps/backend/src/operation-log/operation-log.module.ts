import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AuditContextService } from './audit-context.service.js';
import { OperationLogService } from './operation-log.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [AuditContextService, OperationLogService],
  exports: [AuditContextService, OperationLogService],
})
export class OperationLogModule {}
