<template>
  <div class="worker-tasks-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="批次、工单、客户、产品或路线" />
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

      <el-table
        v-loading="loading"
        :data="tasks"
        class="tasks-table"
        :row-class-name="getTaskRowClassName"
      >
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
        <el-table-column label="工艺文件" min-width="190">
          <template #default="{ row }">
            <el-link
              v-if="row.sopFileUrl"
              type="primary"
              :underline="false"
              @click="viewProcessFile(row.sopFileName, row.sopFileUrl)"
            >
              {{ row.sopFileName || '在线查看' }}
            </el-link>
            <span v-else class="sub-text">未配置</span>
          </template>
        </el-table-column>
        <el-table-column label="交期" width="155">
          <template #default="{ row }">
            <div>{{ row.planEndDate || '未设置' }}</div>
            <el-tag :type="getTaskDeliveryMeta(row).type" effect="light" size="small">
              {{ getTaskDeliveryMeta(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划数量" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.plannedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="合格/报工/异常" width="150" align="right">
          <template #default="{ row }">
            {{ formatQuantity(qualifiedQuantity(row)) }} / {{ formatQuantity(row.outputQuantity) }} / {{ formatQuantity(row.abnormalQuantity) }}
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
            <el-tooltip
              :content="row.stepStatus === 'pending' && !row.canStart ? '前一道工序完成后才可开始' : ''"
              :disabled="row.stepStatus !== 'pending' || row.canStart"
              placement="top"
            >
              <span>
                <el-button link type="primary" :disabled="row.stepStatus !== 'pending' || !row.canStart" @click="startStep(row)">
                  开始
                </el-button>
              </span>
            </el-tooltip>
            <el-button link type="primary" :disabled="!canReport(row)" @click="openReport(row)">上报数量</el-button>
          </template>
        </el-table-column>
      </el-table>

      <TablePagination v-model:page="currentPage" v-model:page-size="pageSize" :total="total" @change="loadTasks" />
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
              <el-table-column label="合格/报工/异常" width="150" align="right">
                <template #default="{ row }">
                  {{ formatQuantity(qualifiedQuantity(row)) }} / {{ formatQuantity(row.outputQuantity) }} / {{ formatQuantity(row.abnormalQuantity) }}
                </template>
              </el-table-column>
              <el-table-column label="重要参数" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">{{ formatParameterValues(row.parameterValues) }}</template>
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
        <el-form-item label="合格数量" required>
          <el-input-number v-model="reportForm.qualifiedQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="异常数量">
          <el-input-number v-model="reportForm.abnormalQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="报工总数">
          <el-input :model-value="formatQuantity(reportTotalQuantity)" disabled />
        </el-form-item>
        <div v-if="reportForm.parameterValues.length" class="report-parameters">
          <div class="report-parameters-title">重要参数</div>
          <el-form-item
            v-for="parameter in reportForm.parameterValues"
            :key="parameter.key"
            :label="parameter.key"
            required
          >
            <el-input v-model="parameter.value" :placeholder="`请输入${parameter.key}`">
              <template v-if="parameter.unit" #append>{{ parameter.unit }}</template>
            </el-input>
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="reportForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitReport">提交报工</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFileName || '工艺文件在线预览'"
      :width="DialogWidth.xl"
      destroy-on-close
      @closed="clearFilePreview"
    >
      <div v-loading="previewLoading" class="file-preview-body">
        <iframe
          v-if="previewType === 'pdf'"
          class="pdf-preview"
          :src="previewFileUrl"
          :title="previewFileName"
        />
        <img
          v-else-if="previewType === 'image'"
          class="image-preview"
          :src="previewFileUrl"
          :alt="previewFileName"
        />
        <div v-else-if="previewType === 'docx'" ref="docxPreviewContainer" class="docx-preview" />
        <el-empty v-else description="该格式暂不支持在线预览，请下载原文件查看" />
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadPreviewFile">下载原文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepStatus,
  BatchStepParameterValue,
  ProductionTaskDetail,
  WorkerTaskItem,
  WorkerTaskProductOption,
} from '@company/api-contract';
import { productionApi } from '../api/production';
import { DialogWidth } from '../utils/dialog';
import { getDeliveryMeta } from '../utils/delivery';
import { EMessage } from '../utils/message';
import TablePagination from '../components/common/TablePagination.vue';

const stepStatusOptions: Array<{ value: BatchStepStatus; label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = [
  { value: 'pending', label: '待开始', type: 'info' },
  { value: 'doing', label: '进行中', type: 'primary' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'abnormal', label: '异常', type: 'danger' },
  { value: 'skipped', label: '已跳过', type: 'info' },
];

const tasks = ref<WorkerTaskItem[]>([]);
/** 产品筛选项：仅包含当前员工任务所关联的启用产品。 */
const productOptions = ref<WorkerTaskProductOption[]>([]);
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
/** 工艺文件在线预览状态：PDF/图片直接展示，DOCX 在浏览器中渲染。 */
const previewDialogVisible = ref(false);
const previewLoading = ref(false);
const previewFileName = ref('');
const previewFileUrl = ref('');
const previewType = ref<'pdf' | 'image' | 'docx' | 'unsupported'>('unsupported');
const docxPreviewContainer = ref<HTMLElement | null>(null);

const query = reactive({ keyword: '', productId: '', status: '' });
const reportForm = reactive({
  /** 合格数量：允许继续流转到下一工序。 */
  qualifiedQuantity: 0,
  abnormalQuantity: 0,
  // 重要参数值：字段定义来自工序资料，只有报工时填写实际值。
  parameterValues: [] as BatchStepParameterValue[],
  remark: '',
});

const reportStepName = computed(() => reportingTask.value?.stepName ?? '');
/** 报工总数公式：合格数量 + 异常数量。 */
const reportTotalQuantity = computed(
  () => reportForm.qualifiedQuantity + reportForm.abnormalQuantity,
);

const loadOptions = async () => {
  productOptions.value = await productionApi.listWorkerTaskProductOptions();
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

/** 打开报工弹窗并读取工序重要参数及已保存的参数值。 */
const openReport = async (row: WorkerTaskItem) => {
  try {
    // 报工前读取工序详情，确保展示的是批次生成时固化的重要参数定义及已保存值。
    const taskDetail = await productionApi.getWorkerTask(row.id);
    const stepDetail = taskDetail.steps.find((step) => step.id === row.stepRecordId);
    if (!stepDetail) {
      EMessage.warning('未找到当前工序报工记录，请刷新任务后重试');
      return;
    }
    reportingTask.value = row;
    Object.assign(reportForm, {
      qualifiedQuantity: qualifiedQuantity(row),
      abnormalQuantity: Number(row.abnormalQuantity ?? 0),
      parameterValues: stepDetail.parameterValues.map((item) => ({ ...item })),
      remark: stepDetail.remark ?? '',
    });
    reportDialogVisible.value = true;
  } catch (error) {
    EMessage.error(error, '工序重要参数加载失败');
  }
};

const submitReport = async () => {
  if (!reportingTask.value) {
    return;
  }

  if (reportTotalQuantity.value <= 0) {
    EMessage.warning('请填写合格数量或异常数量');
    return;
  }
  if (reportForm.parameterValues.some((item) => !item.value?.trim())) {
    EMessage.warning('请填写全部工序重要参数');
    return;
  }

  submitting.value = true;
  try {
    await productionApi.updateWorkerTaskStep(reportingTask.value.id, reportingTask.value.stepRecordId, {
      // 只要存在异常数量就标记异常提醒；异常不阻断合格数量继续流转。
      status: reportForm.abnormalQuantity > 0 ? 'abnormal' : 'completed',
      startedAt: reportingTask.value.startedAt ?? new Date().toISOString(),
      completedAt: new Date().toISOString(),
      outputQuantity: reportTotalQuantity.value,
      abnormalQuantity: reportForm.abnormalQuantity,
      parameterValues: reportForm.parameterValues,
      remark: reportForm.remark,
    });
    EMessage.success('报工已提交');
    reportDialogVisible.value = false;
    await loadTasks();
  } catch (error) {
    EMessage.error(error, '报工提交失败');
  } finally {
    submitting.value = false;
  }
};

const canReport = (row: WorkerTaskItem) => row.stepStatus === 'doing';
const getStepStatusMeta = (status: BatchStepStatus) => stepStatusOptions.find((item) => item.value === status) ?? stepStatusOptions[0];
/** 员工任务交期提示：已完成、异常结束或跳过的工序不再参与紧急任务提醒。 */
const getTaskDeliveryMeta = (row: Pick<WorkerTaskItem, 'planEndDate' | 'stepStatus'>) =>
  getDeliveryMeta(row.planEndDate, row.stepStatus, ['completed', 'abnormal', 'skipped']);
/** 逾期、今日到期和三天内到期的待执行任务使用浅色背景，便于员工判断优先级。 */
const getTaskRowClassName = ({ row }: { row: WorkerTaskItem }) =>
  getTaskDeliveryMeta(row).urgent ? 'delivery-urgent-row' : '';
/** 组合员工任务产品选项文本，不展示库存、BOM 或工艺路线等管理信息。 */
const formatProduct = (product: WorkerTaskProductOption) =>
  [product.code, product.specification, product.name].filter(Boolean).join(' / ');
const formatQuantity = (value: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};
/** 合格数量公式：报工总数 - 异常数量。 */
const qualifiedQuantity = (row: Pick<WorkerTaskItem, 'outputQuantity' | 'abnormalQuantity'>) =>
  Math.max(Number(row.outputQuantity ?? 0) - Number(row.abnormalQuantity ?? 0), 0);
/** 将报工参数整理为紧凑文本，供任务详情快速核对。 */
const formatParameterValues = (items: BatchStepParameterValue[]) =>
  items.length
    ? items.map((item) => `${item.key}：${item.value || '-'}${item.unit || ''}`).join('；')
    : '-';

/**
 * 查看当前任务工序关联的工艺文件。
 * 文件地址来自员工任务详情，不额外开放产品、工艺路线等管理接口。
 */
const viewProcessFile = async (fileName: string | null, fileUrl: string | null) => {
  if (!fileName || !fileUrl) {
    EMessage.warning('该工序尚未配置工艺文件');
    return;
  }

  previewFileName.value = fileName;
  previewFileUrl.value = fileUrl;
  const extension = fileName.split('.').pop()?.toLowerCase();
  previewType.value = extension === 'pdf'
    ? 'pdf'
    : ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension ?? '')
      ? 'image'
      : extension === 'docx'
        ? 'docx'
        : 'unsupported';
  previewDialogVisible.value = true;

  if (previewType.value === 'unsupported') {
    return;
  }

  previewLoading.value = true;
  try {
    // 预览前校验文件响应，避免静态服务回退到 HTML 后显示空白内容。
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`文件加载失败（${response.status}）`);
    }
    const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('text/html')) {
      throw new Error('原文件不存在，请联系管理人员重新上传');
    }
    if (previewType.value === 'pdf' && !contentType.includes('application/pdf')) {
      throw new Error('服务器返回的不是有效 PDF 文件');
    }
    if (previewType.value === 'image' && !contentType.startsWith('image/')) {
      throw new Error('服务器返回的不是有效图片文件');
    }
    if (previewType.value !== 'docx') {
      return;
    }

    await nextTick();
    if (!docxPreviewContainer.value) {
      throw new Error('预览容器尚未初始化');
    }
    docxPreviewContainer.value.innerHTML = '';
    const { renderAsync } = await import('docx-preview');
    await renderAsync(await response.arrayBuffer(), docxPreviewContainer.value, undefined, {
      className: 'docx',
      inWrapper: true,
      ignoreWidth: false,
      ignoreHeight: false,
      breakPages: true,
    });
  } catch (error) {
    previewType.value = 'unsupported';
    EMessage.error(error, '工艺文件预览失败，请检查原文件是否存在');
  } finally {
    previewLoading.value = false;
  }
};

/** 下载当前预览的工艺文件，并保留后台配置的原文件名。 */
const downloadPreviewFile = () => {
  if (!previewFileUrl.value) return;
  const link = document.createElement('a');
  link.href = previewFileUrl.value;
  link.download = previewFileName.value;
  link.click();
};

/** 关闭预览后清理 DOCX 渲染内容，避免再次打开时残留旧文档。 */
const clearFilePreview = () => {
  if (docxPreviewContainer.value) {
    docxPreviewContainer.value.innerHTML = '';
  }
  previewLoading.value = false;
  previewFileName.value = '';
  previewFileUrl.value = '';
  previewType.value = 'unsupported';
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

.file-preview-body {
  min-height: 520px;
  max-height: 72vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
}

.pdf-preview {
  display: block;
  width: 100%;
  height: 70vh;
  border: 0;
  background: #ffffff;
}

.image-preview {
  display: block;
  max-width: 100%;
  margin: 0 auto;
}

.docx-preview {
  min-height: 520px;
  padding: 20px 0;
}

.docx-preview :deep(.docx-wrapper) {
  background: #f3f4f6;
}

.tasks-table :deep(.delivery-urgent-row > td.el-table__cell) {
  background: #fff7ed;
}

.tasks-table :deep(.delivery-urgent-row:hover > td.el-table__cell) {
  background: #ffedd5 !important;
}

.report-parameters {
  margin: 4px 0 18px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.report-parameters-title {
  margin-bottom: 14px;
  color: #1f2937;
  font-weight: 600;
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
