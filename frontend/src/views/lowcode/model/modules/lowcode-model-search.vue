<script setup lang="ts">
import { enableStatusOptions } from '@/constants/business';
import { $t } from '@/locales';

defineOptions({
  name: 'LowcodeModelSearch'
});

interface Emits {
  (e: 'reset'): void;
  (e: 'search'): void;
  (e: 'update:model', model: Api.LowcodeModel.ModelSearchParams): void;
}

interface Props {
  model: Api.LowcodeModel.ModelSearchParams;
}

const emit = defineEmits<Emits>();

const props = defineProps<Props>();

function reset() {
  emit('reset');
}

function search() {
  emit('search');
}
</script>

<template>
  <NCard :title="$t('common.search')" :bordered="false" size="small" class="card-wrapper">
    <NForm :model="props.model" label-placement="left" :label-width="80">
      <NGrid responsive="screen" item-responsive>
        <NFormItemGi span="24 s:12 m:6" :label="$t('page.lowcode.model.name')" path="name" class="pr-24px">
          <NInput
            :value="props.model.name"
            :placeholder="$t('page.lowcode.model.form.name')"
            @update:value="val => emit('update:model', { ...props.model, name: val })"
          />
        </NFormItemGi>
        <NFormItemGi span="24 s:12 m:6" :label="$t('common.status')" path="status" class="pr-24px">
          <NSelect
            :value="props.model.status"
            :placeholder="$t('page.lowcode.model.form.status')"
            :options="enableStatusOptions"
            clearable
            @update:value="val => emit('update:model', { ...props.model, status: val })"
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

<style scoped></style>
