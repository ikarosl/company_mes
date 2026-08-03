import type { CreateInspectionPayload, CreateReworkPayload, UpdateInspectionPayload } from '@company/api-contract';
import { PERMISSIONS } from '@company/constants';
import { Body, Controller, Get, Inject, Param, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../auth/current-user.decorator.js';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { Audit } from '../../operation-log/audit.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { InspectionRepository } from './inspection.repository.js';
import { ReworkRepository } from '../reworks/rework.repository.js';
import { saveInspectionFile, type UploadedInspectionFile } from './inspection-file.storage.js';

@UseGuards(PermissionGuard)
@Controller('quality/inspections')
export class InspectionController {
  constructor(
    @Inject(InspectionRepository) private readonly inspections: InspectionRepository,
    @Inject(ReworkRepository) private readonly reworks: ReworkRepository,
  ) {}

  @RequirePermission(PERMISSIONS.quality.inspections.view)
  @Get()
  list(
    @Query('keyword') keyword?: string,
    @Query('inspectionType') inspectionType?: string,
    @Query('result') result?: string,
    @Query('batchId') batchId?: string,
    @Query('materialBatchId') materialBatchId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.inspections.list(
      { keyword, inspectionType, result, batchId, materialBatchId },
      readPagination(page, pageSize),
    );
  }

  @RequirePermission(PERMISSIONS.quality.inspections.view)
  @Get('targets')
  targets(
    @Query('targetType') targetType?: string,
    @Query('batchId') batchId?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.inspections.listTargets(targetType, batchId, keyword);
  }

  /** 上传检验附件到后端本地目录，返回可写入检验记录的访问地址。 */
  @RequirePermission(PERMISSIONS.quality.inspections.uploadFile)
  @Post('files')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: UploadedInspectionFile) {
    return saveInspectionFile(file);
  }

  @RequirePermission(PERMISSIONS.quality.inspections.detail)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.inspections.get(readId(id));
  }

  @RequirePermission(PERMISSIONS.quality.inspections.create)
  @Audit({ module: 'quality', action: '新增检验记录', targetType: 'inspection_record' })
  @Post()
  create(@Body() body: CreateInspectionPayload, @CurrentUser('id') userId: string) {
    return this.inspections.create(body, Number(userId));
  }

  @RequirePermission(PERMISSIONS.quality.inspections.update)
  @Audit({ module: 'quality', action: '编辑检验记录', targetType: 'inspection_record' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateInspectionPayload,
    @CurrentUser('id') userId: string,
  ) {
    return this.inspections.update(readId(id), body, Number(userId));
  }

  @RequirePermission(PERMISSIONS.quality.inspections.createRework)
  @Audit({ module: 'quality', action: '从检验创建返工单', targetType: 'rework_record' })
  @Post(':id/rework')
  createRework(
    @Param('id') id: string,
    @Body() body: Omit<CreateReworkPayload, 'sourceInspectionId'>,
    @CurrentUser('id') userId: string,
  ) {
    return this.reworks.create(
      { ...body, sourceInspectionId: String(readId(id)) },
      Number(userId),
    );
  }
}
