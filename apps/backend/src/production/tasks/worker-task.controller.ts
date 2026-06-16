import { Body, Controller, Get, Inject, Param, Put, Query, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@company/constants';
import type { UpdateBatchStepRecordPayload } from '@company/api-contract';
// import type { ProductionTaskFilters } from './production-task.repository.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProductionTaskRepository } from './production-task.repository.js';

@UseGuards(PermissionGuard)
@Controller('worker/tasks')
export class WorkerTaskController {
  constructor(@Inject(ProductionTaskRepository) private readonly tasks: ProductionTaskRepository) {}

  @RequirePermission(PERMISSIONS.worker.tasks.view)
  @Get()
  listTasks(
    @CurrentUser('id') userId: string,
    @Query('keyword') keyword?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tasks.listTasksForWorker(
      userId,
      { keyword, productId, status },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.worker.tasks.detail)
  @Get(':id')
  getTask(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.getTaskForWorker(readId(id), userId);
  }

  @RequirePermission(PERMISSIONS.worker.tasks.start)
  @Put(':id/start')
  startTask(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.startTaskForWorker(readId(id), userId);
  }

  @RequirePermission(PERMISSIONS.worker.tasks.complete)
  @Put(':id/complete')
  completeTask(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.tasks.finishTaskForWorker(readId(id), userId);
  }

  @RequirePermission(PERMISSIONS.worker.tasks.start)
  @Put(':id/steps/:recordId')
  updateStepRecord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() body: UpdateBatchStepRecordPayload,
  ) {
    return this.tasks.updateStepRecordForWorker(readId(id), readId(recordId), body, userId);
  }
}
