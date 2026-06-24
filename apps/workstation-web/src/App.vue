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

// 员工端当前仅保留共享包联调入口，一期业务仍以管理端为主。
const sample = sum(1, 2);
</script>
