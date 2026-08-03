<template>
  <div class="table-pagination">
    <span class="table-pagination__total">共 {{ total }} 条</span>
    <el-pagination
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      layout="sizes, prev, pager, next"
      background
      @current-change="changePage"
      @size-change="changePageSize"
    />
    <span v-if="showJumper" class="table-pagination__jumper">
      前往
      <el-input
        v-model="jumpPage"
        class="table-pagination__jump-input"
        inputmode="numeric"
        @keyup.enter="commitJump"
        @blur="commitJump"
      />
      页
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

/** 所有管理列表共用的后端分页参数。 */
const props = withDefaults(
  defineProps<{
    page: number;
    pageSize: number;
    total: number;
    pageSizes?: number[];
    showJumper?: boolean;
  }>(),
  {
    pageSizes: () => [10, 20, 50, 100],
    showJumper: true,
  },
);

const emit = defineEmits<{
  'update:page': [value: number];
  'update:pageSize': [value: number];
  change: [];
}>();

/** 跳页输入值：由组件固定渲染中文“前往…页”，不依赖第三方语言包。 */
const jumpPage = ref(String(props.page));

watch(
  () => props.page,
  (page) => {
    jumpPage.value = String(page);
  },
);

/** 切换页码后通知列表重新请求后端。 */
const changePage = (page: number) => {
  emit('update:page', page);
  emit('change');
};

/** 切换每页数量时回到第一页，防止当前页超过新的最大页数。 */
const changePageSize = (pageSize: number) => {
  emit('update:pageSize', pageSize);
  emit('update:page', 1);
  emit('change');
};

/** 校验并提交跳页；超出范围时自动收敛到有效页码。 */
const commitJump = () => {
  const maxPage = Math.max(1, Math.ceil(props.total / props.pageSize));
  const parsedPage = Number(jumpPage.value);
  const nextPage = Number.isInteger(parsedPage)
    ? Math.min(Math.max(parsedPage, 1), maxPage)
    : props.page;
  jumpPage.value = String(nextPage);
  if (nextPage !== props.page) {
    changePage(nextPage);
  }
};
</script>

<style scoped>
.table-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-height: 64px;
  padding: 12px 20px;
}

.table-pagination__total {
  color: #303846;
  font-size: 14px;
  white-space: nowrap;
}

.table-pagination__jumper {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.table-pagination__jump-input {
  width: 52px;
}

.table-pagination__jump-input :deep(.el-input__inner) {
  text-align: center;
}

@media (max-width: 720px) {
  .table-pagination {
    justify-content: flex-start;
    padding-inline: 12px;
  }

  .table-pagination :deep(.el-pagination) {
    flex-wrap: wrap;
  }
}
</style>
