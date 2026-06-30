<template>
  <div class="inventory-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="物料">
          <el-input v-model="query.keyword" clearable placeholder="名称或编码" />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="query.batchCode" clearable placeholder="库存批次号" />
        </el-form-item>
        <el-form-item label="批次状态">
          <el-select v-model="query.batchStatus" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="可用" value="可用" />
            <el-option label="冻结" value="冻结" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="query.stockStatus" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="可用" value="可用" />
            <el-option label="待检" value="待检" />
            <el-option label="冻结" value="冻结" />
            <el-option label="不良" value="不良" />
          </el-select>
        </el-form-item>
        <el-form-item label="对象大类">
          <el-select v-model="query.itemKind" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="物料" value="material" />
            <el-option label="半成品" value="semi_finished" />
            <el-option label="成品" value="finished_product" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="rows" class="inventory-table">
        <el-table-column label="库存对象" min-width="180">
          <template #default="{ row }">
            <div class="item-name">{{ row.itemName }}</div>
            <div class="sub-text">{{ row.itemCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ kindLabel(row.itemKind) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchCode" label="批次号" min-width="170" />
        <el-table-column label="来源" width="140">
          <template #default="{ row }">{{ row.sourceType || '-' }}</template>
        </el-table-column>
        <el-table-column label="供应商" min-width="140">
          <template #default="{ row }">{{ row.provider || '-' }}</template>
        </el-table-column>
        <el-table-column label="可用数量" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ danger: Number(row.availableQuantity) < 0 }">
              {{ formatQuantity(row.availableQuantity) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="待检数量" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.pendingQuantity) }}</template>
        </el-table-column>
        <el-table-column label="冻结数量" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.frozenQuantity) }}</template>
        </el-table-column>
        <el-table-column label="不良数量" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.defectiveQuantity) }}</template>
        </el-table-column>
        <el-table-column label="合计" width="110" align="right">
          <template #default="{ row }">{{ formatQuantity(row.totalQuantity) }}</template>
        </el-table-column>
        <el-table-column label="批次状态" width="112">
          <template #default="{ row }">
            <el-tag :type="row.batchStatus === '可用' ? 'success' : row.batchStatus === '冻结' ? 'warning' : 'info'" effect="light">
              {{ row.batchStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
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
          @current-change="loadRows"
        />
      </div>
    </section>

    <el-dialog v-model="detailVisible" title="批次详情" width="680px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="对象名称">{{ detailRow.itemName }}</el-descriptions-item>
        <el-descriptions-item label="对象编码">{{ detailRow.itemCode }}</el-descriptions-item>
        <el-descriptions-item label="对象大类">{{ kindLabel(detailRow.itemKind) }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ detailRow.batchCode }}</el-descriptions-item>
        <el-descriptions-item label="来源类型">{{ detailRow.sourceType }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.provider || '-' }}</el-descriptions-item>
        <el-descriptions-item label="可用数量">{{ formatQuantity(detailRow.availableQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="待检数量">{{ formatQuantity(detailRow.pendingQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="冻结数量">{{ formatQuantity(detailRow.frozenQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="不良数量">{{ formatQuantity(detailRow.defectiveQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="合计数量">{{ formatQuantity(detailRow.totalQuantity) }}</el-descriptions-item>
        <el-descriptions-item label="批次状态">
          <el-tag :type="detailRow.batchStatus === '可用' ? 'success' : 'info'" effect="light">
            {{ detailRow.batchStatus }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import type { ItemBatchStockListItem } from '@company/api-contract';
import { warehouseApi } from '../../api/warehouse';

const rows = ref<ItemBatchStockListItem[]>([]);
const detailRow = ref<ItemBatchStockListItem | null>(null);
const loading = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);

const query = reactive({
  keyword: '',
  batchCode: '',
  batchStatus: '',
  stockStatus: '',
  itemKind: '',
});

const kindLabel = (kind: string) => {
  const map: Record<string, string> = { material: '物料', semi_finished: '半成品', finished_product: '成品' };
  return map[kind] ?? kind;
};

const loadRows = async () => {
  loading.value = true;
  try {
    const page = await warehouseApi.listInventory({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword || undefined,
      batchStatus: query.batchStatus || undefined,
      stockStatus: query.stockStatus || undefined,
      itemKind: query.itemKind || undefined,
    });
    rows.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const search = async () => {
  currentPage.value = 1;
  await loadRows();
};

const resetQuery = async () => {
  query.keyword = '';
  query.batchCode = '';
  query.batchStatus = '';
  query.stockStatus = '';
  query.itemKind = '';
  currentPage.value = 1;
  await loadRows();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadRows();
};

const openDetail = (row: ItemBatchStockListItem) => {
  detailRow.value = row;
  detailVisible.value = true;
};

const formatQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '-';
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
};

onMounted(loadRows);
</script>

<style scoped>
.inventory-page { display: flex; flex-direction: column; gap: 16px; }
.query-panel, .table-panel { border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.query-panel { padding: 20px 20px 4px; }
.query-form { display: flex; align-items: flex-start; gap: 12px 22px; }
.query-form :deep(.el-form-item) { margin-right: 0; margin-bottom: 16px; }
.query-form :deep(.el-input), .query-form :deep(.el-select) { width: 180px; }
.query-actions { margin-left: auto; }
.table-panel { overflow: hidden; }
.table-toolbar { display: flex; align-items: center; justify-content: flex-end; height: 60px; padding: 0 16px; border-bottom: 1px solid #e5e7eb; }
.inventory-table { width: 100%; }
.inventory-table :deep(.el-table__header th) { height: 48px; background: #f9fafb; color: #1f2937; font-weight: 600; }
.inventory-table :deep(.el-table__row) { height: 56px; }
.item-name { color: #1f2937; font-weight: 600; }
.sub-text { margin-top: 2px; color: #6b7280; font-size: 12px; }
.danger { color: #ef4444; font-weight: 600; }
.table-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; height: 64px; padding: 0 20px; }
.total-text { color: #6b7280; font-size: 14px; }
.page-size { width: 96px; }
</style>
