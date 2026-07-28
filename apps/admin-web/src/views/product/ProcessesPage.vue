<template>
  <div class="processes-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="编码、名称、SOP或备注" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchProcesses">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增工序</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadProcesses" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="processes" class="process-table">
        <el-table-column label="工序编码" min-width="130">
          <template #default="{ row }">
            <span class="process-code">{{ row.processCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="processName" label="工序名称" min-width="140" />
        <el-table-column prop="description" label="工序说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="技术文件" min-width="190">
          <template #default="{ row }">
            <el-link v-if="row.sopFileName" type="primary" @click="openFilePreview(row)">
              {{ row.sopFileName }}
            </el-link>
            <span v-else class="empty-text">未上传</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openUpload(row)">上传文件</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
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
          @current-change="loadProcesses"
        />
      </div>
    </section>

    <el-dialog
      v-model="processDialogVisible"
      :title="editingProcessId ? '编辑工序' : '新增工序'"
      :width="DialogWidth.md"
    >
      <el-form class="dialog-form" label-width="96px" :model="processForm">
        <el-form-item label="工序编码" required>
          <el-input v-model="processForm.processCode" placeholder="例如：GX-001" />
        </el-form-item>
        <el-form-item label="工序名称" required>
          <el-input v-model="processForm.processName" placeholder="例如：装配、调试、检验" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-switch v-model="processForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="工序说明">
          <el-input
            v-model="processForm.description"
            type="textarea"
            :rows="3"
            placeholder="填写操作要求、检验要求或注意事项"
          />
        </el-form-item>
        <div class="parameter-section">
          <div class="parameter-toolbar">
            <span class="parameter-title">重要参数</span>
            <el-button type="primary" :icon="Plus" @click="addImportantParameter">新增参数</el-button>
          </div>
          <el-table :data="processForm.importantParameters" border empty-text="暂无重要参数">
            <el-table-column label="参数名称" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.key" placeholder="例如：焊接温度" maxlength="100" />
              </template>
            </el-table-column>
            <el-table-column label="单位" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.unit" placeholder="例如：℃、s、dB" maxlength="50" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeImportantParameter($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="parameter-tip">这里只配置报工时必须填写的参数名称和单位，参数值由员工报工时填写。</div>
        </div>
        <el-form-item label="备注">
          <el-input v-model="processForm.remark" type="textarea" :rows="2" placeholder="可填写备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProcess">保存工序</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadDialogVisible" title="上传工序技术文件" :width="DialogWidth.md">
      <el-upload
        drag
        action=""
        :auto-upload="false"
        :limit="1"
        :file-list="uploadFileList"
        :on-change="handleUploadChange"
        :on-remove="handleUploadRemove"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">将文件拖到这里，或点击选择文件</div>
      </el-upload>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUpload">上传文件</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="工序详情" :width="DialogWidth.md">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="工序编码">{{ detailRow.processCode }}</el-descriptions-item>
        <el-descriptions-item label="工序名称">{{ detailRow.processName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ detailRow.status === 1 ? '启用' : '停用' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(detailRow.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="工序说明" :span="2">{{ detailRow.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="技术文件" :span="2">
          <el-link
            v-if="detailRow.sopFileName"
            type="primary"
            @click="openFilePreview(detailRow)"
          >
            {{ detailRow.sopFileName }}
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="重要参数" :span="2">
          <el-tag
            v-for="parameter in detailRow.importantParameters"
            :key="parameter.key"
            class="parameter-tag"
            effect="plain"
          >
            {{ parameter.key }}{{ parameter.unit ? `（${parameter.unit}）` : '' }}
          </el-tag>
          <span v-if="!detailRow.importantParameters.length">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFileName || '技术文件预览'"
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
        <el-empty
          v-else
          description="该格式暂不支持在线预览，请下载原文件查看"
        />
      </div>
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadPreviewFile">下载原文件</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessageBox, type UploadFile, type UploadFiles } from 'element-plus';
import { Plus, Refresh, UploadFilled } from '@element-plus/icons-vue';
import type { ProcessImportantParameter, ProcessListItem } from '@company/api-contract';
import { productApi } from '../../api/product';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

const processes = ref<ProcessListItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const processDialogVisible = ref(false);
const uploadDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const editingProcessId = ref<string | null>(null);
const uploadingProcessId = ref<string | null>(null);
const uploadFileList = ref<UploadFile[]>([]);
const selectedFile = ref<File | null>(null);
const detailRow = ref<ProcessListItem | null>(null);
/** 文件预览弹窗状态：PDF/图片直接展示，DOCX 下载后在浏览器本地渲染。 */
const previewDialogVisible = ref(false);
const previewLoading = ref(false);
const previewFileName = ref('');
const previewFileUrl = ref('');
const previewType = ref<'pdf' | 'image' | 'docx' | 'unsupported'>('unsupported');
const docxPreviewContainer = ref<HTMLElement | null>(null);
const query = reactive({
  keyword: '',
  status: '',
});
const processForm = reactive({
  processCode: '',
  processName: '',
  description: '',
  enabled: true,
  importantParameters: [] as ProcessImportantParameter[],
  remark: '',
});

const loadProcesses = async () => {
  loading.value = true;
  try {
    const page = await productApi.listProcesses({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      status: query.status,
    });
    processes.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const searchProcesses = async () => {
  currentPage.value = 1;
  await loadProcesses();
};

const resetQuery = async () => {
  query.keyword = '';
  query.status = '';
  currentPage.value = 1;
  await loadProcesses();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadProcesses();
};

const resetProcessForm = () => {
  Object.assign(processForm, {
    processCode: '',
    processName: '',
    description: '',
    enabled: true,
    importantParameters: [],
    remark: '',
  });
};

const openCreate = () => {
  editingProcessId.value = null;
  resetProcessForm();
  processDialogVisible.value = true;
};

const openEdit = (row: ProcessListItem) => {
  editingProcessId.value = row.id;
  Object.assign(processForm, {
    processCode: row.processCode,
    processName: row.processName,
    description: row.description ?? '',
    enabled: row.status === 1,
    importantParameters: row.importantParameters.map((item) => ({ ...item })),
    remark: row.remark ?? '',
  });
  processDialogVisible.value = true;
};

const openUpload = (row: ProcessListItem) => {
  uploadingProcessId.value = row.id;
  uploadFileList.value = [];
  selectedFile.value = null;
  uploadDialogVisible.value = true;
};

/** 新增一行工序重要参数定义，参数值留到报工时填写。 */
const addImportantParameter = () => {
  processForm.importantParameters.push({ key: '', unit: null });
};

/** 删除当前工序不再需要记录的参数定义。 */
const removeImportantParameter = (index: number) => {
  processForm.importantParameters.splice(index, 1);
};

const openDetail = (row: ProcessListItem) => {
  detailRow.value = row;
  detailDialogVisible.value = true;
};

/** 在站内弹窗预览技术文件；DOCX 在浏览器本地解析，不上传到第三方服务。 */
const openFilePreview = async (row: ProcessListItem) => {
  if (!row.sopFileUrl || !row.sopFileName) {
    EMessage.warning('该工序尚未上传技术文件');
    return;
  }

  previewFileName.value = row.sopFileName;
  previewFileUrl.value = row.sopFileUrl;
  const extension = row.sopFileName.split('.').pop()?.toLowerCase();
  previewType.value = extension === 'pdf'
    ? 'pdf'
    : ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension ?? '')
      ? 'image'
      : extension === 'docx'
        ? 'docx'
        : 'unsupported';
  previewDialogVisible.value = true;

  if (previewType.value !== 'docx') {
    return;
  }

  previewLoading.value = true;
  try {
    await nextTick();
    const response = await fetch(row.sopFileUrl);
    if (!response.ok) {
      throw new Error(`文件加载失败（${response.status}）`);
    }
    if (!docxPreviewContainer.value) {
      throw new Error('预览容器尚未初始化');
    }
    docxPreviewContainer.value.innerHTML = '';
    // DOCX 解析器体积较大，仅在实际预览 DOCX 时按需加载。
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
    EMessage.error(error, '技术文件预览失败');
  } finally {
    previewLoading.value = false;
  }
};

/** 下载当前预览的原始文件，并保留业务人员熟悉的原文件名。 */
const downloadPreviewFile = () => {
  if (!previewFileUrl.value) {
    return;
  }
  const link = document.createElement('a');
  link.href = previewFileUrl.value;
  link.download = previewFileName.value;
  link.click();
};

/** 关闭弹窗后清理 DOCX 生成的页面节点，避免下次预览残留。 */
const clearFilePreview = () => {
  if (docxPreviewContainer.value) {
    docxPreviewContainer.value.innerHTML = '';
  }
  previewLoading.value = false;
  previewFileName.value = '';
  previewFileUrl.value = '';
  previewType.value = 'unsupported';
};

const submitProcess = async () => {
  if (!processForm.processCode.trim() || !processForm.processName.trim()) {
    EMessage.warning('请填写工序编码和工序名称');
    return;
  }
  const parameterKeys = processForm.importantParameters.map((item) => item.key.trim());
  if (parameterKeys.some((key) => !key)) {
    EMessage.warning('请填写重要参数名称');
    return;
  }
  if (new Set(parameterKeys).size !== parameterKeys.length) {
    EMessage.warning('重要参数名称不能重复');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      processCode: processForm.processCode,
      processName: processForm.processName,
      description: processForm.description,
      importantParameters: processForm.importantParameters,
      status: processForm.enabled ? 1 : 0,
      remark: processForm.remark,
    };

    if (editingProcessId.value) {
      await productApi.updateProcess(editingProcessId.value, payload);
      EMessage.success('工序已更新');
    } else {
      await productApi.createProcess(payload);
      EMessage.success('工序已新增');
    }

    processDialogVisible.value = false;
    await loadProcesses();
  } finally {
    submitting.value = false;
  }
};

const handleUploadChange = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
  uploadFileList.value = uploadFiles.slice(-1);
  selectedFile.value = uploadFile.raw ?? null;
};

const handleUploadRemove = () => {
  uploadFileList.value = [];
  selectedFile.value = null;
};

const submitUpload = async () => {
  if (!uploadingProcessId.value || !selectedFile.value) {
    EMessage.warning('请选择要上传的技术文件');
    return;
  }

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  submitting.value = true;
  try {
    await productApi.uploadProcessSop(uploadingProcessId.value, formData);
    EMessage.success('技术文件已上传');
    uploadDialogVisible.value = false;
    await loadProcesses();
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: ProcessListItem) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionText = nextStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认${actionText}该工序？`, `${actionText}工序`, {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: nextStatus === 1 ? 'info' : 'warning',
    });
  } catch {
    return;
  }

  await productApi.changeProcessStatus(row.id, nextStatus);
  EMessage.success(`工序已${actionText}`);
  await loadProcesses();
};

const formatTime = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 19);
};

onMounted(loadProcesses);
</script>

<style scoped>
.processes-page {
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

.process-table {
  width: 100%;
}

.process-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.process-table :deep(.el-table__row) {
  height: 56px;
}

.process-code {
  font-weight: 600;
}

.empty-text {
  color: #9ca3af;
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
.dialog-form :deep(.el-textarea) {
  width: 100%;
}

.parameter-section {
  margin: 4px 0 20px;
}

.parameter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.parameter-title {
  color: #1f2937;
  font-weight: 600;
}

.parameter-tip {
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
}

.parameter-tag {
  margin: 2px 8px 2px 0;
}

.file-preview-body {
  min-height: 520px;
  max-height: 72vh;
  overflow: auto;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
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

.upload-icon {
  color: #6b7280;
  font-size: 36px;
}

.upload-text {
  color: #374151;
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
