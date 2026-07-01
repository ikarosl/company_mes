import { Body, Controller, Get, Inject, Param, Put, Query, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@company/constants';
import type { UpdateBatchStepRecordPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
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

  @RequirePermission(PERMISSIONS.production.reports.finish)
  @Audit({
    module: 'production',
    action: '修正报工数量',
    targetType: 'batch_step_record',
    targetParams: { productionBatchId: 'batchId', stepRecordId: 'recordId' },
  })
  @Put(':batchId/steps/:recordId')
  updateExecutionStepRecord(
    @Param('batchId') batchId: string,
    @Param('recordId') recordId: string,
    @Body() body: UpdateBatchStepRecordPayload,
  ) {
    // 报工页只暴露数量和备注修正；仓库层会保留未传字段并校验状态流转与数量格式。
    return this.tasks.updateStepRecord(readId(batchId), readId(recordId), body);
  }
}
