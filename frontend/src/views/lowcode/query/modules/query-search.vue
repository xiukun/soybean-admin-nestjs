<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80" label-placement="left">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.query.name')" path="name" class="pr-24px">
          <NInput v-model:value="model.name" :placeholder="$t('page.lowcode.query.form.name')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.query.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.lowcode.query.form.status')"
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

<script setup lang="ts">
import { $t } from '@/locales';
import { queryStatusOptions } from '@/constants/business';

export interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

defineOptions({
  name: 'QuerySearch'
});

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.QuerySearchParams>('model', { required: true });

async function reset() {
  emit('reset');
}

async function search() {
  emit('search');
}
</script>

<style scoped></style>
