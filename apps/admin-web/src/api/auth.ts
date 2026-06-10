import { AUTH_API, type LoginRequest } from '@company/api-contract';
import {
  AuthClient,
  type AuthApi,
  type AuthClientOptions,
  type AuthRequestConfig,
} from '@company/auth-client';
import { toRequestError } from '@company/request';
import { httpClient } from './shared/http-client';

const authRequest = async <T>(config: AuthRequestConfig) => {
  try {
    const response = await httpClient.request<T>(config);
    return response.data;
  } catch (error) {
    throw toRequestError(error);
  }
};

export const authApi: AuthApi = {
  /**
   * 用户登录接口
   *
   * @remarks
   * - 显式设置 withCredentials: true 是为了确保在所有场景下都能正确处理 Cookie
   * - 当前是同域架构（baseURL: '/api'），Cookie 会自动携带，此设置是冗余的但无害
   * - 未来如果迁移到独立认证中心（跨域架构），此设置将成为必需项
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
   */
  login: (payload: LoginRequest) =>
    authRequest({
      url: AUTH_API.login,
      method: 'POST',
      data: payload,
      skipAuth: true,
      skipRefresh: true,
      withCredentials: true,
    }),

  /**
   * 刷新 Token 接口
   *
   * @remarks
   * - 需要发送 refreshToken Cookie 来获取新的 accessToken
   * - withCredentials: true 确保 refreshToken Cookie 被附加到请求中
   * - 当前同域架构下 Cookie 会自动附加，但显式声明能提高代码可读性和规范性
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
   */
  refresh: () =>
    authRequest({
      url: AUTH_API.refresh,
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
      withCredentials: true,
    }),

  /**
   * 用户登出接口
   *
   * @remarks
   * - 后端会清除 refreshToken Cookie
   * - withCredentials: true 确保登出请求能被正确处理
   */
  logout: async () => {
    await authRequest({
      url: AUTH_API.logout,
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
      withCredentials: true,
    });
  },

  getCurrentUser: () =>
    authRequest({
      url: AUTH_API.me,
      method: 'GET',
    }),

  validateToken: () =>
    authRequest({
      url: AUTH_API.validate,
      method: 'GET',
    }),
};

export const createAuthClient = (
  sessionAccessors: Pick<AuthClientOptions, 'getSession' | 'setSession'>,
) =>
  new AuthClient({
    request: httpClient,
    api: authApi,
    ...sessionAccessors,
  });
