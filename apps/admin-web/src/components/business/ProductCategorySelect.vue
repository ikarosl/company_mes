<template>
  <el-cascader
    v-if="allowAttributeSelection"
    class="product-category-select"
    :model-value="modelValue"
    :options="cascaderOptions"
    :props="cascaderProps"
    :clearable="clearable"
    filterable
    :placeholder="placeholder"
    @update:model-value="handleValueChange"
  />
  <el-select
    v-else
    class="product-category-select"
    :model-value="modelValue"
    :clearable="clearable"
    filterable
    :placeholder="placeholder"
    @update:model-value="handleValueChange"
  >
    <el-option-group
      v-for="group in categoryGroups"
      :key="group.key"
      :label="group.label"
    >
      <el-option
        v-for="category in group.options"
        :key="category.id"
        :label="`${group.label} / ${category.productType}`"
        :value="category.id"
      >
        <span class="category-type">{{ category.productType }}</span>
      </el-option>
    </el-option-group>
  </el-select>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  PRODUCT_ATTRIBUTE_LABELS,
  normalizeProductAttribute,
  type ProductAttribute,
  type ProductCategoryListItem,
} from '@company/api-contract';

const props = withDefaults(
  defineProps<{
    /** 当前选中的产品分类 ID。 */
    modelValue: string;
    /** 可选产品分类，由业务页面统一从分类接口加载。 */
    options: ProductCategoryListItem[];
    /** 未选择时显示的提示文案。 */
    placeholder?: string;
    /** 是否允许清空当前选择。 */
    clearable?: boolean;
    /** 是否允许直接选择一级产品属性；仅用于列表查询，产品建档仍需选择二级分类。 */
    allowAttributeSelection?: boolean;
  }>(),
  {
    placeholder: '请选择产品分类',
    clearable: false,
    allowAttributeSelection: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/** 固定一级分类顺序，避免接口返回顺序变化导致下拉分组跳动。 */
const attributeOrder: ProductAttribute[] = [
  'finished',
  'semi_finished',
  'material',
  'auxiliary',
  'other',
];

/** 两级下拉数据：一级为产品属性，二级为该属性下可选择的具体产品类型。 */
const categoryGroups = computed(() => {
  const grouped = new Map<string, ProductCategoryListItem[]>();

  props.options.forEach((category) => {
    const rawAttribute = category.productAttribute as string;
    const attribute = normalizeProductAttribute(rawAttribute) ?? rawAttribute;
    const items = grouped.get(attribute) ?? [];
    items.push(category);
    grouped.set(attribute, items);
  });

  const knownGroups = attributeOrder
    .filter((attribute) => grouped.has(attribute))
    .map((attribute) => ({
      key: attribute,
      label: PRODUCT_ATTRIBUTE_LABELS[attribute],
      options: sortCategories(grouped.get(attribute) ?? []),
    }));

  // 未识别的历史属性仍可选择，避免数据清理前分类从页面消失。
  const legacyGroups = [...grouped.entries()]
    .filter(([attribute]) => !attributeOrder.includes(attribute as ProductAttribute))
    .map(([attribute, options]) => ({
      key: `legacy:${attribute}`,
      label: attribute,
      options: sortCategories(options),
    }));

  return [...knownGroups, ...legacyGroups];
});

/** 查询场景使用的级联数据：父节点和具体分类节点均可选择。 */
const cascaderOptions = computed(() =>
  categoryGroups.value.map((group) => ({
    value: `attribute:${group.key}`,
    label: group.label,
    children: group.options.map((category) => ({
      value: category.id,
      label: category.productType,
    })),
  })),
);

/** checkStrictly 允许选择一级大类，emitPath=false 让表单只保存最终查询值。 */
const cascaderProps = {
  checkStrictly: true,
  emitPath: false,
};

/** 同一一级分类内按具体类型名称排序，方便快速定位。 */
const sortCategories = (categories: ProductCategoryListItem[]) =>
  [...categories].sort((left, right) => left.productType.localeCompare(right.productType, 'zh-CN'));

/** Element Plus 清空时可能返回 undefined，统一转换为空字符串。 */
const handleValueChange = (value: string | undefined) => {
  emit('update:modelValue', value ?? '');
};
</script>

<style scoped>
.product-category-select {
  width: 100%;
}

.category-type {
  padding-left: 8px;
}
</style>
