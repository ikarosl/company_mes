<template>
  <div class="system-users-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字：">
          <el-input v-model="query.keyword" clearable placeholder="账号、姓名、部门、角色、邮箱或手机号" />
        </el-form-item>
        <el-form-item label="用户账号：">
          <el-input v-model="query.username" clearable placeholder="请输入用户账号" />
        </el-form-item>
        <el-form-item label="姓名：">
          <el-input v-model="query.displayName" clearable placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="岗位：">
          <el-select v-model="query.roleId" clearable placeholder="请选择岗位">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态：">
          <el-select v-model="query.status" clearable placeholder="请选择状态">
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
        <div class="batch-actions">
          <el-button type="primary" :icon="Plus" @click="openCreate">新增用户</el-button>
          <el-button :icon="Key" @click="openBatchResetPassword">重置密码</el-button>
        </div>
        <div class="table-tools">
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" text circle :loading="loading" @click="loadUsers" />
          </el-tooltip>
          <el-tooltip content="筛选" placement="top">
            <el-button :icon="Filter" text circle @click="focusFirstFilter" />
          </el-tooltip>
          <el-tooltip content="列设置" placement="top">
            <el-button :icon="Setting" text circle @click="showColumnSettingPending" />
          </el-tooltip>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedUsers"
        class="users-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="56" />
        <el-table-column prop="username" label="用户账号" min-width="110" />
        <el-table-column prop="displayName" label="姓名" min-width="90" />
        <el-table-column label="岗位" min-width="120">
          <template #default="{ row }">{{ getPrimaryRoleName(row) }}</template>
        </el-table-column>
        <el-table-column label="角色" min-width="140">
          <template #default="{ row }">{{ formatUserRoles(row) }}</template>
        </el-table-column>
        <el-table-column label="部门" min-width="120">
          <template #default="{ row }">{{ row.departmentName ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近登录" min-width="170">
          <template #default="{ row }">{{ row.lastLoginAt ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="toggleStatus(row)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button link type="primary" @click="openResetPassword(row)">重置密码</el-button>
            <el-button link type="primary" @click="openAssignRoles(row)">分配角色</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-text">共 {{ filteredUsers.length }} 条</span>
        <el-select v-model="pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option label="10条/页" :value="10" />
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredUsers.length"
          layout="prev, pager, next"
        />
      </div>
    </section>

    <el-dialog
      v-model="userDialogVisible"
      :title="editingUserId ? '编辑用户' : '新增用户'"
      :width="DialogWidth.md"
    >
      <el-form class="dialog-form" label-width="92px" :model="userForm">
        <el-form-item label="用户账号" required>
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item v-if="!editingUserId" label="初始密码" required>
          <el-input v-model="userForm.password" show-password />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="userForm.displayName" />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="userForm.departmentId" clearable placeholder="请选择部门">
            <el-option
              v-for="department in departmentOptions"
              :key="department.id"
              :label="department.name"
              :value="department.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!editingUserId" label="角色">
          <el-select v-model="userForm.roleIds" multiple clearable placeholder="请选择角色">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userForm.mobile" />
        </el-form-item>
        <el-form-item v-if="!editingUserId" label="状态">
          <el-switch v-model="userForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingUser" @click="submitUser">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" :title="passwordDialogTitle" :width="DialogWidth.sm">
      <el-form class="dialog-form" label-width="92px" :model="passwordForm">
        <el-form-item label="新密码" required>
          <el-input v-model="passwordForm.password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingPassword" @click="submitResetPassword">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="分配角色" :width="DialogWidth.md">
      <el-form class="dialog-form" label-width="92px">
        <el-form-item label="用户">
          <el-input :model-value="assigningUser?.displayName ?? ''" disabled />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="roleForm.roleIds" multiple clearable placeholder="请选择角色">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingRoles" @click="submitAssignRoles">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Filter, Key, Plus, Refresh, Setting } from '@element-plus/icons-vue';
import type {
  SystemDepartmentOption,
  SystemRoleOption,
  SystemUserListItem,
} from '@company/api-contract';
import { systemApi } from '../../api/system';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

type UserForm = {
  username: string;
  password: string;
  displayName: string;
  departmentId: string | null;
  email: string;
  mobile: string;
  enabled: boolean;
  roleIds: string[];
};

const users = ref<SystemUserListItem[]>([]);
const departmentOptions = ref<SystemDepartmentOption[]>([]);
const roleOptions = ref<SystemRoleOption[]>([]);
const selectedUsers = ref<SystemUserListItem[]>([]);
const resettingUsers = ref<SystemUserListItem[]>([]);
const assigningUser = ref<SystemUserListItem | null>(null);
const loading = ref(false);
const savingUser = ref(false);
const savingPassword = ref(false);
const savingRoles = ref(false);
const userDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const roleDialogVisible = ref(false);
const editingUserId = ref<string | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const query = reactive({
  keyword: '',
  username: '',
  displayName: '',
  roleId: '',
  status: '',
});
const userForm = reactive<UserForm>({
  username: '',
  password: '',
  displayName: '',
  departmentId: null,
  email: '',
  mobile: '',
  enabled: true,
  roleIds: [],
});
const passwordForm = reactive({ password: '' });
const roleForm = reactive({ roleIds: [] as string[] });

const roleNameById = computed(() => new Map(roleOptions.value.map((role) => [role.id, role.name])));
const roleNameByCode = computed(
  () => new Map(roleOptions.value.map((role) => [role.code, role.name])),
);
const passwordDialogTitle = computed(() =>
  resettingUsers.value.length > 1 ? '批量重置密码' : '重置密码',
);

const getRoleName = (idOrCode: string) =>
  roleNameById.value.get(idOrCode) ?? roleNameByCode.value.get(idOrCode) ?? idOrCode;

const formatUserRoles = (row: SystemUserListItem) => {
  if (row.roleIds.length > 0) {
    return row.roleIds.map(getRoleName).join('、');
  }

  return row.roles.length > 0 ? row.roles.map(getRoleName).join('、') : '-';
};

const getPrimaryRoleName = (row: SystemUserListItem) => {
  const roleId = row.roleIds[0];
  const roleCode = row.roles[0];
  return roleId ? getRoleName(roleId) : roleCode ? getRoleName(roleCode) : '-';
};

const filteredUsers = computed(() =>
  users.value.filter((user) => {
    const keyword = query.keyword.trim().toLowerCase();
    const usernameKeyword = query.username.trim().toLowerCase();
    const displayNameKeyword = query.displayName.trim().toLowerCase();
    const matchesUsername =
      !usernameKeyword || user.username.toLowerCase().includes(usernameKeyword);
    const matchesDisplayName =
      !displayNameKeyword || user.displayName.toLowerCase().includes(displayNameKeyword);
    const matchesKeyword =
      !keyword ||
      [
        user.username,
        user.displayName,
        user.departmentName ?? '',
        user.email ?? '',
        user.mobile ?? '',
        formatUserRoles(user),
      ].some((value) => value.toLowerCase().includes(keyword));
    const matchesRole = !query.roleId || user.roleIds.includes(query.roleId);
    const matchesStatus =
      !query.status ||
      (query.status === 'enabled' && user.status === 1) ||
      (query.status === 'disabled' && user.status !== 1);

    return matchesKeyword && matchesUsername && matchesDisplayName && matchesRole && matchesStatus;
  }),
);

const pagedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

const resetUserForm = () => {
  Object.assign(userForm, {
    username: '',
    password: '',
    displayName: '',
    departmentId: null,
    email: '',
    mobile: '',
    enabled: true,
    roleIds: [],
  });
};

const loadUsers = async () => {
  loading.value = true;
  try {
    users.value = await systemApi.listUsers({ page: 1, pageSize: 100 });
    currentPage.value = 1;
  } finally {
    loading.value = false;
  }
};

const loadOptions = async () => {
  const [departments, roles] = await Promise.all([
    systemApi.listDepartmentOptions(),
    systemApi.listRoleOptions(),
  ]);
  departmentOptions.value = departments;
  roleOptions.value = roles;
};

const handleSearch = () => {
  currentPage.value = 1;
};

const resetQuery = () => {
  query.keyword = '';
  query.username = '';
  query.displayName = '';
  query.roleId = '';
  query.status = '';
  currentPage.value = 1;
};

const handlePageSizeChange = () => {
  currentPage.value = 1;
};

const handleSelectionChange = (selection: SystemUserListItem[]) => {
  selectedUsers.value = selection;
};

const openCreate = () => {
  editingUserId.value = null;
  resetUserForm();
  userDialogVisible.value = true;
};

const openEdit = (row: SystemUserListItem) => {
  editingUserId.value = row.id;
  Object.assign(userForm, {
    username: row.username,
    password: '',
    displayName: row.displayName,
    departmentId: row.departmentId,
    email: row.email ?? '',
    mobile: row.mobile ?? '',
    enabled: row.status === 1,
    roleIds: row.roleIds,
  });
  userDialogVisible.value = true;
};

const submitUser = async () => {
  const username = userForm.username.trim();
  const displayName = userForm.displayName.trim();
  const password = userForm.password.trim();

  if (!username || !displayName) {
    EMessage.warning('请填写用户账号和姓名');
    return;
  }

  if (!editingUserId.value && password.length < 6) {
    EMessage.warning('初始密码至少 6 位');
    return;
  }

  savingUser.value = true;
  try {
    if (editingUserId.value) {
      await systemApi.updateUser(editingUserId.value, {
        username,
        displayName,
        departmentId: userForm.departmentId,
        email: userForm.email,
        mobile: userForm.mobile,
      });
      EMessage.success('用户信息已更新');
    } else {
      await systemApi.createUser({
        username,
        password,
        displayName,
        departmentId: userForm.departmentId,
        email: userForm.email,
        mobile: userForm.mobile,
        status: userForm.enabled ? 1 : 0,
        roleIds: userForm.roleIds,
      });
      EMessage.success('用户已新增');
    }
    userDialogVisible.value = false;
    await loadUsers();
  } finally {
    savingUser.value = false;
  }
};

const toggleStatus = async (row: SystemUserListItem) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionText = nextStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认${actionText}用户「${row.displayName}」？`, '提示', {
      type: 'warning',
    });
  } catch {
    return;
  }

  await systemApi.changeUserStatus(row.id, { status: nextStatus });
  EMessage.success(`用户已${actionText}`);
  await loadUsers();
};

const openResetPassword = (row: SystemUserListItem) => {
  resettingUsers.value = [row];
  passwordForm.password = '';
  passwordDialogVisible.value = true;
};

const openBatchResetPassword = () => {
  if (selectedUsers.value.length === 0) {
    EMessage.warning('请先选择需要重置密码的用户');
    return;
  }

  resettingUsers.value = [...selectedUsers.value];
  passwordForm.password = '';
  passwordDialogVisible.value = true;
};

const submitResetPassword = async () => {
  const password = passwordForm.password.trim();
  if (password.length < 6) {
    EMessage.warning('新密码至少 6 位');
    return;
  }

  savingPassword.value = true;
  try {
    await Promise.all(
      resettingUsers.value.map((user) => systemApi.resetUserPassword(user.id, { password })),
    );
    EMessage.success('密码已重置');
    passwordDialogVisible.value = false;
  } finally {
    savingPassword.value = false;
  }
};

const openAssignRoles = (row: SystemUserListItem) => {
  assigningUser.value = row;
  roleForm.roleIds = [...row.roleIds];
  roleDialogVisible.value = true;
};

const submitAssignRoles = async () => {
  if (!assigningUser.value) {
    return;
  }

  savingRoles.value = true;
  try {
    await systemApi.assignUserRoles(assigningUser.value.id, { roleIds: roleForm.roleIds });
    EMessage.success('角色已分配');
    roleDialogVisible.value = false;
    await loadUsers();
  } finally {
    savingRoles.value = false;
  }
};

const showColumnSettingPending = () => {
  EMessage.info('列设置暂未接入');
};

const focusFirstFilter = async () => {
  await nextTick();
  document.querySelector<HTMLInputElement>('.query-panel input')?.focus();
};

onMounted(async () => {
  await Promise.all([loadUsers(), loadOptions()]);
});
</script>

<style scoped>
.system-users-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-panel,
.table-panel {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #ffffff;
}

.query-panel {
  padding: 34px 16px 18px 14px;
}

.query-form {
  display: flex;
  align-items: flex-start;
  gap: 10px 22px;
}

.query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 16px;
}

.query-form :deep(.el-form-item__label) {
  height: 34px;
  padding-right: 8px;
  color: #303846;
  font-weight: 600;
  line-height: 34px;
}

.query-form :deep(.el-input),
.query-form :deep(.el-select) {
  width: 142px;
}

.query-form :deep(.el-input__wrapper),
.query-form :deep(.el-select__wrapper) {
  min-height: 34px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #cfd6e1 inset;
}

.query-actions {
  margin-left: auto;
}

.query-actions :deep(.el-button) {
  min-width: 67px;
  height: 32px;
  border-radius: 4px;
}

.query-actions :deep(.el-button + .el-button) {
  margin-left: 18px;
}

.table-panel {
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 65px;
  padding: 0 18px 0 17px;
  border-bottom: 1px solid #ebeef5;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.batch-actions :deep(.el-button) {
  height: 34px;
  border-radius: 4px;
}

.table-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7787;
}

.table-tools :deep(.el-button) {
  width: 20px;
  height: 20px;
  color: #667382;
}

.users-table {
  width: 100%;
  color: #354254;
  font-size: 14px;
}

.users-table :deep(.el-table__header th) {
  height: 52px;
  background: #fafafa;
  color: #1f2937;
  font-weight: 600;
}

.users-table :deep(.el-table__row) {
  height: 53px;
}

.users-table :deep(.el-table__cell) {
  border-bottom-color: #edf0f5;
}

.users-table :deep(.el-checkbox__inner) {
  width: 16px;
  height: 16px;
  border-color: #cbd5e1;
  border-radius: 4px;
}

.users-table :deep(.el-tag) {
  height: 22px;
  padding: 0 10px;
  border: 0;
  border-radius: 4px;
  line-height: 22px;
}

.users-table :deep(.el-tag--success) {
  background: #c9f7d8;
  color: #16a05d;
}

.users-table :deep(.el-tag--info) {
  background: #edf0f4;
  color: #667085;
}

.users-table :deep(.el-button.is-link) {
  padding: 0;
  font-weight: 600;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  height: 64px;
  padding: 0 17px;
}

.total-text {
  color: #303846;
  font-size: 14px;
}

.page-size {
  width: 78px;
}

.page-size :deep(.el-select__wrapper) {
  min-height: 30px;
  padding: 0 7px;
  border-radius: 4px;
}

.table-footer :deep(.el-pagination) {
  gap: 4px;
}

.table-footer :deep(.el-pager li),
.table-footer :deep(.btn-prev),
.table-footer :deep(.btn-next) {
  min-width: 32px;
  height: 32px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.table-footer :deep(.el-pager li.is-active) {
  border-color: #1890ff;
  background: #1890ff;
  color: #ffffff;
}

.dialog-form :deep(.el-select),
.dialog-form :deep(.el-input) {
  width: 100%;
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
