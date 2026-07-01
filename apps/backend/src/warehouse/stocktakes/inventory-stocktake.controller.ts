import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import type {
  AdjustInventoryStocktakePayload,
  CreateInventoryStocktakePayload,
} from '@company/api-contract';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { InventoryStocktakeRepository } from './inventory-stocktake.repository.js';

@UseGuards(PermissionGuard)
@Controller('warehouse/stocktakes')
export class InventoryStocktakeController {
  constructor(
    @Inject(InventoryStocktakeRepository)
    private readonly stocktakes: InventoryStocktakeRepository,
  ) {}

  @RequirePermission(PERMISSIONS.warehouse.stocktakes.view)
  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('inventoryType') inventoryType?: string,
    @Query('inventoryBatchId') inventoryBatchId?: string,
    @Query('status') status?: string,
    @Query('differenceType') differenceType?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.stocktakes.list(
      { keyword, inventoryType, inventoryBatchId, status, differenceType },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.warehouse.stocktakes.targets)
  @Get('targets')
  listTargets(@Query('inventoryType') inventoryType?: string, @Query('keyword') keyword?: string) {
    return this.stocktakes.listTargets(inventoryType, keyword);
  }

  @RequirePermission(PERMISSIONS.warehouse.stocktakes.view)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.stocktakes.get(readId(id));
  }

  @RequirePermission(PERMISSIONS.warehouse.stocktakes.create)
  @Audit({
    module: 'warehouse',
    action: '库存盘点登记',
    targetType: 'inventory_stocktake',
    businessKeyBodyField: 'inventoryBatchId',
  })
  @Post()
  create(@Body() body: CreateInventoryStocktakePayload, @CurrentUser('id') userId: string) {
    return this.stocktakes.create(body, Number(userId));
  }

  @RequirePermission(PERMISSIONS.warehouse.stocktakes.adjust)
  @Audit({
    module: 'warehouse',
    action: '库存盘点调账',
    targetType: 'inventory_stocktake',
  })
  @Post(':id/adjust')
  adjust(
    @Param('id') id: string,
    @Body() body: AdjustInventoryStocktakePayload,
    @CurrentUser('id') userId: string,
  ) {
    return this.stocktakes.adjust(readId(id), body, Number(userId));
  }
}
