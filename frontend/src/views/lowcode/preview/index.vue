<script setup lang="tsx">
import { computed, onMounted, ref } from 'vue';
import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';
import { fetchGetLowcodePageByCode, fetchGetLowcodePageList } from '@/service/api';
import { $t } from '@/locales';
import AmisRenderer from '@/components/lowcode/amis-renderer.vue';

defineOptions({
  name: 'LowcodePreview'
});

const loading = ref(false);
const error = ref('');
const selectedPageCode = ref('');
const pageSchema = ref({});
const pageData = ref({});
const pages = ref<Api.LowcodePage.Page[]>([]);

const pageOptions = computed(() => {
  return pages.value.map(page => ({
    label: `${page.title} (${page.code})`,
    value: page.code
  }));
});

async function loadPages() {
  try {
    const { data } = await fetchGetLowcodePageList({
      current: 1,
      size: 100,
      status: 'ENABLED'
    } as Api.LowcodePage.PageSearchParams);
    if (data) {
      pages.value = data.records;
    }
  } catch (err) {
    console.error('加载页面列表失败:', err);
    error.value = '加载页面列表失败';
  }
}

async function handlePageChange(code: string) {
  if (!code) return;

  loading.value = true;
  error.value = '';

  try {
    const { data: page, error: fetchError } = await fetchGetLowcodePageByCode(code);

    if (fetchError || !page) {
      error.value = '页面不存在';
      return;
    }

    // 解析页面Schema
    try {
      pageSchema.value = JSON.parse(page.schema);
      pageData.value = {}; // 可以根据需要设置初始数据
    } catch (parseError) {
      console.error('解析页面Schema失败:', parseError);
      error.value = '页面配置格式错误';
    }
  } catch (err) {
    console.error('加载页面失败:', err);
    error.value = '加载页面失败';
  } finally {
    loading.value = false;
  }
}

function handleRefresh() {
  if (selectedPageCode.value) {
    handlePageChange(selectedPageCode.value);
  }
}

function handleAction(action: any) {
  console.log('AMIS Action:', action);
  // 处理AMIS组件的动作
}

onMounted(() => {
  loadPages();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <NCard :title="$t('page.lowcode.preview.title')" :bordered="false" size="small" class="card-wrapper">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="selectedPageCode"
            :placeholder="$t('page.lowcode.preview.selectPage')"
            :options="pageOptions"
            class="w-200px"
            @update:value="handlePageChange"
          />
          <NButton type="primary" @click="handleRefresh">
            <template #icon>
              <icon-ic-round-refresh class="text-icon" />
            </template>
            {{ $t('common.refresh') }}
          </NButton>
        </NSpace>
      </template>
      <div v-if="loading" class="h-400px flex-center">
        <NSpin size="large" />
      </div>
      <div v-else-if="!selectedPageCode" class="h-400px flex-center text-gray-400">
        {{ $t('page.lowcode.preview.selectPageTip') }}
      </div>
      <div v-else-if="error" class="h-400px flex-center text-red-500">
        {{ error }}
      </div>
      <div v-else class="lowcode-renderer">
        <AmisRenderer :schema="pageSchema" :data="pageData" @action="handleAction" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.lowcode-renderer {
  min-height: 400px;
}

:deep(.amis-scope) {
  border: none;
}
</style>
