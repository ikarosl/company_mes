<template>
  <div>
    <input v-model.number="left" aria-label="First number" type="number" />
    <input v-model.number="right" aria-label="Second number" type="number" />
    <input aria-label="Result" readonly type="number" :value="result" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { sum } from '@company/utils';

const props = defineProps<{
  a: number;
  b: number;
}>();

const left = ref(props.a);
const right = ref(props.b);
const result = computed(() => sum(left.value, right.value));

watch(
  () => [props.a, props.b],
  ([nextLeft, nextRight]) => {
    left.value = nextLeft;
    right.value = nextRight;
  },
);
</script>
