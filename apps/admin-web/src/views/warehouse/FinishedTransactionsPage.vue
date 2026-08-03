<template>
  <div class="transaction-page">
    <section class="query-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="产品">
          <el-input v-model="query.keyword" clearable placeholder="产品、库存批次、生产批次或流水单号" />
        </el-form-item>
        <el-form-item label="库存批次">
          <el-input v-model="query.inventoryBatchNo" clearable placeholder="产品库存批次号" />
        </el-form-item>
        <el-form-item label="产品类型">
          <el-select v-model="query.objectType" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="item in objectTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="流转类型">
          <el-select v-model="query.transactionType" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="入库" value="inbound" />
            <el-option label="出库" value="outbound" />
            <el-option label="盘点调整" value="adjustment" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产批次">
          <el-input v-model="query.productionBatchNo" clearable placeholder="生产批次号" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="toolbar">
        <div>
          <el-button type="primary" :icon="Plus" @click="openInbound">成/半成品入库</el-button>
          <el-button :icon="Upload" @click="openOutbound">成/半成品出库</el-button>
        </div>
        <el-tooltip content="刷新">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="rows" empty-text="暂无成/半成品出入库记录">
        <el-table-column label="流转类型" width="112">
          <template #default="{ row }">
            <el-tag :type="getTransactionTypeMeta(row.transactionType).type" effect="light">
              {{ getTransactionTypeMeta(row.transactionType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <strong>{{ row.productName }}</strong>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="产品类型" width="110">
          <template #default="{ row }">{{ getObjectTypeLabel(row.objectType) }}</template>
        </el-table-column>
        <el-table-column prop="inventoryBatchNo" label="产品库存批次号" min-width="170" />
        <el-table-column label="数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.quantity) }} {{ row.unit || '' }}</template>
        </el-table-column>
        <el-table-column label="关联生产批次" min-width="170">
          <template #default="{ row }">{{ row.productionBatchNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="流转原因" width="120">
          <template #default="{ row }">{{ getFlowReasonLabel(row.flowReason) }}</template>
        </el-table-column>
        <el-table-column label="外部单号" min-width="150">
          <template #default="{ row }">{{ row.externalDocNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="合作方" min-width="160">
          <template #default="{ row }">{{ formatPartner(row.partnerName, row.partnerType) }}</template>
        </el-table-column>
        <el-table-column label="记录人" width="120">
          <template #default="{ row }">{{ row.recordedByName || '-' }}</template>
        </el-table-column>
        <el-table-column label="记录日期" width="130">
          <template #default="{ row }">{{ row.recordedAt || '-' }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="170">
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
      </el-table>

      <TablePagination v-model:page="page" v-model:page-size="pageSize" :total="total" @change="loadRows" />
    </section>

    <el-dialog v-model="inboundVisible" title="成/半成品入库" :width="DialogWidth.lg" class="business-dialog">
      <el-form :model="inboundForm" label-width="128px">
        <div class="form-grid">
          <el-form-item label="入库类型" required>
            <el-select v-model="inboundForm.sourceType" @change="handleInboundSourceChange">
              <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="产品类型" required>
            <el-select v-model="inboundForm.objectType">
              <el-option v-for="item in objectTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="isProductionInbound" label="生产批次 ID" required>
            <el-select
              v-model="inboundForm.productionBatchId"
              filterable
              :loading="batchLoading"
              placeholder="请选择仍有可入库数量的生产批次"
              @change="handleInboundBatchChange"
            >
              <el-option
                v-for="item in completedBatches"
                :key="item.id"
                :label="formatBatchOption(item)"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="产品" required>
            <el-select
              v-model="inboundForm.productId"
              filterable
              :loading="productLoading"
              placeholder="请选择产品"
            >
              <el-option
                v-for="item in productOptions"
                :key="item.id"
                :label="formatProductOption(item)"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="产品信息">
            <el-input :model-value="selectedInboundProductText" disabled />
          </el-form-item>
          <el-form-item v-if="isProductionInbound" label="可入库数量">
            <el-input :model-value="selectedInboundAvailableText" disabled />
          </el-form-item>
          <el-form-item label="产品库存批次号">
            <el-input
              v-model="inboundForm.inventoryBatchNo"
              clearable
              placeholder="不填写则系统自动生成"
            />
          </el-form-item>
          <el-form-item label="数量" required>
            <el-input-number
              v-model="inboundForm.quantity"
              :min="1"
              :max="inboundQuantityMax"
              :precision="0"
              :step="1"
            />
          </el-form-item>
          <el-form-item label="合作类型">
            <el-select v-model="inboundForm.partnerType" clearable placeholder="可选">
              <el-option v-for="item in partnerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="客户/供应商">
            <el-input v-model="inboundForm.partnerName" clearable placeholder="可填写客户或供应商名称" />
          </el-form-item>
          <el-form-item label="外部单号">
            <el-input v-model="inboundForm.externalDocNo" clearable placeholder="客户单号、入库单或供应商单号" />
          </el-form-item>
          <el-form-item label="附件地址">
            <el-input v-model="inboundForm.fileUrl" clearable placeholder="入库单、发货单或退货单附件地址" />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="inboundForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inboundVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitInbound">确认入库</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="outboundVisible" title="成/半成品出库" :width="DialogWidth.lg" class="business-dialog">
      <el-form :model="outboundForm" label-width="128px">
        <el-form-item label="产品库存批次" required>
          <el-select
            v-model="outboundForm.inventoryId"
            filterable
            :loading="inventoryOptionLoading"
            placeholder="请选择可用库存批次"
            @change="syncOutboundQuantity"
          >
            <el-option
              v-for="item in inventoryBatchOptions"
              :key="item.id"
              :label="formatInventoryOption(item)"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :model-value="selectedOutboundInventoryText" disabled />
        </el-form-item>
        <el-form-item label="数量" required>
          <el-input-number v-model="outboundForm.quantity" :min="1" :precision="0" :step="1" />
        </el-form-item>
        <div class="form-grid">
          <el-form-item label="合作类型">
            <el-select v-model="outboundForm.partnerType" clearable placeholder="可选">
              <el-option v-for="item in partnerTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="客户/供应商">
            <el-input v-model="outboundForm.partnerName" clearable placeholder="可填写客户或供应商名称" />
          </el-form-item>
          <el-form-item label="外部单号">
            <el-input v-model="outboundForm.externalDocNo" clearable placeholder="客户单号、发货单或退货单" />
          </el-form-item>
          <el-form-item label="附件地址">
            <el-input v-model="outboundForm.fileUrl" clearable placeholder="入库单、发货单或退货单附件地址" />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="outboundForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="outboundVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitOutbound">确认出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Plus, Refresh, Upload } from '@element-plus/icons-vue';
import type {
  FinishedInboundPayload,
  FinishedFlowPartnerType,
  FinishedInventoryObjectType,
  FinishedInventoryOption,
  FinishedInventorySourceType,
  FinishedOutboundPayload,
  FinishedProductionInboundOption,
  FinishedTransactionListItem,
  FinishedTransactionType,
  ProductListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { warehouseApi } from '../../api/warehouse';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';
import TablePagination from '../../components/common/TablePagination.vue';

/** 入库来源类型字典：与 product_inventory_batches.source_type 保持一致。 */
const sourceTypeOptions: Array<{ value: FinishedInventorySourceType; label: string }> = [
  { value: 'production', label: '生产入库' },
  { value: 'purchase', label: '采购入库' },
  { value: 'outsourcing', label: '外协入库' },
  { value: 'other', label: '其他入库' },
];

/** 产品库存对象类型字典：区分成品和半成品库存。 */
/** 流转原因中文标签：兼容入库来源、出库和盘点调整记录。 */
const flowReasonLabels: Record<string, string> = {
  production: '生产入库',
  purchase: '采购入库',
  outsourcing: '外协入库',
  stocktake: '盘点调整',
  other: '其他入库',
  outbound: '产品出库',
};

const objectTypeOptions: Array<{ value: FinishedInventoryObjectType; label: string }> = [
  { value: 'finished', label: '成品' },
  { value: 'semi_finished', label: '半成品' },
];

/** 合作类型字典：对应 product_flow_records.partner_type，可选填写。 */
const partnerTypeOptions: Array<{ value: FinishedFlowPartnerType; label: string }> = [
  { value: 'customer', label: '客户' },
  { value: 'supplier', label: '供应商' },
];

/** 成/半成品出入库流水表格数据。 */
const rows = ref<FinishedTransactionListItem[]>([]);
/** 可生产入库批次选项：仅包含 completed 且剩余可入库数量大于 0 的生产批次。 */
const completedBatches = ref<FinishedProductionInboundOption[]>([]);
/** 非 production 入库时可选择的产品列表。 */
const productOptions = ref<ProductListItem[]>([]);
/** 当前可出库的产品库存批次选项。 */
const inventoryBatchOptions = ref<FinishedInventoryOption[]>([]);
const loading = ref(false);
const batchLoading = ref(false);
const productLoading = ref(false);
const inventoryOptionLoading = ref(false);
const submitting = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const inboundVisible = ref(false);
const outboundVisible = ref(false);

/** 查询条件：直接提交给后端列表接口，用于筛选流水记录。 */
const query = reactive({
  keyword: '',
  inventoryBatchNo: '',
  objectType: '' as FinishedInventoryObjectType | '',
  transactionType: '' as FinishedTransactionType | '',
  productionBatchNo: '',
});

/** 成/半成品入库表单：production 来源由生产批次决定产品，其他来源直接选择产品。 */
const inboundForm = reactive<FinishedInboundPayload>({
  sourceType: 'production',
  objectType: 'finished',
  productionBatchId: '',
  productId: '',
  inventoryBatchNo: '',
  quantity: 1,
  partnerName: '',
  partnerType: null,
  externalDocNo: '',
  fileUrl: '',
  remark: '',
});

/** 成/半成品出库表单：flow_type 由后端固定写 outbound，前端不提供选择。 */
const outboundForm = reactive<FinishedOutboundPayload>({
  inventoryId: '',
  quantity: 1,
  partnerName: '',
  partnerType: null,
  externalDocNo: '',
  fileUrl: '',
  remark: '',
});

const isProductionInbound = computed(() => inboundForm.sourceType === 'production');
const selectedInboundBatch = computed(
  () => completedBatches.value.find((item) => item.id === inboundForm.productionBatchId) ?? null,
);
const selectedInboundProduct = computed(
  () => productOptions.value.find((item) => item.id === inboundForm.productId) ?? null,
);
const selectedInboundProductText = computed(() => {
  if (isProductionInbound.value) {
    return selectedInboundBatch.value
      ? `${selectedInboundBatch.value.productModel} / ${selectedInboundBatch.value.productName}`
      : '选择生产批次后自动带出';
  }

  return selectedInboundProduct.value
    ? `${selectedInboundProduct.value.productModel} / ${selectedInboundProduct.value.productName}`
    : '请选择产品';
});
const selectedInboundAvailableText = computed(() =>
  selectedInboundBatch.value
    ? `${formatQuantity(selectedInboundBatch.value.availableQuantity)} ${selectedInboundBatch.value.unit || ''}`
    : '选择生产批次后自动计算',
);
const inboundQuantityMax = computed(() =>
  isProductionInbound.value && selectedInboundBatch.value
    ? Math.max(1, Number(selectedInboundBatch.value.availableQuantity))
    : undefined,
);
const selectedOutboundInventory = computed(
  () => inventoryBatchOptions.value.find((item) => item.id === outboundForm.inventoryId) ?? null,
);
const selectedOutboundInventoryText = computed(() =>
  selectedOutboundInventory.value
    ? `${formatQuantity(selectedOutboundInventory.value.quantity)} ${selectedOutboundInventory.value.unit || ''}`
    : '选择库存批次后显示',
);

/** 加载成/半成品出入库流水列表。 */
const loadRows = async () => {
  loading.value = true;
  try {
    const result = await warehouseApi.listFinishedTransactions({
      ...query,
      page: page.value,
      pageSize: pageSize.value,
    });
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    EMessage.error(error, '成/半成品出入库记录加载失败');
  } finally {
    loading.value = false;
  }
};

/** 加载可生产入库批次：后端按生产批次计划数量减已入库流水合计，只返回剩余数量大于 0 的批次。 */
const loadCompletedBatches = async () => {
  batchLoading.value = true;
  try {
    completedBatches.value = await warehouseApi.listFinishedProductionInboundOptions();
  } catch (error) {
    EMessage.error(error, '可入库生产批次加载失败');
  } finally {
    batchLoading.value = false;
  }
};

/** 加载启用产品，供非 production 来源入库使用。 */
const loadProductOptions = async () => {
  productLoading.value = true;
  try {
    const pageResult = await productApi.listProducts({ page: 1, pageSize: 200, status: 'enabled' });
    productOptions.value = pageResult.items;
  } catch (error) {
    EMessage.error(error, '产品选项加载失败');
  } finally {
    productLoading.value = false;
  }
};

/** 加载当前可出库库存批次，只返回 quantity > 0 的批次。 */
const loadInventoryOptions = async () => {
  inventoryOptionLoading.value = true;
  try {
    inventoryBatchOptions.value = await warehouseApi.listFinishedInventoryOptions({
      objectType: query.objectType,
      keyword: query.keyword,
    });
  } catch (error) {
    EMessage.error(error, '可出库库存批次加载失败');
  } finally {
    inventoryOptionLoading.value = false;
  }
};

const search = async () => {
  page.value = 1;
  await loadRows();
};

const resetQuery = async () => {
  Object.assign(query, {
    keyword: '',
    inventoryBatchNo: '',
    objectType: '',
    transactionType: '',
    productionBatchNo: '',
  });
  await search();
};

const changePage = async (value: number) => {
  page.value = value;
  await loadRows();
};

/** 打开入库弹窗，重置表单并准备生产批次和产品选项。 */
const openInbound = async () => {
  Object.assign(inboundForm, {
    sourceType: 'production',
    objectType: 'finished',
    productionBatchId: '',
    productId: '',
    inventoryBatchNo: '',
    quantity: 1,
    partnerName: '',
    partnerType: null,
    externalDocNo: '',
    fileUrl: '',
    remark: '',
  });
  await Promise.all([loadCompletedBatches(), loadProductOptions()]);
  inboundVisible.value = true;
};

/** 打开出库弹窗，刷新可出库库存批次。 */
const openOutbound = async () => {
  Object.assign(outboundForm, {
    inventoryId: '',
    quantity: 1,
    partnerName: '',
    partnerType: null,
    externalDocNo: '',
    fileUrl: '',
    remark: '',
  });
  await loadInventoryOptions();
  outboundVisible.value = true;
};

/** 切换入库来源时清理互斥字段，避免 production 和产品选择同时提交。 */
const handleInboundSourceChange = () => {
  inboundForm.productionBatchId = '';
  inboundForm.productId = '';
  inboundForm.quantity = 1;
};

/** 选择生产批次后默认带出剩余可入库数量，允许现场按实际入库数量调小。 */
const handleInboundBatchChange = () => {
  if (selectedInboundBatch.value) {
    inboundForm.quantity = Number(selectedInboundBatch.value.availableQuantity);
  }
};

/** 选择库存批次后默认填入全部当前库存，便于整批出库。 */
const syncOutboundQuantity = () => {
  if (selectedOutboundInventory.value) {
    outboundForm.quantity = Number(selectedOutboundInventory.value.quantity);
  }
};

/** 提交入库：后端在事务中同步写库存批次和入库流水。 */
const submitInbound = async () => {
  if (isProductionInbound.value && !inboundForm.productionBatchId) {
    EMessage.warning('请选择已完成生产批次');
    return;
  }
  if (!isProductionInbound.value && !inboundForm.productId) {
    EMessage.warning('请选择产品');
    return;
  }
  if (!Number.isInteger(Number(inboundForm.quantity)) || Number(inboundForm.quantity) <= 0) {
    EMessage.warning('请填写大于 0 的整数入库数量');
    return;
  }
  if (
    isProductionInbound.value &&
    selectedInboundBatch.value &&
    Number(inboundForm.quantity) > Number(selectedInboundBatch.value.availableQuantity)
  ) {
    EMessage.warning(`入库数量不能超过剩余可入库数量 ${formatQuantity(selectedInboundBatch.value.availableQuantity)}`);
    return;
  }

  submitting.value = true;
  try {
    await warehouseApi.finishedInbound({
      ...inboundForm,
      productionBatchId: isProductionInbound.value ? inboundForm.productionBatchId : null,
      productId: isProductionInbound.value ? null : inboundForm.productId,
      inventoryBatchNo: inboundForm.inventoryBatchNo || null,
      partnerName: inboundForm.partnerName || null,
      partnerType: inboundForm.partnerType || null,
      externalDocNo: inboundForm.externalDocNo || null,
      fileUrl: inboundForm.fileUrl || null,
      remark: inboundForm.remark || null,
    });
    EMessage.success('成/半成品已入库');
    inboundVisible.value = false;
    await Promise.all([loadRows(), loadInventoryOptions(), loadCompletedBatches()]);
  } catch (error) {
    EMessage.error(error, '成/半成品入库失败');
  } finally {
    submitting.value = false;
  }
};

/** 提交出库：后端固定写 outbound 流水并扣减库存批次数量。 */
const submitOutbound = async () => {
  if (!outboundForm.inventoryId) {
    EMessage.warning('请选择产品库存批次');
    return;
  }
  if (!Number.isInteger(Number(outboundForm.quantity)) || Number(outboundForm.quantity) <= 0) {
    EMessage.warning('请填写大于 0 的整数出库数量');
    return;
  }

  submitting.value = true;
  try {
    await warehouseApi.finishedOutbound({
      inventoryId: outboundForm.inventoryId,
      quantity: outboundForm.quantity,
      partnerName: outboundForm.partnerName || null,
      partnerType: outboundForm.partnerType || null,
      externalDocNo: outboundForm.externalDocNo || null,
      fileUrl: outboundForm.fileUrl || null,
      remark: outboundForm.remark || null,
    });
    EMessage.success('成/半成品已出库');
    outboundVisible.value = false;
    await Promise.all([loadRows(), loadInventoryOptions()]);
  } catch (error) {
    EMessage.error(error, '成/半成品出库失败');
  } finally {
    submitting.value = false;
  }
};

const formatBatchOption = (item: FinishedProductionInboundOption) =>
  `${item.batchNo} / ${item.productModel} / ${item.productName} / 计划 ${formatQuantity(item.plannedQuantity)} / 已入 ${formatQuantity(item.inboundQuantity)} / 可入 ${formatQuantity(item.availableQuantity)}`;
const formatProductOption = (item: ProductListItem) =>
  `${item.productModel} / ${item.productName}`;
const formatInventoryOption = (item: FinishedInventoryOption) =>
  `${item.inventoryBatchNo} / ${item.productModel} / ${getObjectTypeLabel(item.objectType)} / 可出 ${formatQuantity(item.quantity)} ${item.unit || ''}`;

const getTransactionTypeMeta = (type: FinishedTransactionType) =>
  ({
    inbound: { label: '入库', type: 'success' as const },
    outbound: { label: '出库', type: 'primary' as const },
    adjustment: { label: '盘点调整', type: 'warning' as const },
  })[type];
const getObjectTypeLabel = (type: FinishedInventoryObjectType) =>
  type === 'finished' ? '成品' : '半成品';
const getFlowReasonLabel = (value: string | null) =>
  value ? flowReasonLabels[value] ?? value : '-';
const formatPartner = (name: string | null, type: FinishedFlowPartnerType | null) => {
  const typeText = partnerTypeOptions.find((item) => item.value === type)?.label;
  if (name && typeText) {
    return `${typeText} / ${name}`;
  }
  return name || typeText || '-';
};
const formatQuantity = (value: string | number) =>
  Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 4 });

onMounted(async () => {
  await Promise.all([loadRows(), loadCompletedBatches(), loadProductOptions()]);
});
</script>

<style scoped>
.transaction-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.query-panel,
.table-panel {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
}

.toolbar,
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.toolbar {
  margin-bottom: 12px;
}

.footer {
  margin-top: 16px;
  color: #6b7280;
}

.sub-text {
  margin-top: 3px;
  color: #6b7280;
  font-size: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.business-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.el-select),
:deep(.el-date-editor),
:deep(.el-input-number) {
  width: 100%;
}
</style>
