import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthRepository } from './auth/auth.repository.js';
import { AuthService } from './auth/auth.service.js';
import { PermissionGuard } from './auth/permission.guard.js';
import { DatabaseService } from './database/database.service.js';
import { AuditInterceptor } from './operation-log/audit.interceptor.js';
import { OperationLogService } from './operation-log/operation-log.service.js';
import { SystemLogController } from './system/logs/system-log.controller.js';
import { SystemLogRepository } from './system/logs/system-log.repository.js';
import { SystemOptionController } from './system/options/system-option.controller.js';
import { SystemOptionRepository } from './system/options/system-option.repository.js';
import { SystemPermissionController } from './system/permissions/system-permission.controller.js';
import { SystemPermissionRepository } from './system/permissions/system-permission.repository.js';
import { SystemRoleController } from './system/roles/system-role.controller.js';
import { SystemRoleRepository } from './system/roles/system-role.repository.js';
import { SystemUserController } from './system/users/system-user.controller.js';
import { SystemUserRepository } from './system/users/system-user.repository.js';

@Module({
  controllers: [
    AppController,
    AuthController,
    SystemUserController,
    SystemRoleController,
    SystemPermissionController,
    SystemOptionController,
    SystemLogController,
  ],
  providers: [
    DatabaseService,
    AuthRepository,
    AuthService,
    PermissionGuard,
    SystemUserRepository,
    SystemRoleRepository,
    SystemOptionRepository,
    SystemPermissionRepository,
    SystemLogRepository,
    OperationLogService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
