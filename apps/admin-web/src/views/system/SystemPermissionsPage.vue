<template>
  <section class="page-panel">
    <div class="page-toolbar">
      <h1>权限管理</h1>
      <el-button :loading="loading" @click="loadPermissions">刷新</el-button>
    </div>

    <el-form class="query-bar" :inline="true" @submit.prevent="handleSearch">
      <el-form-item label="关键字">
        <el-input v-model="keyword" clearable placeholder="名称、编码、路由或接口" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="permissions" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="parentId" label="父级" width="90" />
      <el-table-column prop="name" label="权限名称" min-width="140" />
      <el-table-column prop="code" label="权限编码" min-width="200" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">{{ formatPermissionType(row.type) }}</template>
      </el-table-column>
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

    <TablePagination
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      @change="loadPermissions"
    />
  </section>
</template>

<script setup lang="ts">
import type { SystemPermissionListItem } from '@company/api-contract';
import { onMounted, ref } from 'vue';
import { systemApi } from '../../api/system';
import TablePagination from '../../components/common/TablePagination.vue';

/** 当前页权限记录，由后端分页接口返回。 */
const permissions = ref<SystemPermissionListItem[]>([]);
/** 权限类型中文标签，未知值保留原值以兼容历史数据。 */
const permissionTypeLabels: Record<string, string> = {
  menu: '菜单',
  page: '页面',
  api: '接口',
  button: '按钮',
};
const formatPermissionType = (value: string) => permissionTypeLabels[value] ?? value;
const loading = ref(false);
const keyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
/** 后端筛选后的权限记录总数。 */
const total = ref(0);

/** 按当前筛选条件和页码查询权限列表。 */
const loadPermissions = async () => {
  loading.value = true;
  try {
    const result = await systemApi.listPermissions({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
    });
    permissions.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

/** 查询时回到第一页，避免旧页码超出新结果范围。 */
const handleSearch = () => {
  currentPage.value = 1;
  void loadPermissions();
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
