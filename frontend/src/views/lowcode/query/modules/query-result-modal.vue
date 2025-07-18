<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-1200px">
    <div class="h-500px">
      <NTabs v-model:value="activeTab" type="line" animated>
        <NTabPane name="result" :tab="$t('page.manage.query.result')">
          <div v-if="loading" class="flex-center h-200px">
            <NSpin size="medium" />
          </div>
          <div v-else-if="error" class="flex-center h-200px">
            <NResult status="error" :title="$t('page.manage.query.executeError')" :description="error" />
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
          <div v-else class="flex-center h-200px">
            <NEmpty :description="$t('page.manage.query.noData')" />
          </div>
        </NTabPane>
        <NTabPane name="info" :tab="$t('page.manage.query.info')">
          <NDescriptions :column="2" label-placement="left">
            <NDescriptionsItem :label="$t('page.manage.query.executeTime')">
              {{ executeTime }}ms
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.query.rowCount')">
              {{ rowCount }}
            </NDescriptionsItem>
            <NDescriptionsItem :label="$t('page.manage.query.columnCount')">
              {{ columnCount }}
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
  return props.queryName ? `${$t('page.manage.query.result')} - ${props.queryName}` : $t('page.manage.query.result');
});

const modalVisible = computed({
  get() {
    return visible.value;
  },
  set(value) {
    visible.value = value;
  }
});

const resultData = computed(() => props.data || []);

const resultColumns = computed<DataTableColumns<any>>(() => {
  if (!resultData.value || resultData.value.length === 0) {
    return [];
  }

  const firstRow = resultData.value[0];
  return Object.keys(firstRow).map(key => ({
    key,
    title: key,
    width: 150,
    ellipsis: {
      tooltip: true
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
    window.$message?.warning($t('page.manage.query.noDataToExport'));
    return;
  }

  // TODO: Implement export functionality
  window.$message?.info($t('common.comingSoon'));
}

watch(visible, newVal => {
  if (newVal) {
    activeTab.value = 'result';
  }
});
</script>

<style scoped></style>
