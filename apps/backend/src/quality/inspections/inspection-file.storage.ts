import { BadRequestException } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

/** 检验附件上传对象：由 Multer 内存存储提供文件内容。 */
export interface UploadedInspectionFile {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
}

/** 检验附件最大 20MB，避免本地存储被异常大文件占满。 */
const MAX_INSPECTION_FILE_SIZE = 20 * 1024 * 1024;

/** 当前允许的检验报告、图片和常用办公文档扩展名。 */
const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip',
]);

/**
 * 将检验附件保存到后端本地 uploads/inspections 目录。
 * 返回相对访问地址，后续迁移文件服务器时只需替换本存储实现。
 */
export async function saveInspectionFile(file: UploadedInspectionFile) {
  if (!file?.buffer?.length || !file.originalname) {
    throw new BadRequestException('请选择需要上传的检验文件');
  }
  if ((file.size ?? file.buffer.length) > MAX_INSPECTION_FILE_SIZE) {
    throw new BadRequestException('检验文件不能超过 20MB');
  }

  const originalName = decodeUploadFileName(file.originalname);
  const extension = originalName.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new BadRequestException('仅支持 PDF、图片、Office、CSV、TXT 或 ZIP 文件');
  }

  const uploadsDir = join(process.cwd(), 'uploads', 'inspections');
  await mkdir(uploadsDir, { recursive: true });
  const storageName = `${randomUUID()}-${sanitizeFileName(originalName)}`;
  await writeFile(join(uploadsDir, storageName), file.buffer);

  return { fileName: originalName, fileUrl: `/uploads/inspections/${storageName}` };
}

/** 兼容浏览器 multipart 上传中文文件名时可能出现的 latin1 解码。 */
function decodeUploadFileName(fileName: string) {
  const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? fileName : decoded;
}

/** 清理路径及 Windows 非法字符，UUID 负责避免同名覆盖。 */
function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}
