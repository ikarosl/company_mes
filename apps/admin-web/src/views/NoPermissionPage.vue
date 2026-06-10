<template>
  <section class="blank-page">
    <h1>无权限</h1>
    <p>当前账号没有访问该页面所需的权限点。</p>
  </section>
</template>

<style scoped>
.blank-page {
  min-height: calc(100vh - 108px);
  padding: 24px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #ffffff;
}

.blank-page h1 {
  margin: 0 0 12px;
  color: #1f2d3d;
  font-size: 22px;
}

.blank-page p {
  margin: 0;
  color: #606266;
}
</style>
