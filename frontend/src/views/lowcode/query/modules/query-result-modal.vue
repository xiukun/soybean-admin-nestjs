<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { $t } from '@/locales';

export interface Props {
  /** Query name */
  queryName?: string;
  /** Query result data */
  data?: any[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string;
  /** Execute time in milliseconds */
  executeTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  queryName: '',
  data: () => [],
  loading: false,
  error: '',
  executeTime: 0
});

const visible = defineModel<boolean>('visible', {
  default: false
});

const activeTab = ref('result');

const title = computed(() => {
  return props.queryName ? `${$t('page.lowcode.query.result')} - ${props.queryName}` : $t('page.lowcode.query.result');
});

const modalVisible = computed({
  get() {
    return visible.value;
  },
  set(value) {
    visible.value = value;
  }
});

const resultData = computed(() => {
  const data = props.data || [];
  // 确保数据是数组且每个元素都是对象
  return Array.isArray(data) ? data.filter(item => item && typeof item === 'object') : [];
});

const resultColumns = computed<DataTableColumns<any>>(() => {
  if (!resultData.value || resultData.value.length === 0) {
    return [];
  }

  const firstRow = resultData.value[0];
  if (!firstRow || typeof firstRow !== 'object') {
    return [];
  }

  return Object.keys(firstRow).map(key => ({
    key,
    title: key,
    width: 150,
    ellipsis: {
      tooltip: true
    },
    render: (row: any) => {
      try {
        // 安全检查：确保 row 存在且是对象
        if (!row || typeof row !== 'object') {
          return '-';
        }

        const value = row[key];

        // 处理 null 和 undefined
        if (value === null || value === undefined) {
          return '-';
        }

        // 处理空字符串
        if (value === '') {
          return '-';
        }

        // 处理空对象的情况
        if (typeof value === 'object' && !Array.isArray(value)) {
          try {
            if (Object.keys(value).length === 0) {
              return '-';
            }
          } catch {
            return '-';
          }
        }

        // 处理日期时间字段
        if (key.includes('时间') || key.includes('Time') || key.includes('date') || key.includes('Date')) {
          if (value && typeof value === 'string' && value !== '') {
            try {
              return new Date(value).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
            } catch {
              return value;
            }
          }
          return '-';
        }

        // 处理数字类型，确保正确显示
        if (typeof value === 'number' || !isNaN(Number(value))) {
          return String(value);
        }

        return String(value);
      } catch (error) {
        console.warn('Error in render function:', error);
        return '-';
      }
    }
  }));
});

const rowCount = computed(() => resultData.value?.length || 0);
const columnCount = computed(() => resultColumns.value?.length || 0);

const scrollX = computed(() => {
  return columnCount.value * 150;
});

const pagination = {
  pageSize: 50,
  showSizePicker: true,
  pageSizes: [20, 50, 100, 200],
  showQuickJumper: true
};

function closeModal() {
  visible.value = false;
}

function exportData() {
  if (!resultData.value || resultData.value.length === 0) {
    window.$message?.warning($t('page.lowcode.query.noDataToExport'));
    return;
  }

  // TODO: Implement export functionality
  window.$message?.info($t('page.lowcode.query.exportComingSoon'));
}

watch(visible, newVal => {
  if (newVal) {
    activeTab.value = 'result';
    // 调试信息
    console.log('Query Result Modal opened with data:', {
      data: props.data,
      dataType: Array.isArray(props.data) ? 'array' : typeof props.data,
      dataLength: Array.isArray(props.data) ? props.data.length : 'N/A',
      queryName: props.queryName,
      loading: props.loading,
      error: props.error,
      executeTime: props.executeTime
    });
  }
});

// // 监听数据变化
// watch(() => props.data, (newData) => {
//   console.log('Query result data changed:', {
//     data: newData,
//     type: Array.isArray(newData) ? 'array' : typeof newData,
//     length: Array.isArray(newData) ? newData.length : 'N/A'
//   });
// }, { deep: true });
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-1200px">
    <div class="h-500px">
      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="result" :tab="$t('page.lowcode.query.result')">
          <div v-if="loading" class="h-200px flex-center">
            <NSpin size="medium" />
          </div>
          <div v-else-if="error" class="h-200px flex-center">
            <NResult status="error" :title="$t('page.lowcode.query.executeError')" :description="error" />
          </div>
          <div v-else-if="resultData && resultData.length > 0" class="h-full">
            <NDataTable
              :columns="resultColumns"
              :data="resultData"
              :pagination="pagination"
              :scroll-x="scrollX"
              size="small"
              class="h-full"
            />
          </div>
          <div v-else class="h-200px flex-center">
            <NEmpty :description="$t('page.lowcode.query.noData')" />
          </div>
        </NTabPane>
        <NTabPane name="info" :tab="$t('page.lowcode.query.info')">
          <NDescriptions :column="2" label-placement="left">
            <NDescriptionsItem :label="$t('page.lowcode.query.executeTime')">{{ executeTime }}ms</NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.query.rowCount')">
              {{ rowCount }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.lowcode.query.columnCount')">
              {{ columnCount }}
            </NDescriptionsItem>
            <NDescriptionsItem label="查询名称">
              {{ props.queryName || '-' }}
            </NDescriptionsItem>
            <NDescriptionsItem label="数据状态">
              <NTag v-if="error" type="error">执行失败</NTag>
              <NTag v-else-if="loading" type="warning">执行中</NTag>
              <NTag v-else-if="rowCount > 0" type="success">成功</NTag>
              <NTag v-else type="info">无数据</NTag>
            </NDescriptionsItem>
            <NDescriptionsItem v-if="error" label="错误信息" :span="2">
              <NText type="error">{{ error }}</NText>
            </NDescriptionsItem>
          </NDescriptions>
        </NTabPane>
      </NTabs>
    </div>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="closeModal">{{ $t('common.close') }}</NButton>
        <NButton type="primary" @click="exportData">
          <template #icon>
            <icon-ic-round-download class="text-icon" />
          </template>
          {{ $t('common.export') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
