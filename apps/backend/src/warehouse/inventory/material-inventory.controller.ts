import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  CreateMaterialBatchPayload,
  StocktakeMaterialBatchPayload,
  UpdateMaterialBatchPayload,
} from '@company/api-contract';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { InventoryStocktakeRepository } from '../stocktakes/inventory-stocktake.repository.js';
import { MaterialInventoryRepository } from './material-inventory.repository.js';

@UseGuards(PermissionGuard)
@Controller('warehouse/inventory')
export class MaterialInventoryController {
  constructor(
    @Inject(MaterialInventoryRepository)
    private readonly inventory: MaterialInventoryRepository,
    @Inject(InventoryStocktakeRepository)
    private readonly stocktakes: InventoryStocktakeRepository,
  ) {}

  @RequirePermission(PERMISSIONS.warehouse.inventory.view)
  @Get()
  listMaterialBatches(
    @Query('keyword') keyword?: string,
    @Query('materialBatchNo') materialBatchNo?: string,
    @Query('supplierName') supplierName?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventory.listMaterialBatches(
      { keyword, materialBatchNo, supplierName, status },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.warehouse.inventory.view)
  @Get(':id')
  getMaterialBatch(@Param('id') id: string) {
    return this.inventory.getMaterialBatch(readId(id));
  }

  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Post()
  createMaterialBatch(@Body() body: CreateMaterialBatchPayload) {
    return this.inventory.createMaterialBatch(body);
  }

  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Put(':id')
  updateMaterialBatch(@Param('id') id: string, @Body() body: UpdateMaterialBatchPayload) {
    return this.inventory.updateMaterialBatch(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.warehouse.inventory.stocktake)
  @Put(':id/stocktake')
  async stocktakeMaterialBatch(
    @Param('id') id: string,
    @Body() body: StocktakeMaterialBatchPayload,
    @CurrentUser('id') userId: string,
  ) {
    const materialBatchId = readId(id);
    await this.stocktakes.createAndAdjust(
      {
        inventoryType: 'material',
        inventoryBatchId: String(materialBatchId),
        countedQuantity: body.quantity,
        remark: body.remark,
      },
      Number(userId),
    );
    return this.inventory.getMaterialBatch(materialBatchId);
  }

  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Put(':id/enable')
  enableMaterialBatch(@Param('id') id: string) {
    return this.inventory.changeMaterialBatchStatus(readId(id), false);
  }

  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Put(':id/disable')
  disableMaterialBatch(@Param('id') id: string) {
    return this.inventory.changeMaterialBatchStatus(readId(id), true);
  }
}
