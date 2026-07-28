import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';

/**
 * 后端请求字符串清理中间件。
 * 在 Controller 读取参数前递归去除 body 和 query 中所有字符串的首尾空格，
 * 防止非管理端客户端绕过前端清理后写入带空格的数据。
 */
@Injectable()
export class TrimRequestValuesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      body?: unknown;
      query?: Record<string, unknown>;
    }>();

    if (request.body !== undefined) {
      request.body = trimValue(request.body);
    }
    trimValue(request.query);
    return next.handle();
  }
}

/** 递归清理普通对象和数组；文件、日期、Buffer 等特殊对象保持原样。 */
export function trimValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = trimValue(item);
    });
    return value;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  Object.entries(value).forEach(([key, item]) => {
    value[key] = trimValue(item);
  });
  return value;
}

/** 仅处理 JSON/查询参数普通对象，避免递归处理框架或二进制对象。 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
}
