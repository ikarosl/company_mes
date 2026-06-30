import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { plannedWarehouseEndpoint } from '../warehouse-planned-endpoint.js';

/** 库存盘点：记录账面快照、实盘数量和盘点调整流水。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/stock-checks')
export class StockCheckController {
  /** 查询盘点单列表，后续读取 stock_check_order。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.view)
  @Get()
  listStockChecks(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return plannedWarehouseEndpoint('盘点单列表', readPagination(page, pageSize));
  }

  /** 查询盘点单详情，后续包含 stock_check_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.detail)
  @Get(':id')
  getStockCheck(@Param('id') id: string) {
    return plannedWarehouseEndpoint('盘点单详情', { stockCheckId: readId(id) });
  }

  /** 创建盘点单，后续保存盘点范围和账面数量快照。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.create)
  @Post()
  createStockCheck(@Body() body: unknown) {
    return plannedWarehouseEndpoint('新增盘点单', body);
  }

  /** 编辑盘点单，后续录入或调整实盘数量。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.update)
  @Put(':id')
  updateStockCheck(@Param('id') id: string, @Body() body: unknown) {
    return plannedWarehouseEndpoint('编辑盘点单', { stockCheckId: readId(id), body });
  }

  /** 完成盘点，后续锁定明细并计算盘盈盘亏。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.complete)
  @Put(':id/complete')
  completeStockCheck(@Param('id') id: string) {
    return plannedWarehouseEndpoint('完成盘点', { stockCheckId: readId(id) });
  }

  /** 生成盘点调整流水，后续写入 inventory_transaction 并标记 adjusted。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.adjust)
  @Post(':id/adjust')
  adjustStockCheck(@Param('id') id: string) {
    return plannedWarehouseEndpoint('生成盘点调整', { stockCheckId: readId(id) });
  }

  /** 取消盘点，后续校验未完成或未调整后流转状态。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.cancel)
  @Put(':id/cancel')
  cancelStockCheck(@Param('id') id: string) {
    return plannedWarehouseEndpoint('取消盘点', { stockCheckId: readId(id) });
  }
}
