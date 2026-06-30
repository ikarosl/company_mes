<template>
  <div class="page">
    <section class="query-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键字"><el-input v-model="query.keyword" clearable placeholder="盘点单号" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="全部" value="" /><el-option label="待盘点" value="待盘点" />
            <el-option label="盘点中" value="盘点中" /><el-option label="已完成" value="已完成" /><el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>
    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增盘点单</el-button>
        <el-tooltip content="刷新"><el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" /></el-tooltip>
      </div>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="checkNo" label="盘点单号" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === '已完成' ? 'success' : row.status === '盘点中' ? 'warning' : row.status === '已取消' ? 'info' : ''" effect="light">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="明细数" width="80" align="center"><template #default="{ row }">{{ row.detailCount }}</template></el-table-column>
        <el-table-column label="待处理项" width="100" align="center">
          <template #default="{ row }"><span :class="{ danger: row.pendingItems > 0 }">{{ row.pendingItems }}</span></template>
        </el-table-column>
        <el-table-column label="开始时间" width="170"><template #default="{ row }">{{ row.startedAt ? formatTime(row.startedAt) : '-' }}</template></el-table-column>
        <el-table-column label="完成时间" width="170"><template #default="{ row }">{{ row.completedAt ? formatTime(row.completedAt) : '-' }}</template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === '待盘点'" link type="primary" @click="openEdit(row)">录入实盘</el-button>
            <el-button v-if="row.status === '盘点中'" link type="success" @click="handleComplete(row)">完成盘点</el-button>
            <el-button v-if="row.status === '已完成'" link type="primary" @click="handleAdjust(row)">生成调整</el-button>
            <el-button v-if="['待盘点','盘点中'].includes(row.status)" link @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-footer">
        <span class="total-text">共 {{ total }} 条</span>
        <el-select v-model="pageSize" class="page-size" @change="handlePageSizeChange">
          <el-option label="10条/页" :value="10" /><el-option label="20条/页" :value="20" /><el-option label="50条/页" :value="50" />
        </el-select>
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next, jumper" @current-change="loadRows" />
      </div>
    </section>

    <el-dialog v-model="createVisible" title="新增盘点单" width="500px">
      <el-form label-width="100px" :model="createForm">
        <el-form-item label="盘点单号"><el-input v-model="createForm.checkNo" placeholder="留空自动生成" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="createForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitCreate">创建</el-button></template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="录入实盘数量" width="760px" :close-on-click-modal="false">
      <el-table :data="editDetails" max-height="480">
        <el-table-column prop="itemCode" label="对象编码" width="130" />
        <el-table-column prop="itemName" label="对象名称" width="150" />
        <el-table-column prop="batchCode" label="批次号" width="130" />
        <el-table-column prop="stockStatus" label="库存状态" width="90" />
        <el-table-column prop="systemQuantity" label="账面数量" width="110" align="right" />
        <el-table-column label="实盘数量" width="140">
          <template #default="{ row, $index }">
            <el-input-number v-model="row.actualQuantity" :min="0" :precision="4" size="small" controls-position="right" style="width:120px" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer><el-button @click="editVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitEdit">保存实盘</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="盘点单详情" width="800px">
      <el-descriptions v-if="detailRow" :column="2" border style="margin-bottom:16px">
        <el-descriptions-item label="盘点单号">{{ detailRow.checkNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detailRow.status }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ detailRow.startedAt ? formatTime(detailRow.startedAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ detailRow.completedAt ? formatTime(detailRow.completedAt) : '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detailDetails.length" :data="detailDetails" max-height="400">
        <el-table-column prop="itemCode" label="编码" width="120" />
        <el-table-column prop="itemName" label="名称" width="140" />
        <el-table-column prop="batchCode" label="批次号" width="130" />
        <el-table-column prop="systemQuantity" label="账面" width="100" align="right" />
        <el-table-column prop="actualQuantity" label="实盘" width="100" align="right" />
        <el-table-column prop="differenceQuantity" label="差异" width="100" align="right" />
        <el-table-column prop="result" label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.result === '一致' ? 'success' : row.result === '盘盈' ? 'warning' : 'danger'" size="small">{{ row.result }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="adjusted" label="已调整" width="80">
          <template #default="{ row }">{{ row.adjusted ? '是' : '否' }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type { StockCheckListItem, StockCheckDetailItem } from '@company/api-contract';
import { warehouseApi } from '../../api/warehouse';

const rows = ref<StockCheckListItem[]>([]);
const detailRow = ref<StockCheckListItem | null>(null);
const detailDetails = ref<StockCheckDetailItem[]>([]);
const editDetails = ref<StockCheckDetailItem[]>([]);
const editingId = ref<string | null>(null);
const loading = ref(false); const submitting = ref(false);
const total = ref(0); const currentPage = ref(1); const pageSize = ref(10);
const createVisible = ref(false); const detailVisible = ref(false); const editVisible = ref(false);
const query = reactive({ keyword: '', status: '' });
const createForm = reactive({ checkNo: '', remark: '' });

const loadRows = async () => {
  loading.value = true;
  try { const page = await warehouseApi.listStockChecks({ page: currentPage.value, pageSize: pageSize.value, keyword: query.keyword || undefined, status: query.status || undefined }); rows.value = page.items; total.value = page.total; } finally { loading.value = false; }
};
const search = async () => { currentPage.value = 1; await loadRows(); };
const resetQuery = async () => { query.keyword = ''; query.status = ''; currentPage.value = 1; await loadRows(); };
const handlePageSizeChange = async () => { currentPage.value = 1; await loadRows(); };

const openCreate = () => { createForm.checkNo = ''; createForm.remark = ''; createVisible.value = true; };

const submitCreate = async () => {
  submitting.value = true;
  try { await warehouseApi.createStockCheck({ checkNo: createForm.checkNo || null, remark: createForm.remark || null, details: [] }); ElMessage.success('盘点单已创建'); createVisible.value = false; await loadRows(); } finally { submitting.value = false; }
};

const openDetail = async (row: StockCheckListItem) => {
  detailRow.value = row;
  const d = await warehouseApi.getStockCheck(row.id);
  detailDetails.value = d.details ?? [];
  detailVisible.value = true;
};

const openEdit = async (row: StockCheckListItem) => {
  editingId.value = row.id;
  const d = await warehouseApi.getStockCheck(row.id);
  editDetails.value = (d.details ?? []).map(item => ({ ...item }));
  editVisible.value = true;
};

const submitEdit = async () => {
  if (!editingId.value) return;
  submitting.value = true;
  try {
    await warehouseApi.updateStockCheck(editingId.value, {
      details: editDetails.map(d => ({ itemId: d.itemId, batchId: d.batchId, stockStatus: d.stockStatus, actualQuantity: d.actualQuantity, remark: d.remark })),
    });
    ElMessage.success('实盘数量已保存');
    editVisible.value = false;
    await loadRows();
  } finally { submitting.value = false; }
};

const handleComplete = async (row: StockCheckListItem) => {
  try { await ElMessageBox.confirm('确认完成盘点？完成后明细将被锁定。', '完成盘点', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }); } catch { return; }
  await warehouseApi.completeStockCheck(row.id); ElMessage.success('盘点已完成'); await loadRows();
};

const handleAdjust = async (row: StockCheckListItem) => {
  try { await ElMessageBox.confirm('确认生成盘点调整流水？将自动处理盘盈盘亏。', '生成调整', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }); } catch { return; }
  await warehouseApi.adjustStockCheck(row.id); ElMessage.success('盘点调整流水已生成'); await loadRows();
};

const handleCancel = async (row: StockCheckListItem) => {
  try { await ElMessageBox.confirm('确认取消该盘点单？', '取消盘点', { confirmButtonText: '确认取消', cancelButtonText: '不取消', type: 'warning' }); } catch { return; }
  await warehouseApi.cancelStockCheck(row.id); ElMessage.success('已取消'); await loadRows();
};

const formatTime = (v: string) => v.replace('T', ' ').slice(0, 19);
onMounted(loadRows);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.query-panel, .table-panel { border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; }
.query-panel { padding: 20px 20px 4px; }
.query-panel :deep(.el-form-item) { margin-right: 0; margin-bottom: 16px; }
.table-panel { overflow: hidden; }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 16px; border-bottom: 1px solid #e5e7eb; }
.table-panel :deep(.el-table__header th) { height: 48px; background: #f9fafb; color: #1f2937; font-weight: 600; }
.table-panel :deep(.el-table__row) { height: 56px; }
.danger { color: #ef4444; font-weight: 600; }
.table-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; height: 64px; padding: 0 20px; }
.total-text { color: #6b7280; font-size: 14px; }
.page-size { width: 96px; }
</style>
