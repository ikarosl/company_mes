<template>
  <div class="execution-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="批次号 / 工单号 / 产品" />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="query.status" clearable placeholder="全部">
            <el-option
              v-for="item in taskStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchTasks">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="records-section">
      <div class="section-toolbar">
        <div>
          <h1>生产报工</h1>
          <span class="record-count">共 {{ total }} 个生产任务</span>
        </div>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadTasks" />
        </el-tooltip>
      </div>

      <el-skeleton v-if="loading && !taskRecords.length" :rows="8" animated />

      <el-empty v-else-if="!taskRecords.length" description="暂无符合条件的生产任务" />

      <div v-else class="task-list">
        <article v-for="task in taskRecords" :key="task.id" class="task-block">
          <header class="task-header">
            <div class="task-identity">
              <div class="task-title-row">
                <h2>{{ task.batchNo }}</h2>
                <el-tag :type="getTaskStatusMeta(task.status).type" effect="light">
                  {{ getTaskStatusMeta(task.status).label }}
                </el-tag>
              </div>
              <div class="task-meta">
                <span>工单 {{ task.workOrderNo || '-' }}</span>
                <span>{{ task.productModel }} / {{ task.productName }}</span>
                <span>计划 {{ formatQuantity(task.plannedQuantity) }}</span>
                <span>负责人 {{ task.ownerName || '-' }}</span>
              </div>
            </div>

            <div class="task-progress">
              <div class="progress-label">
                <span>工序进度</span>
                <strong>{{ completedStepCount(task) }} / {{ task.steps.length }}</strong>
              </div>
              <el-progress
                :percentage="taskProgress(task)"
                :stroke-width="10"
                :show-text="false"
                :status="taskProgress(task) === 100 ? 'success' : undefined"
              />
            </div>

            <div class="task-summary">
              <div>
                <span>当前工序</span>
                <strong>{{ currentStepName(task) }}</strong>
              </div>
              <div>
                <span>任务操作</span>
                <div class="task-actions">
                  <el-button
                    size="small"
                    :type="task.status === 'doing' ? 'success' : 'primary'"
                    :disabled="!canOperateTask(task)"
                    :loading="operatingTaskId === task.id"
                    @click="operateTask(task)"
                  >
                    {{ getTaskOperationLabel(task) }}
                  </el-button>
                </div>
              </div>
              <div>
                <span>异常数量</span>
                <strong class="abnormal-text">{{
                  formatQuantity(totalAbnormalQuantity(task))
                }}</strong>
              </div>
            </div>
          </header>

          <el-table :data="task.steps" class="steps-table" row-key="id">
            <el-table-column label="工序" min-width="170">
              <template #default="{ row }">
                <div class="step-name">{{ row.stepName }}</div>
                <span class="step-order">第 {{ row.stepOrder }} 道</span>
              </template>
            </el-table-column>
            <el-table-column label="操作员" min-width="130">
              <template #default="{ row }">{{ row.responsibleUserName || '未派工' }}</template>
            </el-table-column>
            <el-table-column label="开工时间" min-width="170">
              <template #default="{ row }">{{ formatDateTime(row.startedAt) }}</template>
            </el-table-column>
            <el-table-column label="完工时间" min-width="170">
              <template #default="{ row }">{{ formatDateTime(row.completedAt) }}</template>
            </el-table-column>
            <el-table-column label="合格 / 完成 / 异常" min-width="170" align="right">
              <template #default="{ row }">
                <div class="quantity-cell">
                  <span>{{ formatQuantity(stepQualifiedQuantity(row)) }}</span>
                  <span>/</span>
                  <strong>{{ formatQuantity(stepOutputQuantity(row)) }}</strong>
                  <span>/</span>
                  <span :class="{ 'abnormal-text': stepAbnormalQuantity(row) > 0 }">
                    {{ formatQuantity(stepAbnormalQuantity(row)) }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="报工状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStepStatusMeta(row.status).type" effect="light">
                  {{ getStepStatusMeta(row.status).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="170" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="openStepDetail(task, row)">查看</el-button>
                <el-tooltip content="待报工修正接口接入" placement="top">
                  <span>
                    <el-button link type="primary" :icon="EditPen" disabled>修正数量</el-button>
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </article>
      </div>

      <div class="table-footer">
        <el-select v-model="pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option label="5个/页" :value="5" />
          <el-option label="10个/页" :value="10" />
          <el-option label="20个/页" :value="20" />
        </el-select>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          @current-change="loadTasks"
        />
      </div>
    </section>

    <el-dialog v-model="detailVisible" title="工序报工详情" :width="DialogWidth.lg">
      <el-descriptions v-if="detailStep" :column="2" border>
        <el-descriptions-item label="生产批次">{{ detailTask?.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="工序">{{ detailStep.stepName }}</el-descriptions-item>
        <el-descriptions-item label="操作员">{{
          detailStep.responsibleUserName || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          getStepStatusMeta(detailStep.status).label
        }}</el-descriptions-item>
        <el-descriptions-item label="开工时间">{{
          formatDateTime(detailStep.startedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="完工时间">{{
          formatDateTime(detailStep.completedAt)
        }}</el-descriptions-item>
        <el-descriptions-item label="完成数量">{{
          formatQuantity(stepOutputQuantity(detailStep))
        }}</el-descriptions-item>
        <el-descriptions-item label="合格数量">{{
          formatQuantity(stepQualifiedQuantity(detailStep))
        }}</el-descriptions-item>
        <el-descriptions-item label="异常数量">{{
          formatQuantity(stepAbnormalQuantity(detailStep))
        }}</el-descriptions-item>
        <el-descriptions-item label="返工数量">{{
          formatQuantity(stepReturnQuantity(detailStep))
        }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{
          detailStep.remark || '-'
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { EditPen, Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepRecordItem,
  BatchStepStatus,
  ProductionBatchStatus,
  ProductionTaskDetail,
} from '@company/api-contract';
import { productionApi } from '../../api/production';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

const taskStatusOptions: Array<{ value: ProductionBatchStatus; label: string }> = [
  { value: 'pending', label: '待准备' },
  { value: 'material_pending', label: '待分配物料' },
  { value: 'material_assigned', label: '待开工' },
  { value: 'doing', label: '生产中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const taskRecords = ref<ProductionTaskDetail[]>([]);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(5);
const detailVisible = ref(false);
const detailTask = ref<ProductionTaskDetail | null>(null);
const detailStep = ref<BatchStepRecordItem | null>(null);
const operatingTaskId = ref<string | null>(null);

const query = reactive({
  keyword: '',
  status: '',
});

const loadTasks = async () => {
  loading.value = true;
  try {
    const page = await productionApi.listExecutionRecords({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      status: query.status,
    });
    taskRecords.value = page.items;
    total.value = page.total;
  } catch (error) {
    EMessage.error(error, '生产报工数据加载失败');
  } finally {
    loading.value = false;
  }
};

const searchTasks = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const resetQuery = async () => {
  Object.assign(query, { keyword: '', status: '' });
  currentPage.value = 1;
  await loadTasks();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const openStepDetail = (task: ProductionTaskDetail, step: BatchStepRecordItem) => {
  detailTask.value = task;
  detailStep.value = step;
  detailVisible.value = true;
};

const completedStepCount = (task: ProductionTaskDetail) =>
  task.steps.filter((step) => step.status === 'completed').length;
const taskProgress = (task: ProductionTaskDetail) =>
  task.steps.length ? Math.round((completedStepCount(task) / task.steps.length) * 100) : 0;
const currentStepName = (task: ProductionTaskDetail) =>
  task.steps.find((step) => step.status === 'doing')?.stepName ??
  task.steps.find((step) => step.status === 'pending')?.stepName ??
  (task.steps.length ? '全部完成' : '未配置工序');
const totalAbnormalQuantity = (task: ProductionTaskDetail) =>
  task.steps.reduce((totalAmount, step) => totalAmount + stepAbnormalQuantity(step), 0);

const canStartTask = (task: ProductionTaskDetail) =>
  ['pending', 'material_pending', 'material_assigned'].includes(task.status);
const canOperateTask = (task: ProductionTaskDetail) =>
  canStartTask(task) || task.status === 'doing';
const getTaskOperationLabel = (task: ProductionTaskDetail) => {
  if (task.status === 'doing') {
    return '完工';
  }
  if (canStartTask(task)) {
    return '开始';
  }
  return task.status === 'completed' ? '已完工' : '不可操作';
};

const operateTask = async (task: ProductionTaskDetail) => {
  if (task.status === 'doing') {
    await finishTask(task);
    return;
  }
  if (canStartTask(task)) {
    await startTask(task);
  }
};

const startTask = async (task: ProductionTaskDetail) => {
  operatingTaskId.value = task.id;
  try {
    await productionApi.startTask(task.id);
    EMessage.success('生产任务已开始');
    await loadTasks();
  } catch (error) {
    EMessage.error(error, '生产任务开始失败');
  } finally {
    operatingTaskId.value = null;
  }
};

const finishTask = async (task: ProductionTaskDetail) => {
  operatingTaskId.value = task.id;
  try {
    await productionApi.finishTask(task.id);
    EMessage.success('生产任务已完工');
    await loadTasks();
  } catch (error) {
    EMessage.error(error, '生产任务完工失败');
  } finally {
    operatingTaskId.value = null;
  }
};

const stepOutputQuantity = (step: BatchStepRecordItem) => Number(step.outputQuantity ?? 0);
const stepAbnormalQuantity = (step: BatchStepRecordItem) => Number(step.abnormalQuantity ?? 0);
const stepReturnQuantity = (step: BatchStepRecordItem) => Number(step.returnQuantity ?? 0);
const stepQualifiedQuantity = (step: BatchStepRecordItem) =>
  Math.max(stepOutputQuantity(step) - stepAbnormalQuantity(step), 0);

const getTaskStatusMeta = (status: ProductionBatchStatus) => {
  const meta: Record<
    ProductionBatchStatus,
    { label: string; type: 'info' | 'warning' | 'primary' | 'success' | 'danger' }
  > = {
    pending: { label: '待准备', type: 'info' },
    material_pending: { label: '待分配物料', type: 'warning' },
    material_assigned: { label: '待开工', type: 'primary' },
    doing: { label: '生产中', type: 'primary' },
    completed: { label: '已完成', type: 'success' },
    cancelled: { label: '已取消', type: 'danger' },
  };
  return meta[status];
};

const getStepStatusMeta = (status: BatchStepStatus) => {
  const meta: Record<
    BatchStepStatus,
    { label: string; type: 'info' | 'primary' | 'success' | 'danger' | 'warning' }
  > = {
    pending: { label: '未开工', type: 'info' },
    doing: { label: '已开工', type: 'primary' },
    completed: { label: '已完成', type: 'success' },
    abnormal: { label: '异常', type: 'danger' },
    skipped: { label: '已跳过', type: 'warning' },
  };
  return meta[status];
};

const formatQuantity = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
    : '-';
};

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';

onMounted(loadTasks);
</script>

<style scoped>
.execution-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-panel,
.records-section {
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
  width: 220px;
}

.query-actions {
  margin-left: auto;
}

.records-section {
  overflow: hidden;
}

.section-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 18px;
  border-bottom: 1px solid #e5e7eb;
}

.section-toolbar > div {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.section-toolbar h1 {
  margin: 0;
  color: #111827;
  font-size: 18px;
}

.record-count,
.step-order,
.task-meta {
  color: #6b7280;
  font-size: 13px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
}

.task-block {
  overflow: hidden;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #ffffff;
}

.task-header {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) minmax(220px, 0.8fr) minmax(310px, 1fr);
  gap: 28px;
  align-items: center;
  padding: 18px 20px;
  background: #f8fafc;
}

.task-title-row,
.task-meta,
.progress-label,
.task-summary,
.quantity-cell {
  display: flex;
  align-items: center;
}

.task-title-row {
  gap: 10px;
}

.task-title-row h2 {
  margin: 0;
  color: #172033;
  font-size: 17px;
}

.task-meta {
  flex-wrap: wrap;
  gap: 6px 18px;
  margin-top: 8px;
}

.task-progress {
  min-width: 0;
}

.progress-label {
  justify-content: space-between;
  margin-bottom: 8px;
  color: #475569;
  font-size: 13px;
}

.progress-label strong {
  color: #172033;
}

.task-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(80px, 1fr));
  gap: 18px;
}

.task-summary div {
  min-width: 0;
}

.task-summary span,
.task-summary strong {
  display: block;
}

.task-actions {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.task-summary span {
  margin-bottom: 4px;
  color: #6b7280;
  font-size: 12px;
}

.task-summary strong {
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.steps-table {
  width: 100%;
}

.steps-table :deep(.el-table__header th) {
  height: 44px;
  background: #ffffff;
  color: #475569;
  font-weight: 600;
}

.step-name {
  color: #1f2937;
  font-weight: 600;
}

.quantity-cell {
  justify-content: flex-end;
  gap: 6px;
  white-space: nowrap;
}

.abnormal-text {
  color: #dc2626 !important;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 64px;
  padding: 0 20px;
  border-top: 1px solid #e5e7eb;
}

.page-size {
  width: 100px;
}

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-input-number),
.dialog-form :deep(.el-textarea) {
  width: 100%;
}

@media (max-width: 1180px) {
  .task-header {
    grid-template-columns: 1fr 1fr;
  }

  .task-summary {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .query-form {
    display: grid;
    grid-template-columns: 1fr;
  }

  .query-form :deep(.el-input),
  .query-form :deep(.el-select) {
    width: 100%;
  }

  .query-actions {
    margin-left: 0;
  }

  .task-header {
    grid-template-columns: 1fr;
  }

  .task-summary {
    grid-column: auto;
  }

  .section-toolbar {
    align-items: flex-start;
    padding-top: 14px;
    padding-bottom: 14px;
  }
}
</style>
