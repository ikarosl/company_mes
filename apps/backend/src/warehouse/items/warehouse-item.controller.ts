import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type { CreateWarehouseItemPayload, UpdateWarehouseItemPayload } from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { WarehouseItemRepository } from './warehouse-item.repository.js';

/** 库存对象管理：统一维护物料、半成品、成品基础信息。 */
@UseGuards(PermissionGuard)
@Controller('warehouse/items')
export class WarehouseItemController {
  constructor(
    @Inject(WarehouseItemRepository)
    private readonly items: WarehouseItemRepository,
  ) {}

  /** 查询库存对象列表，后续读取 item_info + item_type。 */
  @RequirePermission(PERMISSIONS.warehouse.items.view)
  @Get()
  listItems(
    @Query('keyword') keyword?: string,
    @Query('itemKind') itemKind?: string,
    @Query('typeId') typeId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.items.listItems({ keyword, itemKind, typeId, status }, readPagination(page, pageSize));
  }

  /** 查询库存对象分类选项，用于新增/编辑表单选择物料、半成品、成品类型。 */
  @RequirePermission(PERMISSIONS.warehouse.items.view)
  @Get('types/options')
  listTypeOptions(@Query('itemKind') itemKind?: string) {
    return this.items.listTypeOptions(itemKind);
  }

  /** 查询库存对象详情，后续用于编辑弹窗回显。 */
  @RequirePermission(PERMISSIONS.warehouse.items.detail)
  @Get(':id')
  getItem(@Param('id') id: string) {
    return this.items.getItem(readId(id));
  }

  /** 新增库存对象，后续写入 item_info。 */
  @RequirePermission(PERMISSIONS.warehouse.items.create)
  @Post()
  createItem(@Body() body: CreateWarehouseItemPayload) {
    return this.items.createItem(body);
  }

  /** 编辑库存对象，后续更新 item_info 并校验编码唯一。 */
  @RequirePermission(PERMISSIONS.warehouse.items.update)
  @Put(':id')
  updateItem(@Param('id') id: string, @Body() body: UpdateWarehouseItemPayload) {
    return this.items.updateItem(readId(id), body);
  }

  /** 启用库存对象，后续把 item_info.status 更新为“启用”。 */
  @RequirePermission(PERMISSIONS.warehouse.items.enable)
  @Put(':id/enable')
  enableItem(@Param('id') id: string) {
    return this.items.changeItemStatus(readId(id), '启用');
  }

  /** 停用库存对象，后续把 item_info.status 更新为“停用”。 */
  @RequirePermission(PERMISSIONS.warehouse.items.disable)
  @Put(':id/disable')
  disableItem(@Param('id') id: string) {
    return this.items.changeItemStatus(readId(id), '停用');
  }
}
