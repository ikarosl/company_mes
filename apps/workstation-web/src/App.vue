<template>
  <main>
    <h1>Company Workstation</h1>
    <p>Shared sum: {{ sample }}</p>
    <p>UI sum: <SumResult :a="2" :b="3" /></p>
  </main>
</template>

<script setup lang="ts">
import { SumResult } from '@company/ui';
import { sum } from '@company/utils';

const sample = sum(1, 2);
</script>
