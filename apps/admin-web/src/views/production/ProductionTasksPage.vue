<template>
  <div class="tasks-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="批次号/工单/产品" />
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="query.productId" clearable filterable placeholder="全部">
            <el-option v-for="product in productOptions" :key="product.id" :label="formatProduct(product)" :value="product.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="query.ownerId" clearable filterable placeholder="全部">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="item in taskStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchTasks">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增任务</el-button>
        <div class="toolbar-actions">
          <span class="toolbar-title">生产任务</span>
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" text circle :loading="loading" @click="loadTasks" />
          </el-tooltip>
        </div>
      </div>

      <el-table v-loading="loading" :data="tasks" class="tasks-table">
        <el-table-column label="生产批次号" min-width="170">
          <template #default="{ row }"><span class="batch-no">{{ row.batchNo }}</span></template>
        </el-table-column>
        <el-table-column label="工单号" min-width="150">
          <template #default="{ row }">{{ row.workOrderNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <div class="product-name">{{ row.productName }}</div>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.plannedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="工艺路线" min-width="160">
          <template #default="{ row }">{{ row.routeName || '未选择' }}</template>
        </el-table-column>
        <el-table-column label="物料状态" width="130">
          <template #default="{ row }">{{ materialStatusLabels[row.materialStatus] ?? row.materialStatus }}</template>
        </el-table-column>
        <el-table-column label="派工状态" width="110">
          <template #default="{ row }">{{ dispatchStatusLabels[row.dispatchStatus] ?? row.dispatchStatus }}</template>
        </el-table-column>
        <el-table-column label="生产状态" width="110">
          <template #default="{ row }">{{ productionStatusLabels[row.productionStatus] ?? row.productionStatus }}</template>
        </el-table-column>
        <el-table-column label="任务状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusMeta(row.status).type" effect="light">
              {{ getTaskStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="120">
          <template #default="{ row }">{{ row.ownerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="generateMaterials(row)">生成物料</el-button>
            <el-button link type="primary" @click="openDispatch(row)">派工</el-button>
            <el-button link type="primary" :disabled="row.status === 'completed'" @click="startTask(row)">开始</el-button>
            <el-button link type="primary" :disabled="row.status === 'completed'" @click="finishTask(row)">完成</el-button>
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
        <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next, jumper" @current-change="loadTasks" />
      </div>
    </section>

    <el-dialog v-model="taskDialogVisible" :title="editingTaskId ? '编辑任务' : '新增任务'" width="720px">
      <el-form class="dialog-form" label-width="108px" :model="taskForm">
        <el-form-item v-if="!editingTaskId" label="所属工单" required>
          <el-select v-model="taskForm.workOrderId" filterable placeholder="请选择已下达工单" @change="handleTaskOrderChange">
            <el-option
              v-for="order in workOrderOptions"
              :key="order.id"
              :label="formatWorkOrder(order)"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!editingTaskId" label="批次号">
          <el-input v-model="taskForm.batchNo" placeholder="不填则系统自动生成" />
        </el-form-item>
        <el-form-item label="工艺路线" required>
          <el-select v-model="taskForm.routeId" filterable clearable placeholder="请选择工艺路线">
            <el-option v-for="route in routeOptions" :key="route.id" :label="formatRoute(route)" :value="route.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="taskForm.ownerId" filterable clearable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" required>
          <el-input-number v-model="taskForm.plannedQuantity" :min="0.0001" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker v-model="taskForm.planStartDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划完成">
          <el-date-picker v-model="taskForm.planEndDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="taskForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitTask">保存任务</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="任务详情" width="1040px">
      <template v-if="activeTask">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="生产批次号">{{ activeTask.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="工单号">{{ activeTask.workOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ activeTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="工艺路线">{{ activeTask.routeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQuantity(activeTask.plannedQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ activeTask.ownerName || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs class="detail-tabs">
          <el-tab-pane label="工序执行">
            <el-table :data="activeTask.steps" class="detail-table">
              <el-table-column prop="stepOrder" label="顺序" width="70" />
              <el-table-column prop="processName" label="工序" min-width="160" />
              <el-table-column label="默认负责人" width="130">
                <template #default="{ row }">{{ row.defaultOwnerName || '-' }}</template>
              </el-table-column>
              <el-table-column label="实际负责人" width="130">
                <template #default="{ row }">{{ row.actualOwnerName || '-' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }">{{ stepStatusLabels[row.status] ?? row.status }}</template>
              </el-table-column>
              <el-table-column label="合格/总数" width="130">
                <template #default="{ row }">{{ formatQuantity(row.qualifiedQuantity) }} / {{ formatQuantity(row.totalQuantity) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="90" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openStepEdit(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="物料需求">
            <el-table :data="activeTask.materialRequirements" class="detail-table">
              <el-table-column prop="routeStepName" label="工序" min-width="150" />
              <el-table-column prop="materialModel" label="物料型号" min-width="160" />
              <el-table-column prop="materialName" label="物料名称" min-width="160" />
              <el-table-column label="单位用量" width="110" align="right">
                <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
              </el-table-column>
              <el-table-column label="需求数量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.requiredQuantity) }}</template>
              </el-table-column>
              <el-table-column label="批次记录" width="100">
                <template #default="{ row }">{{ row.needBatchRecord ? '需要' : '不需要' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchDialogVisible" title="任务派工" width="860px">
      <el-table :data="dispatchRows" class="detail-table">
        <el-table-column prop="stepOrder" label="顺序" width="70" />
        <el-table-column prop="processName" label="工序" min-width="180" />
        <el-table-column label="负责人" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.actualOwnerId" clearable filterable placeholder="按默认负责人">
              <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDispatch">确认派工</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stepDialogVisible" title="编辑工序记录" width="640px">
      <el-form class="dialog-form" label-width="108px" :model="stepForm">
        <el-form-item label="实际负责人">
          <el-select v-model="stepForm.actualOwnerId" clearable filterable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="stepForm.status">
            <el-option v-for="item in stepStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="总数">
          <el-input-number v-model="stepForm.totalQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="合格数量">
          <el-input-number v-model="stepForm.qualifiedQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="不合格数量">
          <el-input-number v-model="stepForm.defectiveQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stepForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stepDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStep">保存工序记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepRecordItem,
  BatchStepStatus,
  ProcessRouteListItem,
  ProductListItem,
  ProductionBatchItem,
  ProductionBatchStatus,
  ProductionTaskDetail,
  SystemUserListItem,
  WorkOrderListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { productionApi } from '../../api/production';
import { systemApi } from '../../api/system';

const taskStatusOptions: Array<{ value: ProductionBatchStatus; label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = [
  { value: 'pending', label: '待处理', type: 'info' },
  { value: 'assigned', label: '已派工', type: 'primary' },
  { value: 'doing', label: '生产中', type: 'primary' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
];
const stepStatusOptions: Array<{ value: BatchStepStatus; label: string }> = [
  { value: 'pending', label: '待处理' },
  { value: 'assigned', label: '已派工' },
  { value: 'doing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'abnormal', label: '异常' },
  { value: 'skipped', label: '已跳过' },
];
const materialStatusLabels: Record<string, string> = {
  ungenerated: '未生成需求',
  unassigned: '未分配',
  partial_assigned: '部分分配',
  assigned: '已分配',
  ready: '已齐套',
  outbound: '已出库',
  shortage: '缺料',
  returned: '已退料',
};
const dispatchStatusLabels: Record<string, string> = { pending: '待派工', assigned: '已派工' };
const productionStatusLabels: Record<string, string> = { pending: '待开始', doing: '生产中', completed: '已完成' };
const stepStatusLabels = Object.fromEntries(stepStatusOptions.map((item) => [item.value, item.label]));

const tasks = ref<ProductionBatchItem[]>([]);
const productOptions = ref<ProductListItem[]>([]);
const routeOptions = ref<ProcessRouteListItem[]>([]);
const userOptions = ref<SystemUserListItem[]>([]);
const workOrderOptions = ref<WorkOrderListItem[]>([]);
const activeTask = ref<ProductionTaskDetail | null>(null);
const editingTaskId = ref<string | null>(null);
const dispatchTaskId = ref<string | null>(null);
const editingStepId = ref<string | null>(null);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const taskDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const dispatchDialogVisible = ref(false);
const stepDialogVisible = ref(false);
const dispatchRows = ref<Array<BatchStepRecordItem & { actualOwnerId: string | null }>>([]);

const query = reactive({ keyword: '', productId: '', ownerId: '', status: '' });
const taskForm = reactive({
  workOrderId: '',
  batchNo: '',
  routeId: '',
  ownerId: '',
  plannedQuantity: 1,
  planStartDate: '',
  planEndDate: '',
  remark: '',
});
const stepForm = reactive({
  actualOwnerId: '',
  status: 'assigned' as BatchStepStatus,
  totalQuantity: 0,
  qualifiedQuantity: 0,
  defectiveQuantity: 0,
  remark: '',
});

const loadOptions = async () => {
  const [products, routes, users, releasedOrders, doingOrders] = await Promise.all([
    productApi.listProducts({ page: 1, pageSize: 100, status: 'enabled' }),
    productApi.listRoutes({ page: 1, pageSize: 100, status: 'enabled' }),
    systemApi.listUsers({ status: 'enabled' }),
    productionApi.listOrders({ page: 1, pageSize: 100, status: 'released' }),
    productionApi.listOrders({ page: 1, pageSize: 100, status: 'doing' }),
  ]);
  productOptions.value = products.items;
  routeOptions.value = routes.items;
  userOptions.value = users;
  workOrderOptions.value = [...releasedOrders.items, ...doingOrders.items];
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const page = await productionApi.listTasks({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      productId: query.productId,
      ownerId: query.ownerId,
      status: query.status,
    });
    tasks.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadOptions(), loadTasks()]);
  } finally {
    loading.value = false;
  }
};

const searchTasks = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const resetQuery = async () => {
  Object.assign(query, { keyword: '', productId: '', ownerId: '', status: '' });
  currentPage.value = 1;
  await loadTasks();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const resetTaskForm = () => {
  Object.assign(taskForm, {
    workOrderId: '',
    batchNo: '',
    routeId: '',
    ownerId: '',
    plannedQuantity: 1,
    planStartDate: '',
    planEndDate: '',
    remark: '',
  });
};

const openCreate = () => {
  editingTaskId.value = null;
  resetTaskForm();
  taskDialogVisible.value = true;
};

const openEdit = (row: ProductionBatchItem) => {
  editingTaskId.value = row.id;
  Object.assign(taskForm, {
    workOrderId: row.workOrderId,
    batchNo: row.batchNo,
    routeId: row.routeId ?? '',
    ownerId: row.ownerId ?? '',
    plannedQuantity: Number(row.plannedQuantity),
    planStartDate: row.planStartDate ?? '',
    planEndDate: row.planEndDate ?? '',
    remark: row.remark ?? '',
  });
  taskDialogVisible.value = true;
};

const handleTaskOrderChange = (workOrderId: string) => {
  const order = workOrderOptions.value.find((item) => item.id === workOrderId);
  if (!order) {
    return;
  }

  taskForm.routeId = order.routeId ?? '';
  taskForm.ownerId = order.ownerId ?? '';
  taskForm.planStartDate = order.planStartDate ?? '';
  taskForm.planEndDate = order.planEndDate ?? '';
  taskForm.plannedQuantity = Math.max(Number(order.plannedQuantity) - Number(order.assignedQuantity), 0.0001);
};

const submitTask = async () => {
  if (taskForm.plannedQuantity <= 0 || (!editingTaskId.value && !taskForm.workOrderId)) {
    ElMessage.warning('请选择所属工单并填写计划数量');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      routeId: taskForm.routeId || null,
      ownerId: taskForm.ownerId || null,
      plannedQuantity: taskForm.plannedQuantity,
      planStartDate: taskForm.planStartDate || null,
      planEndDate: taskForm.planEndDate || null,
      remark: taskForm.remark,
    };

    if (editingTaskId.value) {
      await productionApi.updateTask(editingTaskId.value, payload);
      ElMessage.success('任务已更新');
    } else {
      await productionApi.createTask({
        ...payload,
        workOrderId: taskForm.workOrderId,
        batchNo: taskForm.batchNo || null,
      });
      ElMessage.success('任务已新增');
    }

    taskDialogVisible.value = false;
    await loadTasks();
    await loadOptions();
  } finally {
    submitting.value = false;
  }
};

const openDetail = async (row: ProductionBatchItem) => {
  activeTask.value = await productionApi.getTask(row.id);
  detailDialogVisible.value = true;
};

const generateMaterials = async (row: ProductionBatchItem) => {
  const result = await productionApi.generateTaskMaterialDemand(row.id);
  activeTask.value = result.task;
  ElMessage.success(`已生成 ${result.materials.length} 条物料需求`);
  await loadTasks();
};

const openDispatch = async (row: ProductionBatchItem) => {
  const steps = await productionApi.previewTaskDispatch(row.id);
  dispatchTaskId.value = row.id;
  dispatchRows.value = steps.map((step) => ({ ...step, actualOwnerId: step.actualOwnerId }));
  dispatchDialogVisible.value = true;
};

const submitDispatch = async () => {
  if (!dispatchTaskId.value) {
    return;
  }

  submitting.value = true;
  try {
    await productionApi.dispatchTask(dispatchTaskId.value, {
      steps: dispatchRows.value.map((row) => ({ routeStepId: row.routeStepId, actualOwnerId: row.actualOwnerId })),
    });
    ElMessage.success('派工已保存');
    dispatchDialogVisible.value = false;
    await loadTasks();
  } finally {
    submitting.value = false;
  }
};

const startTask = async (row: ProductionBatchItem) => {
  await productionApi.startTask(row.id);
  ElMessage.success('任务已开始');
  await loadTasks();
};

const finishTask = async (row: ProductionBatchItem) => {
  try {
    await ElMessageBox.confirm('确认完成该生产任务？', '完成任务', {
      confirmButtonText: '确认完成',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    return;
  }

  await productionApi.finishTask(row.id);
  ElMessage.success('任务已完成');
  await loadTasks();
};

const openStepEdit = (row: BatchStepRecordItem) => {
  if (!activeTask.value) {
    return;
  }

  editingTaskId.value = activeTask.value.id;
  editingStepId.value = row.id;
  Object.assign(stepForm, {
    actualOwnerId: row.actualOwnerId ?? '',
    status: row.status,
    totalQuantity: Number(row.totalQuantity ?? 0),
    qualifiedQuantity: Number(row.qualifiedQuantity ?? 0),
    defectiveQuantity: Number(row.defectiveQuantity ?? 0),
    remark: row.remark ?? '',
  });
  stepDialogVisible.value = true;
};

const submitStep = async () => {
  if (!editingTaskId.value || !editingStepId.value) {
    return;
  }

  submitting.value = true;
  try {
    activeTask.value = await productionApi.updateTaskStep(editingTaskId.value, editingStepId.value, {
      actualOwnerId: stepForm.actualOwnerId || null,
      status: stepForm.status,
      totalQuantity: stepForm.totalQuantity,
      qualifiedQuantity: stepForm.qualifiedQuantity,
      defectiveQuantity: stepForm.defectiveQuantity,
      remark: stepForm.remark,
    });
    ElMessage.success('工序记录已更新');
    stepDialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
};

const getTaskStatusMeta = (status: ProductionBatchStatus) => taskStatusOptions.find((item) => item.value === status) ?? taskStatusOptions[0];
const formatProduct = (product: ProductListItem) => `${product.productModel} / ${product.productName}`;
const formatRoute = (route: ProcessRouteListItem) => `${route.routeName}${route.productType ? ` / ${route.productType}` : ''}`;
const formatWorkOrder = (order: WorkOrderListItem) =>
  `${order.orderNo} / ${order.productModel} / 剩余 ${formatQuantity(Number(order.plannedQuantity) - Number(order.assignedQuantity))}`;
const formatQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};

onMounted(loadPageData);
</script>

<style scoped>
.tasks-page {
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
  gap: 12px 22px;
}

.query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 16px;
}

.query-form :deep(.el-input),
.query-form :deep(.el-select) {
  width: 180px;
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title,
.batch-no,
.product-name {
  color: #1f2937;
  font-weight: 600;
}

.tasks-table,
.detail-table {
  width: 100%;
}

.tasks-table :deep(.el-table__header th),
.detail-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.sub-text {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
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
.dialog-form :deep(.el-date-editor),
.dialog-form :deep(.el-input-number),
.dialog-form :deep(.el-textarea) {
  width: 100%;
}

.detail-tabs {
  margin-top: 18px;
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
