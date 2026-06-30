import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { plannedWarehouseEndpoint } from '../warehouse-planned-endpoint.js';
import { InventoryRepository } from './inventory.repository.js';

@UseGuards(PermissionGuard)
@Controller('warehouse/inventory')
export class MaterialInventoryController {
  constructor(
    @Inject(InventoryRepository)
    private readonly inventory: InventoryRepository,
  ) {}

  /** 查询库存批次现存量，数据来源为 v_item_batch_stock。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.view)
  @Get()
  listInventoryBatches(
    @Query('keyword') keyword?: string,
    @Query('itemKind') itemKind?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('batchStatus') batchStatus?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventory.listBatchStock({ keyword, itemKind, stockStatus, batchStatus }, readPagination(page, pageSize));
  }

  /** 查询可分配库存，数据来源为 v_item_batch_available_to_allocate。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.viewAvailable)
  @Get('available')
  listAvailableInventory(
    @Query('keyword') keyword?: string,
    @Query('itemKind') itemKind?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inventory.listAvailableToAllocate({ keyword, itemKind }, readPagination(page, pageSize));
  }

  /** 查询单个库存批次现存量详情。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.view)
  @Get(':id')
  getInventoryBatch(@Param('id') id: string) {
    return this.inventory.getBatchStock(readId(id));
  }

  /** 旧物料批次新增入口已废弃，后续应改走入库单创建库存批次。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Post()
  createInventoryBatch(@Body() body: unknown) {
    return plannedWarehouseEndpoint('库存批次新增已迁移到入库单', body);
  }

  /** 旧物料批次编辑入口已废弃，后续仅允许维护 item_batch 业务状态。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Put(':id')
  updateInventoryBatch(@Param('id') id: string, @Body() body: unknown) {
    return plannedWarehouseEndpoint('库存批次编辑', { batchId: readId(id), body });
  }

  /** 旧盘点入口保留为过渡兼容，真实盘点应走 /warehouse/stock-checks。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.stocktake)
  @Put(':id/stocktake')
  stocktakeMaterialBatch(@Param('id') id: string, @Body() body: unknown) {
    return plannedWarehouseEndpoint('旧库存盘点入口已迁移到库存盘点单', { batchId: readId(id), body });
  }

  /** 启用库存批次，后续更新 item_batch.batch_status。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Put(':id/enable')
  enableMaterialBatch(@Param('id') id: string) {
    return plannedWarehouseEndpoint('启用库存批次', { batchId: readId(id) });
  }

  /** 停用库存批次，后续更新 item_batch.batch_status。 */
  @RequirePermission(PERMISSIONS.warehouse.inventory.adjust)
  @Put(':id/disable')
  disableMaterialBatch(@Param('id') id: string) {
    return plannedWarehouseEndpoint('停用库存批次', { batchId: readId(id) });
  }
}
