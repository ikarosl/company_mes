<template>
  <div class="product-categories-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="产品属性">
          <el-input v-model="query.productAttribute" clearable placeholder="请输入产品属性" />
        </el-form-item>
        <el-form-item label="产品类型">
          <el-input v-model="query.productType" clearable placeholder="请输入产品类型" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchCategories">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增分类</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadCategories" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="categories" class="category-table">
        <el-table-column prop="productAttribute" label="产品属性" min-width="140" />
        <el-table-column prop="productType" label="产品类型" min-width="160" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="180">
          <template #default="{ row }">{{ formatTime(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
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
          @current-change="loadCategories"
        />
      </div>
    </section>

    <el-dialog
      v-model="categoryDialogVisible"
      :title="editingCategoryId ? '编辑分类' : '新增分类'"
      width="640px"
    >
      <el-form class="dialog-form" label-width="96px" :model="categoryForm">
        <el-form-item label="产品属性" required>
          <el-input v-model="categoryForm.productAttribute" placeholder="例如：成品、半成品、外购件" />
        </el-form-item>
        <el-form-item label="产品类型" required>
          <el-input v-model="categoryForm.productType" placeholder="例如：环形器、PCB、腔体" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-switch v-model="categoryForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="categoryForm.remark"
            type="textarea"
            :rows="3"
            placeholder="可填写分类说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCategory">保存分类</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="分类详情" width="640px">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="产品属性">{{ detailRow.productAttribute }}</el-descriptions-item>
        <el-descriptions-item label="产品类型">{{ detailRow.productType }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ detailRow.status === 1 ? '启用' : '停用' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(detailRow.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type { ProductCategoryListItem } from '@company/api-contract';
import { productApi } from '../../api/product';

const categories = ref<ProductCategoryListItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const categoryDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const editingCategoryId = ref<string | null>(null);
const detailRow = ref<ProductCategoryListItem | null>(null);
const query = reactive({
  productAttribute: '',
  productType: '',
  status: '',
});
const categoryForm = reactive({
  productAttribute: '',
  productType: '',
  enabled: true,
  remark: '',
});

const loadCategories = async () => {
  loading.value = true;
  try {
    const page = await productApi.listCategories({
      page: currentPage.value,
      pageSize: pageSize.value,
      productAttribute: query.productAttribute,
      productType: query.productType,
      status: query.status,
    });
    categories.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const searchCategories = async () => {
  currentPage.value = 1;
  await loadCategories();
};

const resetQuery = async () => {
  query.productAttribute = '';
  query.productType = '';
  query.status = '';
  currentPage.value = 1;
  await loadCategories();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadCategories();
};

const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    productAttribute: '',
    productType: '',
    enabled: true,
    remark: '',
  });
};

const openCreate = () => {
  editingCategoryId.value = null;
  resetCategoryForm();
  categoryDialogVisible.value = true;
};

const openEdit = (row: ProductCategoryListItem) => {
  editingCategoryId.value = row.id;
  Object.assign(categoryForm, {
    productAttribute: row.productAttribute,
    productType: row.productType,
    enabled: row.status === 1,
    remark: row.remark ?? '',
  });
  categoryDialogVisible.value = true;
};

const openDetail = (row: ProductCategoryListItem) => {
  detailRow.value = row;
  detailDialogVisible.value = true;
};

const submitCategory = async () => {
  if (!categoryForm.productAttribute.trim() || !categoryForm.productType.trim()) {
    ElMessage.warning('请填写产品属性和产品类型');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      productAttribute: categoryForm.productAttribute,
      productType: categoryForm.productType,
      status: categoryForm.enabled ? 1 : 0,
      remark: categoryForm.remark,
    };

    if (editingCategoryId.value) {
      await productApi.updateCategory(editingCategoryId.value, payload);
      ElMessage.success('分类已更新');
    } else {
      await productApi.createCategory(payload);
      ElMessage.success('分类已新增');
    }

    categoryDialogVisible.value = false;
    await loadCategories();
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: ProductCategoryListItem) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionText = nextStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认${actionText}该产品分类？`, `${actionText}分类`, {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: nextStatus === 1 ? 'info' : 'warning',
    });
  } catch {
    return;
  }

  await productApi.changeCategoryStatus(row.id, nextStatus);
  ElMessage.success(`分类已${actionText}`);
  await loadCategories();
};

const formatTime = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 19);
};

onMounted(loadCategories);
</script>

<style scoped>
.product-categories-page {
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
  gap: 12px 24px;
}

.query-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 16px;
}

.query-form :deep(.el-input) {
  width: 180px;
}

.query-form :deep(.el-select) {
  width: 140px;
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

.category-table {
  width: 100%;
}

.category-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.category-table :deep(.el-table__row) {
  height: 56px;
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
.dialog-form :deep(.el-textarea) {
  width: 100%;
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
