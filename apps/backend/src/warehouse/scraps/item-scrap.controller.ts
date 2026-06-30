import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateItemScrapPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ItemScrapRepository } from './item-scrap.repository.js';

/** 报废管理：覆盖库存内报废、已分配未出库报废、退料后报废和生产消耗报废。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/scraps')
export class ItemScrapController {
  constructor(@Inject(ItemScrapRepository) private readonly scraps: ItemScrapRepository) {}

  /** 查询报废单列表，读取 item_scrap 关联库存对象信息。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.view)
  @Get()
  listScraps(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('scrapScene') scrapScene?: string,
  ) {
    return this.scraps.listScraps({ keyword, status, scrapScene }, readPagination(page, pageSize));
  }

  /** 查询报废单详情。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.detail)
  @Get(':id')
  getScrap(@Param('id') id: string) {
    return this.scraps.getScrap(readId(id));
  }

  /** 创建报废单，按 scrap_scene 校验关联对象。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.create)
  @Post()
  createScrap(@Body() body: CreateItemScrapPayload) {
    return this.scraps.createScrap(body);
  }

  /** 确认报废，按场景生成库存流水或记录消耗。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.confirm)
  @Put(':id/confirm')
  confirmScrap(@Param('id') id: string) {
    return this.scraps.confirmScrap(readId(id));
  }

  /** 取消报废单，仅允许待确认状态取消。 */
  @RequirePermission(PERMISSIONS.warehouse.scraps.cancel)
  @Put(':id/cancel')
  cancelScrap(@Param('id') id: string) {
    return this.scraps.cancelScrap(readId(id));
  }
}
