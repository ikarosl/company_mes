<template>
  <div class="table-pagination">
    <span class="table-pagination__total">共 {{ total }} 条</span>
    <el-pagination
      :current-page="page"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :total="total"
      :layout="showJumper ? 'sizes, prev, pager, next, jumper' : 'sizes, prev, pager, next'"
      background
      @current-change="changePage"
      @size-change="changePageSize"
    />
  </div>
</template>

<script setup lang="ts">
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
  change: [value: { page: number; pageSize: number }];
}>();

/** 切换页码后通知列表重新请求后端。 */
const changePage = (page: number) => {
  emit('update:page', page);
  emit('change', { page, pageSize: props.pageSize });
};

/** 切换每页数量时回到第一页，防止当前页超过新的最大页数。 */
const changePageSize = (pageSize: number) => {
  emit('update:pageSize', pageSize);
  emit('update:page', 1);
  emit('change', { page: 1, pageSize });
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
