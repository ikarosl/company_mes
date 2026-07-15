import type { AssignReworkHandlerPayload, CreateReworkPayload, CreateReworkRecheckPayload, SubmitReworkResultPayload, UpdateReworkPayload } from '@company/api-contract';
import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ReworkRepository } from './rework.repository.js';

@UseGuards(PermissionGuard)
@Controller('quality/reworks')
export class ReworkController {
  constructor(@Inject(ReworkRepository) private readonly reworks: ReworkRepository) {}
  @RequirePermission(PERMISSIONS.quality.reworks.view)
  @Get()
  list(@Query('keyword') keyword?:string,@Query('status') status?:string,@Query('sourceInspectionId') sourceInspectionId?:string,@Query('handlerId') handlerId?:string,@Query('page') page?:string,@Query('pageSize') pageSize?:string){return this.reworks.list({keyword,status,sourceInspectionId,handlerId},readPagination(page,pageSize));}
  @RequirePermission(PERMISSIONS.quality.reworks.detail)
  @Get(':id') get(@Param('id') id:string){return this.reworks.get(readId(id));}
  @RequirePermission(PERMISSIONS.quality.reworks.create)
  @Audit({module:'quality',action:'创建返工单',targetType:'rework_record'})
  @Post() create(@Body() body:CreateReworkPayload,@CurrentUser('id') userId:string){return this.reworks.create(body,Number(userId));}
  @RequirePermission(PERMISSIONS.quality.reworks.update)
  @Audit({module:'quality',action:'编辑返工单',targetType:'rework_record'})
  @Put(':id') update(@Param('id') id:string,@Body() body:UpdateReworkPayload,@CurrentUser('id') userId:string){return this.reworks.update(readId(id),body,Number(userId));}
  @RequirePermission(PERMISSIONS.quality.reworks.assignOwner)
  @Audit({module:'quality',action:'分配返工处理人',targetType:'rework_record'})
  @Put(':id/owner') assign(@Param('id') id:string,@Body() body:AssignReworkHandlerPayload,@CurrentUser('id') userId:string){return this.reworks.assignHandler(readId(id),body,Number(userId));}
  @RequirePermission(PERMISSIONS.quality.reworks.submitResult)
  @Audit({module:'quality',action:'提交返工结果',targetType:'rework_record'})
  @Put(':id/result') submitResult(@Param('id') id:string,@Body() body:SubmitReworkResultPayload,@CurrentUser('id') userId:string){return this.reworks.submitResult(readId(id),body,Number(userId));}
  @RequirePermission(PERMISSIONS.quality.reworks.reinspect)
  @Audit({module:'quality',action:'返工复检',targetType:'rework_record'})
  @Post(':id/reinspect') reinspect(@Param('id') id:string,@Body() body:CreateReworkRecheckPayload,@CurrentUser('id') userId:string){return this.reworks.reinspect(readId(id),body,Number(userId));}
}
