import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { plannedWarehouseEndpoint } from '../warehouse-planned-endpoint.js';

/** 报废管理：覆盖库存内报废、已分配未出库报废、退料后报废和生产消耗报废。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/scraps')
export class ItemScrapController {
  /** 查询报废单列表，后续读取 item_scrap。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.view)
  @Get()
  listScraps(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return plannedWarehouseEndpoint('报废单列表', readPagination(page, pageSize));
  }

  /** 查询报废单详情，后续展示报废场景和补料链路。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.detail)
  @Get(':id')
  getScrap(@Param('id') id: string) {
    return plannedWarehouseEndpoint('报废单详情', { scrapId: readId(id) });
  }

  /** 创建报废单，后续按 scrap_scene 校验关联对象。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.create)
  @Post()
  createScrap(@Body() body: unknown) {
    return plannedWarehouseEndpoint('新增报废单', body);
  }

  /** 确认报废，后续生成库存流水或报废补料需求。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.confirm)
  @Put(':id/confirm')
  confirmScrap(@Param('id') id: string) {
    return plannedWarehouseEndpoint('确认报废', { scrapId: readId(id) });
  }

  /** 取消报废，后续校验未确认后流转状态。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.cancel)
  @Put(':id/cancel')
  cancelScrap(@Param('id') id: string) {
    return plannedWarehouseEndpoint('取消报废', { scrapId: readId(id) });
  }
}
