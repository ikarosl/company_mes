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

    <el-dialog
      v-model="permissionDialogVisible"
      title="分配权限"
      width="1080px"
      class="permission-dialog"
      :close-on-click-modal="false"
      @closed="resetPermissionDialog"
    >
      <!-- 角色信息头 -->
      <div class="perm-role-header">
        <div class="perm-role-info-row">
          <span class="perm-role-info-item">
            <span class="perm-info-label">角色名称：</span>
            <span class="perm-info-value">{{ editingRole?.name }}</span>
          </span>
          <span class="perm-role-info-item">
            <span class="perm-info-label">角色编码：</span>
            <span class="perm-info-value">{{ editingRole?.code }}</span>
          </span>
          <span class="perm-role-info-item perm-role-desc-item">
            <span class="perm-info-label">角色描述：</span>
            <span class="perm-info-value">{{ editingRole?.description ?? '-' }}</span>
          </span>
        </div>
        <div class="perm-role-actions">
          <el-button
            type="primary"
            :loading="permissionSaving"
            :disabled="permissionLoading"
            @click="submitRolePermissions"
          >
            保存
          </el-button>
          <el-button
            :disabled="permissionLoading || permissionSaving"
            @click="resetAssignedPermissions"
          >
            重置
          </el-button>
        </div>
      </div>

      <div class="perm-section-title">权限配置</div>

      <!-- 主体：左侧树 + 右侧权限详情 -->
      <div v-loading="permissionLoading" class="perm-body">
        <!-- 左侧：模块树 -->
        <div class="perm-tree-panel">
          <div class="perm-panel-header">模块目录</div>
          <div class="perm-tree-search">
            <el-input
              v-model="permissionKeyword"
              clearable
              :prefix-icon="Search"
              placeholder="请输入模块名称"
            />
          </div>
          <el-tree
            ref="permissionTreeRef"
            :data="permissionTree"
            :props="treeProps"
            :filter-node-method="filterPermissionNode"
            :expand-on-click-node="false"
            node-key="id"
            highlight-current
            @node-click="handlePermissionNodeClick"
          >
            <template #default="{ node, data }">
              <span
                class="perm-tree-node"
                :class="{
                  'is-active': activePermissionNode?.id === data.id,
                  'is-leaf-permission': node.level >= 3,
                }"
              >
                <el-checkbox
                  :model-value="isPermissionChecked(data)"
                  :indeterminate="isPermissionIndeterminate(data)"
                  @click.stop
                  @change="handlePermissionCheck(data, $event)"
                />
                <span class="perm-tree-label">{{ data.name }}</span>
              </span>
            </template>
          </el-tree>
        </div>

        <!-- 右侧：权限详情表格 -->
        <div class="perm-detail-panel">
          <div class="perm-detail-header">
            <div>
              <span class="perm-detail-title">{{ activePermissionNode?.name ?? '权限详情' }}</span>
              <span v-if="activePermissionNode" class="perm-detail-count">
                权限列表（已选择 {{ activeScopeCheckedCount }} 项）
              </span>
            </div>
            <div v-if="permissionDetailRows.length" class="perm-detail-actions">
              <el-button link type="primary" @click="setPermissionDetailExpanded(true)">
                展开全部
              </el-button>
              <span class="perm-action-divider">|</span>
              <el-button link type="primary" @click="setPermissionDetailExpanded(false)">
                收起全部
              </el-button>
            </div>
          </div>
          <el-table
            v-if="permissionDetailRows.length"
            ref="permissionDetailTableRef"
            :data="permissionDetailRows"
            class="perm-table"
            row-key="id"
            default-expand-all
            :tree-props="{ children: 'children' }"
          >
            <el-table-column label="权限名称" min-width="220">
              <template #default="{ row }">
                <div class="perm-name-cell">
                  <el-checkbox
                    :model-value="isPermissionChecked(row)"
                    :indeterminate="isPermissionIndeterminate(row)"
                    @click.stop
                    @change="handlePermissionCheck(row, $event)"
                  />
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="权限编码" min-width="260" />
            <el-table-column label="权限描述" min-width="220">
              <template #default="{ row }">{{ getPermissionDescription(row) }}</template>
            </el-table-column>
          </el-table>
          <div v-else class="perm-empty">请从左侧选择一个功能模块查看权限详情</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Refresh, Search, Setting } from '@element-plus/icons-vue';
import type {
  SystemPermissionTreeNode,
  SystemRoleListItem,
  SystemUserListItem,
} from '@company/api-contract';
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

// 权限弹窗状态
const permissionTree = ref<SystemPermissionTreeNode[]>([]);
const editingRole = ref<SystemRoleListItem | null>(null);
const permissionTreeRef = ref();
const permissionDetailTableRef = ref();
const permissionKeyword = ref('');
const permissionLoading = ref(false);
const permissionSaving = ref(false);
const checkedPermissionIds = ref<Set<string>>(new Set());
const initialPermissionIds = ref<string[]>([]);
const activePermissionNode = ref<SystemPermissionTreeNode | null>(null);

/** el-tree 属性配置：第三级（node.level >= 3）勾选框禁用仅展示 */
const treeProps = {
  label: 'name',
  children: 'children',
};

const permissionRelations = computed(() => {
  const parentById = new Map<string, string | null>();
  const levelById = new Map<string, number>();

  const walk = (nodes: SystemPermissionTreeNode[], parentId: string | null, level: number) => {
    for (const node of nodes) {
      parentById.set(node.id, parentId);
      levelById.set(node.id, level);
      walk(node.children ?? [], node.id, level + 1);
    }
  };

  walk(permissionTree.value, null, 1);

  return { parentById, levelById };
});

const permissionDetailRows = computed<SystemPermissionTreeNode[]>(() => {
  if (!activePermissionNode.value) {
    return [];
  }

  const activeLevel = getPermissionLevel(activePermissionNode.value);

  if (activeLevel >= 3) {
    return [];
  }

  return activeLevel === 1
    ? activePermissionNode.value.children ?? []
    : [activePermissionNode.value];
});

const activeScopeCheckedCount = computed(() => {
  const ids = new Set<string>();

  for (const row of permissionDetailRows.value) {
    for (const id of collectPermissionIds(row)) {
      ids.add(id);
    }
  }

  let count = 0;
  for (const id of ids) {
    if (checkedPermissionIds.value.has(id)) {
      count += 1;
    }
  }

  return count;
});

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

const collectPermissionIds = (node: SystemPermissionTreeNode): string[] => [
  node.id,
  ...(node.children ?? []).flatMap((child) => collectPermissionIds(child)),
];

const getPermissionLevel = (node: SystemPermissionTreeNode) =>
  permissionRelations.value.levelById.get(node.id) ?? 1;

const isPermissionChecked = (node: SystemPermissionTreeNode) => {
  const ids = collectPermissionIds(node);
  return ids.length > 0 && ids.every((id) => checkedPermissionIds.value.has(id));
};

const isPermissionIndeterminate = (node: SystemPermissionTreeNode) => {
  const ids = collectPermissionIds(node);

  if (ids.length <= 1) {
    return false;
  }

  const checkedCount = ids.filter((id) => checkedPermissionIds.value.has(id)).length;
  return checkedCount > 0 && checkedCount < ids.length;
};

const handlePermissionCheck = (
  node: SystemPermissionTreeNode,
  checked: boolean | string | number,
) => {
  const nextCheckedPermissionIds = new Set(checkedPermissionIds.value);

  for (const id of collectPermissionIds(node)) {
    if (checked) {
      nextCheckedPermissionIds.add(id);
    } else {
      nextCheckedPermissionIds.delete(id);
    }
  }

  checkedPermissionIds.value = nextCheckedPermissionIds;
};

const handlePermissionNodeClick = (
  node: SystemPermissionTreeNode,
  treeNode?: { expanded: boolean },
) => {
  if (getPermissionLevel(node) >= 3) {
    void nextTick(() => {
      permissionTreeRef.value?.setCurrentKey?.(activePermissionNode.value?.id ?? null);
    });
    return;
  }

  activePermissionNode.value = node;
  if (treeNode) {
    treeNode.expanded = true;
  }
};

const filterPermissionNode = (keyword: string, node: SystemPermissionTreeNode) => {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  return (
    node.name.toLowerCase().includes(normalizedKeyword) ||
    node.code.toLowerCase().includes(normalizedKeyword)
  );
};

const getPermissionDescription = (node: SystemPermissionTreeNode) => {
  if (node.apiMethod && node.apiPath) {
    return `${node.apiMethod} ${node.apiPath}`;
  }

  if (node.routePath) {
    return `页面路由 ${node.routePath}`;
  }

  return '权限分组';
};

const selectDefaultPermissionNode = async () => {
  activePermissionNode.value =
    permissionTree.value.find((node) => (node.children?.length ?? 0) > 0) ??
    permissionTree.value[0] ??
    null;

  await nextTick();

  if (activePermissionNode.value) {
    permissionTreeRef.value?.setCurrentKey?.(activePermissionNode.value.id);
  }
};

const setPermissionDetailExpanded = async (expanded: boolean) => {
  await nextTick();

  const toggleRows = (rows: SystemPermissionTreeNode[]) => {
    for (const row of rows) {
      permissionDetailTableRef.value?.toggleRowExpansion?.(row, expanded);
      toggleRows(row.children ?? []);
    }
  };

  toggleRows(permissionDetailRows.value);
};

const resetAssignedPermissions = () => {
  checkedPermissionIds.value = new Set(initialPermissionIds.value);
};

const resetPermissionDialog = () => {
  editingRole.value = null;
  activePermissionNode.value = null;
  permissionTree.value = [];
  checkedPermissionIds.value = new Set();
  initialPermissionIds.value = [];
  permissionKeyword.value = '';
  permissionLoading.value = false;
  permissionSaving.value = false;
};

const openAssignPermissions = async (row: SystemRoleListItem) => {
  editingRole.value = row;
  editingRoleId.value = row.id;
  permissionDialogVisible.value = true;
  permissionLoading.value = true;

  try {
    const [tree, rolePermissions] = await Promise.all([
      systemApi.listPermissionTree(),
      systemApi.getRolePermissions(row.id),
    ]);
    permissionTree.value = tree;
    initialPermissionIds.value = rolePermissions.permissionIds;
    checkedPermissionIds.value = new Set(rolePermissions.permissionIds);
    await selectDefaultPermissionNode();
  } catch {
    ElMessage.error('加载权限数据失败');
  } finally {
    permissionLoading.value = false;
  }
};

const submitRolePermissions = async () => {
  if (!editingRoleId.value) {
    return;
  }

  permissionSaving.value = true;

  try {
    await systemApi.assignRolePermissions(editingRoleId.value, {
      permissionIds: [...checkedPermissionIds.value],
    });
    ElMessage.success('角色权限已保存');
    permissionDialogVisible.value = false;
    await loadPageData();
  } catch {
    ElMessage.error('保存角色权限失败');
  } finally {
    permissionSaving.value = false;
  }
};

const deleteRole = (row: SystemRoleListItem) => {
  void row;
  ElMessage.warning('角色删除接口尚未接入');
};

const showColumnSettingPending = () => {
  ElMessage.info('列设置暂未接入');
};

watch(permissionKeyword, (keyword) => {
  permissionTreeRef.value?.filter?.(keyword);
});

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

/* ====== 权限分配弹窗 ====== */
.permission-dialog :deep(.el-dialog__body) {
  padding: 0 20px 10px;
}

.perm-role-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  margin: 12px 0;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.perm-role-info-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 40px;
}

.perm-role-info-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.perm-role-desc-item {
  flex: 1;
  min-width: 200px;
}

.perm-info-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.perm-info-value {
  color: #303846;
  font-size: 14px;
  font-weight: 600;
}

.perm-role-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.perm-role-actions :deep(.el-button) {
  min-width: 72px;
  height: 32px;
  border-radius: 4px;
}

.perm-section-title {
  height: 36px;
  color: #303846;
  font-size: 15px;
  font-weight: 600;
  line-height: 36px;
}

.perm-body {
  display: flex;
  gap: 0;
  min-height: 460px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.perm-tree-panel {
  flex: 0 0 280px;
  overflow-y: auto;
  border-right: 1px solid #e4e7ed;
}

.perm-detail-panel {
  flex: 1;
  overflow: hidden;
}

.perm-panel-header {
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
  color: #303846;
  font-size: 14px;
  font-weight: 600;
  line-height: 40px;
}

.perm-tree-search {
  padding: 12px 12px 8px;
}

.perm-tree-search :deep(.el-input__wrapper) {
  min-height: 32px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #d8dee8 inset;
}

.perm-tree-panel :deep(.el-tree) {
  padding: 0 8px 12px;
}

.perm-tree-panel :deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
}

.perm-tree-panel :deep(.el-tree-node__content:hover) {
  background: #f5f8fc;
}

.perm-tree-panel :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #edf5ff;
}

.perm-tree-node {
  display: inline-flex;
  align-items: center;
  width: calc(100% - 24px);
  gap: 8px;
  color: #303846;
  cursor: pointer;
}

.perm-tree-node.is-leaf-permission {
  color: #6b7280;
}

.perm-tree-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.perm-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 16px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.perm-detail-title {
  color: #303846;
  font-size: 14px;
  font-weight: 600;
}

.perm-detail-count {
  margin-left: 8px;
  color: #6b7280;
  font-size: 13px;
}

.perm-detail-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.perm-detail-actions :deep(.el-button.is-link) {
  padding: 0;
  font-size: 13px;
  font-weight: 500;
}

.perm-action-divider {
  color: #d4d9e2;
}

.perm-table {
  width: 100%;
}

.perm-table :deep(.el-table__header th) {
  height: 44px;
  background: #fafafa;
  color: #303846;
  font-weight: 600;
}

.perm-table :deep(.el-table__row) {
  height: 44px;
}

.perm-table :deep(.el-table__cell) {
  border-bottom-color: #edf0f5;
}

.perm-table :deep(.el-checkbox__inner) {
  width: 16px;
  height: 16px;
  border-color: #7b8aa0;
  border-radius: 4px;
}

.perm-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.perm-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #909399;
  font-size: 14px;
}

.perm-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
