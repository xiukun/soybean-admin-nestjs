<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm ref="formRef" :model="model" :label-width="80">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.relationship.name')" path="search" class="pr-24px">
          <NInput v-model:value="model.search" :placeholder="$t('page.lowcode.relationship.form.name.placeholder')" />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.relationship.typeLabel')" path="type" class="pr-24px">
          <NSelect
            v-model:value="model.type"
            :placeholder="$t('page.lowcode.relationship.form.type.placeholder')"
            :options="typeOptions"
            clearable
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('common.status')" path="status" class="pr-24px">
          <NSelect
            v-model:value="model.status"
            :placeholder="$t('page.lowcode.relationship.form.status.placeholder')"
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
  model: Api.Lowcode.RelationshipSearchParams;
}

const emit = defineEmits<Emits>();

const props = defineProps<Props>();

const formRef = ref<FormInst | null>(null);

const typeOptions = computed(() => [
  {
    label: $t('page.lowcode.relationship.type.oneToOne'),
    value: 'ONE_TO_ONE'
  },
  {
    label: $t('page.lowcode.relationship.type.oneToMany'),
    value: 'ONE_TO_MANY'
  },
  {
    label: $t('page.lowcode.relationship.type.manyToOne'),
    value: 'MANY_TO_ONE'
  },
  {
    label: $t('page.lowcode.relationship.type.manyToMany'),
    value: 'MANY_TO_MANY'
  }
]);

const statusOptions = computed(() => [
  {
    label: $t('page.lowcode.relationship.status.ACTIVE'),
    value: 'ACTIVE'
  },
  {
    label: $t('page.lowcode.relationship.status.INACTIVE'),
    value: 'INACTIVE'
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
