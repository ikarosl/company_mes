<template>
  <section class="page-panel">
    <div class="page-toolbar">
      <h1>权限管理</h1>
      <el-button :loading="loading" @click="loadPermissions">刷新</el-button>
    </div>

    <el-form class="query-bar" :inline="true">
      <el-form-item label="关键字">
        <el-input v-model="keyword" clearable placeholder="名称、编码、类型、路由或接口" />
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="filteredPermissions" border>
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
import { computed, onMounted, ref } from 'vue';
import type { SystemPermissionListItem } from '@company/api-contract';
import { systemApi } from '../../api/system';

const permissions = ref<SystemPermissionListItem[]>([]);
const loading = ref(false);
const keyword = ref('');

/** 权限数据量较小，综合关键字在前端匹配可见业务字段。 */
const filteredPermissions = computed(() => {
  const value = keyword.value.trim().toLowerCase();
  if (!value) {
    return permissions.value;
  }

  return permissions.value.filter((item) =>
    [
      item.name,
      item.code,
      item.type,
      item.routePath ?? '',
      item.apiMethod ?? '',
      item.apiPath ?? '',
    ].some((field) => field.toLowerCase().includes(value)),
  );
});

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

.query-bar {
  margin-bottom: 10px;
}
</style>
