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
        <article
          v-for="task in taskRecords"
          :key="task.id"
          class="task-block"
          :class="{ 'delivery-urgent-block': getTaskDeliveryMeta(task).urgent }"
        >
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
                <span class="delivery-meta">
                  交期 {{ task.planEndDate || '未设置' }}
                  <el-tag :type="getTaskDeliveryMeta(task).type" effect="light" size="small">
                    {{ getTaskDeliveryMeta(task).label }}
                  </el-tag>
                </span>
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
                <strong class="abnormal-text">
                  {{ formatQuantity(totalAbnormalQuantity(task)) }}
                </strong>
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
                <el-button
                  link
                  type="primary"
                  :icon="EditPen"
                  :disabled="!canCorrectStep(row)"
                  @click="openCorrectionDialog(task, row)"
                >
                  修正报工
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </article>
      </div>

      <TablePagination v-model:page="currentPage" v-model:page-size="pageSize" :total="total" :page-sizes="[5, 10, 20]" @change="loadTasks" />
    </section>

    <el-dialog v-model="detailVisible" title="工序报工详情" :width="DialogWidth.lg">
      <el-descriptions v-if="detailStep" :column="2" border>
        <el-descriptions-item label="生产批次">{{ detailTask?.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="工序">{{ detailStep.stepName }}</el-descriptions-item>
        <el-descriptions-item label="操作员">
          {{ detailStep.responsibleUserName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStepStatusMeta(detailStep.status).label }}
        </el-descriptions-item>
        <el-descriptions-item label="开工时间">
          {{ formatDateTime(detailStep.startedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="完工时间">
          {{ formatDateTime(detailStep.completedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="报工总数">
          {{ formatQuantity(stepOutputQuantity(detailStep)) }}
        </el-descriptions-item>
        <el-descriptions-item label="合格数量">
          {{ formatQuantity(stepQualifiedQuantity(detailStep)) }}
        </el-descriptions-item>
        <el-descriptions-item label="异常数量">
          {{ formatQuantity(stepAbnormalQuantity(detailStep)) }}
        </el-descriptions-item>
        <el-descriptions-item label="重要参数" :span="2">
          <template v-if="detailStep.parameterValues.length">
            <el-tag
              v-for="parameter in detailStep.parameterValues"
              :key="parameter.key"
              class="parameter-tag"
              effect="plain"
            >
              {{ parameter.key }}：{{ parameter.value || '-' }}{{ parameter.unit || '' }}
            </el-tag>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ detailStep.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="correctionVisible" title="修正报工数据" :width="DialogWidth.md">
      <el-form class="dialog-form" label-width="108px" :model="correctionForm">
        <el-form-item label="生产批次">
          <el-input :model-value="correctionTask?.batchNo || '-'" disabled />
        </el-form-item>
        <el-form-item label="工序">
          <el-input :model-value="correctionStep?.stepName || '-'" disabled />
        </el-form-item>
        <el-form-item label="合格数量" required>
          <el-input-number v-model="correctionForm.qualifiedQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="异常数量">
          <el-input-number v-model="correctionForm.abnormalQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="报工总数">
          <el-input :model-value="formatQuantity(correctionTotalQuantity)" disabled />
        </el-form-item>
        <template v-if="correctionForm.parameterValues.length">
          <div class="correction-parameters-title">重要参数</div>
          <el-form-item
            v-for="parameter in correctionForm.parameterValues"
            :key="parameter.key"
            :label="parameter.key"
            required
          >
            <el-input v-model="parameter.value" :placeholder="`请输入${parameter.key}`">
              <template v-if="parameter.unit" #append>{{ parameter.unit }}</template>
            </el-input>
          </el-form-item>
        </template>
        <el-form-item label="备注">
          <el-input v-model="correctionForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="correctionVisible = false">取消</el-button>
        <el-button type="primary" :loading="submittingCorrection" @click="submitCorrection">
          保存修正
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { EditPen, Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepRecordItem,
  BatchStepParameterValue,
  BatchStepStatus,
  ProductionBatchStatus,
  ProductionTaskDetail,
} from '@company/api-contract';
import { productionApi } from '../../api/production';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';
import { getDeliveryMeta } from '../../utils/delivery';
import TablePagination from '../../components/common/TablePagination.vue';

/** 生产批次状态字典：用于查询筛选和任务头部状态标签。 */
const taskStatusOptions: Array<{ value: ProductionBatchStatus; label: string }> = [
  { value: 'pending', label: '待准备' },
  { value: 'material_pending', label: '待分配物料' },
  { value: 'material_assigned', label: '待开工' },
  { value: 'doing', label: '生产中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

/** 生产任务列表：每个任务包含工序报工记录，供分块表格展示。 */
const taskRecords = ref<ProductionTaskDetail[]>([]);
/** 列表加载状态：仅控制查询、刷新和初始骨架屏。 */
const loading = ref(false);
/** 分页总数：由后端列表接口返回。 */
const total = ref(0);
/** 当前页码：查询条件变化时重置为第一页。 */
const currentPage = ref(1);
/** 每页数量：生产报工按批次分块展示，默认保持较小页容量。 */
const pageSize = ref(5);
/** 工序详情弹窗状态：用于查看单道工序的报工记录快照。 */
const detailVisible = ref(false);
const detailTask = ref<ProductionTaskDetail | null>(null);
const detailStep = ref<BatchStepRecordItem | null>(null);
/** 任务级开始/完工按钮 loading 标识，避免重复提交同一批次状态流转。 */
const operatingTaskId = ref<string | null>(null);
/** 修正报工弹窗状态：保存当前批次、当前工序和表单提交 loading。 */
const correctionVisible = ref(false);
const correctionTask = ref<ProductionTaskDetail | null>(null);
const correctionStep = ref<BatchStepRecordItem | null>(null);
const submittingCorrection = ref(false);

/** 查询条件：用于报工列表筛选，提交前直接作为接口查询参数。 */
const query = reactive({
  keyword: '',
  status: '',
});

/** 报工数据修正表单：允许管理人员修正数量、重要参数和备注，不修改派工、文件或工序时间。 */
const correctionForm = reactive({
  /** 合格数量：修正后仍可进入下一工序的数量。 */
  qualifiedQuantity: 0,
  abnormalQuantity: 0,
  /** 重要参数实际值：定义名称和单位沿用批次工序快照。 */
  parameterValues: [] as BatchStepParameterValue[],
  remark: '',
});
/** 修正后的报工总数公式：合格数量 + 异常数量。 */
const correctionTotalQuantity = computed(
  () => correctionForm.qualifiedQuantity + correctionForm.abnormalQuantity,
);

/** 加载报工任务列表，后端会返回每个批次下的工序报工记录。 */
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

/** 查询报工任务：从第一页重新加载，避免保留旧分页导致空列表。 */
const searchTasks = async () => {
  currentPage.value = 1;
  await loadTasks();
};

/** 重置查询条件并刷新列表。 */
const resetQuery = async () => {
  Object.assign(query, { keyword: '', status: '' });
  currentPage.value = 1;
  await loadTasks();
};

/** 切换分页大小后回到第一页，确保新分页口径下数据连续。 */
const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadTasks();
};

/** 打开工序详情弹窗，展示当前列表中已有的报工记录快照。 */
const openStepDetail = (task: ProductionTaskDetail, step: BatchStepRecordItem) => {
  detailTask.value = task;
  detailStep.value = step;
  detailVisible.value = true;
};

/** 打开修正弹窗，并用当前工序数量、重要参数和备注初始化表单。 */
const openCorrectionDialog = (task: ProductionTaskDetail, step: BatchStepRecordItem) => {
  correctionTask.value = task;
  correctionStep.value = step;
  Object.assign(correctionForm, {
    qualifiedQuantity: stepQualifiedQuantity(step),
    abnormalQuantity: stepAbnormalQuantity(step),
    parameterValues: step.parameterValues.map((parameter) => ({ ...parameter })),
    remark: step.remark ?? '',
  });
  correctionVisible.value = true;
};

/** 提交报工数据修正；后端会校验数量及重要参数完整性，并写入操作审计。 */
const submitCorrection = async () => {
  if (!correctionTask.value || !correctionStep.value) {
    return;
  }

  if (
    correctionForm.qualifiedQuantity < 0 ||
    correctionForm.abnormalQuantity < 0
  ) {
    EMessage.warning('报工数量不能小于 0');
    return;
  }
  if (correctionTotalQuantity.value <= 0) {
    EMessage.warning('请填写合格数量或异常数量');
    return;
  }
  // 已结束工序的重要参数必须全部填写，避免修正后形成不完整追溯记录。
  if (
    ['completed', 'abnormal'].includes(correctionStep.value.status) &&
    correctionForm.parameterValues.some((parameter) => !parameter.value?.trim())
  ) {
    EMessage.warning('请填写全部工序重要参数');
    return;
  }

  try {
    await ElMessageBox.confirm('确认保存该工序的报工数据修正？', '修正报工数据', {
      confirmButtonText: '确认保存',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  submittingCorrection.value = true;
  try {
    await productionApi.updateExecutionRecordStep(correctionTask.value.id, correctionStep.value.id, {
      status: correctionStep.value.status,
      outputQuantity: correctionTotalQuantity.value,
      abnormalQuantity: correctionForm.abnormalQuantity,
      parameterValues: correctionForm.parameterValues,
      remark: correctionForm.remark,
    });
    EMessage.success('报工数据已修正');
    correctionVisible.value = false;
    await loadTasks();
  } catch (error) {
    EMessage.error(error, '报工数据修正失败');
  } finally {
    submittingCorrection.value = false;
  }
};

/**
 * 已结束工序数量：completed 和 abnormal 都代表工序已报工结束。
 * abnormal 仅提醒仍有不合格数量待管理/检验人员决定返工或报废，不阻断合格数量流转。
 */
const completedStepCount = (task: ProductionTaskDetail) =>
  task.steps.filter((step) => ['completed', 'abnormal'].includes(step.status)).length;

/** 工序进度公式：已完成工序数 / 工序总数 * 100。 */
const taskProgress = (task: ProductionTaskDetail) =>
  task.steps.length ? Math.round((completedStepCount(task) / task.steps.length) * 100) : 0;

/** 当前工序优先展示生产中的工序，其次展示第一道待处理工序。 */
const currentStepName = (task: ProductionTaskDetail) =>
  task.steps.find((step) => step.status === 'doing')?.stepName ??
  task.steps.find((step) => step.status === 'pending')?.stepName ??
  (task.steps.length ? '全部完成' : '未配置工序');

/** 异常数量汇总公式：累加当前批次所有工序的 abnormalQuantity。 */
const totalAbnormalQuantity = (task: ProductionTaskDetail) =>
  task.steps.reduce((totalAmount, step) => totalAmount + stepAbnormalQuantity(step), 0);

const canStartTask = (task: ProductionTaskDetail) =>
  ['pending', 'material_pending', 'material_assigned'].includes(task.status);
const canOperateTask = (task: ProductionTaskDetail) => canStartTask(task) || task.status === 'doing';
const canCorrectStep = (step: BatchStepRecordItem) =>
  ['doing', 'completed', 'abnormal'].includes(step.status);

const getTaskOperationLabel = (task: ProductionTaskDetail) => {
  if (task.status === 'doing') {
    return '完工';
  }
  if (canStartTask(task)) {
    return '开始';
  }
  return task.status === 'completed' ? '已完工' : '不可操作';
};

/** 根据当前任务状态分派开始或完工操作。 */
const operateTask = async (task: ProductionTaskDetail) => {
  if (task.status === 'doing') {
    await finishTask(task);
    return;
  }
  if (canStartTask(task)) {
    await startTask(task);
  }
};

/** 开始生产任务：批次状态流转由后端再次校验。 */
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

/** 完成生产任务：仅当后端确认所有工序已关闭后才能完成批次。 */
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
/** 合格数量公式：报工总数 - 异常数量，最低为 0。 */
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

/** 生产报工交期提示：已完成和已取消批次不再标记逾期。 */
const getTaskDeliveryMeta = (
  task: Pick<ProductionTaskDetail, 'planEndDate' | 'status'>,
) => getDeliveryMeta(task.planEndDate, task.status, ['completed', 'cancelled']);

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

/* 临近或超过交期的报工批次使用轻量边框提醒，不改变主体表格布局。 */
.task-block.delivery-urgent-block {
  border-color: #f59e0b;
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

.delivery-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.parameter-tag {
  margin: 2px 8px 2px 0;
}

/* 重要参数分组标题：与数量字段分区，便于管理人员核对报工实测值。 */
.correction-parameters-title {
  margin: 4px 0 16px;
  color: #1f2937;
  font-weight: 600;
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
