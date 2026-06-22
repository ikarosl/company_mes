<template>
  <div class="tasks-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="搜索关键字：工单/产品" />
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
        <el-table-column label="批次号" min-width="170">
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
        <el-table-column label="任务状态" width="130">
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
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next, jumper" @current-change="loadTasks" />
      </div>
    </section>

    <el-dialog v-model="taskDialogVisible" :title="editingTaskId ? '编辑任务' : '新增任务'" width="980px">
      <el-form class="dialog-form" label-width="108px" :model="taskForm">
        <el-form-item v-if="!editingTaskId" label="选择工单" required>
          <el-select v-model="taskForm.workOrderId" filterable placeholder="请选择下达的工单" @change="handleTaskOrderChange">
            <el-option
              v-for="order in availableWorkOrderOptions"
              :key="order.id"
              :label="formatWorkOrder(order)"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!editingTaskId" label="批次号">
          <el-input v-model="taskForm.batchNo" placeholder="若为空则自动生成批次号" />
        </el-form-item>
        <el-form-item v-if="!editingTaskId && selectedWorkOrder" label="产品">
          <el-input :model-value="formatTaskProduct(selectedWorkOrder)" disabled />
        </el-form-item>
        <el-form-item label="工艺路线" required>
          <el-select v-model="taskForm.routeId" filterable clearable placeholder="请选择工艺路线" @change="refreshCreatePreview">
            <el-option v-for="route in availableRouteOptions" :key="route.id" :label="formatRoute(route)" :value="route.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="taskForm.ownerId" filterable clearable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" required>
          <el-input-number
            v-model="taskForm.plannedQuantity"
            :min="0"
            :max="taskQuantityMax ?? undefined"
            :precision="4"
            :step="1"
            @change="refreshCreatePreview"
          />
        </el-form-item>
        <el-form-item label="计划开始日期">
          <el-date-picker v-model="taskForm.planStartDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划结束日期">
          <el-date-picker v-model="taskForm.planEndDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="taskForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <el-tabs class="detail-tabs">
        <el-tab-pane label="工序执行">
          <el-table :data="createPreviewSteps" class="detail-table">
            <el-table-column prop="stepOrder" label="顺序" width="70" />
            <el-table-column prop="stepName" label="工序" min-width="160" />
            <el-table-column label="实际参考文件" min-width="220">
              <template #default="{ row }">
                <div class="file-cell">
                  <el-select v-model="row.sopFileId" clearable filterable placeholder="请选择参考文件">
                    <el-option v-for="file in sopFileOptions" :key="file.id" :label="file.name" :value="file.id" />
                  </el-select>
                  <el-upload
                    v-if="canUploadStepFile(row)"
                    :show-file-list="false"
                    :before-upload="createStepSopUploadHandler(row)"
                  >
                    <el-button>上传</el-button>
                  </el-upload>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="负责人" min-width="180">
              <template #default="{ row }">
                <el-select v-model="row.responsibleUserId" clearable filterable placeholder="请选择负责人">
                  <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="物料需求">
          <el-table :data="createPreviewMaterials" class="detail-table">
            <el-table-column prop="materialModel" label="物料型号" min-width="160" />
            <el-table-column prop="materialName" label="物料名称" min-width="160" />
            <el-table-column label="单位用量" width="120" align="right">
              <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
            </el-table-column>
            <el-table-column label="需求数量" width="170" align="right">
              <template #default="{ row }">
                {{ formatQuantity(row.planQuantity) }}
              </template>
            </el-table-column>
            <el-table-column label="单位" width="90">
              <template #default="{ row }">{{ row.unit || '-' }}</template>
            </el-table-column>
            <el-table-column label="批次记录" width="100">
              <template #default="{ row }">{{ row.needBatchRecord ? '需要' : '不需要' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitTask">保存任务</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="任务详情" width="1040px">
      <template v-if="activeTask">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="批次号">{{ activeTask.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="工单号">{{ activeTask.workOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ activeTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="工艺路线">{{ activeTask.routeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQuantity(activeTask.plannedQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ activeTask.ownerName || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs class="detail-tabs">
          <el-tab-pane label="工序执行">
            <el-table :data="activeTask.steps" class="detail-table">
              <el-table-column prop="stepOrder" label="序号" width="70" />
              <el-table-column prop="stepName" label="工序" min-width="160" />
              <el-table-column label="默认负责人" width="130">
                <template #default="{ row }">{{ row.responsibleUserName || '-' }}</template>
              </el-table-column>
              <el-table-column label="现场负责人" width="130">
                <template #default="{ row }">{{ row.responsibleUserName || '-' }}</template>
              </el-table-column>
              <el-table-column label="实际参考文件" width="160">
                <template #default="{ row }">{{ getSopFileName(row.sopFileId) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }">{{ stepStatusLabels[row.status] ?? row.status }}</template>
              </el-table-column>
              <el-table-column label="完成/返工/异常" width="150">
                <template #default="{ row }">{{ formatQuantity(row.outputQuantity) }} / {{ formatQuantity(row.returnQuantity) }} / {{ formatQuantity(row.abnormalQuantity) }}</template>
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
              <el-table-column prop="materialModel" label="物料编码" min-width="160" />
              <el-table-column prop="materialName" label="物料名称" min-width="160" />
              <el-table-column label="单位用量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
              </el-table-column>
              <el-table-column label="需求数量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.planQuantity) }}</template>
              </el-table-column>
              <el-table-column label="已用数量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.usedQuantity) }}</template>
              </el-table-column>
              <el-table-column label="单位" width="80">
                <template #default="{ row }">{{ row.unit || '-' }}</template>
              </el-table-column>
              <el-table-column label="是否批次记录" width="100">
                <template #default="{ row }">{{ row.needBatchRecord ? '是' : '否' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchDialogVisible" title="任务派工" width="860px">
      <el-table :data="dispatchRows" class="detail-table">
        <el-table-column prop="stepOrder" label="序号" width="70" />
        <el-table-column prop="stepName" label="工序" min-width="180" />
        <el-table-column label="实际参考文件" min-width="220">
          <template #default="{ row }">
            <el-select v-model="row.sopFileId" clearable filterable placeholder="请选择参考文件">
              <el-option v-for="file in sopFileOptions" :key="file.id" :label="file.name" :value="file.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="负责人" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.responsibleUserId" clearable filterable placeholder="指定现场负责人">
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
        <el-form-item label="负责人">
          <el-select v-model="stepForm.responsibleUserId" clearable filterable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考文件">
          <div class="file-cell">
            <el-select v-model="stepForm.sopFileId" clearable filterable placeholder="请选择参考文件">
              <el-option v-for="file in sopFileOptions" :key="file.id" :label="file.name" :value="file.id" />
            </el-select>
            <el-upload
              v-if="editingTaskId && editingStepId"
              :show-file-list="false"
              :before-upload="uploadEditingStepSopFile"
            >
              <el-button>上传</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="stepForm.status">
            <el-option v-for="item in stepStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="返工数量">
          <el-input-number v-model="stepForm.returnQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="产出数量">
          <el-input-number v-model="stepForm.outputQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="异常数量">
          <el-input-number v-model="stepForm.abnormalQuantity" :min="0" :precision="4" :step="1" />
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
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type UploadRawFile } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepRecordItem,
  BatchStepStatus,
  ProcessOption,
  ProcessRouteListItem,
  ProductListItem,
  ProductionBatchItem,
  ProductionBatchStatus,
  ProductionTaskDetail,
  TaskMaterialRequirementItem,
  SystemUserListItem,
  WorkOrderListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { productionApi } from '../../api/production';
import { systemApi } from '../../api/system';

const taskStatusOptions: Array<{ value: ProductionBatchStatus; label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = [
  { value: 'pending', label: '已生成批次', type: 'info' },
  { value: 'material_pending', label: '已生成物料需求', type: 'primary' },
  { value: 'material_assigned', label: '已分配物料批次', type: 'primary' },
  { value: 'doing', label: '执行中', type: 'primary' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
];
const stepStatusOptions: Array<{ value: BatchStepStatus; label: string }> = [
  { value: 'pending', label: '待开始' },
  { value: 'doing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'abnormal', label: '异常' },
  { value: 'skipped', label: '已跳过' },
];
const stepStatusLabels = Object.fromEntries(stepStatusOptions.map((item) => [item.value, item.label]));
type MaterialDemandFormRow = Omit<TaskMaterialRequirementItem, 'planQuantity'> & {
  planQuantity: string | number;
};

const tasks = ref<ProductionBatchItem[]>([]);
const productOptions = ref<ProductListItem[]>([]);
const routeOptions = ref<ProcessRouteListItem[]>([]);
const userOptions = ref<SystemUserListItem[]>([]);
const workOrderOptions = ref<WorkOrderListItem[]>([]);
const processOptions = ref<ProcessOption[]>([]);
const activeTask = ref<ProductionTaskDetail | null>(null);
const createPreviewSteps = ref<Array<BatchStepRecordItem & { responsibleUserId: string | null; sopFileId: string | null }>>([]);
const createPreviewMaterials = ref<MaterialDemandFormRow[]>([]);
const editingTaskId = ref<string | null>(null);
const editingTaskOriginalQuantity = ref(0);
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
const dispatchRows = ref<Array<BatchStepRecordItem & { responsibleUserId: string | null; sopFileId: string | null }>>([]);

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
  responsibleUserId: '',
  sopFileId: '',
  status: 'pending' as BatchStepStatus,
  returnQuantity: 0,
  outputQuantity: 0,
  abnormalQuantity: 0,
  remark: '',
});

const loadOptions = async () => {
  const [products, routes, users, processes, releasedOrders, doingOrders] = await Promise.all([
    productApi.listProducts({ page: 1, pageSize: 100, status: 'enabled' }),
    productApi.listRoutes({ page: 1, pageSize: 100, status: 'enabled' }),
    systemApi.listUsers({ status: 'enabled' }),
    productApi.listProcessOptions(),
    productionApi.listOrders({ page: 1, pageSize: 100, status: 'released' }),
    productionApi.listOrders({ page: 1, pageSize: 100, status: 'doing' }),
  ]);
  productOptions.value = products.items;
  routeOptions.value = routes.items;
  userOptions.value = users;
  processOptions.value = processes;
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

const selectedWorkOrder = computed(() => workOrderOptions.value.find((item) => item.id === taskForm.workOrderId) ?? null);
const availableWorkOrderOptions = computed(() =>
  workOrderOptions.value.filter((order) => getWorkOrderRemaining(order) > 0),
);
const selectedProduct = computed(() => productOptions.value.find((item) => item.id === selectedWorkOrder.value?.productId) ?? null);
const selectedWorkOrderRemaining = computed(() => {
  if (!selectedWorkOrder.value) {
    return null;
  }

  return getWorkOrderRemaining(selectedWorkOrder.value);
});
const taskQuantityMax = computed(() => {
  if (selectedWorkOrderRemaining.value === null) {
    return null;
  }

  return editingTaskId.value
    ? selectedWorkOrderRemaining.value + editingTaskOriginalQuantity.value
    : selectedWorkOrderRemaining.value;
});
const availableRouteOptions = computed(() => {
  if (!selectedWorkOrder.value || selectedProduct.value?.categoryId === null || selectedProduct.value?.categoryId === undefined) {
    return routeOptions.value;
  }

  return routeOptions.value.filter((route) => route.productCategoryId === null || route.productCategoryId === selectedProduct.value?.categoryId);
});
const sopFileOptions = computed(() => {
  const map = new Map<string, { id: string; name: string }>();

  for (const process of processOptions.value) {
    if (process.sopFileId && process.sopFileName) {
      map.set(process.sopFileId, { id: process.sopFileId, name: process.sopFileName });
    }
  }

  return [...map.values()];
});

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
  createPreviewSteps.value = [];
  createPreviewMaterials.value = [];
};

const openCreate = () => {
  editingTaskId.value = null;
  editingTaskOriginalQuantity.value = 0;
  resetTaskForm();
  taskDialogVisible.value = true;
};

const openEdit = (row: ProductionBatchItem) => {
  void openEditTask(row);
};

const openEditTask = async (row: ProductionBatchItem) => {
  editingTaskId.value = row.id;
  editingTaskOriginalQuantity.value = Number(row.plannedQuantity);
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
  const detail = await productionApi.getTask(row.id);
  activeTask.value = detail;
  createPreviewSteps.value = detail.steps.map((step) => ({
    ...step,
    responsibleUserId: step.responsibleUserId,
    sopFileId: step.sopFileId,
  }));
  await refreshCreatePreview({ keepSteps: true, keepMaterials: true });
  createPreviewMaterials.value = detail.materialRequirements.map((row) => ({
    ...row,
    planQuantity: row.planQuantity,
  }));
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
  taskForm.plannedQuantity = getWorkOrderRemaining(order);

  if (taskForm.plannedQuantity <= 0) {
    createPreviewSteps.value = [];
    createPreviewMaterials.value = [];
    ElMessage.warning('该工单已无可分配数量');
    return;
  }

  void refreshCreatePreview();
};

const refreshCreatePreview = async (options: { keepSteps?: boolean; keepMaterials?: boolean } = {}) => {
  if (!taskForm.workOrderId || !taskForm.routeId || taskForm.plannedQuantity <= 0) {
    if (!options.keepSteps) {
      createPreviewSteps.value = [];
    }
    if (!options.keepMaterials) {
      createPreviewMaterials.value = [];
    }
    return true;
  }

  try {
    const preview = await productionApi.previewCreateTask({
      workOrderId: taskForm.workOrderId,
      routeId: taskForm.routeId,
      plannedQuantity: taskForm.plannedQuantity,
    });
    if (!options.keepSteps) {
      createPreviewSteps.value = preview.steps.map((step) => ({
        ...step,
        responsibleUserId: step.responsibleUserId,
        sopFileId: step.sopFileId,
      }));
    }
    if (!options.keepMaterials) {
      createPreviewMaterials.value = preview.materialRequirements.map((row) => ({
        ...row,
        planQuantity: row.planQuantity,
      }));
    }
    return true;
  } catch (error) {
    if (!options.keepSteps) {
      createPreviewSteps.value = [];
    }
    if (!options.keepMaterials) {
      createPreviewMaterials.value = [];
    }
    ElMessage.error(error instanceof Error ? error.message : '任务预览失败');
    return false;
  }
};

const submitTask = async () => {
  if (taskForm.plannedQuantity <= 0 || (!editingTaskId.value && !taskForm.workOrderId)) {
    ElMessage.warning('请选择所属工单并填写计划数量');
    return;
  }

  if (taskQuantityMax.value !== null && taskForm.plannedQuantity > taskQuantityMax.value) {
    ElMessage.warning('计划数量不能超过工单剩余数量');
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
      steps: createPreviewSteps.value.map((row) => ({
        processRouteStepsId: row.processRouteStepsId,
        responsibleUserId: row.responsibleUserId,
        sopFileId: row.sopFileId,
      })),
    };

    if (editingTaskId.value) {
      await productionApi.updateTask(editingTaskId.value, payload);
      ElMessage.success('任务已更新');
    } else {
      const previewReady = await refreshCreatePreview();
      if (!previewReady) {
        return;
      }

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
  ElMessage.success('已生成 ' + result.materials.length + ' 条物料需求');
  await loadTasks();
};

const openDispatch = async (row: ProductionBatchItem) => {
  const steps = await productionApi.previewTaskDispatch(row.id);
  dispatchTaskId.value = row.id;
  dispatchRows.value = steps.map((step) => ({ ...step, responsibleUserId: step.responsibleUserId }));
  dispatchDialogVisible.value = true;
};

const submitDispatch = async () => {
  if (!dispatchTaskId.value) {
    return;
  }

  submitting.value = true;
  try {
    await productionApi.dispatchTask(dispatchTaskId.value, {
      steps: dispatchRows.value.map((row) => ({
        processRouteStepsId: row.processRouteStepsId,
        responsibleUserId: row.responsibleUserId,
        sopFileId: row.sopFileId,
      })),
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
    responsibleUserId: row.responsibleUserId ?? '',
    sopFileId: row.sopFileId ?? '',
    status: row.status,
    returnQuantity: Number(row.returnQuantity ?? 0),
    outputQuantity: Number(row.outputQuantity ?? 0),
    abnormalQuantity: Number(row.abnormalQuantity ?? 0),
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
      responsibleUserId: stepForm.responsibleUserId || null,
      sopFileId: stepForm.sopFileId || null,
      status: stepForm.status,
      returnQuantity: stepForm.returnQuantity,
      outputQuantity: stepForm.outputQuantity,
      abnormalQuantity: stepForm.abnormalQuantity,
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
const formatTaskProduct = (order: WorkOrderListItem) => `${order.productModel} / ${order.productName}`;
const formatRoute = (route: ProcessRouteListItem) => `${route.routeName}${route.productType ? ` / ${route.productType}` : ''}`;
const getWorkOrderRemaining = (order: WorkOrderListItem) => Math.max(Number(order.plannedQuantity) - Number(order.assignedQuantity), 0);
const formatWorkOrder = (order: WorkOrderListItem) =>
  [order.orderNo, order.productModel, '剩余 ' + formatQuantity(getWorkOrderRemaining(order))].join(' / ');
const formatQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};

const canUploadStepFile = (row: BatchStepRecordItem) => Boolean(editingTaskId.value && row.batchId !== '0');
const createStepSopUploadHandler = (row: BatchStepRecordItem & { sopFileId: string | null }) =>
  (file: UploadRawFile) => uploadStepSopFile(file, row);
const uploadStepSopFile = (file: UploadRawFile, row: BatchStepRecordItem & { sopFileId: string | null }) => {
  if (!editingTaskId.value || !canUploadStepFile(row)) {
    return false;
  }

  void (async () => {
    const formData = new FormData();
    formData.append('file', file);
    const task = await productionApi.uploadTaskStepSop(editingTaskId.value!, row.id, formData);
    const updated = task.steps.find((step) => step.id === row.id);

    if (updated) {
      row.sopFileId = updated.sopFileId;
    }

    activeTask.value = task;
    ElMessage.success('实际参考文件已上传');
  })();

  return false;
};
const uploadEditingStepSopFile = (file: UploadRawFile) => {
  if (!editingTaskId.value || !editingStepId.value) {
    return false;
  }

  void (async () => {
    const formData = new FormData();
    formData.append('file', file);
    activeTask.value = await productionApi.uploadTaskStepSop(editingTaskId.value!, editingStepId.value!, formData);
    const updated = activeTask.value.steps.find((step) => step.id === editingStepId.value);
    stepForm.sopFileId = updated?.sopFileId ?? '';
    ElMessage.success('实际参考文件已上传');
  })();

  return false;
};
const getSopFileName = (fileId: string | null) => {
  if (!fileId) {
    return '-';
  }

  return sopFileOptions.value.find((file) => file.id === fileId)?.name ?? `文件 #${fileId}`;
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

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-cell :deep(.el-select) {
  flex: 1;
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
