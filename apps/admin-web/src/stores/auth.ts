import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { LoginRequest } from '@company/api-contract';
import type { AuthSession } from '@company/auth-client';
import { createAuthClient } from '../api/auth';

const STORAGE_KEY = 'company.admin.auth.session';
const LOGOUT_INTENT_KEY = 'company.admin.auth.logout_intent';

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(readStoredSession());
  //createAuthClient函数在../api/auth，是一个高级函数，提前注入了HTTP客户端和API接口实现，在这里调用完成初始化并额外传入set/get Session 的方法，
  //最终返回一个完整的AuthClient实例，封装了登录、登出、获取当前用户、验证Token、恢复会话等功能，并且自动处理Token刷新和错误情况
  const authClient = createAuthClient({
    getSession: () => session.value,
    setSession: (nextSession: AuthSession | null) => {
      session.value = nextSession;
      if (nextSession) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    },
  });

  const login = async (payload: LoginRequest) => {
    const nextSession = await authClient.login(payload);
    clearLogoutIntent();
    return nextSession;
  };

  const logout = () => {
    markLogoutIntent();
    return authClient.logout();
  };

  const clearSession = () => authClient.clearSession();

  const getCurrentUser = () => authClient.getCurrentUser();

  const validateToken = () => authClient.validateToken();

  const restoreSession = () => {
    if (hasLogoutIntent()) {
      return Promise.reject(new Error('Auto restore is disabled after logout'));
    }

    return authClient.restoreSession();
  };

  const canAutoRestoreSession = () => !hasLogoutIntent();

  const hasPermission = (permission?: string) => {
    if (!permission) {
      return true;
    }

    return session.value?.user.permissions.includes(permission) ?? false;
  };

  return {
    session,
    login,
    logout,
    clearSession,
    getCurrentUser,
    validateToken,
    restoreSession,
    canAutoRestoreSession,
    hasPermission,
  };
});

const markLogoutIntent = () => {
  window.localStorage.setItem(LOGOUT_INTENT_KEY, String(Date.now()));
};

const clearLogoutIntent = () => {
  window.localStorage.removeItem(LOGOUT_INTENT_KEY);
};

const hasLogoutIntent = () => window.localStorage.getItem(LOGOUT_INTENT_KEY) !== null;

const readStoredSession = (): AuthSession | null => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};
