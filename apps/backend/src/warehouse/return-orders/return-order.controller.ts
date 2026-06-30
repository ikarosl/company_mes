import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateReturnOrderPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ReturnOrderRepository } from './return-order.repository.js';

/** 退料管理：记录生产批次退回库存，以及是否释放原预留。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/return-orders')
export class ReturnOrderController {
  constructor(@Inject(ReturnOrderRepository) private readonly returnOrders: ReturnOrderRepository) {}

  /** 查询退料单列表，读取 return_order 并汇总明细。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.view)
  @Get()
  listReturnOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('productionBatchId') productionBatchId?: string,
  ) {
    return this.returnOrders.listReturnOrders(
      { keyword, status, productionBatchId },
      readPagination(page, pageSize),
    );
  }

  /** 查询退料单详情，包含 return_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.detail)
  @Get(':id')
  getReturnOrder(@Param('id') id: string) {
    return this.returnOrders.getReturnOrder(readId(id));
  }

  /** 创建退料单，关联 production_item_allocation 写入 return_order + return_detail。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.create)
  @Post()
  createReturnOrder(@Body() body: CreateReturnOrderPayload) {
    return this.returnOrders.createReturnOrder(body);
  }

  /** 确认退料入库，生成正数 inventory_transaction（退料入库类型）。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.confirmInbound)
  @Put(':id/confirm-inbound')
  confirmReturnInbound(@Param('id') id: string) {
    return this.returnOrders.confirmReturnInbound(readId(id));
  }

  /** 确认退料报废，创建 item_scrap 记录并变更退料单状态。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.confirmScrap)
  @Put(':id/confirm-scrap')
  confirmReturnScrap(@Param('id') id: string) {
    return this.returnOrders.confirmReturnScrap(readId(id));
  }

  /** 取消退料单，仅允许待处理状态的退料单取消。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.cancel)
  @Put(':id/cancel')
  cancelReturnOrder(@Param('id') id: string) {
    return this.returnOrders.cancelReturnOrder(readId(id));
  }
}
