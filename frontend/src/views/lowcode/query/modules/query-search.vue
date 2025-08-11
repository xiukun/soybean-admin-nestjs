<script setup lang="ts">
import { queryStatusOptions } from '@/constants/business';
import { $t } from '@/locales';

export interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

defineOptions({
  name: 'QuerySearch'
});

const emit = defineEmits<Emits>();

const model = defineModel<Api.Lowcode.QuerySearchParams>('model', { required: true });

async function reset() {
  emit('reset');
}

async function search() {
  emit('search');
}
</script>

<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80" label-placement="left">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.query.name')" path="search" class="pr-24px">
          <NInput v-model:value="model.search" :placeholder="$t('page.lowcode.query.form.name.placeholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('common.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('common.pleaseSelect')"
            :options="queryStatusOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:12" class="pr-24px">
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

<style scoped></style>
