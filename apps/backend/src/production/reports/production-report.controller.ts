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
    action: '修正报工数据',
    targetType: 'batch_step_record',
    targetParams: { productionBatchId: 'batchId', stepRecordId: 'recordId' },
  })
  @Put(':batchId/steps/:recordId')
  updateExecutionStepRecord(
    @Param('batchId') batchId: string,
    @Param('recordId') recordId: string,
    @Body() body: UpdateBatchStepRecordPayload,
  ) {
    // 管理端允许修正数量、重要参数和备注；仓库层统一校验状态流转、数量及参数完整性。
    return this.tasks.updateStepRecord(readId(batchId), readId(recordId), body, {
      allowTerminalCorrection: true,
    });
  }
}
