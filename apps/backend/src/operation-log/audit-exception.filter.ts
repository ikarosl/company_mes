import { ArgumentsHost, Catch, HttpException, Inject } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import type { CurrentUserProfile } from '../auth/current-user.decorator.js';
import { sanitizeAuditData } from './audit-data.js';
import { OperationLogService } from './operation-log.service.js';

@Catch()
export class AuditExceptionFilter extends BaseExceptionFilter {
  constructor(
    @Inject(HttpAdapterHost) httpAdapterHost: HttpAdapterHost,
    @Inject(OperationLogService) private readonly operationLogService: OperationLogService,
  ) {
    super(httpAdapterHost.httpAdapter);
  }

  override async catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<FilterRequest>();

    if (!request.auditInterceptorActive && !readPath(request).startsWith('/auth/login')) {
      const status = readHttpStatus(exception);
      await this.operationLogService.write({
        logType: 'security',
        module: readModule(request),
        action: `${request.method} ${readPath(request)}`,
        userId: request.user?.id ?? null,
        operatorUsername: request.user?.username ?? null,
        result: 'failed',
        requestId: readRequestId(request),
        httpMethod: request.method,
        route: readPath(request),
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

    super.catch(exception, host);
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

const readErrorCode = (error: unknown) => {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' || typeof code === 'number') {
      return String(code);
    }
  }
  return error instanceof Error ? error.constructor.name : null;
};
