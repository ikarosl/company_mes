import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  AssignSystemUserRolesPayload,
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  UpdateSystemUserPayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { SystemUserRepository } from './system-user.repository.js';

@UseGuards(PermissionGuard)
@Controller('system')
export class SystemUserController {
  constructor(@Inject(SystemUserRepository) private readonly users: SystemUserRepository) {}

  @RequirePermission(PERMISSIONS.system.users.view)
  @Get('users')
  listUsers(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.users.listUsers(readPagination(page, pageSize));
  }

  @RequirePermission(PERMISSIONS.system.users.create)
  @Post('users')
  createUser(@Body() body: CreateSystemUserPayload) {
    return this.users.createUser(body);
  }

  @RequirePermission(PERMISSIONS.system.users.update)
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateSystemUserPayload) {
    return this.users.updateUser(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.enable)
  @Put('users/:id/enable')
  enableUser(@Param('id') id: string) {
    return this.users.changeUserStatus(readId(id), { status: 1 });
  }

  @RequirePermission(PERMISSIONS.system.users.disable)
  @Put('users/:id/disable')
  disableUser(@Param('id') id: string) {
    return this.users.changeUserStatus(readId(id), { status: 0 });
  }

  @RequirePermission(PERMISSIONS.system.users.resetPassword)
  @Put('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body() body: ResetSystemUserPasswordPayload) {
    return this.users.resetUserPassword(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.assignRole)
  @Put('users/:id/roles')
  assignUserRoles(@Param('id') id: string, @Body() body: AssignSystemUserRolesPayload) {
    return this.users.assignUserRoles(readId(id), body);
  }
}
