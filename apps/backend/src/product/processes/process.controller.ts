import { PERMISSIONS } from '@company/constants';
import {
  Body,
  BadRequestException,
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
  CreateProcessPayload,
  UpdateProcessPayload,
} from '@company/api-contract';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PermissionGuard } from '../../auth/permission.guard.js';
import { RequirePermission } from '../../auth/require-permission.decorator.js';
import { readId, readPagination } from '../../shared/request-utils.js';
import { ProcessRepository } from './process.repository.js';

interface UploadedSopFile {
  originalname: string;
  buffer: Buffer;
}

@UseGuards(PermissionGuard)
@Controller()
export class ProcessController {
  constructor(@Inject(ProcessRepository) private readonly processes: ProcessRepository) {}

  @RequirePermission(PERMISSIONS.product.processes.view)
  @Get('processes')
  listProcesses(
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.processes.listProcesses({ keyword, status }, readPagination(page, pageSize));
  }

  @RequirePermission(PERMISSIONS.product.processes.view)
  @Get('processes/options')
  listProcessOptions() {
    return this.processes.listProcessOptions();
  }

  @RequirePermission(PERMISSIONS.product.processes.detail)
  @Get('processes/:id')
  getProcess(@Param('id') id: string) {
    return this.processes.getProcess(readId(id));
  }

  @RequirePermission(PERMISSIONS.product.processes.create)
  @Post('processes')
  createProcess(@Body() body: CreateProcessPayload) {
    return this.processes.createProcess(body);
  }

  @RequirePermission(PERMISSIONS.product.processes.update)
  @Put('processes/:id')
  updateProcess(@Param('id') id: string, @Body() body: UpdateProcessPayload) {
    return this.processes.updateProcess(readId(id), body);
  }

  @RequirePermission(PERMISSIONS.product.processes.enable)
  @Put('processes/:id/enable')
  enableProcess(@Param('id') id: string) {
    return this.processes.changeProcessStatus(readId(id), 1);
  }

  @RequirePermission(PERMISSIONS.product.processes.disable)
  @Put('processes/:id/disable')
  disableProcess(@Param('id') id: string) {
    return this.processes.changeProcessStatus(readId(id), 0);
  }

  @RequirePermission(PERMISSIONS.product.processes.uploadSop)
  @Post('processes/:id/sop')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProcessSop(@Param('id') id: string, @UploadedFile() file: UploadedSopFile) {
    if (!file?.buffer) {
      throw new BadRequestException('Missing upload file');
    }

    const uploadsDir = join(process.cwd(), 'uploads', 'processes');
    await mkdir(uploadsDir, { recursive: true });
    const originalName = decodeUploadFileName(file.originalname);
    const fileName = `${Date.now()}-${sanitizeFileName(originalName)}`;
    const filePath = join(uploadsDir, fileName);

    // 文件存储方案未最终确定，当前先写入本地 uploads/processes，并返回静态访问地址。
    await writeFile(filePath, file.buffer);

    return this.processes.uploadProcessSop(readId(id), {
      sopFileName: originalName,
      sopFileUrl: `/uploads/processes/${fileName}`,
    });
  }
}

const decodeUploadFileName = (fileName: string) => {
  const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
  return decoded.includes('�') ? fileName : decoded;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
