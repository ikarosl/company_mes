import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { LoginRequest } from '@company/api-contract';
import type { AuthSession } from '@company/auth-client';
import { createAuthClient } from '../api/auth';

const STORAGE_KEY = 'company.admin.auth.session';

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(readStoredSession());
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
