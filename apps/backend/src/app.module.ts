import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuditInterceptor } from './operation-log/audit.interceptor.js';
import { AuditExceptionFilter } from './operation-log/audit-exception.filter.js';
import { OperationLogModule } from './operation-log/operation-log.module.js';
import { ProductModule } from './product/product.module.js';
import { ProductionModule } from './production/production.module.js';
import { SystemModule } from './system/system.module.js';
import { WarehouseModule } from './warehouse/warehouse.module.js';

@Module({
  imports: [
    DatabaseModule,
    OperationLogModule,
    AuthModule,
    SystemModule,
    ProductModule,
    WarehouseModule,
    ProductionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AuditExceptionFilter,
    },
  ],
})
export class AppModule {}
