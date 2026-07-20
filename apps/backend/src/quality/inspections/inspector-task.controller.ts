import type { SubmitProcessInspectionPayload } from '@company/api-contract';
import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { InspectionRepository } from './inspection.repository.js';

/** 检测端待检任务接口：任务由已完成的需检工序动态派生。 */
@UseGuards(PermissionGuard)
@Controller('inspector/tasks')
export class InspectorTaskController {
  constructor(@Inject(InspectionRepository) private readonly inspections: InspectionRepository) {}

  /** 分页查询当前尚未提交过程检验的工序。 */
  @RequirePermission(PERMISSIONS.inspector.tasks.view)
  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inspections.listPendingProcessTasks(keyword, readPagination(page, pageSize));
  }

  /** 提交后写入正式检验记录，任务会自动从待检列表消失。 */
  @RequirePermission(PERMISSIONS.inspector.tasks.submitResult)
  @Audit({ module: 'inspector', action: '提交过程检验结果', targetType: 'inspection_record' })
  @Put(':id/result')
  submitResult(
    @Param('id') id: string,
    @Body() body: SubmitProcessInspectionPayload,
    @CurrentUser('id') userId: string,
  ) {
    return this.inspections.submitPendingProcessTask(readId(id), body, Number(userId));
  }
}
