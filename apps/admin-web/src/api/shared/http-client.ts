import NProgress from 'nprogress';
import { createRequestClient } from '@company/request';
import { EMessage } from '../../utils/message';

NProgress.configure({ showSpinner: false });

/**
 * HTTP 请求客户端实例
 *
 * @remarks
 * - 使用相对路径 baseURL: '/api'，表示当前是同域架构
 * - 前端和后端 API 在同一源（同协议、同域名、同端口）
 * - 由于是同域请求，Cookie 会自动在请求头中携带（浏览器默认行为）
 * - 不需要显式设置 withCredentials，但为了代码规范和未来架构扩展，
 *   某些敏感接口（login, refresh, logout）仍显式设置 withCredentials: true
 *
 * @example
 * // 同域请求示例 - Cookie 自动附加
 * const response = await request.get('/api/user');
 * // Request 自动包含: Cookie: refreshToken=xxx; sessionId=yyy
 *
 * @example
 * // 未来如果需要独立认证中心（跨域架构），只需修改 baseURL
 * // const request = createRequestClient({ baseURL: 'https://auth.company.com' });
 * // 此时 withCredentials: true 才真正发挥作用
 */
export const httpClient = createRequestClient({
  baseURL: '/api',
  timeoutMs: 10_000,
  retryTimes: 2,
  retryDelayMs: 300,
  onLoadingChange: (loading: boolean) => {
    if (loading) {
      NProgress.start();
    } else {
      NProgress.done();
    }
  },
  // Report final request failures globally; EMessage suppresses duplicate page-level reports.
  onError: (error) => {
    // 401 交由认证客户端刷新令牌，其他最终失败统一提示。
    if (error.status !== 401) {
      EMessage.error(error);
    }
  },
});
