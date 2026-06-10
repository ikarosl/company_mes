import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { OperationLogModule } from '../operation-log/operation-log.module.js';
import { SystemLogController } from './logs/system-log.controller.js';
import { SystemLogRepository } from './logs/system-log.repository.js';
import { SystemOptionController } from './options/system-option.controller.js';
import { SystemOptionRepository } from './options/system-option.repository.js';
import { SystemPermissionController } from './permissions/system-permission.controller.js';
import { SystemPermissionRepository } from './permissions/system-permission.repository.js';
import { SystemRoleController } from './roles/system-role.controller.js';
import { SystemRoleRepository } from './roles/system-role.repository.js';
import { SystemUserController } from './users/system-user.controller.js';
import { SystemUserRepository } from './users/system-user.repository.js';

@Module({
  imports: [AuthModule, DatabaseModule, OperationLogModule],
  controllers: [
    SystemUserController,
    SystemRoleController,
    SystemPermissionController,
    SystemOptionController,
    SystemLogController,
  ],
  providers: [
    SystemUserRepository,
    SystemRoleRepository,
    SystemOptionRepository,
    SystemPermissionRepository,
    SystemLogRepository,
  ],
})
export class SystemModule {}
