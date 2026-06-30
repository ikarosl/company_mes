import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { plannedWarehouseEndpoint } from '../warehouse-planned-endpoint.js';

/** 退料管理：记录生产批次退回库存，以及是否释放原预留。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/return-orders')
export class ReturnOrderController {
  /** 查询退料单列表，后续读取 return_order。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.view)
  @Get()
  listReturnOrders(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return plannedWarehouseEndpoint('退料单列表', readPagination(page, pageSize));
  }

  /** 查询退料单详情，后续包含 return_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.detail)
  @Get(':id')
  getReturnOrder(@Param('id') id: string) {
    return plannedWarehouseEndpoint('退料单详情', { returnOrderId: readId(id) });
  }

  /** 创建退料单，后续关联 production_item_allocation。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.create)
  @Post()
  createReturnOrder(@Body() body: unknown) {
    return plannedWarehouseEndpoint('新增退料单', body);
  }

  /** 确认退料入库，后续生成正数 inventory_transaction。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.confirmInbound)
  @Put(':id/confirm-inbound')
  confirmReturnInbound(@Param('id') id: string) {
    return plannedWarehouseEndpoint('确认退料入库', { returnOrderId: readId(id) });
  }

  /** 确认退料报废，后续创建 item_scrap 并扣减库存。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.confirmScrap)
  @Put(':id/confirm-scrap')
  confirmReturnScrap(@Param('id') id: string) {
    return plannedWarehouseEndpoint('确认退料报废', { returnOrderId: readId(id) });
  }

  /** 取消退料，后续校验未入库和未报废后流转状态。 */
  @RequirePermission(PERMISSIONS.warehouse.returnOrders.cancel)
  @Put(':id/cancel')
  cancelReturnOrder(@Param('id') id: string) {
    return plannedWarehouseEndpoint('取消退料', { returnOrderId: readId(id) });
  }
}
