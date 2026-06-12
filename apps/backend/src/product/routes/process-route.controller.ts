import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import type {
  ConfigureProcessRouteStepsPayload,
  CreateProcessRoutePayload,
  UpdateProcessRoutePayload,
} from '@company/api-contract';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProcessRouteRepository } from './process-route.repository.js';

@UseGuards(PermissionGuard)
@Controller()
export class ProcessRouteController {
  constructor(@Inject(ProcessRouteRepository) private readonly routes: ProcessRouteRepository) {}

  @RequirePermission(PERMISSIONS.product.routes.view)
  @Get('routes')
  listRoutes(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.routes.listRoutes({ keyword, status }, readPagination(page, pageSize));
  }

  @RequirePermission(PERMISSIONS.product.routes.detail)
  @Get('routes/:id')
  getRoute(@Param('id') id: string) {
    return this.routes.getRoute(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.routes.create)
  @Post('routes')
  createRoute(@Body() body: CreateProcessRoutePayload) {
    return this.routes.createRoute(body);
  }

  @RequirePermission(PERMISSIONS.product.routes.update)
  @Put('routes/:id')
  updateRoute(@Param('id') id: string, @Body() body: UpdateProcessRoutePayload) {
    return this.routes.updateRoute(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.product.routes.delete)
  @Delete('routes/:id')
  deleteRoute(@Param('id') id: string) {
    return this.routes.deleteRoute(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.routes.enable)
  @Put('routes/:id/enable')
  enableRoute(@Param('id') id: string) {
    return this.routes.changeRouteStatus(readId(id), 1);
  }

  @RequirePermission(PERMISSIONS.product.routes.disable)
  @Put('routes/:id/disable')
  disableRoute(@Param('id') id: string) {
    return this.routes.changeRouteStatus(readId(id), 0);
  }

  @RequirePermission(PERMISSIONS.product.routes.configProcesses)
  @Put('routes/:id/processes')
  configureRouteSteps(@Param('id') id: string, @Body() body: ConfigureProcessRouteStepsPayload) {
    return this.routes.configureRouteSteps(readId(id), body);
  }
}
