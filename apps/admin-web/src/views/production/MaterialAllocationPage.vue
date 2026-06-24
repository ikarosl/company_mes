<template>
  <div class="material-allocation-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="批次号/工单号/产品" />
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="query.productId" clearable filterable placeholder="全部">
            <el-option v-for="product in productOptions" :key="product.id" :label="formatProduct(product)" :value="product.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料">
          <el-input v-model="query.materialKeyword" clearable placeholder="物料型号/名称" />
        </el-form-item>
        <el-form-item label="关键物料">
          <el-select v-model="query.keyMaterial" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="是" value="1" />
            <el-option label="否" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchAllocations">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <span class="toolbar-title">物料分配</span>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadAllocations" />
        </el-tooltip>
      </div>

      <div v-loading="loading" class="batch-list">
        <el-empty v-if="!allocationRows.length" description="暂无物料需求" />
        <section v-for="batch in allocationRows" v-else :key="batch.id" class="batch-section">
          <div class="batch-header">
            <div>
              <span class="batch-no">{{ batch.batchNo }}</span>
              <span class="sub-text">{{ batch.workOrderNo || '-' }} / {{ batch.productModel }} / {{ batch.productName }}</span>
            </div>
            <div class="batch-meta">
              <span>计划 {{ formatQuantity(batch.plannedQuantity) }}</span>
              <el-tag :type="getMaterialStatusMeta(batch.materialStatus).type" effect="light">
                {{ getMaterialStatusMeta(batch.materialStatus).label }}
              </el-tag>
            </div>
          </div>

          <el-table :data="batch.requirements" class="detail-table">
            <el-table-column prop="materialModel" label="物料编码" min-width="150" />
            <el-table-column prop="materialName" label="物料名称" min-width="150" />
            <el-table-column label="单件用量" width="100" align="right">
              <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
            </el-table-column>
            <el-table-column label="需求数量" width="110" align="right">
              <template #default="{ row }">{{ formatQuantity(row.planQuantity) }}</template>
            </el-table-column>
            <el-table-column label="已预留" width="100" align="right">
              <template #default="{ row }">{{ formatQuantity(row.reservedQuantity) }}</template>
            </el-table-column>
            <el-table-column label="未满足" width="100" align="right">
              <template #default="{ row }">
                <span :class="{ danger: Number(row.unmetQuantity) > 0 }">{{ formatQuantity(row.unmetQuantity) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="物料批次" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.materialBatchNo || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="getRequirementStatusMeta(row.allocationStatus).type" effect="light">
                  {{ getRequirementStatusMeta(row.allocationStatus).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" :disabled="Number(row.usedQuantity) > 0" @click="openAllocate(batch, row)">分配</el-button>
                <el-button link type="danger" :disabled="!row.materialBatchId || Number(row.usedQuantity) > 0" @click="clearAllocation(batch, row)">清除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </div>

      <div class="table-footer">
        <span class="total-text">共 {{ total }} 条</span>
        <el-select v-model="pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option label="10条/页" :value="10" />
          <el-option label="20条/页" :value="20" />
          <el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next, jumper" @current-change="loadAllocations" />
      </div>
    </section>

    <el-dialog v-model="allocateDialogVisible" title="分配物料批次" :width="DialogWidth.lg" class="business-dialog">
      <template v-if="activeBatch && activeRequirement">
        <el-descriptions :column="2" border class="allocation-summary">
          <el-descriptions-item label="生产批次">{{ activeBatch.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="物料">{{ activeRequirement.materialModel }} / {{ activeRequirement.materialName }}</el-descriptions-item>
          <el-descriptions-item label="需求数量">{{ formatQuantity(activeRequirement.planQuantity) }} {{ activeRequirement.unit || '' }}</el-descriptions-item>
          <el-descriptions-item label="未满足">{{ formatQuantity(activeRequirement.unmetQuantity) }} {{ activeRequirement.unit || '' }}</el-descriptions-item>
        </el-descriptions>

        <el-form class="dialog-form" label-width="108px" :model="allocateForm">
          <el-form-item label="物料批次" required>
            <el-select v-model="allocateForm.materialBatchId" filterable placeholder="请选择物料批次" @change="handleBatchChange">
              <el-option
                v-for="batch in availableBatches"
                :key="batch.id"
                :label="formatAvailableBatch(batch)"
                :value="batch.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="预留数量" required>
            <el-input-number v-model="allocateForm.reservedQuantity" :min="0.0001" :precision="4" :step="1" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="allocateForm.remark" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="allocateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAllocation">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type {
  MaterialAllocationAvailableBatchItem,
  MaterialAllocationBatchItem,
  MaterialAllocationRequirementItem,
  ProductListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { productionApi } from '../../api/production';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

/** 批次级物料状态字典：统一物料分配页面的中文文案和状态颜色。 */
const materialStatusOptions: Record<MaterialAllocationBatchItem['materialStatus'], { label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  missing_demand: { label: '未生成需求', type: 'info' },
  unallocated: { label: '待分配', type: 'warning' },
  partial: { label: '部分分配', type: 'warning' },
  allocated: { label: '已齐套', type: 'success' },
  shortage: { label: '缺料', type: 'danger' },
  used: { label: '已领用', type: 'primary' },
};

const requirementStatusOptions: Record<MaterialAllocationRequirementItem['allocationStatus'], { label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }> = {
  unallocated: { label: '待分配', type: 'warning' },
  partial: { label: '部分分配', type: 'warning' },
  allocated: { label: '已预留', type: 'success' },
  used: { label: '已领用', type: 'primary' },
  cancelled: { label: '已取消', type: 'info' },
};

/** 查询条件：按生产批次、产品和物料筛选已生成的需求。 */
const query = reactive({ keyword: '', productId: '', materialKeyword: '', keyMaterial: '' });
const productOptions = ref<ProductListItem[]>([]);
const allocationRows = ref<MaterialAllocationBatchItem[]>([]);
const availableBatches = ref<MaterialAllocationAvailableBatchItem[]>([]);
const activeBatch = ref<MaterialAllocationBatchItem | null>(null);
const activeRequirement = ref<MaterialAllocationRequirementItem | null>(null);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const allocateDialogVisible = ref(false);

/** 分配弹窗表单：记录本次选择的物料批次、预留数量和业务备注。 */
const allocateForm = reactive({
  materialBatchId: '',
  reservedQuantity: 1,
  remark: '',
});

const loadOptions = async () => {
  const page = await productApi.listProducts({ page: 1, pageSize: 200, status: 'enabled' });
  productOptions.value = page.items;
};

const loadAllocations = async (page = currentPage.value) => {
  loading.value = true;
  try {
    currentPage.value = page;
    const result = await productionApi.listMaterialAllocations({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      productId: query.productId,
      materialKeyword: query.materialKeyword,
      keyMaterial: query.keyMaterial,
    });
    allocationRows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};

const searchAllocations = async () => {
  currentPage.value = 1;
  await loadAllocations();
};

const resetQuery = async () => {
  Object.assign(query, { keyword: '', productId: '', materialKeyword: '', keyMaterial: '' });
  currentPage.value = 1;
  await loadAllocations();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadAllocations();
};

/** 打开分配弹窗并读取与当前 BOM 物料匹配的可用库存批次。 */
const openAllocate = async (batch: MaterialAllocationBatchItem, row: MaterialAllocationRequirementItem) => {
  activeBatch.value = batch;
  activeRequirement.value = row;
  availableBatches.value = await productionApi.listAvailableMaterialBatches(row.productMaterialId);
  Object.assign(allocateForm, {
    materialBatchId: row.materialBatchId ?? '',
    reservedQuantity: Number(row.reservedQuantity) > 0 ? Number(row.reservedQuantity) : Math.max(Number(row.unmetQuantity), 0.0001),
    remark: '',
  });
  allocateDialogVisible.value = true;
};

/** 根据所选批次可用量自动收敛本次预留数量，避免默认值超过库存。 */
const handleBatchChange = () => {
  const selected = availableBatches.value.find((item) => item.id === allocateForm.materialBatchId);
  if (!selected || !activeRequirement.value) {
    return;
  }

  const targetQuantity = Number(activeRequirement.value.unmetQuantity) > 0
    ? Number(activeRequirement.value.unmetQuantity)
    : Number(activeRequirement.value.planQuantity);
  allocateForm.reservedQuantity = Math.min(targetQuantity, Number(selected.availableQuantity));
};

/** 提交物料分配，成功后仅替换当前批次数据，避免整页闪烁。 */
const submitAllocation = async () => {
  if (!activeBatch.value || !activeRequirement.value || !allocateForm.materialBatchId || allocateForm.reservedQuantity <= 0) {
    EMessage.warning('请选择物料批次并填写预留数量');
    return;
  }

  submitting.value = true;
  try {
    const updated = await productionApi.allocateMaterial(activeBatch.value.id, {
      productMaterialId: activeRequirement.value.productMaterialId,
      materialBatchId: allocateForm.materialBatchId,
      reservedQuantity: allocateForm.reservedQuantity,
      remark: allocateForm.remark || null,
    });
    replaceAllocationRow(updated);
    EMessage.success('物料批次已分配');
    allocateDialogVisible.value = false;
  } catch (error) {
    EMessage.error(error, '物料分配失败，请检查可用库存');
  } finally {
    submitting.value = false;
  }
};

const clearAllocation = async (batch: MaterialAllocationBatchItem, row: MaterialAllocationRequirementItem) => {
  try {
    await ElMessageBox.confirm('确认清除该物料分配？', '清除分配', {
      confirmButtonText: '确认清除',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }

  try {
    const updated = await productionApi.clearMaterialAllocation(batch.id, row.productMaterialId);
    replaceAllocationRow(updated);
    EMessage.success('物料分配已清除');
  } catch (error) {
    EMessage.error(error, '清除物料分配失败');
  }
};

const replaceAllocationRow = (updated: MaterialAllocationBatchItem) => {
  const index = allocationRows.value.findIndex((item) => item.id === updated.id);
  if (index >= 0) {
    allocationRows.value[index] = updated;
  }
};

const getMaterialStatusMeta = (status: MaterialAllocationBatchItem['materialStatus']) => materialStatusOptions[status] ?? materialStatusOptions.unallocated;
const getRequirementStatusMeta = (status: MaterialAllocationRequirementItem['allocationStatus']) => requirementStatusOptions[status] ?? requirementStatusOptions.unallocated;
const formatProduct = (product: ProductListItem) => `${product.productModel} / ${product.productName}`;
const formatQuantity = (value: string | number | null | undefined) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};

const formatAvailableBatch = (batch: MaterialAllocationAvailableBatchItem) =>
  `${batch.materialBatchNo} / 可用 ${formatQuantity(batch.availableQuantity)} / 库存 ${formatQuantity(batch.quantity)}`;

onMounted(async () => {
  await Promise.all([loadOptions(), loadAllocations()]);
});
</script>

<style scoped>
.material-allocation-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.business-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
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

.toolbar-title,
.batch-no {
  color: #1f2937;
  font-weight: 600;
}

.batch-list {
  min-height: 280px;
  padding: 16px;
}

.batch-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.batch-section + .batch-section {
  margin-top: 16px;
}

.batch-header,
.batch-meta {
  display: flex;
  align-items: center;
}

.batch-header {
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.batch-meta {
  gap: 12px;
  color: #6b7280;
  font-size: 13px;
}

.sub-text {
  margin-left: 8px;
  color: #6b7280;
  font-size: 12px;
}

.detail-table {
  width: 100%;
}

.detail-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.danger {
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
  border-top: 1px solid #e5e7eb;
}

.total-text {
  color: #6b7280;
  font-size: 14px;
}

.page-size {
  width: 96px;
}

.allocation-summary {
  margin-bottom: 16px;
}

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-select),
.dialog-form :deep(.el-input-number),
.dialog-form :deep(.el-textarea) {
  width: 100%;
}

@media (max-width: 1120px) {
  .query-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .query-actions {
    margin-left: 0;
  }

  .batch-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 16px;
  }
}
</style>
