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
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
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

    const processId = readId(id);
    // 先检查工序是否已投产冻结，避免失败请求在磁盘留下孤儿文件。
    await this.processes.assertProcessSopUploadAllowed(processId);

    const uploadsDir = join(process.cwd(), 'uploads', 'processes');
    await mkdir(uploadsDir, { recursive: true });
    const originalName = decodeUploadFileName(file.originalname);
    // 存储名使用 UUID，展示名仍保留用户原文件名，因此同名文件可以重复上传。
    const fileName = `${randomUUID()}-${sanitizeFileName(originalName)}`;
    const filePath = join(uploadsDir, fileName);

    await writeFile(filePath, file.buffer);
    try {
      const result = await this.processes.uploadProcessSop(processId, {
        sopFileName: originalName,
        sopFileUrl: `/uploads/processes/${fileName}`,
      });
      // 数据库切换成功后再清理无引用的旧本地文件，避免更新失败时丢失原 SOP。
      await removeLocalProcessFile(uploadsDir, result.obsoleteFileUrl);
      return result.process;
    } catch (error) {
      // 数据库保存或并发冻结校验失败时回滚本次新写入文件。
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }
}

/** 只允许删除本系统 process 上传目录内的旧文件，外部地址和历史 /files 地址保持不动。 */
const removeLocalProcessFile = async (uploadsDir: string, fileUrl: string | null) => {
  if (!fileUrl?.startsWith('/uploads/processes/')) {
    return;
  }
  await unlink(join(uploadsDir, basename(fileUrl))).catch(() => undefined);
};

const decodeUploadFileName = (fileName: string) => {
  const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
  // 解码结果包含 Unicode 替换字符时，保留原始文件名，避免中文文件名被二次破坏。
  return decoded.includes('\uFFFD') ? fileName : decoded;
};

const sanitizeFileName = (fileName: string) =>
  fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
