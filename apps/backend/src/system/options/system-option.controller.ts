import { PERMISSIONS } from '@company/constants';
import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { SystemOptionRepository } from './system-option.repository.js';

@UseGuards(PermissionGuard)
@Controller('system')
export class SystemOptionController {
  constructor(@Inject(SystemOptionRepository) private readonly options: SystemOptionRepository) {}

  @RequirePermission(PERMISSIONS.system.users.view)
  @Get('departments/options')
  departmentOptions() {
    return this.options.listDepartmentOptions();
  }

  @RequirePermission(PERMISSIONS.system.users.view)
  @Get('roles/options')
  roleOptions() {
    return this.options.listRoleOptions();
  }
}
