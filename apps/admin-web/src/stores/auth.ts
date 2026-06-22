import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { LoginRequest } from '@company/api-contract';
import type { AuthSession } from '@company/auth-client';
import { createAuthClient } from '../api/auth';

const STORAGE_KEY = 'company.admin.auth.session';

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

  const login = (payload: LoginRequest) => authClient.login(payload);

  const logout = () => {
    authClient.logout();
  };

  const getCurrentUser = () => authClient.getCurrentUser();

  const validateToken = () => authClient.validateToken();

  const restoreSession = () => authClient.restoreSession();

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
    getCurrentUser,
    validateToken,
    restoreSession,
    hasPermission,
  };
});

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
