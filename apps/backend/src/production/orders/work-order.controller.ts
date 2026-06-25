import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  CreateProductionBatchPayload,
  CreateWorkOrderPayload,
  UpdateProductionBatchPayload,
  UpdateWorkOrderPayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { WorkOrderRepository } from './work-order.repository.js';

@UseGuards(PermissionGuard)
@Controller('orders')
export class WorkOrderController {
  constructor(@Inject(WorkOrderRepository) private readonly orders: WorkOrderRepository) {}

  @RequirePermission(PERMISSIONS.production.orders.view)
  @Get()
  listOrders(
    @Query('keyword') keyword?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('ownerId') ownerId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.orders.listOrders(
      { keyword, productId, status, ownerId },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.production.orders.detail)
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orders.getOrder(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.orders.create)
  @Audit({
    module: 'production',
    action: '创建生产工单',
    targetType: 'work_order',
    businessKeyBodyField: 'orderNo',
  })
  @Post()
  createOrder(@Body() body: CreateWorkOrderPayload) {
    return this.orders.createOrder(body);
  }

  @RequirePermission(PERMISSIONS.production.orders.update)
  @Audit({
    module: 'production',
    action: '修改生产工单',
    targetType: 'work_order',
    targetParams: { workOrderId: 'id' },
  })
  @Put(':id')
  updateOrder(@Param('id') id: string, @Body() body: UpdateWorkOrderPayload) {
    return this.orders.updateOrder(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.production.orders.release)
  @Audit({
    module: 'production',
    action: '下达生产工单',
    targetType: 'work_order',
    targetParams: { workOrderId: 'id' },
  })
  @Put(':id/release')
  releaseOrder(@Param('id') id: string) {
    return this.orders.changeOrderStatus(readId(id), 'released');
  }

  @RequirePermission(PERMISSIONS.production.orders.close)
  @Audit({
    module: 'production',
    action: '关闭生产工单',
    targetType: 'work_order',
    targetParams: { workOrderId: 'id' },
  })
  @Put(':id/close')
  closeOrder(@Param('id') id: string) {
    return this.orders.changeOrderStatus(readId(id), 'closed');
  }

  @RequirePermission(PERMISSIONS.production.orders.cancel)
  @Audit({
    module: 'production',
    action: '取消生产工单',
    targetType: 'work_order',
    targetParams: { workOrderId: 'id' },
  })
  @Put(':id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.orders.changeOrderStatus(readId(id), 'cancelled');
  }

  @RequirePermission(PERMISSIONS.production.orders.tasks.view)
  @Get(':id/tasks')
  listOrderBatches(@Param('id') id: string) {
    return this.orders.listOrderBatches(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.orders.tasks.create)
  @Post(':id/tasks')
  createOrderBatch(@Param('id') id: string, @Body() body: CreateProductionBatchPayload) {
    return this.orders.createOrderBatch(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.production.orders.tasks.update)
  @Put(':id/tasks/:taskId')
  updateOrderBatch(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateProductionBatchPayload,
  ) {
    return this.orders.updateOrderBatch(readId(id), readId(taskId), body);
  }
}
