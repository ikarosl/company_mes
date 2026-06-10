import { AxiosHeaders, type AxiosError, type AxiosInstance } from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  TokenPair,
  UserProfile,
  ValidateTokenResponse,
} from '@company/api-contract';
import { toRequestError, type RetryRequestConfig } from '@company/request';

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthClientOptions {
  request: AxiosInstance;
  api: AuthApi;
  getSession: () => AuthSession | null;
  setSession: (session: AuthSession | null) => void;
}

export interface AuthApi {
  login: (payload: LoginRequest) => Promise<LoginResponse>;
  refresh: () => Promise<RefreshResponse>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<UserProfile>;
  validateToken: () => Promise<ValidateTokenResponse>;
}

export interface AuthRequestConfig extends RetryRequestConfig {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

const REFRESH_LEEWAY_MS = 30_000;

export class AuthClient {
  private readonly http: AxiosInstance;
  private readonly api: AuthApi;
  private readonly getSessionState: () => AuthSession | null;
  private readonly setSessionState: (session: AuthSession | null) => void;
  private refreshPromise: Promise<AuthSession> | null = null;

  constructor(options: AuthClientOptions) {
    this.http = options.request;
    this.api = options.api;
    this.getSessionState = options.getSession;
    this.setSessionState = options.setSession;
    this.setupAuthInterceptors();
  }

  async login(payload: LoginRequest) {
    const data = await this.api.login(payload);
    return this.setSession(data);
  }

  logout() {
    this.setSessionState(null);
    void this.api.logout().catch(() => undefined);
  }

  async getCurrentUser() {
    return this.api.getCurrentUser();
  }

  async validateToken() {
    const result = await this.api.validateToken();
    const session = this.getSessionState();
    if (session) {
      this.setSessionState({ ...session, user: result.user });
    }
    return result;
  }

  private setupAuthInterceptors() {
    /**
     * 请求拦截器 - 添加认证头
     *
     * @remarks
     * - config 参数由 Axios 自动推断类型，无需显式声明
     * - 类型断言 `as typeof config & AuthRequestConfig` 扩展了 config 的类型，
     *   允许访问自定义的 skipAuth 和 skipRefresh 属性
     * - AxiosHeaders.from(config?.headers) 的作用：
     *   - 如果 headers 为 undefined，返回空的 AxiosHeaders 对象
     *   - 如果 headers 为普通对象或字符串，转换为 AxiosHeaders 实例
     *   - AxiosHeaders 是一个"加强版对象"，提供了 set/get/has/delete 等便捷方法
     * - 最终返回的 config 中，headers 被转换为 AxiosHeaders 类实例，
     *   Axios 在发送请求时会自动处理其转换为普通对象格式
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader
     */
    this.http.interceptors.request.use(async (config) => {
      const authConfig = config as typeof config & AuthRequestConfig;

      if (!authConfig?.skipAuth) {
        const session = await this.ensureFreshAccessToken();
        authConfig.headers = AxiosHeaders.from(authConfig?.headers);
        authConfig.headers.set('Authorization', `Bearer ${session.accessToken}`);
      }

      return authConfig;
    });

    this.http.interceptors.response.use(undefined, async (error: AxiosError) => {
      const config = error.config as
        | (NonNullable<AxiosError['config']> & AuthRequestConfig)
        | undefined;

      if (config && error.response?.status === 401 && !config.skipAuth && !config.skipRefresh) {
        try {
          const session = await this.refresh();
          config.headers = AxiosHeaders.from(config.headers);
          config.headers.set('Authorization', `Bearer ${session.accessToken}`);
          config.skipRefresh = true;
          return this.http.request(config);
        } catch (refreshError) {
          this.logout();
          throw toRequestError(refreshError);
        }
      }

      throw error;
    });
  }
  /**
   * 确定访问令牌是有效的，如果即将过期则尝试刷新，未过期则直接返回存储的会话信息
   * @returns
   */
  private async ensureFreshAccessToken() {
    const session = this.getSessionState();
    if (!session) {
      throw new Error('Not authenticated');
    }

    if (isAccessTokenExpiring(session)) {
      return this.refresh();
    }

    return session;
  }
  /**
   * 刷新访问令牌并更新会话状态，如果刷新失败则清除会话状态
   * @returns
   */
  private async refresh() {
    const session = this.getSessionState();
    if (!session) {
      throw new Error('Not authenticated');
    }

    this.refreshPromise ??= this.api
      .refresh()
      .then((data) => this.setSession(data))
      .catch((error: unknown) => {
        this.logout();
        throw error;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  private setSession(data: TokenPair & { user: UserProfile }): AuthSession {
    const session = {
      user: data.user,
      accessToken: data.accessToken,
      accessTokenExpiresAt: data.accessTokenExpiresAt,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt,
    };
    this.setSessionState(session);
    return session;
  }
}

const isAccessTokenExpiring = (session: AuthSession) => {
  const expiresAt = Date.parse(session.accessTokenExpiresAt);
  return Number.isNaN(expiresAt) || expiresAt - Date.now() <= REFRESH_LEEWAY_MS;
};
