import { PERMISSIONS } from '@company/constants';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type {
  CreateProductionTaskPayload,
  DispatchTaskPayload,
  UpdateBatchStepRecordPayload,
  UpdateProductionBatchPayload,
} from '@company/api-contract';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProductionTaskRepository } from './production-task.repository.js';

interface UploadedSopFile {
  originalname: string;
  buffer: Buffer;
}

@UseGuards(PermissionGuard)
@Controller('tasks')
export class ProductionTaskController {
  constructor(@Inject(ProductionTaskRepository) private readonly tasks: ProductionTaskRepository) {}

  @RequirePermission(PERMISSIONS.production.tasks.view)
  @Get()
  listTasks(
    @Query('keyword') keyword?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('ownerId') ownerId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.tasks.listTasks({ keyword, productId, status, ownerId }, readPagination(page, pageSize));
  }

  @RequirePermission(PERMISSIONS.production.tasks.create)
  @Get('create-preview')
  previewCreateTask(
    @Query('workOrderId') workOrderId?: string,
    @Query('routeId') routeId?: string,
    @Query('plannedQuantity') plannedQuantity?: string,
  ) {
    return this.tasks.previewCreateTask(readId(workOrderId ?? ''), routeId ? readId(routeId) : null, plannedQuantity);
  }

  @RequirePermission(PERMISSIONS.production.tasks.create)
  @Post()
  createTask(@Body() body: CreateProductionTaskPayload) {
    return this.tasks.createTask(body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.detail)
  @Get(':id')
  getTask(@Param('id') id: string) {
    return this.tasks.getTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.update)
  @Put(':id')
  updateTask(@Param('id') id: string, @Body() body: UpdateProductionBatchPayload) {
    return this.tasks.updateTask(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.generateMaterialDemand)
  @Get(':id/material-demand-preview')
  previewMaterialDemand(@Param('id') id: string) {
    return this.tasks.previewMaterialDemand(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.generateMaterialDemand)
  @Post(':id/material-demand')
  generateMaterialDemand(@Param('id') id: string) {
    return this.tasks.generateMaterialDemand(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Get(':id/dispatch-preview')
  previewDispatch(@Param('id') id: string) {
    return this.tasks.previewDispatch(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Post(':id/dispatch')
  dispatchTask(@Param('id') id: string, @Body() body: DispatchTaskPayload) {
    return this.tasks.dispatchTask(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.start)
  @Get(':id/start-preview')
  previewStartTask(@Param('id') id: string) {
    return this.tasks.previewStartTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.start)
  @Put(':id/start')
  startTask(@Param('id') id: string) {
    return this.tasks.startTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.finish)
  @Put(':id/finish')
  finishTask(@Param('id') id: string) {
    return this.tasks.finishTask(readId(id));
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Put(':id/steps/:recordId')
  updateStepRecord(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() body: UpdateBatchStepRecordPayload,
  ) {
    return this.tasks.updateStepRecord(readId(id), readId(recordId), body);
  }

  @RequirePermission(PERMISSIONS.production.tasks.dispatch)
  @Post(':id/steps/:recordId/sop')
  @UseInterceptors(FileInterceptor('file'))
  async uploadStepSop(
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @UploadedFile() file: UploadedSopFile,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Missing upload file');
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'batch-steps');
    await mkdir(uploadsDir, { recursive: true });
    const originalName = decodeUploadFileName(file.originalname);
    const fileName = `${Date.now()}-${sanitizeFileName(originalName)}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, file.buffer);

    return this.tasks.uploadStepSop(readId(id), readId(recordId), {
      sopFileName: originalName,
      sopFileUrl: `/uploads/batch-steps/${fileName}`,
    });
  }
}

const decodeUploadFileName = (fileName: string) => {
  const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
  // 浏览器上传的中文文件名可能按 latin1 传输；解码产生替换字符时保留原文件名。
  return decoded.includes('\uFFFD') ? fileName : decoded;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
