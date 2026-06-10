<template>
  <el-container class="admin-shell">
    <el-aside class="admin-sidebar" width="248px">
      <div class="brand">Company Admin</div>
      <el-menu :default-active="activeMenu" router class="side-menu">
        <el-menu-item v-if="canShow(PERMISSIONS.dashboard.page)" index="/">
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu v-for="group in visibleMenuGroups" :key="group.index" :index="group.index">
          <template #title>
            <span>{{ group.title }}</span>
          </template>
          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
            {{ item.title }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="page-title">{{ route.meta.title ?? '首页' }}</div>
        <div class="user-area">
          <span>{{ authStore.session?.user.displayName }}</span>
          <el-button text type="primary" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { PERMISSIONS } from '@company/constants';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

interface MenuItem {
  title: string;
  path: string;
  permission?: string;
}

interface MenuGroup {
  title: string;
  index: string;
  items: MenuItem[];
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuGroups: MenuGroup[] = [
  {
    title: '系统管理',
    index: '/system',
    items: [
      { title: '用户管理', path: '/system/users', permission: PERMISSIONS.system.users.page },
      { title: '角色管理', path: '/system/roles', permission: PERMISSIONS.system.roles.page },
      {
        title: '权限管理',
        path: '/system/permissions',
        permission: PERMISSIONS.system.permissions.page,
      },
      { title: '日志管理', path: '/system/logs', permission: PERMISSIONS.system.page },
    ],
  },
  {
    title: '产品管理',
    index: '/product',
    items: [
      { title: '生产工序管理', path: '/product/processes' },
      { title: '产品分类管理', path: '/product/categories' },
      { title: '产品信息管理', path: '/product/products' },
      { title: '工艺路线', path: '/product/routes' },
    ],
  },
  {
    title: '仓储管理',
    index: '/warehouse',
    items: [
      { title: '库存管理', path: '/warehouse/inventory' },
      { title: '出入库管理', path: '/warehouse/transactions' },
    ],
  },
  {
    title: '生产管理',
    index: '/production',
    items: [
      {
        title: '工单管理',
        path: '/production/orders',
        permission: PERMISSIONS.productionTasks.page,
      },
      {
        title: '任务管理',
        path: '/production/tasks',
        permission: PERMISSIONS.productionBatches.page,
      },
      { title: '物料分配', path: '/production/material-allocations' },
      {
        title: '派工管理',
        path: '/production/dispatch',
        permission: PERMISSIONS.batchStepRecords.page,
      },
      { title: '生产执行记录', path: '/production/execution-records' },
    ],
  },
  {
    title: '质量管理',
    index: '/quality',
    items: [
      { title: '检验记录', path: '/quality/inspections', permission: PERMISSIONS.inspections.page },
      { title: '返工记录', path: '/quality/reworks' },
    ],
  },
  {
    title: '员工端',
    index: '/worker',
    items: [{ title: '我的任务', path: '/worker/tasks' }],
  },
  {
    title: '检测端',
    index: '/inspector',
    items: [{ title: '检测任务', path: '/inspector/tasks' }],
  },
];

const canShow = (permission?: string) => authStore.hasPermission(permission);

const visibleMenuGroups = computed(() =>
  menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canShow(item.permission)),
    }))
    .filter((group) => group.items.length > 0),
);

const activeMenu = computed(() => {
  if (route.path.startsWith('/production/orders/') && route.path.endsWith('/tasks')) {
    return '/production/tasks';
  }

  if (route.path.startsWith('/production/orders/')) {
    return '/production/orders';
  }

  if (route.path.startsWith('/product/products/') && route.path.endsWith('/materials')) {
    return '/product/products';
  }

  return route.path;
});

const handleLogout = async () => {
  authStore.logout();
  await router.push({ name: 'login' });
};
</script>

<style scoped>
.admin-shell {
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f5f7fb;
}

.admin-sidebar {
  display: flex;
  max-height: 100vh;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #dcdfe6;
  background: #ffffff;
}

.brand {
  flex: 0 0 60px;
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
  color: #1f2d3d;
  font-size: 18px;
  font-weight: 600;
}

.side-menu {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  border-right: 0;
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #dcdfe6;
  background: #ffffff;
}

.page-title {
  color: #1f2d3d;
  font-size: 18px;
  font-weight: 600;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #606266;
}

.admin-main {
  overflow: auto;
  padding: 24px;
}
</style>
