<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80" label-placement="left">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.template.name')" path="name" class="pr-24px">
          <NInput v-model:value="model.name" :placeholder="$t('page.manage.template.form.name')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.template.category')" path="category" class="pr-24px">
          <NSelect
            v-model:value="model.category"
            :placeholder="$t('page.manage.template.form.category')"
            :options="categoryOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.manage.template.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.manage.template.form.status')"
            :options="enableStatusOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 m:6" class="pr-24px">
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
import { enableStatusOptions } from '@/constants/business';

export interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

defineOptions({
  name: 'TemplateSearch'
});

const emit = defineEmits<Emits>();

const model = defineModel<Api.SystemManage.TemplateSearchParams>('model', { required: true });

const categoryOptions = [
  { label: $t('page.manage.template.category.page'), value: 'page' },
  { label: $t('page.manage.template.category.component'), value: 'component' },
  { label: $t('page.manage.template.category.layout'), value: 'layout' }
];

async function reset() {
  emit('reset');
}

async function search() {
  emit('search');
}
</script>

<style scoped></style>
