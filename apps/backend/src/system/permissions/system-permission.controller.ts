import { PERMISSIONS } from '@company/constants';
import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { SystemPermissionRepository } from './system-permission.repository.js';

@UseGuards(PermissionGuard)
@Controller('system')
export class SystemPermissionController {
  constructor(
    @Inject(SystemPermissionRepository)
    private readonly permissions: SystemPermissionRepository,
  ) {}

  @RequirePermission(PERMISSIONS.system.permissions.view)
  @Get('permissions')
  listPermissions() {
    return this.permissions.listPermissions();
  }

  @RequirePermission(PERMISSIONS.system.permissions.view)
  @Get('permissions/tree')
  permissionTree() {
    return this.permissions.listPermissionTree();
  }
}
