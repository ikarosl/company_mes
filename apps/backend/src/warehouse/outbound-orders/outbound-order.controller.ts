import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { plannedWarehouseEndpoint } from '../warehouse-planned-endpoint.js';

/** 出库管理：对外保留出库路由，底层统一使用 stock_order 与 stock_order_detail。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/outbound-orders')
export class OutboundOrderController {
  /** 查询出库单列表，后续读取出库方向的 stock_order。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.view)
  @Get()
  listOutboundOrders(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return plannedWarehouseEndpoint('出库单列表', readPagination(page, pageSize));
  }

  /** 查询出库单详情，后续包含 stock_order_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.detail)
  @Get(':id')
  getOutboundOrder(@Param('id') id: string) {
    return plannedWarehouseEndpoint('出库单详情', { outboundOrderId: readId(id) });
  }

  /** 创建出库单，后续按 production_item_allocation 生成明细。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.create)
  @Post()
  createOutboundOrder(@Body() body: unknown) {
    return plannedWarehouseEndpoint('新增出库单', body);
  }

  /** 拣货确认，后续只流转业务状态，不生成库存流水。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.pick)
  @Put(':id/pick')
  pickOutboundOrder(@Param('id') id: string) {
    return plannedWarehouseEndpoint('拣货', { outboundOrderId: readId(id) });
  }

  /** 确认出库，后续生成负数 inventory_transaction。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.confirm)
  @Put(':id/confirm')
  confirmOutboundOrder(@Param('id') id: string) {
    return plannedWarehouseEndpoint('确认出库', { outboundOrderId: readId(id) });
  }

  /** 取消出库，后续校验未出库后流转状态。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.cancel)
  @Put(':id/cancel')
  cancelOutboundOrder(@Param('id') id: string) {
    return plannedWarehouseEndpoint('取消出库', { outboundOrderId: readId(id) });
  }
}
