import { Body, Controller, Delete, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PERMISSIONS } from '@company/constants';
import type { AllocateMaterialPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { MaterialAllocationRepository } from './material-allocation.repository.js';

@UseGuards(PermissionGuard)
@Controller('material-allocation')
export class MaterialAllocationController {
  constructor(@Inject(MaterialAllocationRepository) private readonly allocation: MaterialAllocationRepository) {}

  @RequirePermission(PERMISSIONS.production.materialAllocation.view)
  @Get()
  listAllocations(
    @Query('keyword') keyword?: string,
    @Query('productId') productId?: string,
    @Query('materialKeyword') materialKeyword?: string,
    @Query('materialStatus') materialStatus?: string,
    @Query('shortage') shortage?: string,
    @Query('keyMaterial') keyMaterial?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.allocation.listAllocations(
      { keyword, productId, materialKeyword, materialStatus, shortage, keyMaterial },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.production.materialAllocation.view)
  @Get('product-materials/:productMaterialId/available-batches')
  listAvailableBatches(@Param('productMaterialId') productMaterialId: string) {
    return this.allocation.listAvailableBatches(readId(productMaterialId));
  }

  @RequirePermission(PERMISSIONS.production.materialAllocation.allocate)
  @Post('batches/:batchId/allocate')
  allocateMaterial(@Param('batchId') batchId: string, @Body() body: AllocateMaterialPayload) {
    return this.allocation.allocateMaterial(readId(batchId), body);
  }

  @RequirePermission(PERMISSIONS.production.materialAllocation.allocate)
  @Delete('batches/:batchId/product-materials/:productMaterialId')
  clearAllocation(@Param('batchId') batchId: string, @Param('productMaterialId') productMaterialId: string) {
    return this.allocation.clearAllocation(readId(batchId), readId(productMaterialId));
  }
}
