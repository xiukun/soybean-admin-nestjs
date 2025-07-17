<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm :model="model" :label-width="80" label-placement="left" :show-feedback="false">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.apiConfig.name')" path="search" class="pr-24px">
          <NInput v-model:value="model.search" :placeholder="$t('page.lowcode.apiConfig.form.search.placeholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.apiConfig.method')" path="method" class="pr-24px">
          <NSelect
            v-model:value="model.method"
            :placeholder="$t('page.lowcode.apiConfig.form.method.placeholder')"
            :options="methodOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('common.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.lowcode.apiConfig.form.status.placeholder')"
            :options="statusOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" class="pr-24px">
          <NSpace class="w-full" justify="end">
            <NButton @click="reset">
              <template #icon>
                <icon-ic-round-refresh class="text-icon" />
              </template>
              {{ $t('common.reset') }}
            </NButton>
            <NButton type="primary" ghost @click="search">
              <template #icon>
                <icon-ic-round-search class="text-icon" />
              </template>
              {{ $t('common.search') }}
            </NButton>
          </NSpace>
        </NFormItemGi>
      </NGrid>
    </NForm>
  </NCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({
  name: 'ApiConfigSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

const emit = defineEmits<Emits>();

const model = defineModel<Api.Lowcode.ApiConfigSearchParams>('model', { required: true });

const methodOptions = computed(() => [
  {
    label: 'GET',
    value: 'GET'
  },
  {
    label: 'POST',
    value: 'POST'
  },
  {
    label: 'PUT',
    value: 'PUT'
  },
  {
    label: 'DELETE',
    value: 'DELETE'
  }
]);

const statusOptions = computed(() => [
  {
    label: $t('page.lowcode.apiConfig.status.ACTIVE'),
    value: 'ACTIVE'
  },
  {
    label: $t('page.lowcode.apiConfig.status.INACTIVE'),
    value: 'INACTIVE'
  }
]);

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<style scoped></style>
