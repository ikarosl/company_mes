import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { ProductCategoryController } from './categories/product-category.controller.js';
import { ProductCategoryRepository } from './categories/product-category.repository.js';
import { ProcessController } from './processes/process.controller.js';
import { ProcessRepository } from './processes/process.repository.js';
import { ProductController } from './products/product.controller.js';
import { ProductRepository } from './products/product.repository.js';
import { ProcessRouteController } from './routes/process-route.controller.js';
import { ProcessRouteRepository } from './routes/process-route.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [ProductCategoryController, ProductController, ProcessController, ProcessRouteController],
  providers: [ProductCategoryRepository, ProductRepository, ProcessRepository, ProcessRouteRepository],
})
export class ProductModule {}
