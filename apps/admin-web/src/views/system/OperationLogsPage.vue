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
        <el-input v-model="query.module" clearable placeholder="auth / production-batches" />
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
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="loadLogs">查询</el-button>
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
      <el-table-column prop="ip" label="IP" min-width="140" />
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="时间" min-width="180" />
      <el-table-column label="详情" width="90" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" @click="openDetail(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

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
        <el-descriptions-item label="备注">{{ activeLog.remark }}</el-descriptions-item>
      </el-descriptions>
      <h2>返回数据</h2>
      <pre>{{ JSON.stringify(activeLog?.afterData, null, 2) }}</pre>
      <h2>变更前数据</h2>
      <pre>{{ JSON.stringify(activeLog?.beforeData, null, 2) }}</pre>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { OperationLogListItem } from '@company/api-contract';
import { systemApi } from '../../api/system';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

/** 日志列表和筛选条件保持在页面级，详情仅通过 Modal 查看。 */
const loading = ref(false);
const detailVisible = ref(false);
const logs = ref<OperationLogListItem[]>([]);
const activeLog = ref<OperationLogListItem | null>(null);
const query = reactive({
  keyword: '',
  logType: '',
  module: '',
  result: '',
  userId: '',
});

const loadLogs = async () => {
  loading.value = true;
  try {
    logs.value = await systemApi.listOperationLogs({
      keyword: query.keyword || undefined,
      logType: query.logType || undefined,
      module: query.module || undefined,
      result: query.result || undefined,
      userId: query.userId || undefined,
    });
  } catch (error) {
    EMessage.error(error, '日志加载失败');
  } finally {
    loading.value = false;
  }
};

const resetQuery = async () => {
  Object.assign(query, {
    keyword: '',
    logType: '',
    module: '',
    result: '',
    userId: '',
  });
  await loadLogs();
};

const openDetail = (row: OperationLogListItem) => {
  activeLog.value = row;
  detailVisible.value = true;
};

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
