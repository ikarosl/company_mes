import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import type {
  AssignSystemRolePermissionsPayload,
  CreateSystemRolePayload,
  UpdateSystemRolePayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId } from '../../shared/request-utils.js';
import { SystemRoleRepository } from './system-role.repository.js';

@UseGuards(PermissionGuard)
@Controller('system')
export class SystemRoleController {
  constructor(@Inject(SystemRoleRepository) private readonly roles: SystemRoleRepository) {}

  @RequirePermission(PERMISSIONS.system.roles.view)
  @Get('roles')
  listRoles() {
    return this.roles.listRoles();
  }

  @RequirePermission(PERMISSIONS.system.roles.write)
  @Post('roles')
  createRole(@Body() body: CreateSystemRolePayload) {
    return this.roles.createRole(body);
  }

  @RequirePermission(PERMISSIONS.system.roles.write)
  @Put('roles/:id')
  updateRole(@Param('id') id: string, @Body() body: UpdateSystemRolePayload) {
    return this.roles.updateRole(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.roles.write)
  @Delete('roles/:id')
  deleteRole(@Param('id') id: string) {
    return this.roles.deleteRole(readId(id));
  }

  @RequirePermission(PERMISSIONS.system.roles.view)
  @Get('roles/:id/permissions')
  rolePermissions(@Param('id') id: string) {
    return this.roles.getRolePermissions(readId(id));
  }

  @RequirePermission(PERMISSIONS.system.roles.write)
  @Put('roles/:id/permissions')
  assignRolePermissions(@Param('id') id: string, @Body() body: AssignSystemRolePermissionsPayload) {
    return this.roles.assignRolePermissions(readId(id), body);
  }
}
