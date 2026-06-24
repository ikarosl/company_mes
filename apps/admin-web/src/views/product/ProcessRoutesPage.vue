<template>
  <div class="process-routes-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="路线编号或名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchRoutes">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增路线</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadRoutes" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="routes" class="route-table">
        <el-table-column label="路线名称" min-width="180">
          <template #default="{ row }">
            <span class="route-name">{{ row.routeName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="routeCode" label="路线编号" min-width="150" />
        <el-table-column label="使用产品类型" min-width="160">
          <template #default="{ row }">{{ formatRouteCategory(row) }}</template>
        </el-table-column>
        <el-table-column label="工序顺序" min-width="260">
          <template #default="{ row }">{{ row.processSummary || '未配置' }}</template>
        </el-table-column>
        <el-table-column label="版本" width="100">
          <template #default="{ row }">{{ row.version || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="310" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openSteps(row)">配置工序</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="deleteRoute(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span class="total-text">共 {{ total }} 条</span>
        <el-select v-model="pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option label="10条/页" :value="10" />
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          @current-change="loadRoutes"
        />
      </div>
    </section>

    <el-dialog
      v-model="routeDialogVisible"
      :title="editingRouteId ? '编辑工艺路线' : '新增工艺路线'"
      :width="DialogWidth.md"
    >
      <el-form class="dialog-form" label-width="112px" :model="routeForm">
        <el-form-item label="路线编号" required>
          <el-input v-model="routeForm.routeCode" placeholder="例如：ROUTE-CIR-STD" />
        </el-form-item>
        <el-form-item label="路线名称" required>
          <el-input v-model="routeForm.routeName" placeholder="例如：环形器标准工艺路线" />
        </el-form-item>
        <el-form-item label="使用产品类型" required>
          <el-select v-model="routeForm.productCategoryId" filterable placeholder="请选择产品分类">
            <el-option
              v-for="category in categoryOptions"
              :key="category.id"
              :label="formatCategory(category)"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="版本">
          <el-input v-model="routeForm.version" placeholder="例如：V1.0" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-switch v-model="routeForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="routeForm.remark" type="textarea" :rows="3" placeholder="可填写路线说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="routeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRoute">保存路线</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stepsDialogVisible" title="配置工序顺序" :width="DialogWidth.xl">
      <div class="step-toolbar">
        <div class="toolbar-left">
          <el-button :icon="Refresh" @click="loadProcessOptions">刷新工序</el-button>
          <el-button :icon="Plus" @click="openProcessCreateWindow">新建工序</el-button>
        </div>
        <el-button type="primary" :icon="Plus" @click="addStep">添加路线步骤</el-button>
      </div>
      <el-table :data="stepForm.steps" class="step-table">
        <el-table-column label="顺序" width="100">
          <template #default="{ row }">
            <el-input-number v-model="row.stepOrder" :min="1" :step="1" controls-position="right" />
          </template>
        </el-table-column>
        <el-table-column label="工序" min-width="250">
          <template #default="{ row }">
            <el-select v-model="row.processId" filterable placeholder="请选择已有工序">
              <el-option
                v-for="process in processOptions"
                :key="process.id"
                :label="formatProcessOption(process)"
                :value="process.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="技术文件" min-width="180">
          <template #default="{ row }">{{ getProcessOption(row.processId)?.sopFileName || '-' }}</template>
        </el-table-column>
        <el-table-column label="默认负责人" min-width="150">
          <template #default="{ row }">
            <el-select v-model="row.defaultOwnerId" clearable placeholder="请选择">
              <el-option
                v-for="user in userOptions"
                :key="user.id"
                :label="user.displayName"
                :value="user.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">
            <el-input v-model="row.remark" placeholder="可填写路线内备注" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ $index }">
            <el-button link type="primary" @click="moveStep($index, -1)">上移</el-button>
            <el-button link type="primary" @click="moveStep($index, 1)">下移</el-button>
            <el-button link type="danger" @click="removeStep($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="stepsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitSteps">保存工序顺序</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="工艺路线详情" :width="DialogWidth.lg">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="路线编号">{{ detailRow.routeCode }}</el-descriptions-item>
        <el-descriptions-item label="路线名称">{{ detailRow.routeName }}</el-descriptions-item>
        <el-descriptions-item label="使用产品类型">{{ formatRouteCategory(detailRow) }}</el-descriptions-item>
        <el-descriptions-item label="版本">{{ detailRow.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ detailRow.status === 1 ? '启用' : '停用' }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detailRow" :data="detailRow.steps" class="detail-step-table">
        <el-table-column prop="stepOrder" label="顺序" width="80" align="center" />
        <el-table-column prop="processCode" label="工序编码" min-width="120" />
        <el-table-column prop="processName" label="工序名称" min-width="120" />
        <el-table-column label="默认负责人" min-width="120">
          <template #default="{ row }">{{ row.defaultOwnerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="技术文件" min-width="180">
          <template #default="{ row }">
            <el-link v-if="row.sopFileName" type="primary" :href="row.sopFileUrl || undefined" target="_blank">
              {{ row.sopFileName }}
            </el-link>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  ProcessOption,
  ProcessRouteDetail,
  ProcessRouteListItem,
  ProductCategoryListItem,
  SystemUserListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { systemApi } from '../../api/system';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

type StepFormRow = {
  processId: string;
  stepOrder: number;
  defaultOwnerId: string;
  status: number;
  remark: string;
};

const routes = ref<ProcessRouteListItem[]>([]);
const processOptions = ref<ProcessOption[]>([]);
const categoryOptions = ref<ProductCategoryListItem[]>([]);
const userOptions = ref<SystemUserListItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const routeDialogVisible = ref(false);
const stepsDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const editingRouteId = ref<string | null>(null);
const detailRow = ref<ProcessRouteDetail | null>(null);
const query = reactive({
  keyword: '',
  status: '',
});
const routeForm = reactive({
  routeCode: '',
  routeName: '',
  productCategoryId: '',
  version: '',
  enabled: true,
  remark: '',
});
const stepForm = reactive<{ steps: StepFormRow[] }>({
  steps: [],
});

const loadRoutes = async () => {
  loading.value = true;
  try {
    const page = await productApi.listRoutes({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      status: query.status,
    });
    routes.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const loadProcessOptions = async () => {
  processOptions.value = await productApi.listProcessOptions();
};

const loadCategoryOptions = async () => {
  const page = await productApi.listCategories({ page: 1, pageSize: 200, status: 'enabled' });
  categoryOptions.value = page.items;
};

const loadPageData = async () => {
  loading.value = true;
  try {
    const [processes, users] = await Promise.all([
      productApi.listProcessOptions(),
      systemApi.listUsers({ page: 1, pageSize: 100 }),
      loadCategoryOptions(),
    ]);
    processOptions.value = processes;
    userOptions.value = users;
    await loadRoutes();
  } finally {
    loading.value = false;
  }
};

const searchRoutes = async () => {
  currentPage.value = 1;
  await loadRoutes();
};

const resetQuery = async () => {
  query.keyword = '';
  query.status = '';
  currentPage.value = 1;
  await loadRoutes();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadRoutes();
};

const resetRouteForm = () => {
  Object.assign(routeForm, {
    routeCode: '',
    routeName: '',
    productCategoryId: '',
    version: 'V1.0',
    enabled: true,
    remark: '',
  });
};

const openCreate = async () => {
  editingRouteId.value = null;
  await loadCategoryOptions();
  resetRouteForm();
  routeDialogVisible.value = true;
};

const openEdit = async (row: ProcessRouteListItem) => {
  editingRouteId.value = row.id;
  await loadCategoryOptions();
  Object.assign(routeForm, {
    routeCode: row.routeCode,
    routeName: row.routeName,
    productCategoryId: row.productCategoryId ?? '',
    version: row.version ?? '',
    enabled: row.status === 1,
    remark: row.remark ?? '',
  });
  routeDialogVisible.value = true;
};

const openSteps = async (row: ProcessRouteListItem) => {
  editingRouteId.value = row.id;
  await loadProcessOptions();
  const detail = await productApi.getRoute(row.id);
  stepForm.steps = detail.steps.map((step) => ({
    processId: step.processId,
    stepOrder: step.stepOrder,
    defaultOwnerId: step.defaultOwnerId ?? '',
    status: step.status,
    remark: step.remark ?? '',
  }));
  stepsDialogVisible.value = true;
};

const openDetail = async (row: ProcessRouteListItem) => {
  detailRow.value = await productApi.getRoute(row.id);
  detailDialogVisible.value = true;
};

const submitRoute = async () => {
  if (!routeForm.routeCode.trim() || !routeForm.routeName.trim()) {
    EMessage.warning('请填写路线编号和路线名称');
    return;
  }

  if (!routeForm.productCategoryId) {
    EMessage.warning('请选择使用产品类型');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      routeCode: routeForm.routeCode,
      routeName: routeForm.routeName,
      productCategoryId: routeForm.productCategoryId,
      version: routeForm.version,
      status: routeForm.enabled ? 1 : 0,
      remark: routeForm.remark,
    };

    if (editingRouteId.value) {
      await productApi.updateRoute(editingRouteId.value, payload);
      EMessage.success('工艺路线已更新');
    } else {
      await productApi.createRoute(payload);
      EMessage.success('工艺路线已新增');
    }

    routeDialogVisible.value = false;
    await loadRoutes();
  } finally {
    submitting.value = false;
  }
};

const addStep = () => {
  stepForm.steps.push({
    stepOrder: stepForm.steps.length + 1,
    processId: '',
    defaultOwnerId: '',
    status: 1,
    remark: '',
  });
};

const removeStep = (index: number) => {
  stepForm.steps.splice(index, 1);
  normalizeStepOrders();
};

const moveStep = (index: number, offset: number) => {
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= stepForm.steps.length) {
    return;
  }

  const [step] = stepForm.steps.splice(index, 1);
  if (step) {
    stepForm.steps.splice(nextIndex, 0, step);
  }
  normalizeStepOrders();
};

const normalizeStepOrders = () => {
  stepForm.steps.forEach((step, index) => {
    step.stepOrder = index + 1;
  });
};

const submitSteps = async () => {
  if (!editingRouteId.value) {
    return;
  }

  const processIds = stepForm.steps.map((step) => step.processId).filter(Boolean);
  if (processIds.length !== stepForm.steps.length) {
    EMessage.warning('请选择每一道路线步骤对应的工序');
    return;
  }

  if (new Set(processIds).size !== processIds.length) {
    EMessage.warning('同一条工艺路线中不能重复选择同一个工序');
    return;
  }

  submitting.value = true;
  try {
    await productApi.configureRouteSteps(editingRouteId.value, {
      steps: stepForm.steps.map((step) => ({
        processId: step.processId,
        stepOrder: step.stepOrder,
        defaultOwnerId: step.defaultOwnerId || null,
        status: step.status,
        remark: step.remark,
      })),
    });
    EMessage.success('工序顺序已保存');
    stepsDialogVisible.value = false;
    await loadRoutes();
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: ProcessRouteListItem) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionText = nextStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认${actionText}该工艺路线？`, `${actionText}路线`, {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: nextStatus === 1 ? 'info' : 'warning',
    });
  } catch {
    return;
  }

  await productApi.changeRouteStatus(row.id, nextStatus);
  EMessage.success(`工艺路线已${actionText}`);
  await loadRoutes();
};

const deleteRoute = async (row: ProcessRouteListItem) => {
  try {
    await ElMessageBox.confirm('删除后该路线和路线步骤会被软删除，确认继续？', '删除工艺路线', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  await productApi.deleteRoute(row.id);
  EMessage.success('工艺路线已删除');
  await loadRoutes();
};

const getProcessOption = (processId: string) =>
  processOptions.value.find((process) => process.id === processId);

const formatCategory = (category: ProductCategoryListItem) =>
  `${category.productAttribute} / ${category.productType}`;

const formatRouteCategory = (route: ProcessRouteListItem | ProcessRouteDetail) =>
  route.productAttribute && route.productType ? `${route.productAttribute} / ${route.productType}` : '-';

const formatProcessOption = (process: ProcessOption) =>
  `${process.processCode} / ${process.processName}`;

const openProcessCreateWindow = () => {
  window.open('/product/processes', '_blank');
};

onMounted(loadPageData);
</script>

<style scoped>
.process-routes-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-panel,
.table-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
}

.query-panel {
  padding: 20px 20px 4px;
}

.query-form {
  display: flex;
  align-items: flex-start;
  gap: 12px 24px;
}

.query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 16px;
}

.query-form :deep(.el-input) {
  width: 190px;
}

.query-form :deep(.el-select) {
  width: 140px;
}

.query-actions {
  margin-left: auto;
}

.table-panel {
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
}

.route-table,
.step-table,
.detail-step-table {
  width: 100%;
}

.route-table :deep(.el-table__header th),
.step-table :deep(.el-table__header th),
.detail-step-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.route-name {
  font-weight: 600;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  height: 64px;
  padding: 0 20px;
}

.total-text {
  color: #6b7280;
  font-size: 14px;
}

.page-size {
  width: 96px;
}

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-select),
.dialog-form :deep(.el-textarea),
.step-table :deep(.el-input),
.step-table :deep(.el-select),
.step-table :deep(.el-input-number) {
  width: 100%;
}

.step-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.detail-step-table {
  margin-top: 16px;
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
