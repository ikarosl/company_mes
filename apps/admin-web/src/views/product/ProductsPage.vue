<template>
  <div class="products-page">
    <section class="query-panel">
      <el-form class="query-form" :inline="true" :model="query">
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="型号或名称" />
        </el-form-item>
        <el-form-item label="产品分类">
          <el-select v-model="query.categoryId" clearable placeholder="全部">
            <el-option
              v-for="category in categoryOptions"
              :key="category.id"
              :label="formatCategory(category)"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="获取方式">
          <el-select v-model="query.acquireMethod" clearable placeholder="全部">
            <el-option label="自制" value="self_made" />
            <el-option label="委外" value="outsourced" />
            <el-option label="外购" value="purchased" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="启用" value="enabled" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item class="query-actions">
          <el-button type="primary" :loading="loading" @click="searchProducts">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </section>

    <section class="table-panel">
      <div class="table-toolbar">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增产品</el-button>
        <el-tooltip content="刷新" placement="top">
          <el-button :icon="Refresh" text circle :loading="loading" @click="loadProducts" />
        </el-tooltip>
      </div>

      <el-table v-loading="loading" :data="products" class="product-table">
        <el-table-column label="产品型号" min-width="170">
          <template #default="{ row }">
            <span class="product-model">{{ row.productModel }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="产品名称" min-width="160" />
        <el-table-column label="属性" width="100">
          <template #default="{ row }">{{ row.productAttribute || '-' }}</template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">{{ row.productType || '-' }}</template>
        </el-table-column>
        <el-table-column label="规格参数" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ formatSpecSummary(row.specValues) }}</template>
        </el-table-column>
        <el-table-column label="物料清单" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.acquireMethod !=='self_made'" type="info" effect="light">无</el-tag>
            <el-tag v-else-if="row.materialCount > 0" type="success" effect="light">
              {{ row.materialCount }} 项
            </el-tag>
            <el-tag v-else type="warning" effect="light">未配置</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="获取方式" width="110">
          <template #default="{ row }">{{ getAcquireMethodLabel(row.acquireMethod) }}</template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="90" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="light">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link v-if="row.acquireMethod ==='self_made'" :type="row.materialCount > 0 ? 'primary' : 'warning'" @click="openMaterials(row)" > 
              物料清单
            </el-button>
            <el-button link type="primary" @click="showInventory(row)">库存</el-button>
            <el-button link type="primary" @click="showRoutes(row)">工艺路线</el-button>
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
          :current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next, jumper"
          @current-change="loadProducts"
        />
      </div>
    </section>

    <el-dialog
      v-model="productDialogVisible"
      :title="editingProductId ? '编辑产品' : '新增产品'"
      :width="DialogWidth.lg"
    >
      <el-form class="dialog-form" label-width="104px" :model="productForm">
        <div class="form-section-title">基础信息</div>
        <div class="form-grid">
          <el-form-item label="产品型号" required>
            <el-input v-model="productForm.productModel" placeholder="请输入产品型号" />
          </el-form-item>
          <el-form-item label="产品名称" required>
            <el-input v-model="productForm.productName" placeholder="请输入产品名称" />
          </el-form-item>
          <el-form-item label="产品分类" required>
            <el-select v-model="productForm.categoryId" placeholder="请选择产品分类">
              <el-option
                v-for="category in categoryOptions"
                :key="category.id"
                :label="formatCategory(category)"
                :value="category.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="单位" required>
            <el-input v-model="productForm.unit" placeholder="pcs" />
          </el-form-item>
          <el-form-item label="获取方式" required>
            <el-select v-model="productForm.acquireMethod">
              <el-option label="自制" value="self_made" />
              <el-option label="委外" value="outsourced" />
              <el-option label="外购" value="purchased" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" required>
            <el-switch v-model="productForm.enabled" active-text="启用" inactive-text="停用" />
          </el-form-item>
        </div>

        <div class="form-section-title">规格参数</div>
        <div class="spec-toolbar">
          <el-button type="primary" :icon="Plus" @click="addSpecRow">新增参数</el-button>
        </div>
        <el-table :data="productForm.specValues" class="spec-table">
          <el-table-column label="参数名称" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.key" placeholder="例如：频率范围" />
            </template>
          </el-table-column>
          <el-table-column label="参数值" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.value" placeholder="例如：6-18" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="130">
            <template #default="{ row }">
              <el-input v-model="row.unit" placeholder="GHz" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" @click="removeSpecRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="form-section-title">备注说明</div>
        <el-form-item label="备注">
          <el-input
            v-model="productForm.remark"
            type="textarea"
            :rows="3"
            placeholder="可填写产品说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="productDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitProduct">保存产品</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="产品详情" :width="DialogWidth.lg">
      <el-descriptions v-if="detailRow" :column="2" border>
        <el-descriptions-item label="产品型号">{{ detailRow.productModel }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ detailRow.productName }}</el-descriptions-item>
        <el-descriptions-item label="产品属性">{{ detailRow.productAttribute || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品类型">{{ detailRow.productType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="获取方式">
          {{ getAcquireMethodLabel(detailRow.acquireMethod) }}
        </el-descriptions-item>
        <el-descriptions-item label="单位">{{ detailRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="物料清单">
          {{ detailRow.materialCount > 0 ? `${detailRow.materialCount} 项` : '未配置' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          {{ detailRow.status === 1 ? '启用' : '停用' }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(detailRow.updatedAt) }}</el-descriptions-item>
        <el-descriptions-item label="规格参数" :span="2">
          <div v-if="detailRow.specValues.length" class="spec-tags">
            <el-tag v-for="item in detailRow.specValues" :key="item.key" effect="plain">
              {{ formatSpecItem(item) }}
            </el-tag>
          </div>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="materialDialogVisible" title="配置产品物料清单" :width="DialogWidth.xl">
      <template v-if="materialProduct">
        <el-alert
          v-if="!materialRows.length"
          title="当前产品尚未配置物料清单。生产任务生成物料需求前，需要先维护这里的用料。"
          type="warning"
          :closable="false"
          show-icon
          class="bom-alert"
        />
        <div class="bom-header">
          <div>
            <span class="product-model">{{ materialProduct.productModel }}</span>
            <span class="sub-text">{{ materialProduct.productName }}</span>
          </div>
          <div class="bom-actions">
            <el-button :icon="Refresh" @click="refreshMaterialOptions">刷新物料</el-button>
            <el-button :icon="Plus" @click="openCreateMaterialProduct">新建物料信息</el-button>
            <el-button type="primary" :icon="Plus" @click="addMaterialRow">添加已有物料</el-button>
          </div>
        </div>
        <el-table :data="materialRows" class="material-table">
          <el-table-column label="物料" min-width="260">
            <template #default="{ row }">
              <el-select v-model="row.materialProductId" filterable placeholder="请选择物料" @change="fillMaterialUnit(row)">
                <el-option
                  v-for="item in materialOptions"
                  :key="item.id"
                  :label="formatProductOption(item)"
                  :value="item.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="单位" width="120">
            <template #default="{ row }">
              <el-input v-model="row.unit" placeholder="pcs" />
            </template>
          </el-table-column>
          <el-table-column label="单位用量" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.quantityPerUnit"
                :min="0.0001"
                :precision="4"
                :step="1"
                controls-position="right"
              />
            </template>
          </el-table-column>
          <el-table-column label="关键物料" width="110" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.isKeyMaterial" />
            </template>
          </el-table-column>
          <el-table-column label="记录批次" width="110" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.needBatchRecord" />
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.remark" placeholder="可选" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" @click="removeMaterialRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
      <template #footer>
        <el-button @click="materialDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitMaterials">保存物料清单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import type {
  ProductAcquireMethod,
  ProductCategoryListItem,
  ProductListItem,
  ProductMaterialItem,
  ProductSpecValue,
} from '@company/api-contract';
import { productApi } from '../../api/product';
import { DialogWidth } from '../../utils/dialog';
import { EMessage } from '../../utils/message';

type SpecFormRow = {
  key: string;
  value: string;
  unit: string;
};

type MaterialFormRow = {
  id?: string;
  materialProductId: string;
  quantityPerUnit: number;
  unit: string;
  isKeyMaterial: boolean;
  needBatchRecord: boolean;
  remark: string;
};

const acquireMethodLabels: Record<ProductAcquireMethod, string> = {
  self_made: '自制',
  outsourced: '委外',
  purchased: '外购',
};

const products = ref<ProductListItem[]>([]);
const categoryOptions = ref<ProductCategoryListItem[]>([]);
const materialOptions = ref<ProductListItem[]>([]);
const loading = ref(false);
const submitting = ref(false);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const productDialogVisible = ref(false);
const detailDialogVisible = ref(false);
const materialDialogVisible = ref(false);
const editingProductId = ref<string | null>(null);
const detailRow = ref<ProductListItem | null>(null);
const materialProduct = ref<ProductListItem | null>(null);
const materialRows = ref<MaterialFormRow[]>([]);
const creatingMaterialFromBom = ref(false);
const query = reactive({
  keyword: '',
  categoryId: '',
  acquireMethod: '',
  status: '',
});
const productForm = reactive({
  productModel: '',
  productName: '',
  categoryId: '',
  unit: 'pcs',
  acquireMethod: 'self_made' as ProductAcquireMethod,
  enabled: true,
  remark: '',
  specValues: [] as SpecFormRow[],
});

const loadCategoryOptions = async () => {
  const page = await productApi.listCategories({ page: 1, pageSize: 100, status: 'enabled' });
  categoryOptions.value = page.items;
};

const loadProducts = async () => {
  loading.value = true;
  try {
    const page = await productApi.listProducts({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: query.keyword,
      categoryId: query.categoryId,
      acquireMethod: query.acquireMethod,
      status: query.status,
    });
    products.value = page.items;
    total.value = page.total;
  } finally {
    loading.value = false;
  }
};

const loadPageData = async () => {
  loading.value = true;
  try {
    await loadCategoryOptions();
    await loadProducts();
  } finally {
    loading.value = false;
  }
};

const searchProducts = async () => {
  currentPage.value = 1;
  await loadProducts();
};

const resetQuery = async () => {
  query.keyword = '';
  query.categoryId = '';
  query.acquireMethod = '';
  query.status = '';
  currentPage.value = 1;
  await loadProducts();
};

const handlePageSizeChange = async () => {
  currentPage.value = 1;
  await loadProducts();
};

const resetProductForm = () => {
  Object.assign(productForm, {
    productModel: '',
    productName: '',
    categoryId: '',
    unit: 'pcs',
    acquireMethod: 'self_made',
    enabled: true,
    remark: '',
    specValues: [] as SpecFormRow[],
  });
};

const openCreate = () => {
  editingProductId.value = null;
  creatingMaterialFromBom.value = false;
  resetProductForm();
  addSpecRow();
  productDialogVisible.value = true;
};

const openEdit = (row: ProductListItem) => {
  editingProductId.value = row.id;
  creatingMaterialFromBom.value = false;
  Object.assign(productForm, {
    productModel: row.productModel,
    productName: row.productName,
    categoryId: row.categoryId ?? '',
    unit: row.unit,
    acquireMethod: row.acquireMethod,
    enabled: row.status === 1,
    remark: row.remark ?? '',
    specValues: row.specValues.map((item) => ({
      key: item.key,
      value: item.value ?? '',
      unit: item.unit ?? '',
    })),
  });

  if (!productForm.specValues.length) {
    addSpecRow();
  }

  productDialogVisible.value = true;
};

const openDetail = (row: ProductListItem) => {
  detailRow.value = row;
  detailDialogVisible.value = true;
};

const openMaterials = async (row: ProductListItem) => {
  materialProduct.value = row;
  const materials = await productApi.listProductMaterials(row.id);
  await refreshMaterialOptions();
  materialRows.value = materials.map(toMaterialFormRow);
  materialDialogVisible.value = true;
};

const refreshMaterialOptions = async () => {
  const options = await productApi.listProducts({ page: 1, pageSize: 200, status: 'enabled' });
  materialOptions.value = options.items.filter((item) => item.id !== materialProduct.value?.id);
};

const addSpecRow = () => {
  productForm.specValues.push({ key: '', value: '', unit: '' });
};

const removeSpecRow = (index: number) => {
  productForm.specValues.splice(index, 1);
};

const addMaterialRow = () => {
  materialRows.value.push({
    materialProductId: '',
    quantityPerUnit: 1,
    unit: materialProduct.value?.unit ?? 'pcs',
    isKeyMaterial: true,
    needBatchRecord: true,
    remark: '',
  });
};

const openCreateMaterialProduct = () => {
  editingProductId.value = null;
  creatingMaterialFromBom.value = true;
  resetProductForm();
  addSpecRow();
  productDialogVisible.value = true;
};

const removeMaterialRow = (index: number) => {
  materialRows.value.splice(index, 1);
};

const fillMaterialUnit = (row: MaterialFormRow) => {
  const product = materialOptions.value.find((item) => item.id === row.materialProductId);
  if (product && !row.unit.trim()) {
    row.unit = product.unit;
  }
};

const submitProduct = async () => {
  if (!productForm.productModel.trim() || !productForm.productName.trim() || !productForm.unit.trim()) {
    EMessage.warning('请填写产品型号、产品名称和单位');
    return;
  }

  if (!productForm.categoryId) {
    EMessage.warning('请选择产品分类');
    return;
  }

  const invalidSpec = productForm.specValues.some(
    (item) => item.value.trim() && !item.key.trim(),
  );
  if (invalidSpec) {
    EMessage.warning('已填写参数值的规格必须填写参数名称');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      productModel: productForm.productModel,
      productName: productForm.productName,
      categoryId: productForm.categoryId,
      unit: productForm.unit,
      acquireMethod: productForm.acquireMethod,
      status: productForm.enabled ? 1 : 0,
      remark: productForm.remark,
      specValues: buildSpecValues(),
    };

    let savedProduct: ProductListItem;
    if (editingProductId.value) {
      savedProduct = await productApi.updateProduct(editingProductId.value, payload);
      EMessage.success('产品已更新');
    } else {
      savedProduct = await productApi.createProduct(payload);
      EMessage.success(creatingMaterialFromBom.value ? '物料信息已新增' : '产品已新增');
    }

    productDialogVisible.value = false;
    await loadProducts();
    if (creatingMaterialFromBom.value && materialProduct.value) {
      await refreshMaterialOptions();
      materialRows.value.push({
        materialProductId: savedProduct.id,
        quantityPerUnit: 1,
        unit: savedProduct.unit,
        isKeyMaterial: true,
        needBatchRecord: true,
        remark: '',
      });
      creatingMaterialFromBom.value = false;
    }
  } finally {
    submitting.value = false;
  }
};

const buildSpecValues = (): ProductSpecValue[] =>
  productForm.specValues
    .map((item) => ({
      key: item.key.trim(),
      value: item.value.trim() || null,
      unit: item.unit.trim() || null,
    }))
    .filter((item) => item.key || item.value);

const submitMaterials = async () => {
  if (!materialProduct.value) {
    return;
  }

  const invalidRow = materialRows.value.some((item) => !item.materialProductId);
  if (invalidRow) {
    EMessage.warning('请选择物料');
    return;
  }

  const invalidQuantity = materialRows.value.some((item) => Number(item.quantityPerUnit) <= 0);
  if (invalidQuantity) {
    EMessage.warning('请填写大于 0 的单位用量');
    return;
  }

  const materialIds = materialRows.value.map((item) => item.materialProductId);
  if (new Set(materialIds).size !== materialIds.length) {
    EMessage.warning('同一个物料不能重复配置');
    return;
  }

  submitting.value = true;
  try {
    await productApi.configureProductMaterials(materialProduct.value.id, {
      materials: materialRows.value.map((item) => ({
        id: item.id,
        materialProductId: item.materialProductId,
        quantityPerUnit: item.quantityPerUnit,
        unit: item.unit || null,
        isKeyMaterial: item.isKeyMaterial,
        needBatchRecord: item.needBatchRecord,
        remark: item.remark || null,
      })),
    });
    EMessage.success('物料清单已保存');
    materialDialogVisible.value = false;
    await loadProducts();
  } finally {
    submitting.value = false;
  }
};

const toggleStatus = async (row: ProductListItem) => {
  const nextStatus = row.status === 1 ? 0 : 1;
  const actionText = nextStatus === 1 ? '启用' : '停用';
  try {
    await ElMessageBox.confirm(`确认${actionText}该产品？`, `${actionText}产品`, {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      type: nextStatus === 1 ? 'info' : 'warning',
    });
  } catch {
    return;
  }

  await productApi.changeProductStatus(row.id, nextStatus);
  EMessage.success(`产品已${actionText}`);
  await loadProducts();
};

const showInventory = async (row: ProductListItem) => {
  await productApi.getProductInventory(row.id);
  EMessage.info('库存接口已接入，库存管理模块完成后将显示明细');
};

const showRoutes = async (row: ProductListItem) => {
  await productApi.getProductRoutes(row.id);
  EMessage.info('工艺路线接口已接入，工艺路线模块完成后将显示明细');
};

const toMaterialFormRow = (item: ProductMaterialItem): MaterialFormRow => ({
  id: item.id,
  materialProductId: item.materialProductId,
  quantityPerUnit: Number(item.quantityPerUnit),
  unit: item.unit ?? item.materialUnit,
  isKeyMaterial: item.isKeyMaterial,
  needBatchRecord: item.needBatchRecord,
  remark: item.remark ?? '',
});

const formatCategory = (category: ProductCategoryListItem) =>
  `${category.productAttribute} / ${category.productType}`;

const formatProductOption = (product: ProductListItem) =>
  `${product.productModel} / ${product.productName}`;

const getAcquireMethodLabel = (method: ProductAcquireMethod) => acquireMethodLabels[method] ?? method;

const formatTime = (value: string | null) => {
  if (!value) {
    return '-';
  }

  return value.replace('T', ' ').slice(0, 19);
};

const formatSpecItem = (item: ProductSpecValue) =>
  `${item.key}: ${item.value ?? '-'}${item.unit ? ` ${item.unit}` : ''}`;

const formatSpecSummary = (items: ProductSpecValue[]) => {
  if (!items.length) {
    return '-';
  }

  return items.map(formatSpecItem).join('；');
};

onMounted(loadPageData);
</script>

<style scoped>
.products-page {
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

.query-form :deep(.el-input) {
  width: 180px;
}

.query-form :deep(.el-select) {
  width: 160px;
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

.product-table {
  width: 100%;
}

.product-table :deep(.el-table__header th),
.spec-table :deep(.el-table__header th),
.material-table :deep(.el-table__header th) {
  height: 48px;
  background: #f9fafb;
  color: #1f2937;
  font-weight: 600;
}

.product-table :deep(.el-table__row) {
  height: 56px;
}

.product-model {
  font-weight: 600;
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

.form-section-title {
  margin: 4px 0 12px;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
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
.dialog-form :deep(.el-textarea),
.spec-table :deep(.el-input) {
  width: 100%;
}

.spec-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.bom-alert {
  margin-bottom: 14px;
}

.bom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.bom-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-text {
  margin-left: 8px;
  color: #6b7280;
  font-size: 13px;
}

.material-table {
  width: 100%;
}

.spec-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
