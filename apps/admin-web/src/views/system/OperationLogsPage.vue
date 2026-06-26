<template>
  <section class="page-panel">
    <div class="page-toolbar">
      <div>
        <h1>日志审计</h1>
        <p>查看登录、业务操作、状态变更和异常记录。</p>
      </div>
      <el-button :loading="loading" @click="loadLogs">刷新</el-button>
    </div>

    <el-form class="query-bar" :inline="true" :model="query">
      <el-form-item label="关键字">
        <el-input v-model="query.keyword" clearable placeholder="模块、动作、用户、对象、IP或备注" />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.logType" clearable placeholder="全部" style="width: 130px">
          <el-option label="认证" value="auth" />
          <el-option label="操作" value="operation" />
        </el-select>
      </el-form-item>
      <el-form-item label="模块">
        <el-select v-model="query.module" clearable filterable placeholder="请选择模块" style="width: 170px">
          <el-option
            v-for="item in operationLogModuleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="query.result" clearable placeholder="全部" style="width: 130px">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="用户ID">
        <el-input v-model="query.userId" clearable />
      </el-form-item>
      <el-form-item label="请求ID">
        <el-input v-model="query.requestId" clearable />
      </el-form-item>
      <el-form-item label="对象类型">
        <el-input v-model="query.targetType" clearable placeholder="work_order / user" />
      </el-form-item>
      <el-form-item label="对象ID">
        <el-input v-model="query.targetId" clearable />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="query.createdAtRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="searchLogs">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="logs" border>
      <el-table-column prop="id" label="ID" width="90" />
      <el-table-column prop="logType" label="类型" width="100" />
      <el-table-column prop="module" label="模块" min-width="150" />
      <el-table-column prop="action" label="动作" min-width="220" show-overflow-tooltip />
      <el-table-column label="用户" min-width="130">
        <template #default="{ row }">
          {{ row.username ?? row.userId ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="targetType" label="对象" min-width="130" />
      <el-table-column prop="targetId" label="对象ID" width="100" />
      <el-table-column label="结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.result === 'success' ? 'success' : 'danger'">
            {{ row.result }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="httpStatus" label="状态码" width="90" />
      <el-table-column prop="durationMs" label="耗时(ms)" width="100" />
      <el-table-column prop="ip" label="IP" min-width="140" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" min-width="180" />
      <el-table-column label="详情" width="90" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-footer">
      <span class="total-text">共 {{ total }} 条</span>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next, jumper"
        @current-change="loadLogs"
      />
    </div>

    <el-dialog v-model="detailVisible" title="日志详情" :width="DialogWidth.lg">
      <el-descriptions v-if="activeLog" border :column="1" class="detail-block">
        <el-descriptions-item label="动作">{{ activeLog.action }}</el-descriptions-item>
        <el-descriptions-item label="用户">{{
          activeLog.username ?? activeLog.userId
        }}</el-descriptions-item>
        <el-descriptions-item label="对象"
          >{{ activeLog.targetType }} / {{ activeLog.targetId }}</el-descriptions-item
        >
        <el-descriptions-item label="结果">{{ activeLog.result }}</el-descriptions-item>
        <el-descriptions-item label="请求ID">{{ activeLog.requestId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求">
          {{ activeLog.httpMethod || '-' }} {{ activeLog.route || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态 / 耗时">
          {{ activeLog.httpStatus ?? '-' }} / {{ activeLog.durationMs ?? '-' }}ms
        </el-descriptions-item>
        <el-descriptions-item label="关联对象">
          {{ JSON.stringify(activeLog.targetIds) }}
        </el-descriptions-item>
        <el-descriptions-item label="错误代码">{{
          activeLog.errorCode || '-'
        }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ activeLog.remark }}</el-descriptions-item>
      </el-descriptions>
      <h2>请求数据</h2>
      <pre>{{ JSON.stringify(activeLog?.requestData, null, 2) }}</pre>
      <h2>变更前数据</h2>
      <pre>{{ JSON.stringify(activeLog?.beforeData, null, 2) }}</pre>
      <h2>字段差异</h2>
      <pre>{{ JSON.stringify(activeDiff, null, 2) }}</pre>
      <h2>返回 / 变更后数据</h2>
      <pre>{{ JSON.stringify(activeLog?.afterData, null, 2) }}</pre>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { OPERATION_LOG_MODULE_OPTIONS, type OperationLogListItem } from '@company/api-contract';
import { systemApi } from '../../api/system';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

/** 日志列表和筛选条件保持在页面级，详情仅通过 Modal 查看。 */
const loading = ref(false);
const detailVisible = ref(false);
const logs = ref<OperationLogListItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = 10;
const activeLog = ref<OperationLogListItem | null>(null);
const activeDiff = computed(() =>
  buildDiff(activeLog.value?.beforeData, activeLog.value?.afterData),
);

/** 模块筛选项：固定使用后端审计 module 枚举，避免人工输入造成查不到数据。 */
const operationLogModuleOptions = OPERATION_LOG_MODULE_OPTIONS;

/** 查询条件：提交接口前会补充分页参数，并将空字符串转换为 undefined。 */
const query = reactive({
  keyword: '',
  logType: '',
  module: '',
  result: '',
  userId: '',
  requestId: '',
  targetType: '',
  targetId: '',
  createdAtRange: [] as string[],
});

/** 拉取日志分页数据：后端按 page/pageSize 返回当前页列表和总数。 */
const loadLogs = async () => {
  loading.value = true;
  try {
    const page = await systemApi.listOperationLogs({
      page: currentPage.value,
      pageSize,
      keyword: query.keyword || undefined,
      logType: query.logType || undefined,
      module: query.module || undefined,
      result: query.result || undefined,
      userId: query.userId || undefined,
      requestId: query.requestId || undefined,
      targetType: query.targetType || undefined,
      targetId: query.targetId || undefined,
      startedAt: query.createdAtRange[0] || undefined,
      endedAt: query.createdAtRange[1] || undefined,
    });
    logs.value = page.items;
    total.value = page.total;
  } catch (error) {
    EMessage.error(error, '日志加载失败');
  } finally {
    loading.value = false;
  }
};

/** 查询按钮：从第一页重新加载，避免当前页超出筛选后的结果范围。 */
const searchLogs = async () => {
  currentPage.value = 1;
  await loadLogs();
};

/** 重置全部搜索条件，并恢复第一页的 10 条分页查询。 */
const resetQuery = async () => {
  Object.assign(query, {
    keyword: '',
    logType: '',
    module: '',
    result: '',
    userId: '',
    requestId: '',
    targetType: '',
    targetId: '',
    createdAtRange: [],
  });
  currentPage.value = 1;
  await loadLogs();
};

/** 打开详情弹窗：展示请求数据、变更前后快照和字段差异。 */
const openDetail = (row: OperationLogListItem) => {
  activeLog.value = row;
  detailVisible.value = true;
};

/** 构造字段差异：仅比较一层字段，方便管理员快速定位本次变更内容。 */
const buildDiff = (before: unknown, after: unknown) => {
  if (!isRecord(before) || !isRecord(after)) {
    return null;
  }

  const diff: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { before: before[key], after: after[key] };
    }
  }
  return diff;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

onMounted(loadLogs);
</script>

<style scoped>
.page-panel {
  min-height: calc(100vh - 108px);
  padding: 24px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #ffffff;
}

.page-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.page-toolbar h1 {
  margin: 0 0 6px;
  color: #1f2d3d;
  font-size: 22px;
}

.page-toolbar p {
  margin: 0;
  color: #606266;
}

.query-bar {
  margin-bottom: 10px;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
}

.total-text {
  color: #606266;
  font-size: 13px;
}

.detail-block {
  margin-bottom: 18px;
}

h2 {
  margin: 18px 0 8px;
  font-size: 15px;
}

pre {
  max-height: 260px;
  overflow: auto;
  padding: 12px;
  border-radius: 6px;
  background: #f5f7fb;
  font-size: 12px;
}
</style>
