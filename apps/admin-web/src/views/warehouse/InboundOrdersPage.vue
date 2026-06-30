<template>
  <div class="page">
    <section class="query-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键字"><el-input v-model="query.keyword" clearable placeholder="单号或供应商" /></el-form-item>
        <el-form-item label="来源">
          <el-select v-model="query.sourceType" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="外购" value="外购" /><el-option label="自产" value="自产" />
            <el-option label="委外" value="委外" /><el-option label="退货入库" value="退货入库" />
            <el-option label="盘点生成" value="盘点生成" /><el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="全部" value="" />
            <el-option label="待确认" value="待确认" /><el-option label="已完成" value="已完成" /><el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增入库单</el-button>
        <el-tooltip content="刷新"><el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" /></el-tooltip>
      </div>

      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="inboundNo" label="入库单号" width="180" />
        <el-table-column prop="sourceType" label="来源" width="100" />
        <el-table-column prop="provider" label="供应商" width="150">
          <template #default="{ row }">{{ row.provider || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : row.status === '已取消' ? 'info' : 'warning'" effect="light">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="明细数" width="80" align="center">
          <template #default="{ row }">{{ row.detailCount }}</template>
        </el-table-column>
        <el-table-column label="入库数量" width="130" align="right">
          <template #default="{ row }">{{ formatQuantity(row.totalInboundNumber) }}</template>
        </el-table-column>
        <el-table-column label="入库时间" width="170">
          <template #default="{ row }">{{ row.inboundAt ? formatTime(row.inboundAt) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === '待确认'" link type="success" @click="handleConfirm(row)">确认</el-button>
            <el-button v-if="row.status === '待确认'" link type="danger" @click="handleCancel(row)">取消</el-button>
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

    <el-dialog v-model="createVisible" title="新增入库单" width="760px">
      <el-form label-width="100px" :model="createForm">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库单号"><el-input v-model="createForm.inboundNo" placeholder="留空自动生成" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源类型" required>
              <el-select v-model="createForm.sourceType" placeholder="请选择" style="width:100%">
                <el-option label="外购" value="外购" /><el-option label="自产" value="自产" /><el-option label="委外" value="委外" />
                <el-option label="退货入库" value="退货入库" /><el-option label="盘点生成" value="盘点生成" /><el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="供应商"><el-input v-model="createForm.provider" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="备注"><el-input v-model="createForm.remark" type="textarea" :rows="2" /></el-form-item>
        <el-divider>入库明细</el-divider>
        <div v-for="(d, i) in createForm.details" :key="i" class="detail-row">
          <el-row :gutter="8" align="middle">
            <el-col :span="6"><el-input v-model="d.itemId" placeholder="库存对象ID" size="small" /></el-col>
            <el-col :span="5"><el-input v-model="d.batchCode" placeholder="批次号" size="small" /></el-col>
            <el-col :span="5"><el-input-number v-model="d.inboundNumber" :min="0.0001" :precision="4" size="small" style="width:100%" /></el-col>
            <el-col :span="5">
              <el-select v-model="d.stockStatus" placeholder="状态" size="small" style="width:100%">
                <el-option label="可用" value="可用" /><el-option label="待检" value="待检" />
                <el-option label="冻结" value="冻结" /><el-option label="不良" value="不良" />
              </el-select>
            </el-col>
            <el-col :span="2">
              <el-button link type="danger" :icon="Delete" size="small" @click="removeDetail(i)" />
            </el-col>
          </el-row>
        </div>
        <el-button size="small" @click="addDetail">+ 添加行</el-button>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="入库单详情" width="760px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="单号">{{ detailRow.inboundNo }}</el-descriptions-item>
        <el-descriptions-item label="来源">{{ detailRow.sourceType }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ detailRow.provider || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="detailRow.status === '已完成' ? 'success' : 'info'">{{ detailRow.status }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="入库时间">{{ detailRow.inboundAt ? formatTime(detailRow.inboundAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-table v-if="detailDetails.length" :data="detailDetails" style="margin-top:16px">
        <el-table-column prop="itemCode" label="对象编码" width="140" />
        <el-table-column prop="itemName" label="名称" width="160" />
        <el-table-column prop="batchCode" label="批次号" width="140" />
        <el-table-column prop="inboundNumber" label="数量" width="120" align="right" />
        <el-table-column prop="stockStatus" label="库存状态" width="100" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus, Refresh } from '@element-plus/icons-vue';
import type { InboundOrderListItem, InboundDetailItem } from '@company/api-contract';
import { warehouseApi } from '../../api/warehouse';

const rows = ref<InboundOrderListItem[]>([]);
const detailRow = ref<InboundOrderListItem | null>(null);
const detailDetails = ref<InboundDetailItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const createVisible = ref(false);
const detailVisible = ref(false);
const query = reactive({ keyword: '', sourceType: '', status: '' });
const createForm = reactive({ inboundNo: '', sourceType: '外购' as string, provider: '', remark: '', details: [] as Array<{ itemId: string; batchCode: string; inboundNumber: number; stockStatus: string; batchId?: string }> });

const addDetail = () => createForm.details.push({ itemId: '', batchCode: '', inboundNumber: 0, stockStatus: '可用' });
const removeDetail = (i: number) => createForm.details.splice(i, 1);

const loadRows = async () => {
  loading.value = true;
  try {
    const page = await warehouseApi.listInboundOrders({ page: currentPage.value, pageSize: pageSize.value, keyword: query.keyword || undefined, sourceType: query.sourceType || undefined, status: query.status || undefined });
    rows.value = page.items;
    total.value = page.total;
  } finally { loading.value = false; }
};
const search = async () => { currentPage.value = 1; await loadRows(); };
const resetQuery = async () => { query.keyword = ''; query.sourceType = ''; query.status = ''; currentPage.value = 1; await loadRows(); };
const handlePageSizeChange = async () => { currentPage.value = 1; await loadRows(); };

const openCreate = () => {
  createForm.inboundNo = ''; createForm.sourceType = '外购'; createForm.provider = ''; createForm.remark = ''; createForm.details = [];
  createVisible.value = true;
};

const submitCreate = async () => {
  if (!createForm.sourceType || createForm.details.length === 0) { ElMessage.warning('请选择来源并填写明细'); return; }
  submitting.value = true;
  try {
    await warehouseApi.createInboundOrder({ inboundNo: createForm.inboundNo || null, sourceType: createForm.sourceType as any, provider: createForm.provider || null, details: createForm.details.map(d => ({ itemId: d.itemId, batchCode: d.batchCode, inboundNumber: d.inboundNumber, stockStatus: d.stockStatus as any })) });
    ElMessage.success('入库单已创建');
    createVisible.value = false;
    await loadRows();
  } finally { submitting.value = false; }
};

const openDetail = async (row: InboundOrderListItem) => {
  detailRow.value = row;
  const detail = await warehouseApi.getInboundOrder(row.id);
  detailDetails.value = detail.details ?? [];
  detailVisible.value = true;
};

const handleConfirm = async (row: InboundOrderListItem) => {
  try { await ElMessageBox.confirm('确认入库后将生成库存流水，是否继续？', '确认入库', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }); } catch { return; }
  await warehouseApi.confirmInboundOrder(row.id);
  ElMessage.success('已确认入库');
  await loadRows();
};

const handleCancel = async (row: InboundOrderListItem) => {
  try { await ElMessageBox.confirm('确认取消该入库单？', '取消入库', { confirmButtonText: '确认取消', cancelButtonText: '不取消', type: 'warning' }); } catch { return; }
  await warehouseApi.cancelInboundOrder(row.id);
  ElMessage.success('已取消');
  await loadRows();
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
