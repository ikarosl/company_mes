import { PERMISSIONS } from '@company/constants';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AssignSystemUserRolesPayload,
  CreateSystemUserPayload,
  ResetSystemUserPasswordPayload,
  UpdateSystemUserPayload,
  UpdateSystemUserStatusPayload,
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

  @RequirePermission(PERMISSIONS.system.users.write)
  @Post('users')
  createUser(@Body() body: CreateSystemUserPayload) {
    return this.users.createUser(body);
  }

  @RequirePermission(PERMISSIONS.system.users.write)
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateSystemUserPayload) {
    return this.users.updateUser(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.write)
  @Patch('users/:id/status')
  changeUserStatus(@Param('id') id: string, @Body() body: UpdateSystemUserStatusPayload) {
    return this.users.changeUserStatus(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.write)
  @Patch('users/:id/password')
  resetUserPassword(@Param('id') id: string, @Body() body: ResetSystemUserPasswordPayload) {
    return this.users.resetUserPassword(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.write)
  @Put('users/:id/roles')
  assignUserRoles(@Param('id') id: string, @Body() body: AssignSystemUserRolesPayload) {
    return this.users.assignUserRoles(readId(id), body);
  }
}
