<template>
  <div class="transaction-page">
    <section class="query-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="物料">
          <el-input v-model="query.keyword" clearable placeholder="物料、批次、供应商、协议、生产批次或工单" />
        </el-form-item>
        <el-form-item label="物料批次">
          <el-input v-model="query.materialBatchNo" clearable placeholder="批次号" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.transactionType" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="入库" value="inbound" />
            <el-option label="生产出库" value="outbound" />
            <el-option label="退料" value="return" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产批次">
          <el-input
            v-model="query.productionBatchNo"
            clearable
            placeholder="生产批次号"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="toolbar">
        <div>
          <el-button type="primary" :icon="Plus" @click="openInbound">物料入库</el-button>
          <el-button :icon="Upload" @click="openOutbound">生产领料出库</el-button>
          <el-button :icon="Download" @click="openReturn">退料</el-button>
        </div>
        <el-tooltip content="刷新">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadRows" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="rows">
        <el-table-column label="类型" width="112">
          <template #default="{ row }">
            <el-tag
              :type="getTransactionTypeMeta(row.transactionType).type"
              effect="light"
            >
              {{ getTransactionTypeMeta(row.transactionType).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="物料" min-width="210">
          <template #default="{ row }">
            <strong>{{ row.materialName }}</strong>
            <div class="sub-text">{{ row.materialModel }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="materialBatchNo" label="物料批次号" min-width="160" />
        <el-table-column label="供应商" min-width="140">
          <template #default="{ row }">{{ row.supplierName || "-" }}</template>
        </el-table-column>
        <el-table-column label="技术协议编码" min-width="150">
          <template #default="{ row }">{{ row.protocolCode || "-" }}</template>
        </el-table-column>
        <el-table-column label="数量" width="120" align="right">
          <template #default="{ row }"
            >{{ formatQuantity(row.quantity) }} {{ row.unit || "" }}</template
          >
        </el-table-column>
        <el-table-column label="关联生产批次" min-width="170">
          <template #default="{ row }">{{ row.productionBatchNo || "-" }}</template>
        </el-table-column>
        <el-table-column label="工单号" min-width="130">
          <template #default="{ row }">{{ row.workOrderNo || "-" }}</template>
        </el-table-column>
        <el-table-column label="记录人" width="120">
          <template #default="{ row }">{{ row.recordedByName || "-" }}</template>
        </el-table-column>
        <el-table-column label="记录时间" width="170">
          <template #default="{ row }">{{ formatTime(row.recordedAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="170">
          <template #default="{ row }">{{ row.remark || "-" }}</template>
        </el-table-column>
      </el-table>

      <TablePagination v-model:page="page" v-model:page-size="pageSize" :total="total" @change="loadRows" />
    </section>

    <el-dialog
      v-model="inboundVisible"
      title="物料入库"
      :width="DialogWidth.lg"
      class="business-dialog"
    >
      <el-form :model="inboundForm" label-width="112px">
        <div class="form-grid">
          <el-form-item label="物料" required>
            <el-select
              v-model="inboundForm.productId"
              filterable
              placeholder="请选择物料"
            >
              <el-option
                v-for="item in products"
                :key="item.id"
                :label="`${item.productModel} / ${item.productName}`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="物料批次号">
            <el-input v-model="inboundForm.materialBatchNo" placeholder="留空自动生成，如 WL-20260729001" />
          </el-form-item>
          <el-form-item label="供应商">
            <el-input v-model="inboundForm.supplierName" />
          </el-form-item>
          <el-form-item label="技术协议编码">
            <el-input v-model="inboundForm.protocolCode" maxlength="50" />
          </el-form-item>
          <el-form-item label="入库日期">
            <el-date-picker
              v-model="inboundForm.receivedDate"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="入库数量" required>
            <el-input-number
              v-model="inboundForm.quantity"
              :min="0.0001"
              :precision="4"
            />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="inboundForm.remark" type="textarea" :rows="3" />
        </el-form-item>
        <el-divider content-position="left">来料检验（必填）</el-divider>
        <div class="form-grid">
          <el-form-item label="检验名称">
            <el-input v-model="inboundForm.inspectionName" />
          </el-form-item>
          <el-form-item label="检验结果">
            <el-tag :type="inboundInspectionResult === 'pass' ? 'success' : 'warning'">
              {{ inboundInspectionResult === "pass" ? "合格" : "部分合格" }}
            </el-tag>
          </el-form-item>
          <el-form-item label="检验数量" required>
            <el-input-number :model-value="inboundInspectionQuantity" disabled :precision="4" />
          </el-form-item>
          <el-form-item label="合格/入库数量" required>
            <el-input-number :model-value="inboundForm.quantity" disabled :precision="4" />
          </el-form-item>
          <el-form-item label="不合格数量" required>
            <el-input-number v-model="inboundForm.failQuantity" :min="0" :precision="4" />
          </el-form-item>
          <el-form-item label="处置方式">
            <el-select v-model="inboundForm.disposition">
              <el-option label="接收" value="accept" />
              <el-option
                v-if="inboundInspectionResult === 'partial_pass'"
                label="让步接收合格部分"
                value="conditional_accept"
              />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="结果摘要">
          <el-input v-model="inboundForm.resultSummary" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="检验备注">
          <el-input v-model="inboundForm.inspectionRemark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inboundVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitInbound"
          >确认入库</el-button
        >
      </template>
    </el-dialog>

    <el-dialog
      v-model="flowVisible"
      :title="flowMode === 'outbound' ? '生产领料出库' : '物料退料'"
      :width="DialogWidth.lg"
      class="business-dialog"
    >
      <el-alert
        v-if="flowMode === 'outbound' && !filteredDemands.length"
        class="flow-alert"
        title="当前没有可领料的生产任务，请先开始任务后再办理物料出库"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form :model="flowForm" label-width="112px">
        <el-form-item label="物料需求" required>
          <el-select
            v-model="flowForm.usageId"
            filterable
            placeholder="请选择已分配的物料需求"
            @change="syncFlowQuantity"
          >
            <el-option
              v-for="item in filteredDemands"
              :key="item.usageId"
              :label="formatDemand(item)"
              :value="item.usageId"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="flowMode === 'outbound' ? '出库数量' : '退料数量'" required>
          <el-input-number v-model="flowForm.quantity" :min="0.0001" :precision="4" />
        </el-form-item>
        <el-form-item v-if="flowMode === 'return'" label="退料原因" required>
          <el-input v-model="flowForm.reason" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="flowForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="flowVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="flowMode === 'outbound' && !filteredDemands.length"
          :loading="submitting"
          @click="submitFlow"
        >
          {{ flowMode === "outbound" ? "确认出库" : "确认退料" }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Download, Plus, Refresh, Upload } from "@element-plus/icons-vue";
import type {
  MaterialTransactionDemandOption,
  MaterialTransactionListItem,
  ProductListItem,
} from "@company/api-contract";
import { productApi } from "../../api/product";
import { warehouseApi } from "../../api/warehouse";
import { DialogWidth } from "../../utils/dialog";
import { EMessage } from "../../utils/message";
import TablePagination from "../../components/common/TablePagination.vue";

/**
 * 统一整合物料批次入库记录与逐次领料、退料流水。
 * 入库行展示原始入库总量，不随当前库存扣减而改变。
 */
const rows = ref<MaterialTransactionListItem[]>([]);
const products = ref<ProductListItem[]>([]);
const demands = ref<MaterialTransactionDemandOption[]>([]);
const loading = ref(false);
const submitting = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const inboundVisible = ref(false);
const flowVisible = ref(false);
const flowMode = ref<"outbound" | "return">("outbound");
/** 出入库流水查询条件。 */
const query = reactive({
  keyword: "",
  materialBatchNo: "",
  transactionType: "",
  productionBatchNo: "",
});
/** 入库表单：库存数量只接收来料检验中的合格数量。 */
const inboundForm = reactive({
  productId: "",
  materialBatchNo: "",
  supplierName: "",
  protocolCode: "",
  receivedDate: "",
  quantity: 1,
  inspectionName: "来料检验",
  failQuantity: 0,
  disposition: "accept" as "accept" | "conditional_accept",
  resultSummary: "",
  inspectionRemark: "",
  remark: "",
});
/** 检验数量公式：合格入库数量 + 不合格数量。 */
const inboundInspectionQuantity = computed(
  () => Number(inboundForm.quantity || 0) + Number(inboundForm.failQuantity || 0)
);
/** 只要存在不合格数量，本次来料检验即为部分合格。 */
const inboundInspectionResult = computed<"pass" | "partial_pass">(() =>
  Number(inboundForm.failQuantity || 0) > 0 ? "partial_pass" : "pass"
);
/** 出库/退料共用表单，usageId 指向唯一的生产批次物料需求。 */
const flowForm = reactive({ usageId: "", quantity: 1, reason: "", remark: "" });
const filteredDemands = computed(() =>
  demands.value.filter((item) =>
    flowMode.value === "outbound"
      // 领料仅展示已开始且仍有剩余预留数量的生产任务。
      ? item.productionBatchStatus === "doing" && Number(item.remainingQuantity) > 0
      : Number(item.usedQuantity) > 0
  )
);

const loadRows = async () => {
  loading.value = true;
  try {
    const result = await warehouseApi.listMaterialTransactions({
      ...query,
      page: page.value,
      pageSize: pageSize.value,
    });
    rows.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
};
const loadOptions = async () => {
  const [productPage, demandRows] = await Promise.all([
    productApi.listProducts({ page: 1, pageSize: 200, status: "enabled" }),
    warehouseApi.listMaterialTransactionDemands(),
  ]);
  products.value = productPage.items;
  demands.value = demandRows;
};
const search = async () => {
  page.value = 1;
  await loadRows();
};
const resetQuery = async () => {
  Object.assign(query, {
    keyword: "",
    materialBatchNo: "",
    transactionType: "",
    productionBatchNo: "",
  });
  await search();
};
const changePage = async (value: number) => {
  page.value = value;
  await loadRows();
};
const openInbound = () => {
  Object.assign(inboundForm, {
    productId: "",
    materialBatchNo: "",
    supplierName: "",
    protocolCode: "",
    receivedDate: "",
    quantity: 1,
    inspectionName: "来料检验",
    failQuantity: 0,
    disposition: "accept",
    resultSummary: "",
    inspectionRemark: "",
    remark: "",
  });
  inboundVisible.value = true;
};
const openOutbound = async () => {
  await loadOptions();
  flowMode.value = "outbound";
  Object.assign(flowForm, { usageId: "", quantity: 1, reason: "", remark: "" });
  flowVisible.value = true;
};
const openReturn = async () => {
  await loadOptions();
  flowMode.value = "return";
  Object.assign(flowForm, { usageId: "", quantity: 1, reason: "", remark: "" });
  flowVisible.value = true;
};
const syncFlowQuantity = () => {
  const selected = demands.value.find((item) => item.usageId === flowForm.usageId);
  if (selected)
    flowForm.quantity = Number(
      flowMode.value === "outbound" ? selected.remainingQuantity : selected.usedQuantity
    );
};
/** 物料入库：检验记录与唯一物料批次由后端在同一事务内创建。 */
const submitInbound = async () => {
  if (
    !inboundForm.productId || inboundForm.quantity <= 0
  )
    return EMessage.warning("请选择物料并填写正确的入库数量");
  submitting.value = true;
  try {
    const result = inboundInspectionResult.value;
    const disposition = result === "pass" ? "accept" : inboundForm.disposition;
    await warehouseApi.materialInbound({
      productId: inboundForm.productId,
      materialBatchNo: inboundForm.materialBatchNo,
      supplierName: inboundForm.supplierName,
      protocolCode: inboundForm.protocolCode,
      receivedDate: inboundForm.receivedDate || null,
      quantity: inboundForm.quantity,
      remark: inboundForm.remark,
      inspection: {
        inspectionName: inboundForm.inspectionName,
        inspectQuantity: inboundInspectionQuantity.value,
        passQuantity: inboundForm.quantity,
        failQuantity: inboundForm.failQuantity,
        result,
        disposition,
        resultSummary: inboundForm.resultSummary,
        remark: inboundForm.inspectionRemark,
      },
    });
    EMessage.success("来料检验已记录，合格物料已入库");
    inboundVisible.value = false;
    await loadRows();
  } catch (error) {
    EMessage.error(error, "物料入库失败");
  } finally {
    submitting.value = false;
  }
};
/** 出库和退料均新增独立操作流水，并同步扣减或回补当前库存。 */
const submitFlow = async () => {
  if (!flowForm.usageId || flowForm.quantity <= 0)
    return EMessage.warning("请选择物料需求并填写数量");
  if (flowMode.value === "return" && !flowForm.reason.trim())
    return EMessage.warning("请填写退料原因");
  submitting.value = true;
  try {
    if (flowMode.value === "outbound")
      await warehouseApi.materialOutbound({
        usageId: flowForm.usageId,
        quantity: flowForm.quantity,
        remark: flowForm.remark,
      });
    else
      await warehouseApi.materialReturn({
        usageId: flowForm.usageId,
        quantity: flowForm.quantity,
        reason: flowForm.reason,
        remark: flowForm.remark,
      });
    EMessage.success(flowMode.value === "outbound" ? "物料已出库" : "物料已退回");
    flowVisible.value = false;
    await Promise.all([loadRows(), loadOptions()]);
  } catch (error) {
    EMessage.error(
      error,
      flowMode.value === "outbound" ? "物料出库失败" : "物料退料失败"
    );
  } finally {
    submitting.value = false;
  }
};
const formatDemand = (item: MaterialTransactionDemandOption) =>
  `${item.productionBatchNo} / ${item.materialModel} / ${item.materialBatchNo} / ${
    flowMode.value === "outbound"
      ? `可出 ${formatQuantity(item.remainingQuantity)}`
      : `已出 ${formatQuantity(item.usedQuantity)}`
  }`;
/** 出入库类型字典：退料作为独立流水展示，不再折算进累计出库行。 */
const getTransactionTypeMeta = (type: MaterialTransactionListItem["transactionType"]) => ({
  inbound: { label: "入库", type: "success" as const },
  outbound: { label: "生产出库", type: "primary" as const },
  return: { label: "退料", type: "warning" as const },
}[type]);
const formatQuantity = (value: string | number) =>
  Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 4 });
const formatTime = (value: string) => value.replace("T", " ").slice(0, 19);
onMounted(async () => {
  await Promise.all([loadRows(), loadOptions()]);
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
/* 无可领料任务时将原因置于表单上方，避免用户面对空下拉框。 */
.flow-alert {
  margin-bottom: 16px;
}
:deep(.el-select),
:deep(.el-date-editor),
:deep(.el-input-number) {
  width: 100%;
}
</style>
