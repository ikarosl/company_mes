import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  CreateProductionTaskPayload,
  DispatchTaskPayload,
  UpdateBatchStepRecordPayload,
  UpdateProductionBatchPayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProductionTaskRepository } from './production-task.repository.js';

@UseGuards(PermissionGuard)
@Controller('tasks')
export class ProductionTaskController {
  constructor(@Inject(ProductionTaskRepository) private readonly tasks: ProductionTaskRepository) {}

  @RequirePermission(PERMISSIONS.production.tasks.view)
  @Get()
  listTasks(
    @Query('keyword') keyword?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('ownerId') ownerId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tasks.listTasks({ keyword, productId, status, ownerId }, readPagination(page, pageSize));
  }

  @RequirePermission(PERMISSIONS.production.tasks.create)
  @Get('create-preview')
  previewCreateTask(
    @Query('workOrderId') workOrderId?: string,
    @Query('routeId') routeId?: string,
    @Query('plannedQuantity') plannedQuantity?: string,
  ) {
    return this.tasks.previewCreateTask(readId(workOrderId ?? ''), routeId ? readId(routeId) : null, plannedQuantity);
  }

  @RequirePermission(PERMISSIONS.production.tasks.create)
  @Post()
  createTask(@Body() body: CreateProductionTaskPayload) {
    return this.tasks.createTask(body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get(':id')
  getTask(@Param('id') id: string) {
    return this.tasks.getTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.update)
  @Put(':id')
  updateTask(@Param('id') id: string, @Body() body: UpdateProductionBatchPayload) {
    return this.tasks.updateTask(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.generateMaterialDemand)
  @Post(':id/material-demand')
  generateMaterialDemand(@Param('id') id: string) {
    return this.tasks.generateMaterialDemand(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Get(':id/dispatch-preview')
  previewDispatch(@Param('id') id: string) {
    return this.tasks.previewDispatch(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Post(':id/dispatch')
  dispatchTask(@Param('id') id: string, @Body() body: DispatchTaskPayload) {
    return this.tasks.dispatchTask(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.start)
  @Put(':id/start')
  startTask(@Param('id') id: string) {
    return this.tasks.startTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.finish)
  @Put(':id/finish')
  finishTask(@Param('id') id: string) {
    return this.tasks.finishTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Put(':id/steps/:recordId')
  updateStepRecord(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() body: UpdateBatchStepRecordPayload,
  ) {
    return this.tasks.updateStepRecord(readId(id), readId(recordId), body);
  }
}
