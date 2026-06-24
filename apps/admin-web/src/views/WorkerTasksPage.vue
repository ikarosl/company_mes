<template>
  <div class="worker-tasks-page">
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
        <el-form-item label="报工状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="item in stepStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
        <div class="toolbar-actions">
          <span class="toolbar-title">我的任务</span>
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" text circle :loading="loading" @click="loadTasks" />
          </el-tooltip>
        </div>
      </div>

      <el-table v-loading="loading" :data="tasks" class="tasks-table">
        <el-table-column label="生产批次号" min-width="170">
          <template #default="{ row }"><span class="batch-no">{{ row.batchNo }}</span></template>
        </el-table-column>
        <el-table-column label="当前工序" min-width="150">
          <template #default="{ row }">
            <div class="product-name">{{ row.stepName }}</div>
            <div class="sub-text">第 {{ row.stepOrder }} 道</div>
          </template>
        </el-table-column>
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <div class="product-name">{{ row.productName }}</div>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="计划数量" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.plannedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="完成/返工/异常" width="150" align="right">
          <template #default="{ row }">
            {{ formatQuantity(row.outputQuantity) }} / {{ formatQuantity(row.returnQuantity) }} / {{ formatQuantity(row.abnormalQuantity) }}
          </template>
        </el-table-column>
        <el-table-column label="报工状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStepStatusMeta(row.stepStatus).type" effect="light">
              {{ getStepStatusMeta(row.stepStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
        </el-table-column>
        <el-table-column label="完成时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.completedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" :disabled="row.stepStatus !== 'pending'" @click="startStep(row)">开始</el-button>
            <el-button link type="primary" :disabled="!canReport(row)" @click="openReport(row)">上报数量</el-button>
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

    <el-dialog v-model="detailDialogVisible" title="任务详情" :width="DialogWidth.xl">
      <template v-if="activeTask">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="生产批次号">{{ activeTask.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="工单号">{{ activeTask.workOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ activeTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="当前工序">{{ activeWorkerTask?.stepName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQuantity(activeTask.plannedQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ activeWorkerTask?.responsibleUserName || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs class="detail-tabs">
          <el-tab-pane label="报工记录">
            <el-table :data="activeTask.steps" class="detail-table">
              <el-table-column prop="stepOrder" label="顺序" width="70" />
              <el-table-column prop="stepName" label="工序" min-width="160" />
              <el-table-column label="负责人" width="130">
                <template #default="{ row }">{{ row.responsibleUserName || '-' }}</template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }">{{ getStepStatusMeta(row.status).label }}</template>
              </el-table-column>
              <el-table-column label="完成/返工/异常" width="150" align="right">
                <template #default="{ row }">
                  {{ formatQuantity(row.outputQuantity) }} / {{ formatQuantity(row.returnQuantity) }} / {{ formatQuantity(row.abnormalQuantity) }}
                </template>
              </el-table-column>
              <el-table-column label="开始时间" width="170">
                <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
              </el-table-column>
              <el-table-column label="完成时间" width="170">
                <template #default="{ row }">{{ formatDateTime(row.completedAt) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialogVisible" title="提交报工" :width="DialogWidth.md">
      <el-form class="dialog-form" label-width="108px" :model="reportForm">
        <el-form-item label="当前工序">
          <el-input :model-value="reportStepName" disabled />
        </el-form-item>
        <el-form-item label="返工数量">
          <el-input-number v-model="reportForm.returnQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="完成数量" required>
          <el-input-number v-model="reportForm.outputQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="异常数量">
          <el-input-number v-model="reportForm.abnormalQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="结果状态">
          <el-select v-model="reportForm.status">
            <el-option label="已完成" value="completed" />
            <el-option label="异常" value="abnormal" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reportForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReport">提交报工</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepStatus,
  ProductListItem,
  ProductionTaskDetail,
  WorkerTaskItem,
} from '@company/api-contract';
import { productApi } from '../api/product';
import { productionApi } from '../api/production';
import { DialogWidth } from '../utils/dialog';
import { EMessage } from '../utils/message';

const stepStatusOptions: Array<{ value: BatchStepStatus; label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = [
  { value: 'pending', label: '待开始', type: 'info' },
  { value: 'doing', label: '进行中', type: 'primary' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'abnormal', label: '异常', type: 'danger' },
  { value: 'skipped', label: '已跳过', type: 'info' },
];

const tasks = ref<WorkerTaskItem[]>([]);
const productOptions = ref<ProductListItem[]>([]);
const activeTask = ref<ProductionTaskDetail | null>(null);
const activeWorkerTask = ref<WorkerTaskItem | null>(null);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const detailDialogVisible = ref(false);
const reportDialogVisible = ref(false);
const reportingTask = ref<WorkerTaskItem | null>(null);

const query = reactive({ keyword: '', productId: '', status: '' });
const reportForm = reactive({
  status: 'completed' as Extract<BatchStepStatus, 'completed' | 'abnormal'>,
  returnQuantity: 0,
  outputQuantity: 0,
  abnormalQuantity: 0,
  remark: '',
});

const reportStepName = computed(() => reportingTask.value?.stepName ?? '');

const loadOptions = async () => {
  const products = await productApi.listProducts({ page: 1, pageSize: 100, status: 'enabled' });
  productOptions.value = products.items;
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const page = await productionApi.listWorkerTasks({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      productId: query.productId,
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
  Object.assign(query, { keyword: '', productId: '', status: '' });
  currentPage.value = 1;
  await loadTasks();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const openDetail = async (row: WorkerTaskItem) => {
  activeWorkerTask.value = row;
  activeTask.value = await productionApi.getWorkerTask(row.id);
  detailDialogVisible.value = true;
};

const startStep = async (row: WorkerTaskItem) => {
  await productionApi.updateWorkerTaskStep(row.id, row.stepRecordId, {
    status: 'doing',
    startedAt: new Date().toISOString(),
  });
  EMessage.success('工序已开始');
  await loadTasks();
};

const openReport = (row: WorkerTaskItem) => {
  reportingTask.value = row;
  Object.assign(reportForm, {
    status: Number(row.abnormalQuantity ?? 0) > 0 ? 'abnormal' : 'completed',
    returnQuantity: Number(row.returnQuantity ?? 0),
    outputQuantity: Number(row.outputQuantity ?? 0),
    abnormalQuantity: Number(row.abnormalQuantity ?? 0),
    remark: '',
  });
  reportDialogVisible.value = true;
};

const submitReport = async () => {
  if (!reportingTask.value) {
    return;
  }

  if (reportForm.outputQuantity <= 0 && reportForm.abnormalQuantity <= 0) {
    EMessage.warning('请填写完成数量或异常数量');
    return;
  }

  submitting.value = true;
  try {
    await productionApi.updateWorkerTaskStep(reportingTask.value.id, reportingTask.value.stepRecordId, {
      status: reportForm.status,
      startedAt: reportingTask.value.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      returnQuantity: reportForm.returnQuantity,
      outputQuantity: reportForm.outputQuantity,
      abnormalQuantity: reportForm.abnormalQuantity,
      remark: reportForm.remark,
    });
    EMessage.success('报工已提交');
    reportDialogVisible.value = false;
    await loadTasks();
  } finally {
    submitting.value = false;
  }
};

const canReport = (row: WorkerTaskItem) => row.stepStatus === 'doing';
const getStepStatusMeta = (status: BatchStepStatus) => stepStatusOptions.find((item) => item.value === status) ?? stepStatusOptions[0];
const formatProduct = (product: ProductListItem) => `${product.productModel} / ${product.productName}`;
const formatQuantity = (value: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};
const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-');

onMounted(loadPageData);
</script>

<style scoped>
.worker-tasks-page {
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
