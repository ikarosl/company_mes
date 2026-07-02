<template>
  <el-select
    :model-value="modelValue"
    clearable
    filterable
    remote
    reserve-keyword
    :loading="loading"
    :placeholder="placeholder"
    :remote-method="searchProducts"
    @update:model-value="handleValueChange"
  >
    <el-option
      v-for="product in productOptions"
      :key="product.id"
      :label="formatProduct(product)"
      :value="product.id"
    />
  </el-select>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { ProductListItem } from '@company/api-contract';
import { productApi } from '../../api/product';
import { EMessage } from '../../utils/message';

const props = withDefaults(
  defineProps<{
    /** 当前选中的订单产品 ID。 */
    modelValue: string;
    /** 未选择产品时显示的占位文案。 */
    placeholder?: string;
  }>(),
  {
    placeholder: '请输入产品型号或名称',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

/** 订单产品仅包含成品和半成品，物料、辅料不进入工单及任务筛选。 */
const orderProductAttributes = '成品,半成品';
/** 远程搜索结果：限制单次返回数量，避免产品很多时渲染超长下拉列表。 */
const productOptions = ref<ProductListItem[]>([]);
const loading = ref(false);

/** 将产品型号放在前面，便于现场人员输入型号后快速识别。 */
const formatProduct = (product: ProductListItem) => `${product.productModel} / ${product.productName}`;

/** 合并产品选项并按产品 ID 去重，确保编辑时当前值不会被远程搜索结果覆盖。 */
const mergeProductOption = (product: ProductListItem) => {
  productOptions.value = [
    product,
    ...productOptions.value.filter((item) => item.id !== product.id),
  ];
};

/**
 * 按产品型号、名称远程搜索订单产品。
 * 只请求前 20 条匹配项，用户继续输入即可缩小结果范围。
 */
const searchProducts = async (keyword: string) => {
  loading.value = true;
  try {
    const page = await productApi.listProducts({
      page: 1,
      pageSize: 20,
      keyword: keyword.trim(),
      status: 'enabled',
      productAttributes: orderProductAttributes,
      acquireMethod: 'self_made',
    });
    productOptions.value = page.items;
    await ensureSelectedProduct();
  } catch (error) {
    EMessage.error(error instanceof Error ? error.message : '订单产品查询失败');
  } finally {
    loading.value = false;
  }
};

/** 编辑已有数据时单独补回当前产品，避免它不在本次前 20 条搜索结果中。 */
const ensureSelectedProduct = async () => {
  if (!props.modelValue || productOptions.value.some((item) => item.id === props.modelValue)) {
    return;
  }

  const product = await productApi.getProduct(props.modelValue);
  if ((product.productAttribute === '成品' || product.productAttribute === '半成品') && product.acquireMethod === 'self_made') {
    mergeProductOption(product);
  }
};

/** 同步 v-model，并向业务页面透传产品变更事件。 */
const handleValueChange = (value: string | undefined) => {
  const normalizedValue = value ?? '';
  emit('update:modelValue', normalizedValue);
  emit('change', normalizedValue);
};

watch(
  () => props.modelValue,
  () => {
    void ensureSelectedProduct();
  },
);

onMounted(() => {
  void searchProducts('');
});
</script>
