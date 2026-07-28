import { ArgumentsHost, Catch, HttpException, Inject } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { CurrentUserProfile } from '../auth/current-user.decorator.js';
import { sanitizeAuditData } from './audit-data.js';
import { OperationLogService } from './operation-log.service.js';

@Catch()
export class AuditExceptionFilter extends BaseExceptionFilter {
  constructor(
    @Inject(HttpAdapterHost) private readonly adapterHost: HttpAdapterHost,
    @Inject(OperationLogService) private readonly operationLogService: OperationLogService,
  ) {
    super(adapterHost.httpAdapter);
  }

  override async catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<FilterRequest>();
    const response = context.getResponse();
    const status = readHttpStatus(exception);
    const requestId = readRequestId(request);
    const path = readPath(request);

    if (!request.auditInterceptorActive && !readPath(request).startsWith('/auth/login')) {
      await this.operationLogService.write({
        logType: 'security',
        module: readModule(request),
        action: `${request.method} ${path}`,
        userId: request.user?.id ?? null,
        operatorUsername: request.user?.username ?? null,
        result: 'failed',
        requestId,
        httpMethod: request.method,
        route: path,
        httpStatus: status,
        requestData: sanitizeAuditData({
          params: request.params ?? {},
          query: request.query ?? {},
        }),
        ip: readIp(request),
        userAgent: request.headers['user-agent'] ?? null,
        errorCode: readErrorCode(exception),
        remark: exception instanceof Error ? exception.message : 'request rejected',
      });
    }

    // Return one stable error contract so every client can display the business reason directly.
    this.adapterHost.httpAdapter.reply(
      response,
      {
        success: false,
        statusCode: status,
        code: readErrorCode(exception) ?? `HTTP_${status}`,
        message: readClientMessage(exception, status),
        requestId,
        path,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

interface FilterRequest {
  method: string;
  path?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  auditInterceptorActive?: boolean;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  user?: CurrentUserProfile;
  socket?: {
    remoteAddress?: string;
  };
  headers: {
    ['x-forwarded-for']?: string;
    ['x-request-id']?: string;
    ['user-agent']?: string;
  };
}

const readPath = (request: FilterRequest) =>
  (request.path ?? request.originalUrl ?? request.url ?? '').split('?')[0] ?? '';

const readModule = (request: FilterRequest) =>
  readPath(request).split('/').filter(Boolean)[0] ?? 'unknown';

const readRequestId = (request: FilterRequest) => {
  const supplied = request.headers['x-request-id']?.trim();
  return supplied && supplied.length <= 64 ? supplied : randomUUID();
};

const readIp = (request: FilterRequest) => {
  const forwarded = request.headers['x-forwarded-for'];
  return forwarded?.split(',')[0]?.trim() ?? request.ip ?? request.socket?.remoteAddress ?? null;
};

const readHttpStatus = (error: unknown) =>
  error instanceof HttpException ? error.getStatus() : 500;

/** Read Nest exceptions without exposing internal server errors to clients. */
const readClientMessage = (error: unknown, status: number) => {
  if (!(error instanceof HttpException)) {
    return '\u7cfb\u7edf\u7e41\u5fd9\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';
  }

  const response = error.getResponse();
  if (typeof response === 'string' && response.trim()) {
    return localizeClientMessage(response, status);
  }
  if (response && typeof response === 'object' && 'message' in response) {
    const message = (response as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return localizeClientMessage(message, status);
    }
    if (Array.isArray(message)) {
      const messages = message.filter(
        (item): item is string => typeof item === 'string' && Boolean(item.trim()),
      );
      if (messages.length > 0) {
        return messages.map((item) => localizeClientMessage(item, status)).join('\uff1b');
      }
    }
  }

  return status >= 500
    ? '\u7cfb\u7edf\u7e41\u5fd9\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5'
    : localizeClientMessage(error.message, status);
};

/** Convert historical English business errors before they reach any frontend client. */
const localizeClientMessage = (message: string, status: number) => {
  const translations: Record<string, string> = {
    'Product model already exists': '产品型号已存在，请更换后重试',
    'Username already exists': '用户账号已存在',
    'Route code already exists': '工艺路线编码已存在',
    'Process code already exists': '工序编码已存在',
    'Product category already exists': '产品分类已存在',
    'Material batch no already exists': '物料批次号已存在',
    'Task batch no already exists': '生产批次号已存在',
    'Invalid username or password': '账号或密码错误',
    'Permission denied': '没有权限执行此操作',
    'User is disabled or no longer exists': '用户已停用或不存在',
    'Work order not found': '工单不存在',
    'Production task not found': '生产任务不存在',
    'Production batch not found': '生产批次不存在',
    'Product not found': '产品不存在',
    'Product category not found': '产品分类不存在',
    'Process route not found': '工艺路线不存在',
    'Process not found': '工序不存在',
    'Material batch not found': '物料批次不存在',
    'Role not found': '角色不存在',
    'User not found': '用户不存在',
  };
  if (translations[message]) return translations[message];
  if (/[^\x00-\x7F]/.test(message)) return message;
  if (status === 401) return '登录状态已失效，请重新登录';
  if (status === 403) return '没有权限执行此操作';
  if (status === 404) return '请求的数据不存在或已删除';
  if (status === 409) return '数据已存在或当前状态冲突';
  return '请求参数或当前状态不正确，请检查后重试';
};

const readErrorCode = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' || typeof code === 'number') {
      return String(code);
    }
  }
  return error instanceof Error ? error.constructor.name : null;
};
