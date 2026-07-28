import { PERMISSIONS } from '@company/constants';
import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readPagination } from '../../shared/request-utils.js';
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
  listPermissions(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
  ) {
    // 权限管理列表分页查询；权限树接口仍返回完整树，供授权弹窗使用。
    return this.permissions.listPermissions(readPagination(page, pageSize), { keyword });
  }

  @RequirePermission(PERMISSIONS.system.permissions.view)
  @Get('permissions/tree')
  permissionTree() {
    return this.permissions.listPermissionTree();
  }
}
