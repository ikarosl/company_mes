import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateOutboundOrderPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { OutboundOrderRepository } from './outbound-order.repository.js';

/** 出库管理：对外保留出库路由，底层统一使用 stock_order 与 stock_order_detail。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/outbound-orders')
export class OutboundOrderController {
  constructor(private readonly outboundOrders: OutboundOrderRepository) {}

  /** 查询出库单列表，后续读取出库方向的 stock_order。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.view)
  @Get()
  listOutboundOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('productionBatchId') productionBatchId?: string,
  ) {
    return this.outboundOrders.listOutboundOrders(
      {
        keyword,
        status,
        productionBatchId,
      },
      readPagination(page, pageSize),
    );
  }

  /** 查询出库单详情，后续包含 stock_order_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.detail)
  @Get(':id')
  getOutboundOrder(@Param('id') id: string) {
    return this.outboundOrders.getOutboundOrder(readId(id));
  }

  /** 创建出库单，按 production_item_allocation 反查需求、物料和批次后生成明细。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.create)
  @Post()
  createOutboundOrder(@Body() body: CreateOutboundOrderPayload) {
    return this.outboundOrders.createOutboundOrder(body);
  }

  /** 拣货确认，只流转业务状态，不生成库存流水。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.pick)
  @Put(':id/pick')
  pickOutboundOrder(@Param('id') id: string) {
    return this.outboundOrders.pickOutboundOrder(readId(id));
  }

  /** 确认出库，生成负数 inventory_transaction。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.confirm)
  @Put(':id/confirm')
  confirmOutboundOrder(@Param('id') id: string) {
    return this.outboundOrders.confirmOutboundOrder(readId(id));
  }

  /** 取消出库，已完成的库存事实不允许直接取消。 */
  @RequirePermission(PERMISSIONS.warehouse.outboundOrders.cancel)
  @Put(':id/cancel')
  cancelOutboundOrder(@Param('id') id: string) {
    return this.outboundOrders.cancelOutboundOrder(readId(id));
  }
}
