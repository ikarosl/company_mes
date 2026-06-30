import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateAllocationPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId } from '../../shared/request-utils.js';
import { ProductionMaterialRepository } from './production-material.repository.js';

/** 生产投入需求与分配管理。 */
@UseGuards(PermissionGuard)
@Controller()
export class ProductionMaterialController {
  constructor(
    @Inject(ProductionMaterialRepository)
    private readonly material: ProductionMaterialRepository,
  ) {}

  /** 获取生产批次的需求汇总。 */
  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get('tasks/:id/demands')
  listDemands(@Param('id') id: string) {
    return this.material.listDemandsByBatch(readId(id));
  }

  /** 获取生产批次的分配汇总。 */
  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get('tasks/:id/allocations')
  listAllocations(@Param('id') id: string) {
    return this.material.listAllocationsByBatch(readId(id));
  }

  /** 获取生产批次投入汇总。 */
  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get('tasks/:id/batch-item-summary')
  listBatchItemSummary(@Param('id') id: string) {
    return this.material.listBatchItemSummary(readId(id));
  }

  /** 获取生产批次产出汇总。 */
  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get('tasks/:id/output-summary')
  listOutputSummary(@Param('id') id: string) {
    return this.material.listBatchOutputSummary(readId(id));
  }

  /** 获取生产批次物料详情（需求+分配+投入+产出）。 */
  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get('tasks/:id/materials')
  getMaterialDetail(@Param('id') id: string) {
    return this.material.getProductionMaterialDetail(readId(id));
  }

  /** 生成生产投入需求。 */
  @RequirePermission(PERMISSIONS.production.tasks.generateMaterialDemand)
  @Post('tasks/:id/generate-demand')
  generateDemand(@Param('id') id: string) {
    return this.material.generateDemand(readId(id));
  }

  /** 查询可分配库存批次。 */
  @RequirePermission(PERMISSIONS.production.materialAllocation.view)
  @Get('material-allocation/available')
  listAvailableBatches(@Query('itemId') itemId?: string) {
    return this.material.listAvailableBatches(itemId ? readId(itemId) : undefined);
  }

  /** 创建分配。 */
  @RequirePermission(PERMISSIONS.production.materialAllocation.allocate)
  @Post('material-allocation')
  createAllocation(@Body() body: CreateAllocationPayload) {
    return this.material.createAllocation(body);
  }

  /** 取消分配。 */
  @RequirePermission(PERMISSIONS.production.materialAllocation.allocate)
  @Put('material-allocation/:id/cancel')
  cancelAllocation(@Param('id') id: string) {
    return this.material.cancelAllocation(readId(id));
  }
}
