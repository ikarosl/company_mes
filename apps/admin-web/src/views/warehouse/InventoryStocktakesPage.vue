<template>
  <div class="stocktake-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="盘点单、批次、产品或原因" />
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select v-model="query.inventoryType" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="物料库存" value="material" />
            <el-option label="成品/半成品" value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="差异">
          <el-select v-model="query.differenceType" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="盘盈" value="surplus" />
            <el-option label="盘亏" value="shortage" />
            <el-option label="无差异" value="equal" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="已登记" value="confirmed" />
            <el-option label="已调账" value="adjusted" />
            <el-option label="已作废" value="voided" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchStocktakes">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增盘点</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadStocktakes" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="stocktakeRows" class="stocktake-table">
        <el-table-column prop="stocktakeNo" label="盘点单号" min-width="160" />
        <el-table-column label="对象" min-width="230">
          <template #default="{ row }">
            <div class="strong-text">{{ row.productName || '-' }}</div>
            <div class="sub-text">{{ row.productModel || '-' }} / {{ formatInventoryType(row.inventoryType, row.objectType) }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="batchNoSnapshot" label="库存批次" min-width="160" />
        <el-table-column label="账面" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.beforeQuantity) }}</template>
        </el-table-column>
        <el-table-column label="实盘" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.countedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="差异" width="120" align="right">
          <template #default="{ row }">
            <span :class="getDifferenceMeta(row.differenceType).className">
              {{ formatSignedQuantity(row.differenceQuantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="差异类型" width="110">
          <template #default="{ row }">
            <el-tag :type="getDifferenceMeta(row.differenceType).type" effect="light">
              {{ getDifferenceMeta(row.differenceType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusMeta(row.status).type" effect="light">
              {{ getStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="盘点人" width="120">
          <template #default="{ row }">{{ row.operatorName || '-' }}</template>
        </el-table-column>
        <el-table-column label="盘点时间" width="170">
          <template #default="{ row }">{{ formatTime(row.operatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button
              link
              type="primary"
              :disabled="row.status !== 'confirmed'"
              @click="confirmAdjust(row)"
            >
              确认调账
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
          @current-change="loadStocktakes"
        />
      </div>
    </section>

    <el-dialog v-model="createDialogVisible" title="新增库存盘点" :width="DialogWidth.lg" class="business-dialog">
      <el-form class="dialog-form" label-width="104px" :model="createForm">
        <div class="form-grid">
          <el-form-item label="对象类型" required>
            <el-radio-group v-model="createForm.inventoryType" @change="handleInventoryTypeChange">
              <el-radio-button label="material">物料库存</el-radio-button>
              <el-radio-button label="product">成品/半成品</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="库存批次" required>
            <el-select
              v-model="createForm.inventoryBatchId"
              filterable
              remote
              :remote-method="searchTargets"
              :loading="targetLoading"
              placeholder="请选择库存批次"
              @change="handleTargetChange"
            >
              <el-option
                v-for="target in targetOptions"
                :key="`${target.inventoryType}-${target.id}`"
                :label="formatTarget(target)"
                :value="target.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="账面数量">
            <el-input :model-value="formatQuantity(selectedTarget?.quantity)" disabled />
          </el-form-item>
          <el-form-item label="实盘数量" required>
            <el-input-number v-model="createForm.countedQuantity" :min="0" :precision="4" :step="1" />
          </el-form-item>
          <el-form-item label="差异原因">
            <el-input v-model="createForm.reasonType" maxlength="255" placeholder="如账实不符、破损、漏记等" />
          </el-form-item>
          <el-form-item label="盘点日期">
            <el-date-picker
              v-model="createForm.operatedAt"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="默认当前时间"
            />
          </el-form-item>
        </div>
        <el-form-item label="说明">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="可填写盘点过程、照片编号或处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">保存盘点</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="盘点详情" :width="DialogWidth.lg" class="business-dialog">
      <el-descriptions v-if="activeRow" :column="2" border>
        <el-descriptions-item label="盘点单号">{{ activeRow.stocktakeNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusMeta(activeRow.status).label }}</el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ formatInventoryType(activeRow.inventoryType, activeRow.objectType) }}</el-descriptions-item>
        <el-descriptions-item label="库存批次">{{ activeRow.batchNoSnapshot || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品/物料">{{ activeRow.productModel || '-' }} / {{ activeRow.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="差异类型">{{ getDifferenceMeta(activeRow.differenceType).label }}</el-descriptions-item>
        <el-descriptions-item label="账面数量">{{ formatQuantity(activeRow.beforeQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="实盘数量">{{ formatQuantity(activeRow.countedQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="差异数量">{{ formatSignedQuantity(activeRow.differenceQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="调整后数量">{{ formatQuantity(activeRow.afterQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="盘点人">{{ activeRow.operatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="盘点时间">{{ formatTime(activeRow.operatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="调账人">{{ activeRow.adjustedByName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="调账时间">{{ formatTime(activeRow.adjustedAt) }}</el-descriptions-item>
        <el-descriptions-item label="差异原因" :span="2">{{ activeRow.reasonType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="说明" :span="2">{{ activeRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="adjustDialogVisible" title="确认盘点调账" :width="DialogWidth.lg" class="business-dialog">
      <template v-if="adjustRow">
        <el-alert
          :title="getAdjustAlertTitle(adjustRow)"
          :type="adjustRow.differenceType === 'equal' ? 'info' : 'warning'"
          show-icon
          :closable="false"
          class="adjust-alert"
        />
        <el-descriptions class="adjust-summary" :column="3" border>
          <el-descriptions-item label="盘点单号">{{ adjustRow.stocktakeNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="对象类型">
            {{ formatInventoryType(adjustRow.inventoryType, adjustRow.objectType) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusMeta(adjustRow.status).label }}</el-descriptions-item>
          <el-descriptions-item label="库存批次">{{ adjustRow.batchNoSnapshot || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品/物料">{{ formatStocktakeObject(adjustRow) }}</el-descriptions-item>
          <el-descriptions-item label="盘点人">{{ adjustRow.operatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="账面数量">{{ formatQuantity(adjustRow.beforeQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="实盘数量">{{ formatQuantity(adjustRow.countedQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="调整后数量">{{ formatQuantity(adjustRow.countedQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="差异类型">
            <el-tag :type="getDifferenceMeta(adjustRow.differenceType).type" effect="light">
              {{ getDifferenceMeta(adjustRow.differenceType).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="差异数量">
            <span :class="getDifferenceMeta(adjustRow.differenceType).className">
              {{ formatSignedQuantity(adjustRow.differenceQuantity) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="调账影响">{{ getAdjustImpactText(adjustRow) }}</el-descriptions-item>
          <el-descriptions-item label="盘点时间">{{ formatTime(adjustRow.operatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="差异原因" :span="2">{{ adjustRow.reasonType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="原盘点说明" :span="3">{{ adjustRow.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-form class="dialog-form" label-width="92px" :model="adjustForm">
          <el-form-item label="调账说明">
            <el-input
              v-model="adjustForm.remark"
              type="textarea"
              :rows="3"
              placeholder="可补充调账原因、审批依据或现场确认说明"
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdjust">确认调账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  InventoryStocktakeInventoryType,
  InventoryStocktakeListItem,
  InventoryStocktakeTargetOption,
} from '@company/api-contract';
import { warehouseApi } from '../../api/warehouse';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

const differenceOptions = {
  surplus: { label: '盘盈', type: 'success' as const, className: 'success-text' },
  shortage: { label: '盘亏', type: 'danger' as const, className: 'danger-text' },
  equal: { label: '无差异', type: 'info' as const, className: '' },
};

const statusOptions = {
  draft: { label: '草稿', type: 'info' as const },
  confirmed: { label: '已登记', type: 'warning' as const },
  adjusted: { label: '已调账', type: 'success' as const },
  voided: { label: '已作废', type: 'danger' as const },
};

/** 查询条件：用于盘点台账列表筛选，不直接参与库存数量计算。 */
const query = reactive({
  keyword: '',
  inventoryType: '',
  differenceType: '',
  status: '',
});

const stocktakeRows = ref<InventoryStocktakeListItem[]>([]);
const targetOptions = ref<InventoryStocktakeTargetOption[]>([]);
const activeRow = ref<InventoryStocktakeListItem | null>(null);
const loading = ref(false);
const targetLoading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const createDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const adjustDialogVisible = ref(false);

/** 新增盘点表单：账面数量由所选库存批次带出，提交时只发送实盘数量和说明。 */
const createForm = reactive({
  inventoryType: 'material' as InventoryStocktakeInventoryType,
  inventoryBatchId: '',
  countedQuantity: 0,
  reasonType: '',
  operatedAt: '',
  remark: '',
});

/** 调账确认表单：只允许补充调账说明，调整后库存由后端按盘点实盘数计算。 */
const adjustForm = reactive({
  remark: '',
});

const adjustRow = ref<InventoryStocktakeListItem | null>(null);

const selectedTarget = computed(() =>
  targetOptions.value.find((item) => item.id === createForm.inventoryBatchId) ?? null,
);

const loadStocktakes = async (page = currentPage.value) => {
  loading.value = true;
  try {
    currentPage.value = page;
    const result = await warehouseApi.listStocktakes({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      inventoryType: query.inventoryType,
      differenceType: query.differenceType,
      status: query.status,
    });
    stocktakeRows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

const loadTargets = async (keyword = '') => {
  targetLoading.value = true;
  try {
    targetOptions.value = await warehouseApi.listStocktakeTargets({
      inventoryType: createForm.inventoryType,
      keyword,
    });
  } finally {
    targetLoading.value = false;
  }
};

const searchStocktakes = async () => {
  currentPage.value = 1;
  await loadStocktakes();
};

const resetQuery = async () => {
  Object.assign(query, { keyword: '', inventoryType: '', differenceType: '', status: '' });
  currentPage.value = 1;
  await loadStocktakes();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadStocktakes();
};

const openCreate = async () => {
  Object.assign(createForm, {
    inventoryType: 'material' as InventoryStocktakeInventoryType,
    inventoryBatchId: '',
    countedQuantity: 0,
    reasonType: '',
    operatedAt: '',
    remark: '',
  });
  await loadTargets();
  createDialogVisible.value = true;
};

const openDetail = (row: InventoryStocktakeListItem) => {
  activeRow.value = row;
  detailDialogVisible.value = true;
};

const handleInventoryTypeChange = async () => {
  createForm.inventoryBatchId = '';
  createForm.countedQuantity = 0;
  await loadTargets();
};

const searchTargets = async (keyword: string) => {
  await loadTargets(keyword);
};

const handleTargetChange = () => {
  createForm.countedQuantity = Number(selectedTarget.value?.quantity ?? 0);
};

/** 保存盘点台账：只登记盘点事实，调账需要用户在列表中再次确认。 */
const submitCreate = async () => {
  if (!createForm.inventoryBatchId) {
    EMessage.warning('请选择库存批次');
    return;
  }

  submitting.value = true;
  try {
    await warehouseApi.createStocktake({
      inventoryType: createForm.inventoryType,
      inventoryBatchId: createForm.inventoryBatchId,
      countedQuantity: createForm.countedQuantity,
      reasonType: createForm.reasonType || null,
      operatedAt: createForm.operatedAt || null,
      remark: createForm.remark || null,
    });
    EMessage.success('盘点台账已保存');
    createDialogVisible.value = false;
    await loadStocktakes();
  } catch (error) {
    EMessage.error(error, '盘点台账保存失败');
  } finally {
    submitting.value = false;
  }
};

/** 打开调账确认弹窗：先展示盘点差异和库存调整影响，再由用户确认提交。 */
const confirmAdjust = async (row: InventoryStocktakeListItem) => {
  if (row.status !== 'confirmed') {
    EMessage.warning('只有已登记的盘点记录可以调账');
    return;
  }

  adjustRow.value = row;
  adjustForm.remark = row.remark ?? '';
  adjustDialogVisible.value = true;
};

/** 提交调账：后端事务会同时更新库存当前数量，并把盘点台账状态改为已调账。 */
const submitAdjust = async () => {
  if (!adjustRow.value) {
    return;
  }

  submitting.value = true;
  try {
    await warehouseApi.adjustStocktake(adjustRow.value.id, { remark: adjustForm.remark || null });
    EMessage.success('库存调账已完成');
    adjustDialogVisible.value = false;
    await loadStocktakes();
  } catch (error) {
    EMessage.error(error, '库存调账失败');
  } finally {
    submitting.value = false;
  }
};

const getDifferenceMeta = (type: InventoryStocktakeListItem['differenceType']) =>
  differenceOptions[type] ?? differenceOptions.equal;

const getStatusMeta = (status: InventoryStocktakeListItem['status']) =>
  statusOptions[status] ?? statusOptions.draft;

const formatInventoryType = (type: InventoryStocktakeInventoryType, objectType?: string | null) => {
  if (type === 'material') return '物料库存';
  if (objectType === 'finished') return '成品库存';
  if (objectType === 'semi_finished') return '半成品库存';
  return '产品库存';
};

const formatTarget = (target: InventoryStocktakeTargetOption) =>
  `${target.batchNo} / ${target.productModel} / ${target.productName} / 库存 ${formatQuantity(target.quantity)}`;

const formatStocktakeObject = (row: InventoryStocktakeListItem) =>
  `${row.productModel || '-'} / ${row.productName || '-'}`;

const getAdjustAlertTitle = (row: InventoryStocktakeListItem) =>
  `本次将库存从 ${formatQuantity(row.beforeQuantity)} 调整为 ${formatQuantity(row.countedQuantity)}，差异 ${formatSignedQuantity(row.differenceQuantity)}`;

const getAdjustImpactText = (row: InventoryStocktakeListItem) => {
  if (row.differenceType === 'surplus') return '盘盈调增库存';
  if (row.differenceType === 'shortage') return '盘亏调减库存';
  return '库存数量不变，仅确认盘点结果';
};

const formatQuantity = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};

const formatSignedQuantity = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '-';
  return `${amount > 0 ? '+' : ''}${formatQuantity(amount)}`;
};

const formatTime = (value: string | null) => {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 19);
};

onMounted(loadStocktakes);
</script>

<style scoped>
.stocktake-page {
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
  width: 190px;
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

.stocktake-table {
  width: 100%;
}

.adjust-alert,
.adjust-summary {
  margin-bottom: 16px;
}

.stocktake-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.strong-text {
  color: #1f2937;
  font-weight: 600;
}

.sub-text {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
}

.success-text {
  color: #16a34a;
  font-weight: 600;
}

.danger-text {
  color: #ef4444;
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

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
}

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-select),
.dialog-form :deep(.el-date-editor),
.dialog-form :deep(.el-input-number),
.dialog-form :deep(.el-textarea) {
  width: 100%;
}

.business-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

@media (max-width: 1120px) {
  .query-form,
  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }

  .query-actions {
    margin-left: 0;
  }
}
</style>
