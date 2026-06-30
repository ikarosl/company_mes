import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateStockCheckPayload, UpdateStockCheckPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { StockCheckRepository } from './stock-check.repository.js';

/** 库存盘点：记录账面快照、实盘数量和盘点调整流水。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/stock-checks')
export class StockCheckController {
  constructor(@Inject(StockCheckRepository) private readonly stockChecks: StockCheckRepository) {}

  /** 查询盘点单列表，读取 stock_check_order 并汇总明细状态。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.view)
  @Get()
  listStockChecks(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.stockChecks.listStockChecks({ keyword, status }, readPagination(page, pageSize));
  }

  /** 查询盘点单详情，包含 stock_check_detail 明细。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.detail)
  @Get(':id')
  getStockCheck(@Param('id') id: string) {
    return this.stockChecks.getStockCheck(readId(id));
  }

  /** 创建盘点单，保存盘点范围和账面数量快照。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.create)
  @Post()
  createStockCheck(@Body() body: CreateStockCheckPayload) {
    return this.stockChecks.createStockCheck(body);
  }

  /** 编辑盘点单，录入或调整实盘数量，自动计算盘盈盘亏。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.update)
  @Put(':id')
  updateStockCheck(@Param('id') id: string, @Body() body: UpdateStockCheckPayload) {
    return this.stockChecks.updateStockCheck(readId(id), body);
  }

  /** 完成盘点，锁定明细。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.complete)
  @Put(':id/complete')
  completeStockCheck(@Param('id') id: string) {
    return this.stockChecks.completeStockCheck(readId(id));
  }

  /** 生成盘点调整流水，写入 inventory_transaction 并标记已调整。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.adjust)
  @Post(':id/adjust')
  adjustStockCheck(@Param('id') id: string) {
    return this.stockChecks.adjustStockCheck(readId(id));
  }

  /** 取消盘点单，仅允许未完成的盘点单取消。 */
  @RequirePermission(PERMISSIONS.warehouse.stockChecks.cancel)
  @Put(':id/cancel')
  cancelStockCheck(@Param('id') id: string) {
    return this.stockChecks.cancelStockCheck(readId(id));
  }
}
