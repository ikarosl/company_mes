<template>
  <section class="planned-page">
    <div class="page-heading">
      <p class="section-name">{{ section }}</p>
      <h1>{{ title }}</h1>
      <!-- <p>{{ description }}</p> -->
    </div>

    <el-card shadow="never" class="planned-card">
      <template #header>
        <div class="card-header">
          <span>页面预留</span>
          <el-tag type="info" effect="plain">接口待实现</el-tag>
        </div>
      </template>

      <el-empty :description="description">
        <template v-if="operations.length" #default>
          <div class="operations">
            <el-tag v-for="operation in operations" :key="operation" effect="plain">
              {{ operation }}
            </el-tag>
          </div>
        </template>
      </el-empty>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const title = computed(() => String(route.meta.title ?? '规划页面'));
const section = computed(() => String(route.meta.section ?? '业务模块'));
const description = computed(() =>
  String(route.meta.description ?? '页面结构已预留，后续根据接口实现补充表格、表单和操作流程。'),
);
const operations = computed(() => {
  const value = route.meta.operations;
  return Array.isArray(value) ? value.map(String) : [];
});
</script>

<style scoped>
.planned-page {
  display: grid;
  gap: 16px;
}

.page-heading {
  display: grid;
  gap: 6px;
}

.page-heading h1 {
  margin: 0;
  color: #1f2d3d;
  font-size: 22px;
}

.page-heading p {
  margin: 0;
  color: #606266;
}

.section-name {
  color: #409eff;
  font-size: 13px;
  font-weight: 600;
}

.planned-card {
  border-radius: 6px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.operations {
  display: flex;
  max-width: 760px;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
</style>
