import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service.js';
import { OperationLogService } from './operation-log.service.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(OperationLogService) private readonly operationLogService: OperationLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<HttpRequest>();

    if (!shouldAudit(request)) {
      return next.handle();
    }

    const startedAt = Date.now();
    const auditMeta = readAuditMeta(request);
    const userIdPromise = this.readUserId(request);

    return next.handle().pipe(
      tap((responseBody) => {
        void userIdPromise.then((userId) =>
          this.operationLogService.write({
            ...auditMeta,
            userId,
            result: 'success',
            afterData: shrinkResponse(responseBody),
            ip: readIp(request),
            remark: `duration=${Date.now() - startedAt}ms`,
          }),
        );
      }),
      catchError((error: unknown) =>
        throwError(() => {
          void userIdPromise.then((userId) =>
            this.operationLogService.write({
              ...auditMeta,
              userId,
              result: 'failed',
              ip: readIp(request),
              remark: error instanceof Error ? error.message : 'request failed',
            }),
          );
          return error;
        }),
      ),
    );
  }

  private async readUserId(request: HttpRequest) {
    try {
      const token = readBearerToken(request.headers.authorization);
      if (!token) {
        return null;
      }

      const claims = await this.authService.verifyAccessToken(token);
      return claims.sub;
    } catch {
      return null;
    }
  }
}

interface HttpRequest {
  method: string;
  path?: string;
  originalUrl?: string;
  url?: string;
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  headers: {
    authorization?: string;
    ['x-forwarded-for']?: string;
  };
}

const shouldAudit = (request: HttpRequest) =>
  request.method !== 'GET' &&
  !readPath(request).startsWith('/auth/refresh') &&
  !readPath(request).startsWith('/auth/login');

const readAuditMeta = (request: HttpRequest) => {
  const path = readPath(request);
  const segments = path.split('/').filter(Boolean);
  const targetId = [...segments].reverse().find((segment) => /^\d+$/.test(segment)) ?? null;

  return {
    logType: path.startsWith('/auth') ? 'auth' : 'operation',
    module: segments[0] ?? 'unknown',
    action: `${request.method} ${path}`,
    targetId,
    targetType: segments[0] ?? null,
  };
};

const readPath = (request: HttpRequest) => request.path ?? request.originalUrl ?? request.url ?? '';

const readBearerToken = (authorization?: string) => {
  const [scheme, token] = authorization?.split(' ') ?? [];
  return scheme === 'Bearer' ? token : null;
};

const readIp = (request: HttpRequest) => {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return request.ip ?? request.socket?.remoteAddress ?? null;
};

const shrinkResponse = (responseBody: unknown) => {
  if (!responseBody || typeof responseBody !== 'object') {
    return responseBody;
  }

  const record = responseBody as Record<string, unknown>;
  return {
    id: record.id,
    success: record.success,
    status: record.status,
    result: record.result,
  };
};
