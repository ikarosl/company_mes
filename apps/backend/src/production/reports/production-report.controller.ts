import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@company/constants';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProductionTaskRepository } from '../tasks/production-task.repository.js';

@UseGuards(PermissionGuard)
@Controller('execution-records')
export class ProductionReportController {
  constructor(
    @Inject(ProductionTaskRepository)
    private readonly tasks: ProductionTaskRepository,
  ) {}

  @RequirePermission(PERMISSIONS.production.reports.view)
  @Get()
  listExecutionRecords(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tasks.listExecutionRecords({ keyword, status }, readPagination(page, pageSize));
  }

  @RequirePermission(PERMISSIONS.production.reports.detail)
  @Get(':batchId')
  getExecutionRecord(@Param('batchId') batchId: string) {
    return this.tasks.getTask(readId(batchId));
  }
}
