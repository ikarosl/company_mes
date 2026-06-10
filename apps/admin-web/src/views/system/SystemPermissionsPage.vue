<template>
  <section class="page-panel">
    <div class="page-toolbar">
      <h1>权限管理</h1>
      <el-button :loading="loading" @click="loadPermissions">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="permissions" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="parentId" label="父级" width="90" />
      <el-table-column prop="name" label="权限名称" min-width="140" />
      <el-table-column prop="code" label="权限编码" min-width="200" />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="routePath" label="路由" min-width="160" />
      <el-table-column prop="apiMethod" label="方法" width="90" />
      <el-table-column prop="apiPath" label="接口" min-width="180" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { SystemPermissionListItem } from '@company/api-contract';
import { systemApi } from '../../api/system';

const permissions = ref<SystemPermissionListItem[]>([]);
const loading = ref(false);

const loadPermissions = async () => {
  loading.value = true;
  try {
    permissions.value = await systemApi.listPermissions();
  } finally {
    loading.value = false;
  }
};

onMounted(loadPermissions);
</script>

<style scoped>
.page-panel {
  min-height: calc(100vh - 108px);
  padding: 24px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #ffffff;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-toolbar h1 {
  margin: 0;
  color: #1f2d3d;
  font-size: 22px;
}
</style>
