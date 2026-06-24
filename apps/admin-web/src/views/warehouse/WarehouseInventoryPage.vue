<template>
  <div class="inventory-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="物料">
          <el-input v-model="query.keyword" clearable placeholder="名称或型号" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="query.materialBatchNo" clearable placeholder="物料批次号" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="query.supplierName" clearable placeholder="供应商名称" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchInventory">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增物料批次</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadInventory" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="inventoryRows" class="inventory-table">
        <el-table-column label="物料" min-width="220">
          <template #default="{ row }">
            <div class="material-name">{{ row.productName }}</div>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="物料类型" min-width="150">
          <template #default="{ row }">
            {{ row.productAttribute && row.productType ? `${row.productAttribute} / ${row.productType}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="materialBatchNo" label="物料批次号" min-width="170" />
        <el-table-column label="供应商" min-width="150">
          <template #default="{ row }">{{ row.supplierName || '-' }}</template>
        </el-table-column>
        <el-table-column label="库存数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.quantity) }}</template>
        </el-table-column>
        <el-table-column label="预留数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.reservedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="可用数量" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ danger: Number(row.availableQuantity) < 0 }">
              {{ formatQuantity(row.availableQuantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="112">
          <template #default="{ row }">
            <el-tag :type="getStatusMeta(row.status).type" effect="light">
              {{ getStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openReservations(row)">预留</el-button>
            <el-button link type="primary" @click="openUsages(row)">使用</el-button>
            <el-button link type="primary" @click="openStocktake(row)">盘点</el-button>
            <el-button
              link
              :type="row.status === 'disabled' ? 'success' : 'danger'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'disabled' ? '启用' : '停用' }}
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
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          @current-change="loadInventory"
        />
      </div>
    </section>

    <el-dialog
      v-model="formDialogVisible"
      :title="editingBatchId ? '编辑物料批次' : '新增物料批次'"
      width="760px"
    >
      <el-form class="dialog-form" label-width="104px" :model="batchForm">
        <div class="form-grid">
          <el-form-item label="物料" required>
            <el-select v-model="batchForm.productId" filterable placeholder="请选择物料产品">
              <el-option
                v-for="product in productOptions"
                :key="product.id"
                :label="formatProductOption(product)"
                :value="product.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="批次号" required>
            <el-input v-model="batchForm.materialBatchNo" placeholder="请输入物料批次号" />
          </el-form-item>
          <el-form-item label="供应商">
            <el-input v-model="batchForm.supplierName" placeholder="请输入供应商名称" />
          </el-form-item>
          <el-form-item label="入库日期">
            <el-date-picker
              v-model="batchForm.receivedDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
            />
          </el-form-item>
          <el-form-item label="库存数量" required>
            <el-input-number v-model="batchForm.quantity" :min="0" :precision="4" :step="1" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="batchForm.status">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="batchForm.remark" type="textarea" :rows="3" placeholder="可填写来源或盘点说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBatch">保存批次</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="库存详情" width="760px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="物料名称">{{ detailRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="物料型号">{{ detailRow.productModel }}</el-descriptions-item>
        <el-descriptions-item label="物料类型">
          {{ detailRow.productAttribute && detailRow.productType ? `${detailRow.productAttribute} / ${detailRow.productType}` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="物料批次号">{{ detailRow.materialBatchNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.supplierName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ detailRow.receivedDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="库存数量">{{ formatQuantity(detailRow.quantity) }}</el-descriptions-item>
        <el-descriptions-item label="预留数量">{{ formatQuantity(detailRow.reservedQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="可用数量">{{ formatQuantity(detailRow.availableQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="已用数量">{{ formatQuantity(detailRow.usedQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ getStatusMeta(detailRow.status).label }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(detailRow.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="reservationDialogVisible" title="预留明细" width="820px">
      <el-table :data="activeDetail?.reservations ?? []" class="detail-table">
        <el-table-column label="生产批次ID" width="120">
          <template #default="{ row }">{{ row.batchId || '-' }}</template>
        </el-table-column>
        <el-table-column label="预留数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.reservedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="已用数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.usedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">{{ row.status || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录人" width="120">
          <template #default="{ row }">{{ row.recordedByName || row.recordedBy || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录时间" width="170">
          <template #default="{ row }">{{ formatTime(row.recordedAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="usageDialogVisible" title="使用明细" width="820px">
      <el-table :data="activeDetail?.usages ?? []" class="detail-table">
        <el-table-column label="生产批次ID" width="120">
          <template #default="{ row }">{{ row.batchId || '-' }}</template>
        </el-table-column>
        <el-table-column label="已用数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.usedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="预留数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.reservedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">{{ row.status || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录人" width="120">
          <template #default="{ row }">{{ row.recordedByName || row.recordedBy || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录时间" width="170">
          <template #default="{ row }">{{ formatTime(row.recordedAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="160">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="stocktakeDialogVisible" title="库存盘点" width="480px">
      <el-form class="dialog-form" label-width="92px" :model="stocktakeForm">
        <el-form-item label="盘点数量" required>
          <el-input-number v-model="stocktakeForm.quantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="盘点说明">
          <el-input v-model="stocktakeForm.remark" type="textarea" :rows="3" placeholder="可填写盘点差异说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stocktakeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStocktake">确认盘点</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  MaterialBatchDetail,
  MaterialBatchListItem,
  MaterialBatchStatus,
  ProductListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { warehouseApi } from '../../api/warehouse';

const statusOptions: Array<{ value: MaterialBatchStatus; label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = [
  { value: 'available', label: '可用', type: 'success' },
  { value: 'partial_used', label: '部分使用', type: 'warning' },
  { value: 'used_up', label: '已用尽', type: 'info' },
  { value: 'disabled', label: '停用', type: 'danger' },
];

const inventoryRows = ref<MaterialBatchListItem[]>([]);
const productOptions = ref<ProductListItem[]>([]);
const activeDetail = ref<MaterialBatchDetail | null>(null);
const detailRow = ref<MaterialBatchListItem | null>(null);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const formDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const reservationDialogVisible = ref(false);
const usageDialogVisible = ref(false);
const stocktakeDialogVisible = ref(false);
const editingBatchId = ref<string | null>(null);
const stocktakeBatchId = ref<string | null>(null);

const query = reactive({
  keyword: '',
  materialBatchNo: '',
  supplierName: '',
  status: '',
});

const batchForm = reactive({
  productId: '',
  materialBatchNo: '',
  supplierName: '',
  receivedDate: '',
  quantity: 0,
  status: 'available' as MaterialBatchStatus,
  remark: '',
});

const stocktakeForm = reactive({
  quantity: 0,
  remark: '',
});

const loadProductOptions = async () => {
  const page = await productApi.listProducts({ page: 1, pageSize: 100, status: 'enabled' });
  productOptions.value = page.items;
};

const loadInventory = async () => {
  loading.value = true;
  try {
    const page = await warehouseApi.listInventory({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      materialBatchNo: query.materialBatchNo,
      supplierName: query.supplierName,
      status: query.status,
    });
    inventoryRows.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadProductOptions(), loadInventory()]);
  } finally {
    loading.value = false;
  }
};

const searchInventory = async () => {
  currentPage.value = 1;
  await loadInventory();
};

const resetQuery = async () => {
  query.keyword = '';
  query.materialBatchNo = '';
  query.supplierName = '';
  query.status = '';
  currentPage.value = 1;
  await loadInventory();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadInventory();
};

const resetBatchForm = () => {
  Object.assign(batchForm, {
    productId: '',
    materialBatchNo: '',
    supplierName: '',
    receivedDate: '',
    quantity: 0,
    status: 'available' as MaterialBatchStatus,
    remark: '',
  });
};

const openCreate = async () => {
  editingBatchId.value = null;
  resetBatchForm();
  if (!productOptions.value.length) {
    await loadProductOptions();
  }
  formDialogVisible.value = true;
};

const openEdit = async (row: MaterialBatchListItem) => {
  editingBatchId.value = row.id;
  Object.assign(batchForm, {
    productId: row.productId,
    materialBatchNo: row.materialBatchNo,
    supplierName: row.supplierName ?? '',
    receivedDate: row.receivedDate ?? '',
    quantity: Number(row.quantity),
    status: row.status,
    remark: row.remark ?? '',
  });
  if (!productOptions.value.length) {
    await loadProductOptions();
  }
  formDialogVisible.value = true;
};

const openDetail = (row: MaterialBatchListItem) => {
  detailRow.value = row;
  detailDialogVisible.value = true;
};

const loadDetail = async (row: MaterialBatchListItem) => {
  activeDetail.value = await warehouseApi.getInventory(row.id);
};

const openReservations = async (row: MaterialBatchListItem) => {
  await loadDetail(row);
  reservationDialogVisible.value = true;
};

const openUsages = async (row: MaterialBatchListItem) => {
  await loadDetail(row);
  usageDialogVisible.value = true;
};

const openStocktake = (row: MaterialBatchListItem) => {
  stocktakeBatchId.value = row.id;
  stocktakeForm.quantity = Number(row.quantity);
  stocktakeForm.remark = '';
  stocktakeDialogVisible.value = true;
};

const submitBatch = async () => {
  if (!batchForm.productId || !batchForm.materialBatchNo.trim()) {
    ElMessage.warning('请选择物料并填写批次号');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      productId: batchForm.productId,
      materialBatchNo: batchForm.materialBatchNo,
      supplierName: batchForm.supplierName,
      receivedDate: batchForm.receivedDate || null,
      quantity: batchForm.quantity,
      status: batchForm.status,
      remark: batchForm.remark,
    };

    if (editingBatchId.value) {
      await warehouseApi.updateInventory(editingBatchId.value, payload);
      ElMessage.success('物料批次已更新');
    } else {
      await warehouseApi.createInventory(payload);
      ElMessage.success('物料批次已新增');
    }

    formDialogVisible.value = false;
    await loadInventory();
  } finally {
    submitting.value = false;
  }
};

const submitStocktake = async () => {
  if (!stocktakeBatchId.value) {
    return;
  }

  submitting.value = true;
  try {
    await warehouseApi.stocktakeInventory(stocktakeBatchId.value, {
      quantity: stocktakeForm.quantity,
      remark: stocktakeForm.remark,
    });
    ElMessage.success('库存盘点已保存');
    stocktakeDialogVisible.value = false;
    await loadInventory();
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: MaterialBatchListItem) => {
  const disabled = row.status !== 'disabled';
  const actionText = disabled ? '停用' : '启用';
  try {
    await ElMessageBox.confirm(`确认${actionText}该物料批次？`, `${actionText}物料批次`, {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: disabled ? 'warning' : 'info',
    });
  } catch {
    return;
  }

  await warehouseApi.changeInventoryStatus(row.id, disabled);
  ElMessage.success(`物料批次已${actionText}`);
  await loadInventory();
};

const getStatusMeta = (status: MaterialBatchStatus) =>
  statusOptions.find((item) => item.value === status) ?? statusOptions[0];

const formatProductOption = (product: ProductListItem) => `${product.productModel} / ${product.productName}`;

const formatQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return '-';
  }

  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
};

const formatTime = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 19);
};

onMounted(loadPageData);
</script>

<style scoped>
.inventory-page {
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

.inventory-table {
  width: 100%;
}

.inventory-table :deep(.el-table__header th),
.detail-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.inventory-table :deep(.el-table__row) {
  height: 56px;
}

.material-name {
  color: #1f2937;
  font-weight: 600;
}

.sub-text {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
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
