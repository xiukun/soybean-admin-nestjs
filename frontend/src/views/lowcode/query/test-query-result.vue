<script setup lang="ts">
import { ref } from 'vue';
import QueryResultModal from './modules/query-result-modal.vue';

const resultModalVisible = ref(false);
const testData = ref<any[]>([]);
const queryName = ref('');
const executeTime = ref(0);
const loading = ref(false);
const error = ref('');

// 完全相同的API返回数据
const exactApiData = [
  {
    用户状态: 'ACTIVE',
    用户数量: '2',
    最近注册时间: {},
    最早注册时间: {}
  },
  {
    用户状态: 'INACTIVE',
    用户数量: '1',
    最近注册时间: {},
    最早注册时间: {}
  }
];

function showExactApiData() {
  testData.value = exactApiData;
  queryName.value = '用户状态统计';
  executeTime.value = 150;
  loading.value = false;
  error.value = '';
  resultModalVisible.value = true;
  console.log('显示完全相同的API数据:', exactApiData);
}

function showEmptyResult() {
  testData.value = [];
  queryName.value = '空查询结果';
  executeTime.value = 50;
  loading.value = false;
  error.value = '';
  resultModalVisible.value = true;
}

function showErrorResult() {
  testData.value = [];
  queryName.value = '错误查询';
  executeTime.value = 0;
  loading.value = false;
  error.value = '查询执行失败：数据库连接超时';
  resultModalVisible.value = true;
}
</script>

<template>
  <div class="p-4">
    <NCard title="查询结果测试" :bordered="false">
      <NSpace>
        <NButton type="primary" @click="showExactApiData">显示您的API数据</NButton>
        <NButton @click="showEmptyResult">显示空数据</NButton>
        <NButton @click="showErrorResult">显示错误</NButton>
      </NSpace>
    </NCard>

    <QueryResultModal
      v-model:visible="resultModalVisible"
      :data="testData"
      :query-name="queryName"
      :execute-time="executeTime"
      :loading="loading"
      :error="error"
    />
  </div>
</template>
