import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

/** 请求客户端创建参数，允许业务端注入超时、重试和加载状态策略。 */
export interface RequestClientOptions {
  baseURL?: string;
  timeoutMs?: number;
  retryTimes?: number;
  retryDelayMs?: number;
  onLoadingChange?: (loading: boolean) => void;
  /** 请求重试结束后仍失败时的统一回调，用于业务端展示错误提示。 */
  onError?: (error: RequestError) => void;
}

export interface RetryRequestConfig extends AxiosRequestConfig {
  retryTimes?: number;
  retryCount?: number;
  skipRetry?: boolean;
}

type InternalRetryRequestConfig = InternalAxiosRequestConfig & RetryRequestConfig;

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_TIMES = 2;
const DEFAULT_RETRY_DELAY_MS = 300;

export class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: AxiosResponse,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

export const createRequestClient = (options: RequestClientOptions = {}) => {
  const retryTimes = options.retryTimes ?? DEFAULT_RETRY_TIMES;
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  let loadingCount = 0;

  const setLoading = (loading: boolean) => {
    loadingCount += loading ? 1 : -1;
    loadingCount = Math.max(loadingCount, 0);
    options.onLoadingChange?.(loadingCount > 0);
  };

  const http = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  });

  http.interceptors.request.use((config) => {
    // 所有业务请求统一去除字符串首尾空格，包含查询参数、数组和嵌套表单字段。
    config.params = trimRequestValue(config.params);
    config.data = trimRequestValue(config.data);
    setLoading(true);
    return config;
  });

  http.interceptors.response.use(
    (response) => {
      setLoading(false);
      return response;
    },
    async (error: AxiosError) => {
      setLoading(false);
      const config = error.config as InternalRetryRequestConfig | undefined;

      if (config && shouldRetry(error, config, retryTimes)) {
        config.retryCount = (config.retryCount ?? 0) + 1;
        await delay(retryDelayMs * config.retryCount);
        return http.request(config);
      }

      // 最终失败统一转换错误并通知业务端，避免未单独 catch 的请求静默失败。
      const requestError = toRequestError(error) as RequestError;
      options.onError?.(requestError);
      return Promise.reject(error);
    },
  );

  return http;
};

export const toRequestError = (error: unknown) => {
  if (error instanceof RequestError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const message = readErrorMessage(error);
    return new RequestError(message, error.response?.status ?? 0, error.response);
  }

  return error instanceof Error ? error : new Error('Request failed');
};

const shouldRetry = (
  error: AxiosError,
  config: InternalRetryRequestConfig,
  defaultRetryTimes: number,
) => {
  if (config.skipRetry) {
    return false;
  }

  const retryTimes = config.retryTimes ?? defaultRetryTimes;
  const retryCount = config.retryCount ?? 0;
  const status = error.response?.status;
  return retryCount < retryTimes && (!status || status >= 500);
};

const readErrorMessage = (error: AxiosError) => {
  const data = error.response?.data;

  if (data && typeof data === 'object' && 'message' in data) {
    const message = data.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(message)) {
      const messages = message.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
      if (messages.length > 0) {
        return messages.join('；');
      }
    }
  }

  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? '请求超时，请稍后重试'
      : '网络连接失败，请检查网络或服务状态';
  }

  return `请求失败（HTTP ${error.response.status}）`;
};

const delay = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/**
 * 递归清理请求值中的字符串首尾空格。
 * 文件、日期和二进制对象保持原样；FormData 仅替换其中的文本字段。
 */
export const trimRequestValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value.map(trimRequestValue);
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const normalized = new FormData();
    value.forEach((item, key) => {
      normalized.append(key, typeof item === 'string' ? item.trim() : item);
    });
    return normalized;
  }

  if (typeof URLSearchParams !== 'undefined' && value instanceof URLSearchParams) {
    const normalized = new URLSearchParams();
    value.forEach((item, key) => normalized.append(key, item.trim()));
    return normalized;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, trimRequestValue(item)]),
  );
};

/** 只递归普通请求对象，避免改写 Blob、Date、ArrayBuffer 等特殊实例。 */
const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value) as object | null;
  return prototype === Object.prototype || prototype === null;
};
