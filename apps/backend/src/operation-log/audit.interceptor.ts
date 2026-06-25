import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { catchError, from, mergeMap, Observable, throwError } from 'rxjs';
import type { CurrentUserProfile } from '../auth/current-user.decorator.js';
import { AuditContextService } from './audit-context.service.js';
import { sanitizeAuditData } from './audit-data.js';
import { AUDIT_METADATA_KEY, type AuditOptions } from './audit.decorator.js';
import { OperationLogService } from './operation-log.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuditContextService) private readonly auditContext: AuditContextService,
    @Inject(OperationLogService) private readonly operationLogService: OperationLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<HttpRequest>();
    const response = context.switchToHttp().getResponse<HttpResponse>();

    if (!shouldAudit(request)) {
      return next.handle();
    }

    const startedAt = Date.now();
    const requestId = readRequestId(request);
    const options = this.reflector.getAllAndOverride<AuditOptions | undefined>(AUDIT_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const auditMeta = readAuditMeta(request, options);

    request.auditInterceptorActive = true;
    response.setHeader?.('x-request-id', requestId);

    return new Observable((subscriber) =>
      this.auditContext.run(() =>
        next
          .handle()
          .pipe(
            mergeMap((responseBody) => {
              const durationMs = Date.now() - startedAt;
              const snapshot = this.auditContext.getSnapshot();
              return from(
                this.operationLogService.write({
                  ...auditMeta,
                  userId: request.user?.id ?? null,
                  operatorUsername: request.user?.username ?? null,
                  result: 'success',
                  requestId,
                  httpMethod: request.method,
                  route: readRoute(request),
                  httpStatus: response.statusCode ?? 200,
                  durationMs,
                  requestData: readRequestData(request),
                  beforeData: sanitizeAuditData(snapshot?.beforeData),
                  afterData: sanitizeAuditData(
                    snapshot?.afterData ??
                      (options?.captureResponse === false ? undefined : responseBody),
                  ),
                  ip: readIp(request),
                  userAgent: request.headers['user-agent'] ?? null,
                  remark: `duration=${durationMs}ms`,
                }),
              ).pipe(mergeMap(() => from([responseBody])));
            }),
            catchError((error: unknown) => {
              const durationMs = Date.now() - startedAt;
              const snapshot = this.auditContext.getSnapshot();
              return from(
                this.operationLogService.write({
                  ...auditMeta,
                  userId: request.user?.id ?? null,
                  operatorUsername: request.user?.username ?? null,
                  result: 'failed',
                  requestId,
                  httpMethod: request.method,
                  route: readRoute(request),
                  httpStatus: readHttpStatus(error),
                  durationMs,
                  requestData: readRequestData(request),
                  beforeData: sanitizeAuditData(snapshot?.beforeData),
                  afterData: sanitizeAuditData(snapshot?.afterData),
                  ip: readIp(request),
                  userAgent: request.headers['user-agent'] ?? null,
                  errorCode: readErrorCode(error),
                  remark: error instanceof Error ? error.message : 'request failed',
                }),
              ).pipe(mergeMap(() => throwError(() => error)));
            }),
          )
          .subscribe(subscriber),
      ),
    );
  }
}

interface HttpRequest {
  method: string;
  path?: string;
  originalUrl?: string;
  url?: string;
  baseUrl?: string;
  ip?: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  route?: {
    path?: string;
  };
  user?: CurrentUserProfile;
  auditInterceptorActive?: boolean;
  socket?: {
    remoteAddress?: string;
  };
  headers: {
    authorization?: string;
    ['x-forwarded-for']?: string;
    ['x-request-id']?: string;
    ['user-agent']?: string;
  };
}

interface HttpResponse {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
}

const shouldAudit = (request: HttpRequest) =>
  request.method !== 'GET' &&
  !readPath(request).startsWith('/auth/refresh') &&
  !readPath(request).startsWith('/auth/login');

export const readAuditMeta = (request: HttpRequest, options?: AuditOptions) => {
  const path = readPath(request);
  const segments = path.split('/').filter(Boolean);
  const targetIds = readTargetIds(request, options);
  const firstTargetId = Object.values(targetIds)[0] ?? null;
  const fallbackTargetId = [...segments].reverse().find((segment) => /^\d+$/.test(segment)) ?? null;

  return {
    logType: path.startsWith('/auth') ? 'auth' : 'operation',
    module: options?.module ?? segments[0] ?? 'unknown',
    action: options?.action ?? `${request.method} ${readRoute(request)}`,
    targetId: firstTargetId ?? fallbackTargetId,
    targetType: options?.targetType ?? segments[0] ?? null,
    targetIds: Object.keys(targetIds).length ? targetIds : undefined,
    businessKey: readBusinessKey(request, options),
  };
};

const readTargetIds = (request: HttpRequest, options?: AuditOptions) => {
  const targetIds: Record<string, string> = {};

  if (options?.targetParams) {
    for (const [targetName, paramName] of Object.entries(options.targetParams)) {
      const value = request.params?.[paramName];
      if (value !== null && value !== undefined && value !== '') {
        targetIds[targetName] = String(value);
      }
    }
    return targetIds;
  }

  for (const [name, value] of Object.entries(request.params ?? {})) {
    if (value !== null && value !== undefined && value !== '') {
      targetIds[name] = String(value);
    }
  }

  return targetIds;
};

const readBusinessKey = (request: HttpRequest, options?: AuditOptions) => {
  if (!options?.businessKeyBodyField || !request.body || typeof request.body !== 'object') {
    return null;
  }

  const value = (request.body as Record<string, unknown>)[options.businessKeyBodyField];
  return value === null || value === undefined || value === '' ? null : String(value);
};

const readRequestData = (request: HttpRequest) =>
  sanitizeAuditData({
    params: request.params ?? {},
    query: request.query ?? {},
    body: request.body,
  });

const readRoute = (request: HttpRequest) => {
  const routePath = request.route?.path;
  if (routePath) {
    return `${request.baseUrl ?? ''}${routePath}` || '/';
  }
  return readPath(request);
};

const readPath = (request: HttpRequest) => {
  const path = request.path ?? request.originalUrl ?? request.url ?? '';
  return path.split('?')[0] ?? '';
};

const readRequestId = (request: HttpRequest) => {
  const supplied = request.headers['x-request-id']?.trim();
  return supplied && supplied.length <= 64 ? supplied : randomUUID();
};

const readIp = (request: HttpRequest) => {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return request.ip ?? request.socket?.remoteAddress ?? null;
};

export const readHttpStatus = (error: unknown) => {
  if (error instanceof HttpException) {
    return error.getStatus();
  }

  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    return Number.isInteger(status) ? status : 500;
  }

  return 500;
};

export const readErrorCode = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return null;
  }

  if ('code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string' || typeof code === 'number') {
      return String(code);
    }
  }

  return error.constructor?.name ?? null;
};
