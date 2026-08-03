<template>
  <div class="product-categories-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="属性、类型或备注" @keyup.enter="searchCategories" />
        </el-form-item>
        <el-form-item label="产品属性">
          <el-select v-model="query.productAttribute" clearable placeholder="请选择产品属性">
            <el-option
              v-for="option in productAttributeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
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
        <el-table-column label="产品属性" min-width="140">
          <template #default="{ row }">{{ getProductAttributeLabel(row.productAttribute) }}</template>
        </el-table-column>
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

      <TablePagination v-model:page="currentPage" v-model:page-size="pageSize" :total="total" @change="loadCategories" />
    </section>

    <el-dialog
      v-model="categoryDialogVisible"
      :title="editingCategoryId ? '编辑分类' : '新增分类'"
      :width="DialogWidth.md"
    >
      <el-form class="dialog-form" label-width="96px" :model="categoryForm">
        <el-form-item label="产品属性" required>
          <el-select v-model="categoryForm.productAttribute" placeholder="请选择产品属性">
            <el-option
              v-for="option in productAttributeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
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

    <el-dialog v-model="detailDialogVisible" title="分类详情" :width="DialogWidth.md">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="产品属性">
          {{ getProductAttributeLabel(detailRow.productAttribute) }}
        </el-descriptions-item>
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
import { ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import {
  PRODUCT_ATTRIBUTE_LABELS,
  type ProductAttribute,
  type ProductCategoryListItem,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';
import TablePagination from '../../components/common/TablePagination.vue';

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
/** 产品属性下拉选项：值提交给接口，中文标签仅用于页面展示。 */
const productAttributeOptions: Array<{ value: ProductAttribute; label: string }> = [
  { value: 'finished', label: PRODUCT_ATTRIBUTE_LABELS.finished },
  { value: 'semi_finished', label: PRODUCT_ATTRIBUTE_LABELS.semi_finished },
  { value: 'material', label: PRODUCT_ATTRIBUTE_LABELS.material },
  { value: 'auxiliary', label: PRODUCT_ATTRIBUTE_LABELS.auxiliary },
  { value: 'other', label: PRODUCT_ATTRIBUTE_LABELS.other },
];
/** 将接口枚举值转换为页面中文标签。 */
const getProductAttributeLabel = (value: ProductAttribute) =>
  PRODUCT_ATTRIBUTE_LABELS[value] ?? value;
const query = reactive({
  keyword: '',
  productAttribute: '' as ProductAttribute | '',
  productType: '',
  status: '',
});
const categoryForm = reactive({
  productAttribute: '' as ProductAttribute | '',
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
      keyword: query.keyword,
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
  query.keyword = '';
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
    EMessage.warning('请填写产品属性和产品类型');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      productAttribute: categoryForm.productAttribute as ProductAttribute,
      productType: categoryForm.productType,
      status: categoryForm.enabled ? 1 : 0,
      remark: categoryForm.remark,
    };

    if (editingCategoryId.value) {
      await productApi.updateCategory(editingCategoryId.value, payload);
      EMessage.success('分类已更新');
    } else {
      await productApi.createCategory(payload);
      EMessage.success('分类已新增');
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
  EMessage.success(`分类已${actionText}`);
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
