import { PERMISSIONS } from '@company/constants';
import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readPagination } from '../../shared/request-utils.js';
import { SystemLogRepository } from './system-log.repository.js';

@UseGuards(PermissionGuard)
@Controller('system')
export class SystemLogController {
  constructor(@Inject(SystemLogRepository) private readonly logs: SystemLogRepository) {}

  @RequirePermission(PERMISSIONS.system.logs.view)
  @Get('logs')
  operationLogs(
    @Query('logType') logType?: string,
    @Query('module') module?: string,
    @Query('result') result?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.logs.listOperationLogs(
      { logType, module, result, userId },
      readPagination(page, pageSize),
    );
  }
}
