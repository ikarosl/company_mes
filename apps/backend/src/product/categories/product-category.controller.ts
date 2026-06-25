import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  CreateProductCategoryPayload,
  UpdateProductCategoryPayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProductCategoryRepository } from './product-category.repository.js';

@UseGuards(PermissionGuard)
@Controller()
export class ProductCategoryController {
  constructor(
    @Inject(ProductCategoryRepository) private readonly categories: ProductCategoryRepository,
  ) {}

  @RequirePermission(PERMISSIONS.product.categories.view)
  @Get('product-categories')
  listCategories(
    @Query('keyword') keyword?: string,
    @Query('productAttribute') productAttribute?: string,
    @Query('productType') productType?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.categories.listCategories(
      { keyword, productAttribute, productType, status },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.product.categories.detail)
  @Get('product-categories/:id')
  getCategory(@Param('id') id: string) {
    return this.categories.getCategory(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.categories.create)
  @Post('product-categories')
  createCategory(@Body() body: CreateProductCategoryPayload) {
    return this.categories.createCategory(body);
  }

  @RequirePermission(PERMISSIONS.product.categories.update)
  @Put('product-categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: UpdateProductCategoryPayload) {
    return this.categories.updateCategory(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.product.categories.enable)
  @Put('product-categories/:id/enable')
  enableCategory(@Param('id') id: string) {
    return this.categories.changeCategoryStatus(readId(id), 1);
  }

  @RequirePermission(PERMISSIONS.product.categories.disable)
  @Put('product-categories/:id/disable')
  disableCategory(@Param('id') id: string) {
    return this.categories.changeCategoryStatus(readId(id), 0);
  }
}
