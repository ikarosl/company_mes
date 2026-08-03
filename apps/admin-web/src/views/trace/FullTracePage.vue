<template>
  <div class="trace-page">
    <section class="query-panel">
      <el-form inline class="query-form" @submit.prevent="handleSearch">
        <el-form-item label="追溯关键词">
          <el-input v-model="keyword" clearable placeholder="工单、批次、产品、物料批次、检验单或流转单号" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :disabled="loading" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="query-tip">支持从工单正向追踪至出入库，也支持通过物料批次、检验单和流转单据反向定位生产批次。</div>
    </section>

    <section class="table-panel">
      <div class="panel-title">追溯结果 <span>共 {{ groupedResults.length }} 个工单 / {{ results.length }} 个生产批次</span></div>
      <el-table :data="pagedGroupedResults" empty-text="暂无匹配的追溯记录" @row-dblclick="openOrderDetail">
        <el-table-column prop="orderNo" label="工单号" min-width="150" />
        <el-table-column label="生产批次" min-width="210"><template #default="{ row }"><div v-for="batch in row.batches" :key="batch.batchId" class="batch-line">{{ batch.batchNo }}</div></template></el-table-column>
        <el-table-column label="产品" min-width="220"><template #default="{ row }"><b>{{ row.productName }}</b><div class="sub-text">{{ row.productCode }} / {{ row.productModel }}</div></template></el-table-column>
        <el-table-column prop="customerName" label="客户" min-width="140" show-overflow-tooltip />
        <el-table-column label="批次计划合计" width="130" align="right"><template #default="{ row }">{{ row.plannedQuantity }}</template></el-table-column>
        <el-table-column label="闭环状态" width="120"><template #default="{ row }"><el-tag :type="getClosureMeta(row.closureStatus).type">{{ getClosureMeta(row.closureStatus).label }}</el-tag></template></el-table-column>
        <el-table-column prop="issueCount" label="异常/缺口" width="100" align="center" />
        <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openOrderDetail(row)">查看链路</el-button></template></el-table-column>
      </el-table>
      <TablePagination
        v-model:page="page"
        v-model:page-size="pageSize"
        :total="groupedResults.length"
        :page-sizes="[10, 20, 50]"
      />
    </section>

    <el-dialog v-model="detailVisible" title="全流程追溯详情" width="92%" top="4vh" destroy-on-close>
      <div v-if="detail" class="detail-content">
        <div v-if="orderBatches.length > 1" class="batch-switcher">
          <span>当前工单包含 {{ orderBatches.length }} 个生产批次：</span>
          <el-radio-group v-model="activeBatchId" @change="switchBatch">
            <el-radio-button v-for="batch in orderBatches" :key="batch.batchId" :value="batch.batchId">
              {{ batch.batchNo }}
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="overview-grid">
          <div><span>工单号</span><strong>{{ detail.overview.orderNo }}</strong></div>
          <div><span>生产批次</span><strong>{{ detail.overview.batchNo }}</strong></div>
          <div><span>产品</span><strong>{{ detail.overview.productName }}</strong></div>
          <div><span>客户</span><strong>{{ detail.overview.customerName || '-' }}</strong></div>
          <div><span>执行路线</span><strong>{{ detail.overview.routeName || '-' }} {{ detail.overview.routeVersion || '' }}</strong></div>
          <div><span>负责人</span><strong>{{ detail.overview.ownerName || '-' }}</strong></div>
          <div><span>批次状态</span><strong>{{ traceLabel('batchStatus', detail.overview.batchStatus) }}</strong></div>
          <div><span>闭环状态</span><el-tag :type="closureMeta[detail.overview.closureStatus].type">{{ closureMeta[detail.overview.closureStatus].label }}</el-tag></div>
        </div>

        <el-alert v-if="detail.issues.length" title="当前闭环缺口" type="warning" :closable="false" show-icon>
          <template #default><ul class="issue-list"><li v-for="issue in detail.issues" :key="issue">{{ issue }}</li></ul></template>
        </el-alert>
        <el-alert v-else title="该批次生产、质量和入库记录已形成完整闭环" type="success" :closable="false" show-icon />

        <el-steps :active="flowStep" align-center finish-status="success" class="flow-steps">
          <el-step title="工单/批次" /><el-step title="物料" /><el-step title="工序报工" />
          <el-step title="检验处置" /><el-step title="入库/出库" />
        </el-steps>

        <el-tabs>
          <el-tab-pane :label="`物料记录 (${detail.materials.length})`">
            <el-table :data="detail.materials" border><el-table-column prop="materialName" label="物料" min-width="170" /><el-table-column prop="materialBatchNo" label="物料批次" min-width="150" /><el-table-column prop="supplierName" label="供应商" min-width="130" /><el-table-column prop="planQuantity" label="计划" width="90" /><el-table-column prop="reservedQuantity" label="预留" width="90" /><el-table-column prop="issuedQuantity" label="领料" width="90" /><el-table-column prop="returnedQuantity" label="退料" width="90" /><el-table-column prop="netIssuedQuantity" label="净领用" width="100" /></el-table>
          </el-tab-pane>
          <el-tab-pane :label="`工序执行 (${detail.steps.length})`">
            <el-table :data="detail.steps" border><el-table-column prop="stepOrder" label="顺序" width="70" /><el-table-column prop="stepName" label="工序" min-width="150" /><el-table-column prop="responsibleUserName" label="执行人" width="120" /><el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="statusTagType(row.status)">{{ traceLabel('stepStatus', row.status) }}</el-tag></template></el-table-column><el-table-column prop="outputQuantity" label="报工数" width="100" /><el-table-column prop="abnormalQuantity" label="异常数" width="100" /><el-table-column label="开始时间" min-width="165"><template #default="{ row }">{{ formatTime(row.startedAt) }}</template></el-table-column><el-table-column label="完成时间" min-width="165"><template #default="{ row }">{{ formatTime(row.completedAt) }}</template></el-table-column><el-table-column prop="sopFileName" label="SOP" min-width="180" show-overflow-tooltip /></el-table>
          </el-tab-pane>
          <el-tab-pane :label="`质量/返工 (${detail.quality.length})`">
            <el-table :data="detail.quality" border><el-table-column prop="inspectionNo" label="检验单号" min-width="150" /><el-table-column label="检验类型" min-width="125"><template #default="{ row }">{{ traceLabel('inspectionType', row.inspectionType) }}</template></el-table-column><el-table-column prop="inspectionName" label="检验名称" min-width="140" /><el-table-column label="结果" width="100"><template #default="{ row }"><el-tag :type="resultTagType(row.result)">{{ traceLabel('inspectionResult', row.result) }}</el-tag></template></el-table-column><el-table-column label="处置" width="120"><template #default="{ row }">{{ traceLabel('disposition', row.disposition) }}</template></el-table-column><el-table-column prop="failQuantity" label="不合格数" width="100" /><el-table-column prop="inspectorName" label="检验人" width="110" /><el-table-column prop="reworkNo" label="返工单" min-width="140" /><el-table-column label="返工状态" width="110"><template #default="{ row }">{{ traceLabel('reworkStatus', row.reworkStatus) }}</template></el-table-column><el-table-column label="返工结果" width="105"><template #default="{ row }">{{ traceLabel('inspectionResult', row.reworkResult) }}</template></el-table-column><el-table-column label="检验时间" min-width="165"><template #default="{ row }">{{ formatTime(row.inspectedAt) }}</template></el-table-column></el-table>
          </el-tab-pane>
          <el-tab-pane :label="`报废 (${detail.scraps.length})`">
            <el-table :data="detail.scraps" border><el-table-column prop="scrapNo" label="报废单号" min-width="150" /><el-table-column label="对象" width="110"><template #default="{ row }">{{ traceLabel('scrapObject', row.scrapObjectType) }}</template></el-table-column><el-table-column prop="scrapQuantity" label="数量" width="100" /><el-table-column label="阶段" width="120"><template #default="{ row }">{{ traceLabel('scrapStage', row.scrapStage) }}</template></el-table-column><el-table-column prop="reasonType" label="原因" min-width="180" /><el-table-column label="时间" min-width="165"><template #default="{ row }">{{ formatTime(row.operatedAt) }}</template></el-table-column></el-table>
          </el-tab-pane>
          <el-tab-pane :label="`库存流转 (${detail.flows.length})`">
            <el-table :data="detail.flows" border><el-table-column prop="flowNo" label="流转单号" min-width="150" /><el-table-column prop="inventoryBatchNo" label="库存批次" min-width="150" /><el-table-column label="对象" width="110"><template #default="{ row }">{{ traceLabel('flowObject', row.objectType) }}</template></el-table-column><el-table-column label="类型" width="100"><template #default="{ row }">{{ traceLabel('flowType', row.flowType) }}</template></el-table-column><el-table-column prop="quantity" label="数量" width="100" /><el-table-column prop="partnerName" label="客户/供应商" min-width="150" /><el-table-column prop="externalDocNo" label="外部单号" min-width="150" /><el-table-column prop="flowDate" label="日期" width="120" /></el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer><el-button @click="detailVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { TraceBatchDetail, TraceClosureStatus, TraceSearchItem } from '@company/api-contract';
import { computed, onMounted, ref } from 'vue';
import { traceApi } from '../../api/trace';
import TablePagination from '../../components/common/TablePagination.vue';

/** 查询条件：支持多个业务编号和名称的模糊检索。 */
const keyword = ref('');
/** 搜索及详情加载状态，防止重复提交。 */
const loading = ref(false);
const results = ref<TraceSearchItem[]>([]);
/** 追溯详情弹窗状态及当前批次完整证据链。 */
const detailVisible = ref(false);
const detail = ref<TraceBatchDetail | null>(null);
/** 工单下的批次列表及当前查看批次，用于一个工单拆分多批次时切换链路。 */
const orderBatches = ref<TraceSearchItem[]>([]);
const activeBatchId = ref('');
/** 工单分页状态：同一工单的多个生产批次始终保留在同一页。 */
const page = ref(1);
const pageSize = ref(10);

interface TraceWorkOrderGroup extends Omit<TraceSearchItem, 'batchId' | 'batchNo'> {
  /** 同一工单下的全部生产批次。 */
  batches: TraceSearchItem[];
}

const closureMeta: Record<TraceClosureStatus, { label: string; type: 'success' | 'warning' | 'danger' | 'info' }> = {
  closed: { label: '已闭环', type: 'success' }, in_progress: { label: '进行中', type: 'info' },
  abnormal: { label: '存在异常', type: 'danger' }, incomplete: { label: '数据不完整', type: 'warning' },
};
/** 表格插槽中的 row 由 Element Plus 推断为 any，此处统一收窄并提供安全兜底。 */
const getClosureMeta = (status: TraceClosureStatus) => closureMeta[status] ?? closureMeta.incomplete;

/** 闭环状态严重程度：工单汇总取所有批次中的最严重状态。 */
const closurePriority: Record<TraceClosureStatus, number> = { closed: 0, in_progress: 1, incomplete: 2, abnormal: 3 };
/** 搜索结果按工单合并，批次事实仍原样保留用于详情切换。 */
const groupedResults = computed<TraceWorkOrderGroup[]>(() => {
  const groups = new Map<string, TraceWorkOrderGroup>();
  for (const batch of results.value) {
    const current = groups.get(batch.workOrderId);
    if (!current) {
      groups.set(batch.workOrderId, { ...batch, plannedQuantity: batch.plannedQuantity, issueCount: batch.issueCount, batches: [batch] });
      continue;
    }
    current.batches.push(batch);
    current.plannedQuantity = (Number(current.plannedQuantity) + Number(batch.plannedQuantity)).toFixed(4);
    current.issueCount += batch.issueCount;
    if (closurePriority[batch.closureStatus] > closurePriority[current.closureStatus]) current.closureStatus = batch.closureStatus;
  }
  return [...groups.values()];
});
/** 当前页工单；分页在按工单合并完成后执行，避免拆散同一工单。 */
const pagedGroupedResults = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return groupedResults.value.slice(start, start + pageSize.value);
});

/** 追溯页枚举中文映射：数据库保留稳定英文值，页面统一展示业务含义。 */
const traceLabels: Record<string, Record<string, string>> = {
  batchStatus: { pending: '待准备', material_pending: '待生成/分配物料', material_assigned: '物料已分配', doing: '生产中', completed: '已完成', cancelled: '已取消' },
  stepStatus: { pending: '待开始', doing: '进行中', completed: '已完成', abnormal: '异常完成', skipped: '已跳过' },
  inspectionType: { incoming_material: '来料检验', first_article: '首件检验', process: '过程检验', final: '最终检验', package: '包装检验', test: '测试检验', recheck: '复检' },
  inspectionResult: { pass: '合格', fail: '不合格', partial_pass: '部分合格' },
  disposition: { accept: '接收', reject: '拒收', conditional_accept: '有条件接收', rework: '返工', scrap: '报废', return_supplier: '退供应商', hold: '暂扣' },
  reworkStatus: { pending: '待处理', doing: '处理中', wait_recheck: '待复检', completed: '已完成', closed: '已关闭' },
  scrapObject: { material: '物料', semi_finished: '半成品', product: '成品' },
  scrapStage: { production: '生产过程', inspection: '检验处置', stocktake: '库存盘点', warehouse: '仓储环节' },
  flowObject: { semi_finished: '半成品', finished: '成品' },
  flowType: { inbound: '入库', outbound: '出库', adjustment: '库存调整' },
};

/** 未知枚举保留原值便于排查，空值统一显示横线。 */
const traceLabel = (group: string, value: string | null | undefined) => value ? (traceLabels[group]?.[value] ?? value) : '-';
/** 工序状态标签颜色与生产模块保持一致。 */
const statusTagType = (status: string) => status === 'completed' ? 'success' : status === 'abnormal' ? 'danger' : status === 'doing' ? 'primary' : 'info';
/** 检验结果标签颜色与质量模块保持一致。 */
const resultTagType = (result: string) => result === 'pass' ? 'success' : result === 'fail' ? 'danger' : 'warning';
/** 后端时间统一转换为中文 24 小时制，空时间显示横线。 */
const formatTime = (value: string | null | undefined) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';

/** 顶部流程进度以最后一个已有事实节点为准，仅用于快速理解链路。 */
const flowStep = computed(() => {
  if (!detail.value) return 0;
  if (detail.value.flows.length) return 5;
  if (detail.value.quality.length) return 4;
  if (detail.value.steps.some((item) => item.status === 'completed')) return 3;
  if (detail.value.materials.length) return 2;
  return 1;
});

/** 查询追溯批次，空关键词展示最近更新的 100 个批次。 */
async function handleSearch() {
  loading.value = true;
  try { results.value = await traceApi.search(keyword.value || undefined); page.value = 1; }
  finally { loading.value = false; }
}

/** 重置查询条件并恢复默认追溯列表，同时将工单分页返回第一页。 */
function handleReset() {
  keyword.value = '';
  page.value = 1;
  void handleSearch();
}

/** 打开批次完整链路；接口失败时保留列表并由统一 EMessage 显示原因。 */
async function openOrderDetail(row: TraceWorkOrderGroup) {
  loading.value = true;
  try {
    orderBatches.value = row.batches;
    activeBatchId.value = row.batches[0]?.batchId ?? '';
    if (!activeBatchId.value) return;
    detail.value = await traceApi.getBatch(activeBatchId.value);
    detailVisible.value = true;
  }
  finally { loading.value = false; }
}

/** 切换同一工单下的生产批次并加载该批次独立证据链。 */
async function switchBatch(value: string | number | boolean | undefined) {
  const batchId = String(value ?? '');
  if (!batchId) return;
  loading.value = true;
  try { detail.value = await traceApi.getBatch(batchId); }
  finally { loading.value = false; }
}

onMounted(handleSearch);
</script>

<style scoped>
.trace-page{display:flex;flex-direction:column;gap:16px}.query-panel,.table-panel{border:1px solid #e5e7eb;border-radius:8px;background:#fff}.query-panel{padding:20px}.query-form{display:flex;align-items:flex-start}.query-form :deep(.el-input){width:520px}.query-tip,.sub-text,.panel-title span,.total-text{color:#6b7280;font-size:12px}.panel-title{height:56px;display:flex;align-items:center;gap:10px;padding:0 16px;border-bottom:1px solid #e5e7eb;font-weight:600}.table-footer{display:flex;align-items:center;justify-content:flex-end;gap:16px;min-height:64px;padding:0 20px;border-top:1px solid #e5e7eb}.batch-line+.batch-line{margin-top:6px}.detail-content{display:flex;flex-direction:column;gap:20px}.batch-switcher{display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid #dbeafe;border-radius:8px;background:#eff6ff;color:#374151}.overview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:16px;background:#f8fafc;border-radius:8px}.overview-grid>div{display:flex;flex-direction:column;gap:6px}.overview-grid span{color:#6b7280;font-size:12px}.overview-grid strong{color:#1f2937}.issue-list{margin:4px 0;padding-left:20px}.flow-steps{padding:8px 20px}@media(max-width:1100px){.overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.query-form :deep(.el-input){width:360px}.batch-switcher{align-items:flex-start;flex-direction:column}}
</style>
