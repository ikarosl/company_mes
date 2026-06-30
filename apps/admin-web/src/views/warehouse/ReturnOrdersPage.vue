<template>
  <div class="page">
    <section class="query-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键字"><el-input v-model="query.keyword" clearable placeholder="退料单号" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="全部" value="" /><el-option label="待处理" value="待处理" />
            <el-option label="已入库" value="已入库" /><el-option label="已报废" value="已报废" /><el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>
    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增退料单</el-button>
        <el-tooltip content="刷新"><el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" /></el-tooltip>
      </div>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="returnNo" label="退料单号" width="180" />
        <el-table-column prop="productionBatchId" label="生产批次ID" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === '已入库' ? 'success' : row.status === '已报废' ? 'danger' : row.status === '已取消' ? 'info' : 'warning'" effect="light">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column label="退料数量" width="130" align="right"><template #default="{ row }">{{ formatQuantity(row.totalReturnNumber) }}</template></el-table-column>
        <el-table-column label="退料时间" width="170"><template #default="{ row }">{{ row.returnAt ? formatTime(row.returnAt) : '-' }}</template></el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === '待处理'" link type="success" @click="handleConfirmInbound(row)">退料入库</el-button>
            <el-button v-if="row.status === '待处理'" link type="danger" @click="handleConfirmScrap(row)">退料报废</el-button>
            <el-button v-if="row.status === '待处理'" link @click="handleCancel(row)">取消</el-button>
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

    <el-dialog v-model="createVisible" title="新增退料单" width="600px">
      <el-form label-width="120px" :model="createForm">
        <el-form-item label="生产批次ID" required><el-input v-model="createForm.productionBatchId" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="createForm.remark" type="textarea" :rows="2" /></el-form-item>
        <el-divider>退料明细</el-divider>
        <div v-for="(d, i) in createForm.details" :key="i" class="detail-row">
          <el-row :gutter="8" align="middle">
            <el-col :span="6"><el-input v-model="d.allocationId" placeholder="分配ID" size="small" /></el-col>
            <el-col :span="6"><el-input v-model="d.itemId" placeholder="对象ID" size="small" /></el-col>
            <el-col :span="6"><el-input-number v-model="d.returnNumber" :min="0.0001" :precision="4" size="small" style="width:100%" /></el-col>
            <el-col :span="4"><el-checkbox v-model="d.releaseAfterReturn">释放</el-checkbox></el-col>
            <el-col :span="2"><el-button link type="danger" :icon="Delete" size="small" @click="removeDetail(i)" /></el-col>
          </el-row>
        </div>
        <el-button size="small" @click="addDetail">+ 添加行</el-button>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitCreate">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="退料单详情" width="600px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="退料单号">{{ detailRow.returnNo }}</el-descriptions-item>
        <el-descriptions-item label="生产批次ID">{{ detailRow.productionBatchId }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="detailRow.status === '已入库' ? 'success' : 'info'">{{ detailRow.status }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="退料时间">{{ detailRow.returnAt ? formatTime(detailRow.returnAt) : '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus, Refresh } from '@element-plus/icons-vue';
import type { ReturnOrderListItem } from '@company/api-contract';
import { warehouseApi } from '../../api/warehouse';

const rows = ref<ReturnOrderListItem[]>([]);
const detailRow = ref<ReturnOrderListItem | null>(null);
const loading = ref(false); const submitting = ref(false);
const total = ref(0); const currentPage = ref(1); const pageSize = ref(10);
const createVisible = ref(false); const detailVisible = ref(false);
const query = reactive({ keyword: '', status: '' });
const createForm = reactive({ productionBatchId: '', remark: '', details: [] as Array<{ allocationId: string; itemId: string; batchId: string; returnNumber: number; releaseAfterReturn: boolean }> });

const addDetail = () => createForm.details.push({ allocationId: '', itemId: '', batchId: '', returnNumber: 0, releaseAfterReturn: false });
const removeDetail = (i: number) => createForm.details.splice(i, 1);

const loadRows = async () => {
  loading.value = true;
  try { const page = await warehouseApi.listReturnOrders({ page: currentPage.value, pageSize: pageSize.value, keyword: query.keyword || undefined, status: query.status || undefined }); rows.value = page.items; total.value = page.total; } finally { loading.value = false; }
};
const search = async () => { currentPage.value = 1; await loadRows(); };
const resetQuery = async () => { query.keyword = ''; query.status = ''; currentPage.value = 1; await loadRows(); };
const handlePageSizeChange = async () => { currentPage.value = 1; await loadRows(); };

const openCreate = () => { createForm.productionBatchId = ''; createForm.remark = ''; createForm.details = []; createVisible.value = true; };

const submitCreate = async () => {
  if (!createForm.productionBatchId || createForm.details.length === 0) { ElMessage.warning('请填写生产批次和明细'); return; }
  submitting.value = true;
  try { await warehouseApi.createReturnOrder({ productionBatchId: createForm.productionBatchId, details: createForm.details.map(d => ({ allocationId: d.allocationId, itemId: d.itemId, batchId: d.batchId, returnNumber: d.returnNumber, releaseAfterReturn: d.releaseAfterReturn })) }); ElMessage.success('退料单已创建'); createVisible.value = false; await loadRows(); } finally { submitting.value = false; }
};

const openDetail = (row: ReturnOrderListItem) => { detailRow.value = row; detailVisible.value = true; };

const handleConfirmInbound = async (row: ReturnOrderListItem) => {
  try { await ElMessageBox.confirm('确认退料入库后生成库存流水，是否继续？', '确认退料入库', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }); } catch { return; }
  await warehouseApi.confirmReturnInbound(row.id); ElMessage.success('退料已入库'); await loadRows();
};

const handleConfirmScrap = async (row: ReturnOrderListItem) => {
  try { await ElMessageBox.confirm('确认退料报废后创建报废记录，是否继续？', '确认退料报废', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }); } catch { return; }
  await warehouseApi.confirmReturnScrap(row.id); ElMessage.success('退料已报废'); await loadRows();
};

const handleCancel = async (row: ReturnOrderListItem) => {
  try { await ElMessageBox.confirm('确认取消该退料单？', '取消退料', { confirmButtonText: '确认取消', cancelButtonText: '不取消', type: 'warning' }); } catch { return; }
  await warehouseApi.cancelReturnOrder(row.id); ElMessage.success('已取消'); await loadRows();
};

const formatQuantity = (v: string | number | null) => { const n = Number(v ?? 0); return Number.isFinite(n) ? n.toLocaleString('zh-CN', { maximumFractionDigits: 4 }) : '-'; };
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
.table-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; height: 64px; padding: 0 20px; }
.total-text { color: #6b7280; font-size: 14px; }
.page-size { width: 96px; }
.detail-row { margin-bottom: 8px; }
</style>
