<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80" label-placement="left">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.template.name')" path="name" class="pr-24px">
          <NInput v-model:value="model.name" :placeholder="$t('page.lowcode.template.form.name.placeholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.template.category')" path="category" class="pr-24px">
          <NSelect
            v-model:value="model.category"
            :placeholder="$t('page.lowcode.template.form.category.placeholder')"
            :options="categoryOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.template.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.lowcode.template.form.status.placeholder')"
            :options="statusOptions"
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

export interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

defineOptions({
  name: 'TemplateSearch'
});

const emit = defineEmits<Emits>();

const model = defineModel<any>('model', { required: true });

const categoryOptions = [
  { label: $t('page.lowcode.template.categories.PAGE'), value: 'PAGE' },
  { label: $t('page.lowcode.template.categories.COMPONENT'), value: 'COMPONENT' },
  { label: $t('page.lowcode.template.categories.CONTROLLER'), value: 'CONTROLLER' },
  { label: $t('page.lowcode.template.categories.SERVICE'), value: 'SERVICE' },
  { label: $t('page.lowcode.template.categories.MODEL'), value: 'MODEL' },
  { label: $t('page.lowcode.template.categories.DTO'), value: 'DTO' },
  { label: $t('page.lowcode.template.categories.CONFIG'), value: 'CONFIG' },
  { label: $t('page.lowcode.template.categories.TEST'), value: 'TEST' }
];

const statusOptions = [
  { label: $t('page.lowcode.template.status.DRAFT'), value: 'DRAFT' },
  { label: $t('page.lowcode.template.status.PUBLISHED'), value: 'PUBLISHED' },
  { label: $t('page.lowcode.template.status.DEPRECATED'), value: 'DEPRECATED' }
];

async function reset() {
  emit('reset');
}

async function search() {
  emit('search');
}
</script>

<style scoped></style>
