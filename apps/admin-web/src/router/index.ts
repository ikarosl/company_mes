import { createRouter, createWebHistory } from 'vue-router';
import { setupRouterGuards } from './guards';
import { routes } from './routes';

declare module 'vue-router' {
  interface RouteMeta {
    guestOnly?: boolean;
    requiresAuth?: boolean;
    title?: string;
    permission?: string;
    section?: string;
    description?: string;
    operations?: string[];
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

setupRouterGuards(router);
