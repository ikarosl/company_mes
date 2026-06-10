<template>
  <div class="system-roles-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="角色名称：">
          <el-input v-model="query.name" clearable placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码：">
          <el-input v-model="query.code" clearable placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="状态：">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增角色</el-button>
        <div class="table-tools">
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" text circle :loading="loading" @click="loadPageData" />
          </el-tooltip>
          <el-tooltip content="列设置" placement="top">
            <el-button :icon="Setting" text circle @click="showColumnSettingPending" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedRoles"
        class="roles-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="56" />
        <el-table-column label="角色名称" min-width="120">
          <template #default="{ row }">
            <span class="role-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="角色编码" min-width="150" />
        <el-table-column label="关联用户数" width="120" align="center">
          <template #default="{ row }">{{ getAssociatedUserCount(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170">
          <template #default="{ row }">{{ getUpdatedAt(row) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openAssignPermissions(row)">分配权限</el-button>
            <el-button link type="danger" @click="deleteRole(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-text">共 {{ filteredRoles.length }} 条</span>
        <el-select v-model="pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option label="10条/页" :value="10" />
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredRoles.length"
          layout="prev, pager, next, jumper"
        />
      </div>
    </section>

    <el-dialog
      v-model="roleDialogVisible"
      :title="editingRoleId ? '编辑角色' : '新增角色'"
      width="560px"
    >
      <el-form class="dialog-form" label-width="104px" :model="roleForm">
        <el-form-item label="角色名称" required>
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" required>
          <el-input v-model="roleForm.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-switch v-model="roleForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="关联用户数">
          <el-input v-model="roleForm.associatedUserCount" disabled class="readonly-field" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRole">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialogVisible" title="分配权限" width="80%">
      <div class="permission-dialog-space"></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Refresh, Setting } from '@element-plus/icons-vue';
import type { SystemRoleListItem, SystemUserListItem } from '@company/api-contract';
import { systemApi } from '../../api/system';

type RoleWithUpdateTime = SystemRoleListItem & {
  updatedAt?: string | null;
  updateTime?: string | null;
};

const roles = ref<SystemRoleListItem[]>([]);
const users = ref<SystemUserListItem[]>([]);
const selectedRoles = ref<SystemRoleListItem[]>([]);
const loading = ref(false);
const roleDialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const editingRoleId = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const query = reactive({
  name: '',
  code: '',
  status: '',
});
const roleForm = reactive({
  name: '',
  code: '',
  enabled: true,
  associatedUserCount: '0',
});

const roleUserCounts = computed(() => {
  const counts = new Map<string, number>();

  for (const user of users.value) {
    for (const roleId of user.roleIds) {
      counts.set(roleId, (counts.get(roleId) ?? 0) + 1);
    }
  }

  return counts;
});

const filteredRoles = computed(() =>
  roles.value.filter((role) => {
    const nameKeyword = query.name.trim().toLowerCase();
    const codeKeyword = query.code.trim().toLowerCase();
    const matchesName = !nameKeyword || role.name.toLowerCase().includes(nameKeyword);
    const matchesCode = !codeKeyword || role.code.toLowerCase().includes(codeKeyword);
    const matchesStatus =
      !query.status ||
      (query.status === 'enabled' && role.status === 1) ||
      (query.status === 'disabled' && role.status !== 1);

    return matchesName && matchesCode && matchesStatus;
  }),
);

const pagedRoles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRoles.value.slice(start, start + pageSize.value);
});

const getAssociatedUserCount = (role: SystemRoleListItem) => roleUserCounts.value.get(role.id) ?? 0;

const getUpdatedAt = (role: SystemRoleListItem) => {
  const roleWithUpdateTime = role as RoleWithUpdateTime;
  return roleWithUpdateTime.updatedAt ?? roleWithUpdateTime.updateTime ?? '-';
};

const resetRoleForm = () => {
  Object.assign(roleForm, {
    name: '',
    code: '',
    enabled: true,
    associatedUserCount: '0',
  });
};

const loadPageData = async () => {
  loading.value = true;
  try {
    const [roleRows, userRows] = await Promise.all([systemApi.listRoles(), systemApi.listUsers()]);
    roles.value = roleRows;
    users.value = userRows;
    currentPage.value = 1;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
};

const resetQuery = () => {
  query.name = '';
  query.code = '';
  query.status = '';
  currentPage.value = 1;
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

const handleSelectionChange = (selection: SystemRoleListItem[]) => {
  selectedRoles.value = selection;
};

const openCreate = () => {
  editingRoleId.value = null;
  resetRoleForm();
  roleDialogVisible.value = true;
};

const openEdit = (row: SystemRoleListItem) => {
  editingRoleId.value = row.id;
  Object.assign(roleForm, {
    name: row.name,
    code: row.code,
    enabled: row.status === 1,
    associatedUserCount: String(getAssociatedUserCount(row)),
  });
  roleDialogVisible.value = true;
};

const submitRole = () => {
  if (!roleForm.name.trim() || !roleForm.code.trim()) {
    ElMessage.warning('请填写角色名称和角色编码');
    return;
  }

  ElMessage.warning('角色新增/编辑接口尚未接入');
};

const openAssignPermissions = (row: SystemRoleListItem) => {
  editingRoleId.value = row.id;
  permissionDialogVisible.value = true;
};

const deleteRole = (row: SystemRoleListItem) => {
  void row;
  ElMessage.warning('角色删除接口尚未接入');
};

const showColumnSettingPending = () => {
  ElMessage.info('列设置暂未接入');
};

onMounted(loadPageData);
</script>

<style scoped>
.system-roles-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-panel,
.table-panel {
  border: 1px solid #dfe4ec;
  border-radius: 4px;
  background: #ffffff;
}

.query-panel {
  padding: 25px 24px 10px;
}

.query-form {
  display: flex;
  align-items: flex-start;
  gap: 16px 34px;
}

.query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 16px;
}

.query-form :deep(.el-form-item__label) {
  height: 38px;
  padding-right: 10px;
  color: #303846;
  font-weight: 600;
  line-height: 38px;
}

.query-form :deep(.el-input) {
  width: 132px;
}

.query-form :deep(.el-select) {
  width: 184px;
}

.query-form :deep(.el-input__wrapper),
.query-form :deep(.el-select__wrapper) {
  min-height: 38px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #cfd6e1 inset;
}

.query-actions {
  margin-left: auto;
}

.query-actions :deep(.el-button) {
  min-width: 76px;
  height: 34px;
  border-radius: 4px;
}

.query-actions :deep(.el-button + .el-button) {
  margin-left: 10px;
}

.table-panel {
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 65px;
  padding: 0 16px;
  border-bottom: 1px solid #ebeef5;
}

.table-toolbar :deep(.el-button) {
  height: 34px;
  border-radius: 4px;
}

.table-tools {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-tools :deep(.el-button) {
  width: 20px;
  height: 20px;
  color: #667382;
}

.roles-table {
  width: 100%;
  color: #354254;
  font-size: 14px;
}

.roles-table :deep(.el-table__header th) {
  height: 78px;
  background: #fafafa;
  color: #303846;
  font-weight: 600;
}

.roles-table :deep(.el-table__row) {
  height: 80px;
}

.roles-table :deep(.el-table__cell) {
  border-bottom-color: #edf0f5;
}

.roles-table :deep(.el-checkbox__inner) {
  width: 16px;
  height: 16px;
  border-color: #7b8aa0;
  border-radius: 4px;
}

.role-name {
  display: inline-block;
  max-width: 72px;
  color: #354254;
  font-weight: 600;
  line-height: 1.45;
  white-space: normal;
}

.roles-table :deep(.el-tag) {
  height: 30px;
  min-width: 64px;
  border-radius: 15px;
  line-height: 28px;
  text-align: center;
}

.roles-table :deep(.el-tag--success) {
  border-color: #a7ef79;
  background: #f0ffe7;
  color: #67c23a;
}

.roles-table :deep(.el-tag--info) {
  border-color: #d7d7d7;
  background: #f5f5f5;
  color: #999999;
}

.roles-table :deep(.el-button.is-link) {
  padding: 0;
  font-weight: 600;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  height: 80px;
  padding: 0 24px;
}

.total-text {
  color: #303846;
  font-size: 14px;
}

.page-size {
  width: 86px;
}

.page-size :deep(.el-select__wrapper) {
  min-height: 30px;
  border-radius: 4px;
}

.table-footer :deep(.el-pagination) {
  gap: 6px;
}

.table-footer :deep(.el-pager li),
.table-footer :deep(.btn-prev),
.table-footer :deep(.btn-next) {
  min-width: 32px;
  height: 32px;
  border-radius: 4px;
}

.table-footer :deep(.el-pager li.is-active) {
  border: 1px solid #2f63f6;
  background: #ffffff;
  color: #2f63f6;
}

.table-footer :deep(.el-pagination__jump) {
  margin-left: 12px;
  color: #303846;
}

.table-footer :deep(.el-pagination__editor) {
  width: 48px;
}

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-select) {
  width: 100%;
}

.readonly-field :deep(.el-input__wrapper) {
  background: #f5f7fa;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.permission-dialog-space {
  min-height: 560px;
}

@media (max-width: 1120px) {
  .query-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }

  .query-actions {
    margin-left: 0;
  }
}
</style>
