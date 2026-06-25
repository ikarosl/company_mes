<template>
  <div class="tasks-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="批次、工单、客户、产品、路线或负责人" />
        </el-form-item>
        <el-form-item label="产品">
          <OrderProductSelect v-model="query.productId" placeholder="输入型号或名称筛选" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="query.ownerId" clearable filterable placeholder="全部">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option v-for="item in taskStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchTasks">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增任务</el-button>
        <div class="toolbar-actions">
          <span class="toolbar-title">生产任务</span>
          <el-tooltip content="刷新" placement="top">
            <el-button :icon="Refresh" text circle :loading="loading" @click="loadTasks" />
          </el-tooltip>
        </div>
      </div>

      <el-table v-loading="loading" :data="tasks" class="tasks-table">
        <el-table-column label="批次号" min-width="170">
          <template #default="{ row }"><span class="batch-no">{{ row.batchNo }}</span></template>
        </el-table-column>
        <el-table-column label="工单号" min-width="150">
          <template #default="{ row }">{{ row.workOrderNo || '-' }}</template>
        </el-table-column>
        <el-table-column label="产品" min-width="220">
          <template #default="{ row }">
            <div class="product-name">{{ row.productName }}</div>
            <div class="sub-text">{{ row.productModel }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="120" align="right">
          <template #default="{ row }">{{ formatQuantity(row.plannedQuantity) }}</template>
        </el-table-column>
        <el-table-column label="工艺路线" min-width="160">
          <template #default="{ row }">{{ row.routeName || '未选择' }}</template>
        </el-table-column>
        <el-table-column label="任务状态" width="130">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusMeta(row.status).type" effect="light">
              {{ getTaskStatusMeta(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="物料状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getMaterialStatusMeta(row.materialStatus).type" effect="light">
              {{ getMaterialStatusMeta(row.materialStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="派工状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getDispatchStatusMeta(row.dispatchStatus).type" effect="light">
              {{ getDispatchStatusMeta(row.dispatchStatus).label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="120">
          <template #default="{ row }">{{ row.ownerName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="440" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" :disabled="!canConfigureTask(row)" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              type="primary"
              :disabled="!canConfigureTask(row)"
              @click="row.materialStatus === 'missing_demand' ? generateMaterials(row) : openDetail(row)"
            >
              {{ row.materialStatus === 'missing_demand' ? '生成物料' : '查看物料' }}
            </el-button>
            <el-button link type="primary" @click="openMaterialAllocation">物料分配</el-button>
            <el-button link type="primary" :disabled="!canConfigureTask(row)" @click="openDispatch(row)">派工</el-button>
            <el-button link type="primary" :disabled="!canStartTask(row)" @click="startTask(row)">开始</el-button>
            <el-button link type="primary" :disabled="row.status !== 'doing'" @click="finishTask(row)">完成</el-button>
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
        <el-pagination :current-page="currentPage" :page-size="pageSize" :total="total" layout="prev, pager, next, jumper" @current-change="loadTasks" />
      </div>
    </section>

    <el-dialog v-model="taskDialogVisible" :title="editingTaskId ? '编辑任务' : '新增任务'" :width="DialogWidth.xl" class="business-dialog">
      <el-form class="dialog-form" label-width="108px" :model="taskForm">
        <el-form-item v-if="!editingTaskId" label="选择工单" required>
          <el-select
            v-model="taskForm.workOrderId"
            filterable
            remote
            reserve-keyword
            :loading="workOrderLoading"
            :remote-method="searchWorkOrders"
            placeholder="输入工单号、客户或产品"
            @change="handleTaskOrderChange"
          >
            <el-option
              v-for="order in availableWorkOrderOptions"
              :key="order.id"
              :label="formatWorkOrder(order)"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!editingTaskId" label="批次号">
          <el-input v-model="taskForm.batchNo" placeholder="若为空则自动生成批次号" />
        </el-form-item>
        <el-form-item v-if="!editingTaskId && selectedWorkOrder" label="产品">
          <el-input :model-value="formatTaskProduct(selectedWorkOrder)" disabled />
        </el-form-item>
        <el-form-item label="工艺路线" required>
          <el-select v-model="taskForm.routeId" filterable clearable placeholder="请选择工艺路线" @change="refreshCreatePreview">
            <el-option v-for="route in availableRouteOptions" :key="route.id" :label="formatRoute(route)" :value="route.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="taskForm.ownerId" filterable clearable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量" required>
          <el-input-number
            v-model="taskForm.plannedQuantity"
            :min="0"
            :max="taskQuantityMax ?? undefined"
            :precision="4"
            :step="1"
            @change="refreshCreatePreview"
          />
        </el-form-item>
        <el-form-item label="计划开始日期">
          <el-date-picker v-model="taskForm.planStartDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划结束日期">
          <el-date-picker v-model="taskForm.planEndDate" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="taskForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <el-tabs class="detail-tabs">
        <el-tab-pane label="工序执行">
          <el-table :data="createPreviewSteps" class="detail-table">
            <el-table-column prop="stepOrder" label="顺序" width="70" />
            <el-table-column prop="stepName" label="工序" min-width="160" />
            <el-table-column label="实际参考文件" min-width="220">
              <template #default="{ row }">
                <div class="file-cell">
                  <el-select v-model="row.sopFileId" clearable filterable placeholder="请选择参考文件">
                    <el-option v-for="file in sopFileOptions" :key="file.id" :label="file.name" :value="file.id" />
                  </el-select>
                  <el-upload
                    v-if="canUploadStepFile(row)"
                    :show-file-list="false"
                    :before-upload="createStepSopUploadHandler(row)"
                  >
                    <el-button>上传</el-button>
                  </el-upload>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="负责人" min-width="180">
              <template #default="{ row }">
                <el-select v-model="row.responsibleUserId" clearable filterable placeholder="请选择负责人">
                  <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
                </el-select>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="物料需求">
          <el-table :data="createPreviewMaterials" class="detail-table">
            <el-table-column prop="materialModel" label="物料型号" min-width="160" />
            <el-table-column prop="materialName" label="物料名称" min-width="160" />
            <el-table-column label="单位用量" width="120" align="right">
              <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
            </el-table-column>
            <el-table-column label="需求数量" width="170" align="right">
              <template #default="{ row }">
                {{ formatQuantity(row.planQuantity) }}
              </template>
            </el-table-column>
            <el-table-column label="单位" width="90">
              <template #default="{ row }">{{ row.unit || '-' }}</template>
            </el-table-column>
            <el-table-column label="批次记录" width="100">
              <template #default="{ row }">{{ row.needBatchRecord ? '需要' : '不需要' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="taskDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitTask">保存任务</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="任务详情" :width="DialogWidth.xl" class="business-dialog">
      <template v-if="activeTask">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="批次号">{{ activeTask.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="工单号">{{ activeTask.workOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ activeTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="工艺路线">{{ activeTask.routeName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQuantity(activeTask.plannedQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ activeTask.ownerName || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-tabs class="detail-tabs">
          <el-tab-pane label="工序执行">
            <el-table :data="activeTask.steps" class="detail-table">
              <el-table-column prop="stepOrder" label="序号" width="70" />
              <el-table-column prop="stepName" label="工序" min-width="160" />
              <el-table-column label="默认负责人" width="130">
                <template #default="{ row }">{{ row.responsibleUserName || '-' }}</template>
              </el-table-column>
              <el-table-column label="现场负责人" width="130">
                <template #default="{ row }">{{ row.responsibleUserName || '-' }}</template>
              </el-table-column>
              <el-table-column label="实际参考文件" width="160">
                <template #default="{ row }">{{ getSopFileName(row.sopFileId) }}</template>
              </el-table-column>
              <el-table-column label="状态" width="110">
                <template #default="{ row }">{{ stepStatusLabels[row.status] ?? row.status }}</template>
              </el-table-column>
              <el-table-column label="完成/返工/异常" width="150">
                <template #default="{ row }">{{ formatQuantity(row.outputQuantity) }} / {{ formatQuantity(row.returnQuantity) }} / {{ formatQuantity(row.abnormalQuantity) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="90" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openStepEdit(row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="物料需求">
            <el-table :data="activeTask.materialRequirements" class="detail-table">
              <el-table-column prop="materialModel" label="物料编码" min-width="160" />
              <el-table-column prop="materialName" label="物料名称" min-width="160" />
              <el-table-column label="单位用量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
              </el-table-column>
              <el-table-column label="需求数量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.planQuantity) }}</template>
              </el-table-column>
              <el-table-column label="已用数量" width="120" align="right">
                <template #default="{ row }">{{ formatQuantity(row.usedQuantity) }}</template>
              </el-table-column>
              <el-table-column label="单位" width="80">
                <template #default="{ row }">{{ row.unit || '-' }}</template>
              </el-table-column>
              <el-table-column label="是否批次记录" width="100">
                <template #default="{ row }">{{ row.needBatchRecord ? '是' : '否' }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>

    <el-dialog v-model="dispatchDialogVisible" title="任务派工" :width="DialogWidth.lg" class="business-dialog">
      <el-table :data="dispatchRows" class="detail-table">
        <el-table-column prop="stepOrder" label="序号" width="70" />
        <el-table-column prop="stepName" label="工序" min-width="180" />
        <el-table-column label="实际参考文件" min-width="220">
          <template #default="{ row }">
            <el-select v-model="row.sopFileId" clearable filterable placeholder="请选择参考文件">
              <el-option v-for="file in sopFileOptions" :key="file.id" :label="file.name" :value="file.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="负责人" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.responsibleUserId" clearable filterable placeholder="指定现场负责人">
              <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="dispatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitDispatch">确认派工</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="materialDemandDialogVisible" title="生成物料需求" :width="DialogWidth.lg" class="business-dialog">
      <template v-if="materialDemandTask">
        <el-descriptions :column="3" border class="material-demand-summary">
          <el-descriptions-item label="批次号">{{ materialDemandTask.batchNo }}</el-descriptions-item>
          <el-descriptions-item label="产品">{{ materialDemandTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ formatQuantity(materialDemandTask.plannedQuantity) }}</el-descriptions-item>
        </el-descriptions>
        <el-table :data="materialDemandPreviewRows" class="detail-table">
          <el-table-column prop="materialModel" label="物料编码" min-width="160" />
          <el-table-column prop="materialName" label="物料名称" min-width="160" />
          <el-table-column label="单位用量" width="120" align="right">
            <template #default="{ row }">{{ formatQuantity(row.quantityPerUnit) }}</template>
          </el-table-column>
          <el-table-column label="需求数量" width="120" align="right">
            <template #default="{ row }">{{ formatQuantity(row.planQuantity) }}</template>
          </el-table-column>
          <el-table-column label="单位" width="80">
            <template #default="{ row }">{{ row.unit || '-' }}</template>
          </el-table-column>
          <el-table-column label="批次记录" width="100">
            <template #default="{ row }">{{ row.needBatchRecord ? '是' : '否' }}</template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="materialDemandDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmGenerateMaterials">确认生成</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="startCheckDialogVisible" title="开始生产确认" :width="DialogWidth.md" class="business-dialog">
      <template v-if="startCheck">
        <el-alert
          v-if="startCheck.blockers.length"
          title="暂时不能开始生产"
          type="error"
          :closable="false"
          show-icon
        >
          <div v-for="item in startCheck.blockers" :key="item">{{ item }}</div>
        </el-alert>
        <el-alert
          v-else-if="startCheck.warnings.length"
          title="物料尚未完全分配"
          type="warning"
          :closable="false"
          show-icon
        >
          <div v-for="item in startCheck.warnings" :key="item">{{ item }}</div>
        </el-alert>
        <el-descriptions :column="2" border class="start-check-summary">
          <el-descriptions-item label="物料需求">{{ startCheck.materialRequirementCount }} 项</el-descriptions-item>
          <el-descriptions-item label="未分配">{{ startCheck.unallocatedMaterialCount }} 项</el-descriptions-item>
          <el-descriptions-item label="工序数量">{{ startCheck.stepCount }} 道</el-descriptions-item>
          <el-descriptions-item label="未派工">{{ startCheck.unassignedStepCount }} 道</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="startCheckDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!startCheck?.canStart"
          :loading="submitting"
          @click="confirmStartTask"
        >
          确认开始生产
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="stepDialogVisible" title="编辑工序记录" :width="DialogWidth.md" class="business-dialog">
      <el-form class="dialog-form" label-width="108px" :model="stepForm">
        <el-form-item label="负责人">
          <el-select v-model="stepForm.responsibleUserId" clearable filterable placeholder="请选择负责人">
            <el-option v-for="user in userOptions" :key="user.id" :label="user.displayName" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考文件">
          <div class="file-cell">
            <el-select v-model="stepForm.sopFileId" clearable filterable placeholder="请选择参考文件">
              <el-option v-for="file in sopFileOptions" :key="file.id" :label="file.name" :value="file.id" />
            </el-select>
            <el-upload
              v-if="editingTaskId && editingStepId"
              :show-file-list="false"
              :before-upload="uploadEditingStepSopFile"
            >
              <el-button>上传</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="stepForm.status">
            <el-option v-for="item in stepStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="返工数量">
          <el-input-number v-model="stepForm.returnQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="产出数量">
          <el-input-number v-model="stepForm.outputQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="异常数量">
          <el-input-number v-model="stepForm.abnormalQuantity" :min="0" :precision="4" :step="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stepForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="stepDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitStep">保存工序记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox, type UploadRawFile } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  BatchStepRecordItem,
  BatchStepStatus,
  ProcessOption,
  ProcessRouteListItem,
  ProductionBatchItem,
  ProductionBatchStatus,
  ProductionTaskDetail,
  ProductionTaskStartCheck,
  TaskMaterialRequirementItem,
  SystemUserListItem,
  WorkOrderListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { productionApi } from '../../api/production';
import { systemApi } from '../../api/system';
import OrderProductSelect from '../../components/business/OrderProductSelect.vue';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

/** 生产任务状态字典：只表达批次执行阶段，物料和派工状态单独展示。 */
const taskStatusOptions: Array<{ value: ProductionBatchStatus; label: string; type: 'info' | 'primary' | 'success' | 'danger' }> = [
  { value: 'pending', label: '已生成批次', type: 'info' },
  { value: 'material_pending', label: '已生成物料需求', type: 'primary' },
  { value: 'material_assigned', label: '已分配物料批次', type: 'primary' },
  { value: 'doing', label: '执行中', type: 'primary' },
  { value: 'completed', label: '已完成', type: 'success' },
  { value: 'cancelled', label: '已取消', type: 'danger' },
];
/** 物料状态由需求、预留和实际出库数量实时汇总。 */
const materialStatusOptions = {
  missing_demand: { label: '未生成', type: 'info' },
  unallocated: { label: '未分配', type: 'info' },
  partial: { label: '部分分配', type: 'warning' },
  allocated: { label: '已分配', type: 'primary' },
  shortage: { label: '缺料', type: 'danger' },
  used: { label: '已出库', type: 'success' },
} as const;
/** 派工状态由批次工序总数和已指定负责人数量实时汇总。 */
const dispatchStatusOptions = {
  missing_steps: { label: '无工序', type: 'info' },
  unassigned: { label: '未派工', type: 'info' },
  partial: { label: '部分派工', type: 'warning' },
  assigned: { label: '已派工', type: 'success' },
} as const;
const stepStatusOptions: Array<{ value: BatchStepStatus; label: string }> = [
  { value: 'pending', label: '待开始' },
  { value: 'doing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'abnormal', label: '异常' },
  { value: 'skipped', label: '已跳过' },
];
const stepStatusLabels = Object.fromEntries(stepStatusOptions.map((item) => [item.value, item.label]));
type MaterialDemandFormRow = Omit<TaskMaterialRequirementItem, 'planQuantity'> & {
  planQuantity: string | number;
};

/** 任务列表及页面路由：物料分配操作跳转到独立的分块列表页。 */
const tasks = ref<ProductionBatchItem[]>([]);
const router = useRouter();
const routeOptions = ref<ProcessRouteListItem[]>([]);
const userOptions = ref<SystemUserListItem[]>([]);
const workOrderOptions = ref<WorkOrderListItem[]>([]);
const processOptions = ref<ProcessOption[]>([]);
const activeTask = ref<ProductionTaskDetail | null>(null);
const createPreviewSteps = ref<Array<BatchStepRecordItem & { responsibleUserId: string | null; sopFileId: string | null }>>([]);
const createPreviewMaterials = ref<MaterialDemandFormRow[]>([]);
const materialDemandTask = ref<ProductionBatchItem | null>(null);
const materialDemandPreviewRows = ref<TaskMaterialRequirementItem[]>([]);
const editingTaskId = ref<string | null>(null);
const editingTaskOriginalQuantity = ref(0);
const dispatchTaskId = ref<string | null>(null);
const editingStepId = ref<string | null>(null);
const loading = ref(false);
/** 工单远程检索加载状态，避免工单较多时一次性载入全部记录。 */
const workOrderLoading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const taskDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const dispatchDialogVisible = ref(false);
const materialDemandDialogVisible = ref(false);
const startCheckDialogVisible = ref(false);
const stepDialogVisible = ref(false);
const dispatchRows = ref<Array<BatchStepRecordItem & { responsibleUserId: string | null; sopFileId: string | null }>>([]);
/** 开始生产检查弹窗：保存当前任务及后端返回的阻断项、警告项。 */
const startCheckTaskId = ref<string | null>(null);
const startCheck = ref<ProductionTaskStartCheck | null>(null);

/** 任务列表查询条件。 */
const query = reactive({ keyword: '', productId: '', ownerId: '', status: '' });
/** 新增/编辑任务表单：工艺路线决定后续可派工的工序范围。 */
const taskForm = reactive({
  workOrderId: '',
  batchNo: '',
  routeId: '',
  ownerId: '',
  plannedQuantity: 1,
  planStartDate: '',
  planEndDate: '',
  remark: '',
});
const stepForm = reactive({
  responsibleUserId: '',
  sopFileId: '',
  status: 'pending' as BatchStepStatus,
  returnQuantity: 0,
  outputQuantity: 0,
  abnormalQuantity: 0,
  remark: '',
});

/**
 * 远程检索仍可分配生产数量的已下达/生产中工单。
 * 两种状态分别分页查询后按工单 ID 合并，避免只加载固定前 100 条导致后续工单无法选择。
 */
const searchWorkOrders = async (keyword: string) => {
  workOrderLoading.value = true;
  try {
    const normalizedKeyword = keyword.trim();
    const [releasedOrders, doingOrders] = await Promise.all([
      productionApi.listOrders({ page: 1, pageSize: 50, status: 'released', keyword: normalizedKeyword }),
      productionApi.listOrders({ page: 1, pageSize: 50, status: 'doing', keyword: normalizedKeyword }),
    ]);
    const selectedOrder = selectedWorkOrder.value;
    const orderMap = new Map<string, WorkOrderListItem>();

    // 当前已选工单始终保留，防止重新输入关键字时选择值在下拉选项中丢失。
    if (selectedOrder) {
      orderMap.set(selectedOrder.id, selectedOrder);
    }
    for (const order of [...releasedOrders.items, ...doingOrders.items]) {
      if (getWorkOrderRemaining(order) > 0) {
        orderMap.set(order.id, order);
      }
    }
    workOrderOptions.value = [...orderMap.values()];
  } catch (error) {
    EMessage.error(error instanceof Error ? error.message : '可选工单查询失败');
  } finally {
    workOrderLoading.value = false;
  }
};

const loadOptions = async () => {
  const [users, processes] = await Promise.all([
    systemApi.listUsers({ status: 'enabled' }),
    productApi.listProcessOptions(),
  ]);
  userOptions.value = users;
  processOptions.value = processes;
  await searchWorkOrders('');
};

const loadTasks = async () => {
  loading.value = true;
  try {
    const page = await productionApi.listTasks({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      productId: query.productId,
      ownerId: query.ownerId,
      status: query.status,
    });
    tasks.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await Promise.all([loadOptions(), loadTasks()]);
  } finally {
    loading.value = false;
  }
};

const selectedWorkOrder = computed(() => workOrderOptions.value.find((item) => item.id === taskForm.workOrderId) ?? null);
const availableWorkOrderOptions = computed(() =>
  workOrderOptions.value.filter((order) => getWorkOrderRemaining(order) > 0),
);
const selectedWorkOrderRemaining = computed(() => {
  if (!selectedWorkOrder.value) {
    return null;
  }

  return getWorkOrderRemaining(selectedWorkOrder.value);
});
const taskQuantityMax = computed(() => {
  if (selectedWorkOrderRemaining.value === null) {
    return null;
  }

  return editingTaskId.value
    ? selectedWorkOrderRemaining.value + editingTaskOriginalQuantity.value
    : selectedWorkOrderRemaining.value;
});
/** 当前产品可用路线由产品路线接口返回，包含默认路线和同分类的其他版本。 */
const availableRouteOptions = computed(() => routeOptions.value);
const sopFileOptions = computed(() => {
  const map = new Map<string, { id: string; name: string }>();

  for (const process of processOptions.value) {
    if (process.sopFileId && process.sopFileName) {
      map.set(process.sopFileId, { id: process.sopFileId, name: process.sopFileName });
    }
  }

  return [...map.values()];
});

const searchTasks = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const resetQuery = async () => {
  Object.assign(query, { keyword: '', productId: '', ownerId: '', status: '' });
  currentPage.value = 1;
  await loadTasks();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadTasks();
};

const resetTaskForm = () => {
  Object.assign(taskForm, {
    workOrderId: '',
    batchNo: '',
    routeId: '',
    ownerId: '',
    plannedQuantity: 1,
    planStartDate: '',
    planEndDate: '',
    remark: '',
  });
  createPreviewSteps.value = [];
  createPreviewMaterials.value = [];
};

const openCreate = () => {
  editingTaskId.value = null;
  editingTaskOriginalQuantity.value = 0;
  resetTaskForm();
  // 每次打开新增弹窗都刷新可选工单，避免其他操作已分配数量后仍显示旧数据。
  void searchWorkOrders('');
  taskDialogVisible.value = true;
};

const openEdit = (row: ProductionBatchItem) => {
  void openEditTask(row);
};

const openEditTask = async (row: ProductionBatchItem) => {
  editingTaskId.value = row.id;
  editingTaskOriginalQuantity.value = Number(row.plannedQuantity);
  Object.assign(taskForm, {
    workOrderId: row.workOrderId,
    batchNo: row.batchNo,
    routeId: row.routeId ?? '',
    ownerId: row.ownerId ?? '',
    plannedQuantity: Number(row.plannedQuantity),
    planStartDate: row.planStartDate ?? '',
    planEndDate: row.planEndDate ?? '',
    remark: row.remark ?? '',
  });
  taskDialogVisible.value = true;
  const [detail, productRoutes] = await Promise.all([
    productionApi.getTask(row.id),
    productApi.getProductRoutes(row.productId),
  ]);
  routeOptions.value = productRoutes.routes;
  activeTask.value = detail;
  createPreviewSteps.value = detail.steps.map((step) => ({
    ...step,
    responsibleUserId: step.responsibleUserId,
    sopFileId: step.sopFileId,
  }));
  await refreshCreatePreview({ keepSteps: true, keepMaterials: true });
  createPreviewMaterials.value = detail.materialRequirements.map((row) => ({
    ...row,
    planQuantity: row.planQuantity,
  }));
};

const handleTaskOrderChange = async (workOrderId: string) => {
  const order = workOrderOptions.value.find((item) => item.id === workOrderId);
  if (!order) {
    return;
  }

  // 工单不绑定路线；选择工单后加载产品可用路线，并默认带出产品默认路线。
  const productRoutes = await productApi.getProductRoutes(order.productId);
  routeOptions.value = productRoutes.routes;
  taskForm.routeId = productRoutes.defaultRouteId ?? '';
  taskForm.ownerId = order.ownerId ?? '';
  taskForm.planStartDate = order.planStartDate ?? '';
  taskForm.planEndDate = order.planEndDate ?? '';
  taskForm.plannedQuantity = getWorkOrderRemaining(order);

  if (taskForm.plannedQuantity <= 0) {
    createPreviewSteps.value = [];
    createPreviewMaterials.value = [];
    EMessage.warning('该工单已无可分配数量');
    return;
  }

  void refreshCreatePreview();
};

const refreshCreatePreview = async (options: { keepSteps?: boolean; keepMaterials?: boolean } = {}) => {
  if (!taskForm.workOrderId || !taskForm.routeId || taskForm.plannedQuantity <= 0) {
    if (!options.keepSteps) {
      createPreviewSteps.value = [];
    }
    if (!options.keepMaterials) {
      createPreviewMaterials.value = [];
    }
    return true;
  }

  try {
    const preview = await productionApi.previewCreateTask({
      workOrderId: taskForm.workOrderId,
      routeId: taskForm.routeId,
      plannedQuantity: taskForm.plannedQuantity,
    });
    if (!options.keepSteps) {
      createPreviewSteps.value = preview.steps.map((step) => ({
        ...step,
        responsibleUserId: step.responsibleUserId,
        sopFileId: step.sopFileId,
      }));
    }
    if (!options.keepMaterials) {
      createPreviewMaterials.value = preview.materialRequirements.map((row) => ({
        ...row,
        planQuantity: row.planQuantity,
      }));
    }
    return true;
  } catch (error) {
    if (!options.keepSteps) {
      createPreviewSteps.value = [];
    }
    if (!options.keepMaterials) {
      createPreviewMaterials.value = [];
    }
    EMessage.error(error, '任务预览失败');
    return false;
  }
};

const submitTask = async () => {
  if (taskForm.plannedQuantity <= 0 || (!editingTaskId.value && !taskForm.workOrderId)) {
    EMessage.warning('请选择所属工单并填写计划数量');
    return;
  }

  if (taskQuantityMax.value !== null && taskForm.plannedQuantity > taskQuantityMax.value) {
    EMessage.warning('计划数量不能超过工单剩余数量');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      routeId: taskForm.routeId || null,
      ownerId: taskForm.ownerId || null,
      plannedQuantity: taskForm.plannedQuantity,
      planStartDate: taskForm.planStartDate || null,
      planEndDate: taskForm.planEndDate || null,
      remark: taskForm.remark,
      steps: createPreviewSteps.value.map((row) => ({
        processRouteStepsId: row.processRouteStepsId,
        responsibleUserId: row.responsibleUserId,
        sopFileId: row.sopFileId,
      })),
    };

    if (editingTaskId.value) {
      await productionApi.updateTask(editingTaskId.value, payload);
      EMessage.success('任务已更新');
    } else {
      const previewReady = await refreshCreatePreview();
      if (!previewReady) {
        return;
      }

      await productionApi.createTask({
        ...payload,
        workOrderId: taskForm.workOrderId,
        batchNo: taskForm.batchNo || null,
      });
      EMessage.success('任务已新增');
    }

    taskDialogVisible.value = false;
    await loadTasks();
    await loadOptions();
  } finally {
    submitting.value = false;
  }
};

const openDetail = async (row: ProductionBatchItem) => {
  activeTask.value = await productionApi.getTask(row.id);
  detailDialogVisible.value = true;
};

const generateMaterials = async (row: ProductionBatchItem) => {
  materialDemandTask.value = row;
  materialDemandPreviewRows.value = await productionApi.previewTaskMaterialDemand(row.id);
  materialDemandDialogVisible.value = true;
};

const confirmGenerateMaterials = async () => {
  if (!materialDemandTask.value) {
    return;
  }

  submitting.value = true;
  try {
    const result = await productionApi.generateTaskMaterialDemand(materialDemandTask.value.id);
    activeTask.value = result.task;
    materialDemandPreviewRows.value = result.materials;
    EMessage.success('已生成 ' + result.materials.length + ' 条物料需求');
    materialDemandDialogVisible.value = false;
    await loadTasks();
  } finally {
    submitting.value = false;
  }
};

const openDispatch = async (row: ProductionBatchItem) => {
  const steps = await productionApi.previewTaskDispatch(row.id);
  dispatchTaskId.value = row.id;
  dispatchRows.value = steps.map((step) => ({ ...step, responsibleUserId: step.responsibleUserId }));
  dispatchDialogVisible.value = true;
};

const submitDispatch = async () => {
  if (!dispatchTaskId.value) {
    return;
  }

  submitting.value = true;
  try {
    await productionApi.dispatchTask(dispatchTaskId.value, {
      steps: dispatchRows.value.map((row) => ({
        processRouteStepsId: row.processRouteStepsId,
        responsibleUserId: row.responsibleUserId,
        sopFileId: row.sopFileId,
      })),
    });
    EMessage.success('派工已保存');
    dispatchDialogVisible.value = false;
    await loadTasks();
  } finally {
    submitting.value = false;
  }
};

/** 先读取后端开始前检查，弹窗展示阻断项和物料分配警告。 */
const startTask = async (row: ProductionBatchItem) => {
  startCheckTaskId.value = row.id;
  startCheck.value = await productionApi.previewTaskStart(row.id);
  startCheckDialogVisible.value = true;
};

/** 确认开始生产；后端会再次校验，避免绕过前端直接改变状态。 */
const confirmStartTask = async () => {
  if (!startCheckTaskId.value || !startCheck.value?.canStart) {
    return;
  }
  submitting.value = true;
  try {
    await productionApi.startTask(startCheckTaskId.value);
    EMessage.success('任务已开始');
    startCheckDialogVisible.value = false;
    await loadTasks();
  } finally {
    submitting.value = false;
  }
};

const finishTask = async (row: ProductionBatchItem) => {
  try {
    await ElMessageBox.confirm('确认完成该生产任务？', '完成任务', {
      confirmButtonText: '确认完成',
      cancelButtonText: '取消',
      type: 'info',
    });
  } catch {
    return;
  }

  await productionApi.finishTask(row.id);
  EMessage.success('任务已完成');
  await loadTasks();
};

const openStepEdit = (row: BatchStepRecordItem) => {
  if (!activeTask.value) {
    return;
  }

  editingTaskId.value = activeTask.value.id;
  editingStepId.value = row.id;
  Object.assign(stepForm, {
    responsibleUserId: row.responsibleUserId ?? '',
    sopFileId: row.sopFileId ?? '',
    status: row.status,
    returnQuantity: Number(row.returnQuantity ?? 0),
    outputQuantity: Number(row.outputQuantity ?? 0),
    abnormalQuantity: Number(row.abnormalQuantity ?? 0),
    remark: row.remark ?? '',
  });
  stepDialogVisible.value = true;
};

const submitStep = async () => {
  if (!editingTaskId.value || !editingStepId.value) {
    return;
  }

  submitting.value = true;
  try {
    activeTask.value = await productionApi.updateTaskStep(editingTaskId.value, editingStepId.value, {
      responsibleUserId: stepForm.responsibleUserId || null,
      sopFileId: stepForm.sopFileId || null,
      status: stepForm.status,
      returnQuantity: stepForm.returnQuantity,
      outputQuantity: stepForm.outputQuantity,
      abnormalQuantity: stepForm.abnormalQuantity,
      remark: stepForm.remark,
    });
    EMessage.success('工序记录已更新');
    stepDialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
};

const getTaskStatusMeta = (status: ProductionBatchStatus) => taskStatusOptions.find((item) => item.value === status) ?? taskStatusOptions[0];
const getMaterialStatusMeta = (status: ProductionBatchItem['materialStatus']) =>
  materialStatusOptions[status ?? 'missing_demand'];
const getDispatchStatusMeta = (status: ProductionBatchItem['dispatchStatus']) =>
  dispatchStatusOptions[status ?? 'missing_steps'];
const canConfigureTask = (row: ProductionBatchItem) =>
  !['doing', 'completed', 'cancelled'].includes(row.status);
const canStartTask = (row: ProductionBatchItem) =>
  ['pending', 'material_pending', 'material_assigned'].includes(row.status);
const openMaterialAllocation = () => router.push('/production/material-allocation');
const formatTaskProduct = (order: WorkOrderListItem) => `${order.productModel} / ${order.productName}`;
/** 路线名称附带版本号，确保同产品的不同工艺版本可明确选择。 */
const formatRoute = (route: ProcessRouteListItem) =>
  `${route.routeName}${route.version ? ` / ${route.version}` : ''}`;
const getWorkOrderRemaining = (order: WorkOrderListItem) => Math.max(Number(order.plannedQuantity) - Number(order.assignedQuantity), 0);
const formatWorkOrder = (order: WorkOrderListItem) =>
  [order.orderNo, order.productModel, '剩余 ' + formatQuantity(getWorkOrderRemaining(order))].join(' / ');
const formatQuantity = (value: string | number | null) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? amount.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
    : '-';
};

const canUploadStepFile = (row: BatchStepRecordItem) => Boolean(editingTaskId.value && row.batchId !== '0');
const createStepSopUploadHandler = (row: BatchStepRecordItem & { sopFileId: string | null }) =>
  (file: UploadRawFile) => uploadStepSopFile(file, row);
const uploadStepSopFile = (file: UploadRawFile, row: BatchStepRecordItem & { sopFileId: string | null }) => {
  if (!editingTaskId.value || !canUploadStepFile(row)) {
    return false;
  }

  void (async () => {
    const formData = new FormData();
    formData.append('file', file);
    const task = await productionApi.uploadTaskStepSop(editingTaskId.value!, row.id, formData);
    const updated = task.steps.find((step) => step.id === row.id);

    if (updated) {
      row.sopFileId = updated.sopFileId;
    }

    activeTask.value = task;
    EMessage.success('实际参考文件已上传');
  })();

  return false;
};
const uploadEditingStepSopFile = (file: UploadRawFile) => {
  if (!editingTaskId.value || !editingStepId.value) {
    return false;
  }

  void (async () => {
    const formData = new FormData();
    formData.append('file', file);
    activeTask.value = await productionApi.uploadTaskStepSop(editingTaskId.value!, editingStepId.value!, formData);
    const updated = activeTask.value.steps.find((step) => step.id === editingStepId.value);
    stepForm.sopFileId = updated?.sopFileId ?? '';
    EMessage.success('实际参考文件已上传');
  })();

  return false;
};
const getSopFileName = (fileId: string | null) => {
  if (!fileId) {
    return '-';
  }

  return sopFileOptions.value.find((file) => file.id === fileId)?.name ?? `文件 #${fileId}`;
};

onMounted(loadPageData);
</script>

<style scoped>
.tasks-page {
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

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title,
.batch-no,
.product-name {
  color: #1f2937;
  font-weight: 600;
}

.tasks-table,
.detail-table {
  width: 100%;
}

.tasks-table :deep(.el-table__header th),
.detail-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.sub-text {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
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

.dialog-form :deep(.el-input),
.dialog-form :deep(.el-select),
.dialog-form :deep(.el-date-editor),
.dialog-form :deep(.el-input-number),
.dialog-form :deep(.el-textarea) {
  width: 100%;
}

.detail-tabs {
  margin-top: 18px;
}

.file-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-cell :deep(.el-select) {
  flex: 1;
}

.business-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}

@media (max-width: 1120px) {
  .query-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }

  .query-actions {
    margin-left: 0;
  }
}
</style>
