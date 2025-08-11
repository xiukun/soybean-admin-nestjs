<script setup lang="ts">
import ProjectManagement from './components/ProjectManagement.vue';

// 页面标题
defineOptions({
  name: 'LowcodeProject'
});
</script>

<template>
  <div class="lowcode-project-page">
    <ProjectManagement />
  </div>
</template>

<style scoped>
.lowcode-project-page {
  height: 100%;
  padding: 16px;
  background-color: #f5f5f5;
}
</style>
