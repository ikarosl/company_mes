<template>
  <div class="inventory-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="库存类型">
          <el-select v-model="query.inventoryType" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="物料库存" value="material" />
            <el-option label="产品库存" value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存对象">
          <el-input v-model="query.keyword" clearable placeholder="产品/物料、分类、批次、库位或供应商" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="query.materialBatchNo" clearable placeholder="库存批次号" />
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
        <el-button type="primary" @click="openInbound">物料入库</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadInventory" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="inventoryRows" class="inventory-table">
        <el-table-column label="库存类型" width="104">
          <template #default="{ row }">
            <el-tag :type="getInventoryTypeTag(row).type" effect="light">
              {{ getInventoryTypeTag(row).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存对象" min-width="220">
          <template #default="{ row }">
            <div class="material-name">{{ row.productName }}</div>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="对象类型" min-width="150">
          <template #default="{ row }">
            {{ formatObjectType(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="materialBatchNo" label="库存批次号" min-width="170" />
        <el-table-column label="供应商" min-width="150">
          <template #default="{ row }">{{ row.supplierName || '-' }}</template>
        </el-table-column>
        <el-table-column label="技术协议编码" min-width="150">
          <template #default="{ row }">{{ row.protocolCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="库存数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.quantity) }}</template>
        </el-table-column>
        <el-table-column label="初始入库" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.initialQuantity) }}</template>
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
        <el-table-column label="质量状态" width="112">
          <template #default="{ row }">
            <el-tag
              v-if="isMaterialInventory(row)"
              :type="row.qualityStatus === 'qualified' ? 'success' : row.qualityStatus === 'partial_qualified' ? 'warning' : 'info'"
              effect="light"
            >
              {{ formatQualityStatus(row.qualityStatus) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="410" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button v-if="isMaterialInventory(row)" link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button v-if="isMaterialInventory(row)" link type="primary" @click="openReservations(row)">预留</el-button>
            <el-button v-if="isMaterialInventory(row)" link type="primary" @click="openUsages(row)">使用</el-button>
            <el-button link type="primary" @click="openStocktake(row)">盘点</el-button>
            <el-button link type="primary" @click="openStocktakeRecords(row)">盘点记录</el-button>
            <el-button
              v-if="isMaterialInventory(row)"
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
      :width="DialogWidth.lg"
      class="business-dialog"
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
          <el-form-item label="技术协议编码">
            <el-input v-model="batchForm.protocolCode" maxlength="50" placeholder="请输入检测依据编码" />
          </el-form-item>
          <el-form-item label="入库日期">
            <el-date-picker
              v-model="batchForm.receivedDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
            />
          </el-form-item>
          <el-form-item label="库存数量">
            <el-input-number v-model="batchForm.quantity" disabled :min="0" :precision="4" :step="1" />
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

    <el-dialog v-model="detailDialogVisible" title="库存详情" :width="DialogWidth.lg" class="business-dialog">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="库存类型">{{ getInventoryTypeTag(detailRow).label }}</el-descriptions-item>
        <el-descriptions-item label="库存对象">{{ detailRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="对象型号">{{ detailRow.productModel }}</el-descriptions-item>
        <el-descriptions-item label="对象类型">
          {{ formatObjectType(detailRow) }}
        </el-descriptions-item>
        <el-descriptions-item label="库存批次号">{{ detailRow.materialBatchNo }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.supplierName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="技术协议编码">{{ detailRow.protocolCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品库存来源">{{ formatProductSourceType(detailRow.sourceType) }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ detailRow.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ detailRow.unit || '-' }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ detailRow.receivedDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="初始入库数量">{{ formatQuantity(detailRow.initialQuantity) }}</el-descriptions-item>
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

    <el-dialog v-model="reservationDialogVisible" title="预留明细" :width="DialogWidth.lg" class="business-dialog">
      <el-table :data="activeDetail?.reservations ?? []" class="detail-table">
        <el-table-column label="生产批次ID" width="120">
          <template #default="{ row }">{{ row.batchId || '-' }}</template>
        </el-table-column>
        <el-table-column label="预留数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.reservedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">{{ formatUsageType(row.operationType) }}</template>
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

    <el-dialog v-model="usageDialogVisible" title="使用明细" :width="DialogWidth.lg" class="business-dialog">
      <el-table :data="activeDetail?.usages ?? []" class="detail-table">
        <el-table-column label="生产批次ID" width="120">
          <template #default="{ row }">{{ row.batchId || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.operationQuantity) }}</template>
        </el-table-column>
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">{{ formatUsageType(row.operationType) }}</template>
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

    <el-dialog v-model="stocktakeDialogVisible" title="库存盘点" :width="DialogWidth.lg" class="business-dialog">
      <el-descriptions v-if="stocktakeBatch" class="stocktake-summary" :column="3" border>
        <el-descriptions-item label="库存类型">
          <el-tag :type="getInventoryTypeTag(stocktakeBatch).type" effect="light">
            {{ getInventoryTypeTag(stocktakeBatch).label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="库存批次号">{{ stocktakeBatch.materialBatchNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusMeta(stocktakeBatch.status).label }}</el-descriptions-item>
        <el-descriptions-item label="库存对象">{{ stocktakeBatch.productName }}</el-descriptions-item>
        <el-descriptions-item label="对象型号">{{ stocktakeBatch.productModel }}</el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ formatObjectType(stocktakeBatch) }}</el-descriptions-item>
        <el-descriptions-item label="账面库存">{{ formatQuantity(stocktakeBatch.quantity) }}</el-descriptions-item>
        <el-descriptions-item label="本次实盘">{{ formatQuantity(stocktakeForm.quantity) }}</el-descriptions-item>
        <el-descriptions-item label="盘点差异">
          <span :class="{ danger: getStocktakeDifference(stocktakeBatch, stocktakeForm.quantity) < 0 }">
            {{ formatSignedQuantity(getStocktakeDifference(stocktakeBatch, stocktakeForm.quantity)) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="可用数量">{{ formatQuantity(stocktakeBatch.availableQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="预留数量">{{ formatQuantity(stocktakeBatch.reservedQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="已用数量">{{ formatQuantity(stocktakeBatch.usedQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="初始入库">{{ formatQuantity(stocktakeBatch.initialQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="入库日期">{{ stocktakeBatch.receivedDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ stocktakeBatch.unit || '-' }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ stocktakeBatch.supplierName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="技术协议编码">{{ stocktakeBatch.protocolCode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品库存来源">{{ formatProductSourceType(stocktakeBatch.sourceType) }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ stocktakeBatch.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(stocktakeBatch.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="批次备注">{{ stocktakeBatch.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
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

    <el-dialog v-model="stocktakeRecordsDialogVisible" title="盘点记录" :width="DialogWidth.lg" class="business-dialog">
      <el-descriptions v-if="stocktakeRecordBatch" class="record-summary" :column="2" border>
        <el-descriptions-item label="库存类型">{{ getInventoryTypeTag(stocktakeRecordBatch).label }}</el-descriptions-item>
        <el-descriptions-item label="库存对象">{{ stocktakeRecordBatch.productName }}</el-descriptions-item>
        <el-descriptions-item label="对象型号">{{ stocktakeRecordBatch.productModel }}</el-descriptions-item>
        <el-descriptions-item label="库存批次号">{{ stocktakeRecordBatch.materialBatchNo }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ formatQuantity(stocktakeRecordBatch.quantity) }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-loading="stocktakeRecordLoading" :data="stocktakeRecordRows" class="detail-table stocktake-record-table">
        <el-table-column label="盘点单号" min-width="150">
          <template #default="{ row }">{{ row.stocktakeNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="账面数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.beforeQuantity) }}</template>
        </el-table-column>
        <el-table-column label="实盘数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.countedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="差异数量" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ danger: Number(row.differenceQuantity) < 0 }">
              {{ formatSignedQuantity(row.differenceQuantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="差异类型" width="110">
          <template #default="{ row }">
            <el-tag :type="getStocktakeDifferenceMeta(row.differenceType).type" effect="light">
              {{ getStocktakeDifferenceMeta(row.differenceType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStocktakeStatusMeta(row.status).type" effect="light">
              {{ getStocktakeStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="盘点人" width="120">
          <template #default="{ row }">{{ row.operatorName || '-' }}</template>
        </el-table-column>
        <el-table-column label="盘点时间" width="170">
          <template #default="{ row }">{{ formatTime(row.operatedAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import type {
  InventoryStocktakeDifferenceType,
  InventoryStocktakeInventoryType,
  InventoryStocktakeListItem,
  InventoryStocktakeStatus,
  MaterialBatchDetail,
  MaterialBatchListItem,
  MaterialBatchStatus,
  ProductListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { warehouseApi } from '../../api/warehouse';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

const statusOptions: Array<{ value: MaterialBatchStatus; label: string; type: 'success' | 'warning' | 'info' | 'danger' }> = [
  { value: 'available', label: '可用', type: 'success' },
  { value: 'partial_used', label: '部分使用', type: 'warning' },
  { value: 'used_up', label: '已用尽', type: 'info' },
  { value: 'disabled', label: '停用', type: 'danger' },
];

const inventoryRows = ref<MaterialBatchListItem[]>([]);
const router = useRouter();
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
const stocktakeRecordsDialogVisible = ref(false);
const editingBatchId = ref<string | null>(null);
const stocktakeBatchId = ref<string | null>(null);
const stocktakeInventoryType = ref<InventoryStocktakeInventoryType>('material');
const stocktakeBatch = ref<MaterialBatchListItem | null>(null);
const stocktakeRecordBatch = ref<MaterialBatchListItem | null>(null);
const stocktakeRecordRows = ref<InventoryStocktakeListItem[]>([]);
const stocktakeRecordLoading = ref(false);

/** 库存列表查询条件，不参与库存数量计算。 */
const query = reactive({
  inventoryType: '',
  keyword: '',
  materialBatchNo: '',
  supplierName: '',
  status: '',
});

/** 物料批次表单：技术协议编码作为该入库批次的检测依据快照。 */
const batchForm = reactive({
  productId: '',
  materialBatchNo: '',
  supplierName: '',
  protocolCode: '',
  receivedDate: '',
  quantity: 0,
  status: 'available' as MaterialBatchStatus,
  remark: '',
});

const stocktakeForm = reactive({
  quantity: 0,
  remark: '',
});

/** 盘点差异类型：用于库存行内盘点历史的状态标签展示。 */
const stocktakeDifferenceOptions: Array<{
  value: InventoryStocktakeDifferenceType;
  label: string;
  type: 'success' | 'warning' | 'info';
}> = [
  { value: 'surplus', label: '盘盈', type: 'success' },
  { value: 'shortage', label: '盘亏', type: 'warning' },
  { value: 'equal', label: '无差异', type: 'info' },
];

/** 盘点台账状态：用于区分已登记、已调账和作废记录。 */
const stocktakeStatusOptions: Array<{
  value: InventoryStocktakeStatus;
  label: string;
  type: 'primary' | 'success' | 'info' | 'danger';
}> = [
  { value: 'draft', label: '草稿', type: 'info' },
  { value: 'confirmed', label: '已登记', type: 'primary' },
  { value: 'adjusted', label: '已调账', type: 'success' },
  { value: 'voided', label: '已作废', type: 'danger' },
];

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
      inventoryType: query.inventoryType,
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
  query.inventoryType = '';
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

/** 新增正库存统一跳转到带来料检验的物料入库入口。 */
const openInbound = () => router.push('/warehouse/material-transactions');

const openEdit = async (row: MaterialBatchListItem) => {
  if (!isMaterialInventory(row)) {
    EMessage.warning('产品库存请通过成品/半成品出入库或盘点调整');
    return;
  }

  editingBatchId.value = row.id;
  Object.assign(batchForm, {
    productId: row.productId,
    materialBatchNo: row.materialBatchNo,
    supplierName: row.supplierName ?? '',
    protocolCode: row.protocolCode ?? '',
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
  if (!isMaterialInventory(row)) {
    return;
  }

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
  stocktakeInventoryType.value = getInventoryType(row);
  stocktakeBatch.value = row;
  stocktakeForm.quantity = Number(row.quantity);
  stocktakeForm.remark = '';
  stocktakeDialogVisible.value = true;
};

/**
 * 查看单条库存的盘点历史。
 * 1. 记录当前库存批次用于弹窗摘要
 * 2. 按 material + inventoryBatchId 精确查询盘点台账
 * 3. 查询失败时给出明确反馈，避免用户误以为没有记录
 */
const openStocktakeRecords = async (row: MaterialBatchListItem) => {
  stocktakeRecordBatch.value = row;
  stocktakeRecordRows.value = [];
  stocktakeRecordsDialogVisible.value = true;
  stocktakeRecordLoading.value = true;
  try {
    const page = await warehouseApi.listStocktakes({
      page: 1,
      pageSize: 50,
      inventoryType: getInventoryType(row),
      inventoryBatchId: row.id,
    });
    stocktakeRecordRows.value = page.items;
  } catch (error) {
    EMessage.error(error, '盘点记录加载失败');
  } finally {
    stocktakeRecordLoading.value = false;
  }
};

const submitBatch = async () => {
  if (!batchForm.productId || !batchForm.materialBatchNo.trim()) {
    EMessage.warning('请选择物料并填写批次号');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      productId: batchForm.productId,
      materialBatchNo: batchForm.materialBatchNo,
      supplierName: batchForm.supplierName,
      protocolCode: batchForm.protocolCode,
      receivedDate: batchForm.receivedDate || null,
      quantity: batchForm.quantity,
      status: batchForm.status,
      remark: batchForm.remark,
    };

    if (!editingBatchId.value) return;
    await warehouseApi.updateInventory(editingBatchId.value, payload);
    EMessage.success('物料批次已更新');

    formDialogVisible.value = false;
    await loadInventory();
  } catch (error) {
    EMessage.error(error, editingBatchId.value ? '物料批次更新失败' : '物料批次新增失败');
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
    if (stocktakeInventoryType.value === 'material') {
      await warehouseApi.stocktakeInventory(stocktakeBatchId.value, {
        quantity: stocktakeForm.quantity,
        remark: stocktakeForm.remark,
      });
    } else {
      // 产品库存盘点走库存页专用入口，由后端统一完成“登记盘点 + 调账”的事务。
      await warehouseApi.stocktakeInventoryByType('product', stocktakeBatchId.value, {
        quantity: stocktakeForm.quantity,
        remark: stocktakeForm.remark,
      });
    }
    EMessage.success('库存盘点已保存');
    stocktakeDialogVisible.value = false;
    await loadInventory();
  } catch (error) {
    EMessage.error(error, '库存盘点失败');
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: MaterialBatchListItem) => {
  if (!isMaterialInventory(row)) {
    EMessage.warning('产品库存不支持物料批次启停操作');
    return;
  }

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
  EMessage.success(`物料批次已${actionText}`);
  await loadInventory();
};

const getInventoryType = (row: MaterialBatchListItem): InventoryStocktakeInventoryType =>
  row.inventoryType === 'product' ? 'product' : 'material';

/** 物料库存才允许编辑、预留、使用和启停；产品库存只做库存展示和盘点。 */
const isMaterialInventory = (row: MaterialBatchListItem) => getInventoryType(row) === 'material';

const getInventoryTypeTag = (row: MaterialBatchListItem) =>
  getInventoryType(row) === 'product'
    ? { label: '产品库存', type: 'primary' as const }
    : { label: '物料库存', type: 'success' as const };

const formatProductObjectType = (value: string | null | undefined) => ({
  finished: '成品',
  semi_finished: '半成品',
}[value ?? ''] ?? (value || '-'));

const formatProductSourceType = (value: string | null | undefined) => ({
  production: '生产入库',
  purchase: '采购入库',
  outsourcing: '外协入库',
  stocktake: '盘点生成',
  other: '其他',
}[value ?? ''] ?? (value || '-'));

const formatObjectType = (row: MaterialBatchListItem) => {
  if (getInventoryType(row) === 'product') {
    const objectType = formatProductObjectType(row.objectType);
    const category = row.productAttribute && row.productType ? `${row.productAttribute} / ${row.productType}` : '';
    return category ? `${objectType} · ${category}` : objectType;
  }

  return row.productAttribute && row.productType ? `${row.productAttribute} / ${row.productType}` : '-';
};

const getStatusMeta = (status: MaterialBatchStatus) =>
  statusOptions.find((item) => item.value === status) ?? statusOptions[0];

/** 历史批次可能尚未补录来料检验，不能默认显示为已合格。 */
const formatQualityStatus = (status: MaterialBatchListItem['qualityStatus']) => {
  if (status === 'qualified') return '检验合格';
  if (status === 'partial_qualified') return '部分合格';
  return '待补录';
};

const getStocktakeDifferenceMeta = (type: InventoryStocktakeDifferenceType) =>
  stocktakeDifferenceOptions.find((item) => item.value === type) ?? stocktakeDifferenceOptions[2];

const getStocktakeStatusMeta = (status: InventoryStocktakeStatus) =>
  stocktakeStatusOptions.find((item) => item.value === status) ?? stocktakeStatusOptions[1];

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

const formatSignedQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) {
    return '-';
  }

  const formatted = formatQuantity(amount);
  return amount > 0 ? `+${formatted}` : formatted;
};

/** 盘点差异：实盘数量 - 当前账面库存，用于盘点弹窗即时提示盘盈/盘亏。 */
const getStocktakeDifference = (row: MaterialBatchListItem, countedQuantity: string | number | null) => {
  const counted = Number(countedQuantity ?? 0);
  const bookQuantity = Number(row.quantity ?? 0);

  if (!Number.isFinite(counted) || !Number.isFinite(bookQuantity)) {
    return 0;
  }

  return counted - bookQuantity;
};
/** 物料流水操作类型中文标签。 */
const formatUsageType = (type: 'reserve' | 'unreserve' | 'issue' | 'return') => ({
  reserve: '预留',
  unreserve: '取消预留',
  issue: '领料',
  return: '退料',
}[type]);

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

.record-summary {
  margin-bottom: 16px;
}

.stocktake-summary {
  margin-bottom: 18px;
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
