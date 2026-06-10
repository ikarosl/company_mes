import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

export interface RequestClientOptions {
  baseURL?: string;
  timeoutMs?: number;
  retryTimes?: number;
  retryDelayMs?: number;
  onLoadingChange?: (loading: boolean) => void;
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

  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
    return data.message;
  }

  return error.message || `Request failed with status ${error.response?.status ?? 0}`;
};

const delay = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));
