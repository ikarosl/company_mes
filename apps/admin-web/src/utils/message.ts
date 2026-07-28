import { ElMessage } from 'element-plus';

/** 已展示过的异常对象：请求层与页面层共用同一异常时只提示一次。 */
const shownErrors = new WeakSet<object>();
let lastErrorMessage = '';
let lastErrorTime = 0;

/** 展示错误信息，并优先采用后端返回的具体业务原因。 */
const showError = (error: unknown, fallback = '操作失败，请稍后重试') => {
  if (typeof error === 'object' && error !== null) {
    if (shownErrors.has(error)) {
      return;
    }
    shownErrors.add(error);
  }

  const rawMessage = typeof error === 'string'
    ? error
    : error instanceof Error && error.message
      ? error.message
      : fallback;
  const message = localizeMessage(rawMessage);
  const now = Date.now();
  if (message === lastErrorMessage && now - lastErrorTime < 1000) return;
  lastErrorMessage = message;
  lastErrorTime = now;
  ElMessage.error({ message, showClose: true, duration: 5000 });
};

/** 管理端统一消息入口，避免各页面自行定义提示样式和默认错误文案。 */
/** Localize errors raised by authentication or browser code before displaying them. */
const localizeMessage = (message: string) => {
  const translations: Record<string, string> = {
    'Not authenticated': '尚未登录或登录状态已失效',
    'Request failed': '请求失败，请稍后重试',
    'Auto restore is disabled after logout': '已退出登录',
  };
  if (translations[message]) return translations[message];
  return /^[\x00-\x7F]+$/.test(message) ? '操作失败，请稍后重试' : message;
};

export const EMessage = {
  success: (message: string) => ElMessage.success(message),
  warning: (message: string) => ElMessage.warning(message),
  info: (message: string) => ElMessage.info(message),
  error: showError,
};
