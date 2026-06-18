import type { Router } from 'vue-router';
import { useAuthStore } from '../stores/auth';

export const setupRouterGuards = (router: Router) => {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore();

    if (to.meta.guestOnly) {
      if (authStore.session) {
        return { name: 'dashboard' };
      }

      try {
        await authStore.restoreSession();
        return { name: 'dashboard' };
      } catch {
        return true;
      }
    }

    if (!to.meta.requiresAuth) {
      return true;
    }

    if (!authStore.session) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    try {
      await authStore.validateToken();
    } catch {
      authStore.logout();
      return { name: 'login', query: { redirect: to.fullPath } };
    }

    if (!authStore.hasPermission(to.meta.permission)) {
      return { name: 'no-permission' };
    }

    return true;
  });
};
