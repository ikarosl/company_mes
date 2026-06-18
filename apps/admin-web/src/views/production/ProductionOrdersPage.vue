<template>
  <div class="orders-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="工单号/产品" />
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="query.productId" clearable filterable placeholder="全部">
            <el-option
              v-for="product in productOptions"
              :key="product.id"
              :label="formatProduct(product)"
              :value="product.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="query.ownerId" clearable filterable placeholder="全部">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="item in orderStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchOrders">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增工单</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadOrders" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="orders" class="orders-table">
        <el-table-column label="工单号" min-width="160">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <div class="product-name">{{ row.productName }}</div>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="150" align="right">
          <template #default="{ row }">
            {{ formatQuantity(row.assignedQuantity) }} / {{ formatQuantity(row.plannedQuantity) }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="120">
          <template #default="{ row }">{{ row.ownerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="当前流程" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.currentFlow }}</template>
        </el-table-column>
        <el-table-column label="下一步" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.nextAction }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getOrderStatusMeta(row.status).type" effect="light">
              {{ getOrderStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计划完成" width="120">
          <template #default="{ row }">{{ row.planEndDate || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="310" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" :disabled="!canEditOrder(row)" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="openTasks(row)">生产批次</el-button>
            <el-button link type="primary" :disabled="row.status !== 'draft'" @click="releaseOrder(row)">下达</el-button>
            <el-dropdown trigger="click">
              <el-button link type="primary">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :disabled="!canCloseOrder(row)" @click="closeOrder(row)">关闭工单</el-dropdown-item>
                  <el-dropdown-item :disabled="!canCancelOrder(row)" @click="cancelOrder(row)">取消工单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          @current-change="loadOrders"
        />
      </div>
    </section>

    <el-dialog v-model="orderDialogVisible" :title="editingOrderId ? '编辑工单' : '新增工单'" width="860px">
      <el-form class="dialog-form" label-width="108px" :model="orderForm">
        <div class="form-grid">
          <el-form-item label="工单号" required>
            <el-input v-model="orderForm.orderNo" placeholder="请输入工单号" />
          </el-form-item>
          <el-form-item label="产品" required>
            <el-select v-model="orderForm.productId" filterable placeholder="请选择产品" @change="handleOrderProductChange">
              <el-option
                v-for="product in productOptions"
                :key="product.id"
                :label="formatProduct(product)"
                :value="product.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="工艺路线">
            <el-select v-model="orderForm.routeId" clearable filterable placeholder="请选择执行路线">
              <el-option v-for="route in routeOptions" :key="route.id" :label="route.routeName" :value="route.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="计划数量" required>
            <el-input-number v-model="orderForm.plannedQuantity" :min="0.0001" :precision="4" :step="1" />
          </el-form-item>
          <el-form-item label="单位">
            <el-input v-model="orderForm.unit" placeholder="pcs" />
          </el-form-item>
          <el-form-item label="负责人">
            <el-select v-model="orderForm.ownerId" clearable filterable placeholder="请选择负责人">
              <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="计划开始">
            <el-date-picker v-model="orderForm.planStartDate" type="date" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="计划完成">
            <el-date-picker v-model="orderForm.planEndDate" type="date" value-format="YYYY-MM-DD" />
          </el-form-item>
        </div>
        <el-form-item label="备注">
          <el-input v-model="orderForm.remark" type="textarea" :rows="3" placeholder="可填写生产要求或注意事项" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="orderDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitOrder">保存工单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="工单详情" width="1000px">
      <template v-if="activeOrder">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="工单号">{{ activeOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ activeOrder.productName }}</el-descriptions-item>
          <el-descriptions-item label="型号">{{ activeOrder.productModel }}</el-descriptions-item>
          <el-descriptions-item label="工艺路线">{{ activeOrder.routeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQuantity(activeOrder.plannedQuantity) }} {{ activeOrder.unit }}</el-descriptions-item>
          <el-descriptions-item label="已分配">{{ formatQuantity(activeOrder.assignedQuantity) }} {{ activeOrder.unit }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ activeOrder.ownerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getOrderStatusMeta(activeOrder.status).label }}</el-descriptions-item>
          <el-descriptions-item label="计划完成">{{ activeOrder.planEndDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="3">{{ activeOrder.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="dialog-section-title">生产批次</div>
        <el-table :data="activeOrder.batches" class="detail-table">
          <el-table-column prop="batchNo" label="生产批次号" min-width="160" />
          <el-table-column label="数量" width="120" align="right">
            <template #default="{ row }">{{ formatQuantity(row.plannedQuantity) }}</template>
          </el-table-column>
          <el-table-column label="任务状态" width="120">
            <template #default="{ row }">{{ getBatchStatusMeta(row.status).label }}</template>
          </el-table-column>
          <el-table-column label="物料状态" width="130">
            <template #default="{ row }">{{ materialStatusLabels[row.materialStatus] ?? row.materialStatus }}</template>
          </el-table-column>
          <el-table-column label="负责人" width="120">
            <template #default="{ row }">{{ row.ownerName || '-' }}</template>
          </el-table-column>
          <el-table-column label="计划完成" width="120">
            <template #default="{ row }">{{ row.planEndDate || '-' }}</template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <el-dialog v-model="taskDialogVisible" title="生产批次" width="1000px">
      <template v-if="taskOrder">
        <div class="task-toolbar">
          <div>
            <span class="order-no">{{ taskOrder.orderNo }}</span>
            <span class="sub-text">计划 {{ formatQuantity(taskOrder.plannedQuantity) }} {{ taskOrder.unit }}，已分配 {{ formatQuantity(taskOrder.assignedQuantity) }}</span>
          </div>
          <el-button type="primary" :icon="Plus" :disabled="taskOrder.status === 'draft' || Number(taskOrder.plannedQuantity) <= Number(taskOrder.assignedQuantity)" @click="openCreateBatch">
            新增生产批次
          </el-button>
        </div>
        <el-table :data="taskBatches" class="detail-table">
          <el-table-column prop="batchNo" label="生产批次号" min-width="160" />
          <el-table-column label="数量" width="120" align="right">
            <template #default="{ row }">{{ formatQuantity(row.plannedQuantity) }}</template>
          </el-table-column>
          <el-table-column label="任务状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getBatchStatusMeta(row.status).type" effect="light">{{ getBatchStatusMeta(row.status).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="物料状态" width="130">
            <template #default="{ row }">{{ materialStatusLabels[row.materialStatus] ?? row.materialStatus }}</template>
          </el-table-column>
          <el-table-column label="负责人" width="120">
            <template #default="{ row }">{{ row.ownerName || '-' }}</template>
          </el-table-column>
          <el-table-column label="计划完成" width="120">
            <template #default="{ row }">{{ row.planEndDate || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEditBatch(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

    <el-dialog v-model="batchFormDialogVisible" :title="editingBatchId ? '编辑生产批次' : '新增生产批次'" width="640px">
      <el-form class="dialog-form" label-width="108px" :model="batchForm">
        <el-form-item label="批次号">
          <el-input v-model="batchForm.batchNo" placeholder="不填则系统自动生成" />
        </el-form-item>
        <el-form-item label="计划数量" required>
          <el-input-number
            v-model="batchForm.plannedQuantity"
            :min="0.0001"
            :max="batchQuantityMax ?? undefined"
            :precision="4"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="工艺路线">
          <el-select v-model="batchForm.routeId" clearable filterable placeholder="默认沿用工单路线">
            <el-option v-for="route in routeOptions" :key="route.id" :label="route.routeName" :value="route.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="batchForm.ownerId" clearable filterable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="editingBatchId" label="任务状态">
          <el-select v-model="batchForm.status">
            <el-option v-for="item in batchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始">
          <el-date-picker v-model="batchForm.planStartDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划完成">
          <el-date-picker v-model="batchForm.planEndDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchFormDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitBatch">保存生产批次</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  ProcessRouteListItem,
  ProductListItem,
  ProductionBatchItem,
  ProductionBatchStatus,
  SystemUserListItem,
  WorkOrderDetail,
  WorkOrderListItem,
  WorkOrderStatus,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { productionApi } from '../../api/production';
import { systemApi } from '../../api/system';

const orderStatusOptions: Array<{ value: WorkOrderStatus; label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }> = [
  { value: 'draft', label: '草稿', type: 'info' },
  { value: 'released', label: '已下达', type: 'primary' },
  { value: 'doing', label: '生产中', type: 'primary' },
  { value: 'completed', label: '已完工', type: 'success' },
  { value: 'closed', label: '已关闭', type: 'info' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
];

const batchStatusOptions: Array<{ value: ProductionBatchStatus; label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = [
  { value: 'pending', label: '待处理', type: 'info' },
  { value: 'assigned', label: '已派工', type: 'primary' },
  { value: 'doing', label: '生产中', type: 'primary' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
];

const materialStatusLabels: Record<string, string> = {
  ungenerated: '未生成需求',
  unassigned: '未分配',
  partial_assigned: '部分分配',
  assigned: '已分配',
  ready: '已齐套',
  outbound: '已出库',
  shortage: '缺料',
  returned: '已退料',
};

const orders = ref<WorkOrderListItem[]>([]);
const productOptions = ref<ProductListItem[]>([]);
const routeOptions = ref<ProcessRouteListItem[]>([]);
const userOptions = ref<SystemUserListItem[]>([]);
const activeOrder = ref<WorkOrderDetail | null>(null);
const taskOrder = ref<WorkOrderListItem | null>(null);
const taskBatches = ref<ProductionBatchItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const orderDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const taskDialogVisible = ref(false);
const batchFormDialogVisible = ref(false);
const editingOrderId = ref<string | null>(null);
const editingBatchId = ref<string | null>(null);

const query = reactive({ keyword: '', productId: '', ownerId: '', status: '' });
const orderForm = reactive({
  orderNo: '',
  productId: '',
  routeId: '',
  plannedQuantity: 1,
  unit: 'pcs',
  ownerId: '',
  planStartDate: '',
  planEndDate: '',
  remark: '',
});
const batchForm = reactive({
  batchNo: '',
  routeId: '',
  plannedQuantity: 1,
  ownerId: '',
  status: 'pending' as ProductionBatchStatus,
  planStartDate: '',
  planEndDate: '',
  remark: '',
});

const editingBatch = computed(() => taskBatches.value.find((item) => item.id === editingBatchId.value) ?? null);
const batchQuantityMax = computed(() => {
  if (!taskOrder.value) {
    return null;
  }

  const plannedQuantity = Number(taskOrder.value.plannedQuantity);
  const assignedQuantity = Number(taskOrder.value.assignedQuantity);
  const currentBatchQuantity = editingBatch.value ? Number(editingBatch.value.plannedQuantity) : 0;
  const maxQuantity = plannedQuantity - assignedQuantity + currentBatchQuantity;
  return Number.isFinite(maxQuantity) ? Math.max(maxQuantity, 0) : null;
});

const loadOptions = async () => {
  const [products, routes, users] = await Promise.all([
    productApi.listProducts({ page: 1, pageSize: 100, status: 'enabled' }),
    productApi.listRoutes({ page: 1, pageSize: 100, status: 'enabled' }),
    systemApi.listUsers({ status: 'enabled' }),
  ]);
  productOptions.value = products.items;
  routeOptions.value = routes.items;
  userOptions.value = users;
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const page = await productionApi.listOrders({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      productId: query.productId,
      ownerId: query.ownerId,
      status: query.status,
    });
    orders.value = page.items;
    total.value = page.total;
    syncTaskOrderFromOrders();
  } finally {
    loading.value = false;
  }
};

const syncTaskOrderFromOrders = () => {
  if (!taskOrder.value) {
    return;
  }

  const latestOrder = orders.value.find((item) => item.id === taskOrder.value?.id);
  if (latestOrder) {
    taskOrder.value = latestOrder;
  }
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadOptions(), loadOrders()]);
  } finally {
    loading.value = false;
  }
};

const searchOrders = async () => {
  currentPage.value = 1;
  await loadOrders();
};

const resetQuery = async () => {
  Object.assign(query, { keyword: '', productId: '', ownerId: '', status: '' });
  currentPage.value = 1;
  await loadOrders();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadOrders();
};

const resetOrderForm = () => {
  Object.assign(orderForm, {
    orderNo: '',
    productId: '',
    routeId: '',
    plannedQuantity: 1,
    unit: 'pcs',
    ownerId: '',
    planStartDate: '',
    planEndDate: '',
    remark: '',
  });
};

const openCreate = () => {
  editingOrderId.value = null;
  resetOrderForm();
  orderDialogVisible.value = true;
};

const openEdit = (row: WorkOrderListItem) => {
  editingOrderId.value = row.id;
  Object.assign(orderForm, {
    orderNo: row.orderNo,
    productId: row.productId,
    routeId: row.routeId ?? '',
    plannedQuantity: Number(row.plannedQuantity),
    unit: row.unit,
    ownerId: row.ownerId ?? '',
    planStartDate: row.planStartDate ?? '',
    planEndDate: row.planEndDate ?? '',
    remark: row.remark ?? '',
  });
  orderDialogVisible.value = true;
};

const handleOrderProductChange = (productId: string) => {
  const product = productOptions.value.find((item) => item.id === productId);
  if (product) {
    orderForm.unit = product.unit;
  }
};

const submitOrder = async () => {
  if (!orderForm.orderNo.trim() || !orderForm.productId || orderForm.plannedQuantity <= 0) {
    ElMessage.warning('请填写工单号、产品和计划数量');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      orderNo: orderForm.orderNo,
      productId: orderForm.productId,
      routeId: orderForm.routeId || null,
      plannedQuantity: orderForm.plannedQuantity,
      unit: orderForm.unit,
      ownerId: orderForm.ownerId || null,
      planStartDate: orderForm.planStartDate || null,
      planEndDate: orderForm.planEndDate || null,
      remark: orderForm.remark,
    };

    if (editingOrderId.value) {
      await productionApi.updateOrder(editingOrderId.value, payload);
      ElMessage.success('工单已更新');
    } else {
      await productionApi.createOrder(payload);
      ElMessage.success('工单已新增');
    }

    orderDialogVisible.value = false;
    await loadOrders();
  } finally {
    submitting.value = false;
  }
};

const openDetail = async (row: WorkOrderListItem) => {
  activeOrder.value = await productionApi.getOrder(row.id);
  detailDialogVisible.value = true;
};

const openTasks = async (row: WorkOrderListItem) => {
  taskOrder.value = row;
  taskBatches.value = await productionApi.listOrderBatches(row.id);
  taskDialogVisible.value = true;
};

const resetBatchForm = () => {
  const maxQuantity = batchQuantityMax.value ?? 1;
  Object.assign(batchForm, {
    batchNo: '',
    routeId: taskOrder.value?.routeId ?? '',
    plannedQuantity: Math.min(1, Math.max(maxQuantity, 0.0001)),
    ownerId: taskOrder.value?.ownerId ?? '',
    status: 'pending' as ProductionBatchStatus,
    planStartDate: taskOrder.value?.planStartDate ?? '',
    planEndDate: taskOrder.value?.planEndDate ?? '',
    remark: '',
  });
};

const openCreateBatch = () => {
  editingBatchId.value = null;
  resetBatchForm();
  batchFormDialogVisible.value = true;
};

const openEditBatch = (row: ProductionBatchItem) => {
  editingBatchId.value = row.id;
  Object.assign(batchForm, {
    batchNo: row.batchNo,
    routeId: row.routeId ?? '',
    plannedQuantity: Number(row.plannedQuantity),
    ownerId: row.ownerId ?? '',
    status: row.status,
    planStartDate: row.planStartDate ?? '',
    planEndDate: row.planEndDate ?? '',
    remark: row.remark ?? '',
  });
  batchFormDialogVisible.value = true;
};

const submitBatch = async () => {
  if (!taskOrder.value || batchForm.plannedQuantity <= 0) {
    ElMessage.warning('请填写生产批次数量');
    return;
  }

  if (batchQuantityMax.value !== null && batchForm.plannedQuantity > batchQuantityMax.value) {
    ElMessage.warning('生产批次数量不能超过工单剩余可分配数量');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      batchNo: batchForm.batchNo || null,
      routeId: batchForm.routeId || null,
      plannedQuantity: batchForm.plannedQuantity,
      ownerId: batchForm.ownerId || null,
      planStartDate: batchForm.planStartDate || null,
      planEndDate: batchForm.planEndDate || null,
      remark: batchForm.remark,
    };

    if (editingBatchId.value) {
      await productionApi.updateOrderBatch(taskOrder.value.id, editingBatchId.value, {
        ...payload,
        batchNo: batchForm.batchNo,
        status: batchForm.status,
      });
      ElMessage.success('生产批次已更新');
    } else {
      await productionApi.createOrderBatch(taskOrder.value.id, payload);
      ElMessage.success('生产批次已新增');
    }

    batchFormDialogVisible.value = false;
    taskBatches.value = await productionApi.listOrderBatches(taskOrder.value.id);
    await loadOrders();
  } finally {
    submitting.value = false;
  }
};

const releaseOrder = (row: WorkOrderListItem) => changeOrderStatus(row, 'released', '下达');
const closeOrder = (row: WorkOrderListItem) => changeOrderStatus(row, 'closed', '关闭');
const cancelOrder = (row: WorkOrderListItem) => changeOrderStatus(row, 'cancelled', '取消');

const changeOrderStatus = async (
  row: WorkOrderListItem,
  status: Extract<WorkOrderStatus, 'released' | 'closed' | 'cancelled'>,
  label: string,
) => {
  try {
    await ElMessageBox.confirm(`确认${label}该工单？`, `${label}工单`, {
      confirmButtonText: `确认${label}`,
      cancelButtonText: '取消',
      type: status === 'cancelled' ? 'warning' : 'info',
    });
  } catch {
    return;
  }

  await productionApi.changeOrderStatus(row.id, status);
  ElMessage.success(`工单已${label}`);
  await loadOrders();
};

const canEditOrder = (row: WorkOrderListItem) => ['draft', 'released'].includes(row.status);
const canCloseOrder = (row: WorkOrderListItem) => ['released', 'completed'].includes(row.status);
const canCancelOrder = (row: WorkOrderListItem) => ['draft', 'released', 'doing'].includes(row.status);
const getOrderStatusMeta = (status: WorkOrderStatus) => orderStatusOptions.find((item) => item.value === status) ?? orderStatusOptions[0];
const getBatchStatusMeta = (status: ProductionBatchStatus) => batchStatusOptions.find((item) => item.value === status) ?? batchStatusOptions[0];
const formatProduct = (product: ProductListItem) => `${product.productModel} / ${product.productName}`;

const formatQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};

onMounted(loadPageData);
</script>

<style scoped>
.orders-page {
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

.table-toolbar,
.task-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 16px;
  border-bottom: 1px solid #e5e7eb;
}

.orders-table {
  width: 100%;
}

.orders-table :deep(.el-table__header th),
.detail-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.orders-table :deep(.el-table__row) {
  height: 56px;
}

.order-no,
.product-name {
  color: #1f2937;
  font-weight: 600;
}

.sub-text {
  margin-left: 8px;
  color: #6b7280;
  font-size: 12px;
}

.product-name + .sub-text {
  display: block;
  margin-left: 0;
  margin-top: 2px;
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

.dialog-section-title {
  margin: 20px 0 12px;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
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
