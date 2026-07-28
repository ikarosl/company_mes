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
import { Audit } from '../../operation-log/audit.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { SystemUserRepository } from './system-user.repository.js';

@UseGuards(PermissionGuard)
@Controller('system')
export class SystemUserController {
  constructor(@Inject(SystemUserRepository) private readonly users: SystemUserRepository) {}

  @RequirePermission(PERMISSIONS.system.users.view)
  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('username') username?: string,
    @Query('displayName') displayName?: string,
    @Query('roleId') roleId?: string,
    @Query('status') status?: string,
  ) {
    // 用户筛选和分页统一交给数据库处理，避免前端只筛选当前已加载的数据。
    return this.users.listUsers(readPagination(page, pageSize), {
      keyword,
      username,
      displayName,
      roleId,
      status,
    });
  }

  @RequirePermission(PERMISSIONS.system.users.create)
  @Audit({
    module: 'system',
    action: '创建系统用户',
    targetType: 'user',
    businessKeyBodyField: 'username',
  })
  @Post('users')
  createUser(@Body() body: CreateSystemUserPayload) {
    return this.users.createUser(body);
  }

  @RequirePermission(PERMISSIONS.system.users.update)
  @Audit({
    module: 'system',
    action: '修改系统用户',
    targetType: 'user',
    targetParams: { userId: 'id' },
  })
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateSystemUserPayload) {
    return this.users.updateUser(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.enable)
  @Audit({
    module: 'system',
    action: '启用系统用户',
    targetType: 'user',
    targetParams: { userId: 'id' },
  })
  @Put('users/:id/enable')
  enableUser(@Param('id') id: string) {
    return this.users.changeUserStatus(readId(id), { status: 1 });
  }

  @RequirePermission(PERMISSIONS.system.users.disable)
  @Audit({
    module: 'system',
    action: '停用系统用户',
    targetType: 'user',
    targetParams: { userId: 'id' },
  })
  @Put('users/:id/disable')
  disableUser(@Param('id') id: string) {
    return this.users.changeUserStatus(readId(id), { status: 0 });
  }

  @RequirePermission(PERMISSIONS.system.users.resetPassword)
  @Audit({
    module: 'system',
    action: '重置用户密码',
    targetType: 'user',
    targetParams: { userId: 'id' },
    captureResponse: false,
  })
  @Put('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body() body: ResetSystemUserPasswordPayload) {
    return this.users.resetUserPassword(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.system.users.assignRole)
  @Audit({
    module: 'system',
    action: '分配用户角色',
    targetType: 'user',
    targetParams: { userId: 'id' },
  })
  @Put('users/:id/roles')
  assignUserRoles(@Param('id') id: string, @Body() body: AssignSystemUserRolesPayload) {
    return this.users.assignUserRoles(readId(id), body);
  }
}
