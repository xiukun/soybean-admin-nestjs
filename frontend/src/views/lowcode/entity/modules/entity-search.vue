<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.entity.name')" path="search" class="pr-24px">
          <NInput v-model:value="model.search" :placeholder="$t('page.lowcode.entity.form.name.placeholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('common.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.lowcode.entity.form.status.placeholder')"
            :options="statusOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.entity.category')" path="category" class="pr-24px">
          <NSelect
            v-model:value="model.category"
            :placeholder="$t('page.lowcode.entity.form.category.placeholder')"
            :options="categoryOptions"
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
import { computed, ref } from 'vue';
import type { FormInst } from 'naive-ui';
import { $t } from '@/locales';

defineOptions({
  name: 'EntitySearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

interface Props {
  model: Api.Lowcode.EntitySearchParams;
}

const emit = defineEmits<Emits>();

const props = defineProps<Props>();

const formRef = ref<FormInst | null>(null);

const statusOptions = computed(() => [
  {
    label: $t('page.lowcode.entity.status.DRAFT'),
    value: 'DRAFT'
  },
  {
    label: $t('page.lowcode.entity.status.PUBLISHED'),
    value: 'PUBLISHED'
  },
  {
    label: $t('page.lowcode.entity.status.DEPRECATED'),
    value: 'DEPRECATED'
  }
]);

const categoryOptions = computed(() => [
  {
    label: $t('page.lowcode.entity.category.core'),
    value: 'core'
  },
  {
    label: $t('page.lowcode.entity.category.business'),
    value: 'business'
  },
  {
    label: $t('page.lowcode.entity.category.system'),
    value: 'system'
  },
  {
    label: $t('page.lowcode.entity.category.config'),
    value: 'config'
  }
]);

async function reset() {
  await formRef.value?.restoreValidation();
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<style scoped></style>
