import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateInboundOrderPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { InboundOrderRepository } from './inbound-order.repository.js';

/** 入库管理：承接外购、自制、委外、退货和盘点生成等入库动作。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/inbound-orders')
export class InboundOrderController {
  constructor(private readonly inboundOrders: InboundOrderRepository) {}

  /** 查询入库单列表，读取 inbound_order 并汇总 inbound_detail。 */
  @RequirePermission(PERMISSIONS.warehouse.inboundOrders.view)
  @Get()
  listInboundOrders(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('sourceType') sourceType?: string,
    @Query('status') status?: string,
  ) {
    return this.inboundOrders.listInboundOrders(
      {
        keyword,
        sourceType,
        status,
      },
      readPagination(page, pageSize),
    );
  }

  /** 查询入库单详情，包含 inbound_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.inboundOrders.detail)
  @Get(':id')
  getInboundOrder(@Param('id') id: string) {
    return this.inboundOrders.getInboundOrder(readId(id));
  }

  /** 创建入库单，写入待入库主单、明细，并按需要创建库存批次。 */
  @RequirePermission(PERMISSIONS.warehouse.inboundOrders.create)
  @Post()
  createInboundOrder(@Body() body: CreateInboundOrderPayload) {
    return this.inboundOrders.createInboundOrder(body);
  }

  /** 确认入库，生成正数 inventory_transaction。 */
  @RequirePermission(PERMISSIONS.warehouse.inboundOrders.confirm)
  @Put(':id/confirm')
  confirmInboundOrder(@Param('id') id: string) {
    return this.inboundOrders.confirmInboundOrder(readId(id));
  }

  /** 取消待入库单，已入库单不允许直接取消。 */
  @RequirePermission(PERMISSIONS.warehouse.inboundOrders.cancel)
  @Put(':id/cancel')
  cancelInboundOrder(@Param('id') id: string) {
    return this.inboundOrders.cancelInboundOrder(readId(id));
  }
}
