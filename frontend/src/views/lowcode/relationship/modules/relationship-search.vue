<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.relation.name')" path="search" class="pr-24px">
          <NInput v-model:value="model.search" :placeholder="$t('page.lowcode.relation.form.name.placeholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.relation.relationType')" path="type" class="pr-24px">
          <NSelect
            v-model:value="model.type"
            :placeholder="$t('page.lowcode.relation.form.relationType.placeholder')"
            :options="typeOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('common.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('common.pleaseCheckValue')"
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
import { computed, ref } from 'vue';
import type { FormInst } from 'naive-ui';
import { $t } from '@/locales';

defineOptions({
  name: 'RelationshipSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
}

interface Props {
  model: any; // 使用 any 类型以兼容不同的搜索参数类型
}

const emit = defineEmits<Emits>();

defineProps<Props>();

const formRef = ref<FormInst | null>(null);

const typeOptions = computed(() => [
  {
    label: $t('page.lowcode.relation.relationTypes.ONE_TO_ONE'),
    value: 'ONE_TO_ONE'
  },
  {
    label: $t('page.lowcode.relation.relationTypes.ONE_TO_MANY'),
    value: 'ONE_TO_MANY'
  },
  {
    label: $t('page.lowcode.relation.relationTypes.MANY_TO_ONE'),
    value: 'MANY_TO_ONE'
  },
  {
    label: $t('page.lowcode.relation.relationTypes.MANY_TO_MANY'),
    value: 'MANY_TO_MANY'
  }
]);

const statusOptions = computed(() => [
  {
    label: $t('page.lowcode.common.status.active'),
    value: 'ACTIVE'
  },
  {
    label: $t('page.lowcode.common.status.inactive'),
    value: 'INACTIVE'
  }
]);

function reset() {
  formRef.value?.restoreValidation();
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<style scoped></style>
