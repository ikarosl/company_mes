<template>
  <div class="page">
    <section class="query-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键字"><el-input v-model="query.keyword" clearable placeholder="报废单号或对象" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable>
            <el-option label="全部" value="" /><el-option label="待确认" value="待确认" /><el-option label="已确认" value="已确认" /><el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="场景">
          <el-select v-model="query.scrapScene" placeholder="全部" clearable>
            <el-option label="全部" value="" /><el-option label="已分配报废" value="WAREHOUSE_ALLOCATED" />
            <el-option label="退料报废" value="RETURN_AFTER_OUTBOUND" /><el-option label="生产消耗报废" value="PRODUCTION_CONSUMED" /><el-option label="库存内报废" value="IN_STOCK" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="search">查询</el-button><el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>
    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增报废单</el-button>
        <el-tooltip content="刷新"><el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" /></el-tooltip>
      </div>
      <el-table v-loading="loading" :data="rows">
        <el-table-column prop="scrapNo" label="报废单号" width="180" />
        <el-table-column prop="itemCode" label="对象编码" width="120" />
        <el-table-column prop="itemName" label="对象名称" width="160" />
        <el-table-column prop="scrapNumber" label="报废数量" width="120" align="right" />
        <el-table-column label="报废场景" width="140">
          <template #default="{ row }">{{ sceneLabel(row.scrapScene) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }"><el-tag :type="row.status === '已确认' ? 'danger' : row.status === '已取消' ? 'info' : 'warning'" effect="light">{{ row.status }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-if="row.status === '待确认'" link type="danger" @click="handleConfirm(row)">确认报废</el-button>
            <el-button v-if="row.status === '待确认'" link @click="handleCancel(row)">取消</el-button>
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

    <el-dialog v-model="createVisible" title="新增报废单" width="500px">
      <el-form label-width="100px" :model="createForm">
        <el-form-item label="库存对象ID" required><el-input v-model="createForm.itemId" /></el-form-item>
        <el-form-item label="报废场景" required>
          <el-select v-model="createForm.scrapScene" style="width:100%">
            <el-option label="库存内报废" value="IN_STOCK" /><el-option label="已分配未出库报废" value="WAREHOUSE_ALLOCATED" />
            <el-option label="退料后报废" value="RETURN_AFTER_OUTBOUND" /><el-option label="生产消耗报废" value="PRODUCTION_CONSUMED" />
          </el-select>
        </el-form-item>
        <el-form-item label="报废数量" required><el-input-number v-model="createForm.scrapNumber" :min="0.0001" :precision="4" style="width:100%" /></el-form-item>
        <el-form-item label="原因"><el-input v-model="createForm.reason" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="createForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="createVisible = false">取消</el-button><el-button type="primary" :loading="submitting" @click="submitCreate">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="报废单详情" width="600px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="报废单号">{{ detailRow.scrapNo }}</el-descriptions-item>
        <el-descriptions-item label="对象">{{ detailRow.itemName }}({{ detailRow.itemCode }})</el-descriptions-item>
        <el-descriptions-item label="报废场景">{{ sceneLabel(detailRow.scrapScene) }}</el-descriptions-item>
        <el-descriptions-item label="报废数量">{{ detailRow.scrapNumber }}</el-descriptions-item>
        <el-descriptions-item label="状态"><el-tag :type="detailRow.status === '已确认' ? 'danger' : 'info'">{{ detailRow.status }}</el-tag></el-descriptions-item>
        <el-descriptions-item label="原因">{{ detailRow.reason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="确认时间">{{ detailRow.confirmedAt ? formatTime(detailRow.confirmedAt) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type { ItemScrapListItem } from '@company/api-contract';
import { warehouseApi } from '../../api/warehouse';

const rows = ref<ItemScrapListItem[]>([]);
const detailRow = ref<ItemScrapListItem | null>(null);
const loading = ref(false); const submitting = ref(false);
const total = ref(0); const currentPage = ref(1); const pageSize = ref(10);
const createVisible = ref(false); const detailVisible = ref(false);
const query = reactive({ keyword: '', status: '', scrapScene: '' });
const createForm = reactive({ itemId: '', scrapScene: 'IN_STOCK' as string, scrapNumber: 0, reason: '', remark: '' });

const sceneLabel = (s: string) => ({ WAREHOUSE_ALLOCATED: '已分配报废', RETURN_AFTER_OUTBOUND: '退料报废', PRODUCTION_CONSUMED: '生产消耗报废', IN_STOCK: '库存内报废' })[s] ?? s;

const loadRows = async () => {
  loading.value = true;
  try { const page = await warehouseApi.listScraps({ page: currentPage.value, pageSize: pageSize.value, keyword: query.keyword || undefined, status: query.status || undefined, scrapScene: query.scrapScene || undefined }); rows.value = page.items; total.value = page.total; } finally { loading.value = false; }
};
const search = async () => { currentPage.value = 1; await loadRows(); };
const resetQuery = async () => { query.keyword = ''; query.status = ''; query.scrapScene = ''; currentPage.value = 1; await loadRows(); };
const handlePageSizeChange = async () => { currentPage.value = 1; await loadRows(); };
const openCreate = () => { createForm.itemId = ''; createForm.scrapScene = 'IN_STOCK'; createForm.scrapNumber = 0; createForm.reason = ''; createForm.remark = ''; createVisible.value = true; };

const submitCreate = async () => {
  if (!createForm.itemId || createForm.scrapNumber <= 0) { ElMessage.warning('请填写必填字段'); return; }
  submitting.value = true;
  try { await warehouseApi.createScrap({ itemId: createForm.itemId, scrapScene: createForm.scrapScene as any, scrapNumber: createForm.scrapNumber, reason: createForm.reason || null, remark: createForm.remark || null }); ElMessage.success('报废单已创建'); createVisible.value = false; await loadRows(); } finally { submitting.value = false; }
};

const openDetail = (row: ItemScrapListItem) => { detailRow.value = row; detailVisible.value = true; };
const handleConfirm = async (row: ItemScrapListItem) => { try { await ElMessageBox.confirm('确认报废后将生成库存流水，是否继续？', '确认报废', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }); } catch { return; } await warehouseApi.confirmScrap(row.id); ElMessage.success('报废已确认'); await loadRows(); };
const handleCancel = async (row: ItemScrapListItem) => { try { await ElMessageBox.confirm('确认取消该报废单？', '取消报废', { confirmButtonText: '确认取消', cancelButtonText: '不取消', type: 'warning' }); } catch { return; } await warehouseApi.cancelScrap(row.id); ElMessage.success('已取消'); await loadRows(); };
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
</style>
