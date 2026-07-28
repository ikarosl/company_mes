import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  ConfigureProductMaterialsPayload,
  CreateProductPayload,
  SetProductDefaultRoutePayload,
  UpdateProductPayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProductRepository } from './product.repository.js';

@UseGuards(PermissionGuard)
@Controller()
export class ProductController {
  constructor(@Inject(ProductRepository) private readonly products: ProductRepository) {}

  @RequirePermission(PERMISSIONS.product.products.view)
  @Get('products')
  listProducts(
    @Query('keyword') keyword?: string,
    @Query('specKeyword') specKeyword?: string,
    @Query('productAttributes') productAttributes?: string,
    @Query('categoryId') categoryId?: string,
    @Query('acquireMethod') acquireMethod?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.products.listProducts(
      { keyword, specKeyword, productAttributes, categoryId, acquireMethod, status },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.product.products.detail)
  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.products.getProduct(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.products.create)
  @Post('products')
  createProduct(@Body() body: CreateProductPayload) {
    return this.products.createProduct(body);
  }

  @RequirePermission(PERMISSIONS.product.products.update)
  @Put('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: UpdateProductPayload) {
    return this.products.updateProduct(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.product.products.enable)
  @Put('products/:id/enable')
  enableProduct(@Param('id') id: string) {
    return this.products.changeProductStatus(readId(id), 1);
  }

  @RequirePermission(PERMISSIONS.product.products.disable)
  @Put('products/:id/disable')
  disableProduct(@Param('id') id: string) {
    return this.products.changeProductStatus(readId(id), 0);
  }

  @RequirePermission(PERMISSIONS.product.products.viewInventory)
  @Get('products/:id/inventory')
  getProductInventory(@Param('id') id: string) {
    return this.products.getProductInventory(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.products.viewRoute)
  @Get('products/:id/routes')
  getProductRoutes(@Param('id') id: string) {
    return this.products.getProductRoutes(readId(id));
  }

  /** 设置或取消自制产品的默认工艺路线。 */
  @RequirePermission(PERMISSIONS.product.products.bindRoute)
  @Put('products/:id/default-route')
  setProductDefaultRoute(
    @Param('id') id: string,
    @Body() body: SetProductDefaultRoutePayload,
  ) {
    return this.products.setProductDefaultRoute(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.product.products.configBom)
  @Get('products/:id/materials')
  listProductMaterials(@Param('id') id: string) {
    return this.products.listProductMaterials(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.products.configBom)
  @Put('products/:id/materials')
  configureProductMaterials(@Param('id') id: string, @Body() body: ConfigureProductMaterialsPayload) {
    return this.products.configureProductMaterials(readId(id), body);
  }
}
