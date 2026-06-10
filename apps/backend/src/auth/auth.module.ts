import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';
import { PermissionGuard } from './permission.guard.js';

@Module({
  imports: [DatabaseModule, OperationLogModule],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, PermissionGuard],
  exports: [AuthService, PermissionGuard],
})
export class AuthModule {}
