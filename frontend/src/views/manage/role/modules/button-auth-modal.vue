<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue';
import type { TreeOption } from 'naive-ui';
import { fetchAssignButtons, fetchGetButtonTree, fetchGetRoleButtonIds } from '@/service/api';
import { $t } from '@/locales';

defineOptions({
  name: 'ButtonAuthModal'
});

interface Props {
  /** the roleId */
  roleId: string;
}

const props = defineProps<Props>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const title = computed(() => $t('common.edit') + $t('page.manage.role.buttonAuth'));

/** button tree data */
const tree = shallowRef<TreeOption[]>([]);

/** tree checks (button ids) */
const checks = shallowRef<string[]>([]);

const model = reactive({
  roleId: props.roleId,
  buttonIds: [] as string[]
});

async function getTree() {
  const { error, data } = await fetchGetButtonTree();
  if (!error) {
    tree.value = data.map(recursive);
  }
}

async function getRoleButtonIds() {
  const { error, data } = await fetchGetRoleButtonIds(props.roleId);
  if (!error) {
    checks.value = data;
  }
}

function recursive(item: any): TreeOption {
  const result: TreeOption = {
    key: item.key,
    label: item.label
  };
  if (item.children && item.children.length > 0) {
    result.children = item.children.map(recursive);
  }
  return result;
}

async function handleSubmit() {
  model.buttonIds = checks.value;
  const { error } = await fetchAssignButtons(model);
  if (!error) {
    window.$message?.success?.($t('common.modifySuccess'));
    closeModal();
  }
}

function closeModal() {
  visible.value = false;
}

async function init() {
  model.roleId = props.roleId;
  model.buttonIds = [];
  await Promise.all([getTree(), getRoleButtonIds()]);
}

watch(visible, val => {
  if (val) {
    init();
  }
});
</script>

<template>
  <NModal v-model:show="visible" :title="title" preset="card" class="w-480px">
    <div v-if="tree.length === 0" class="h-500px flex-center">
      <NEmpty :description="$t('common.empty')" />
    </div>
    <NTree
      v-else
      v-model:checked-keys="checks"
      :data="tree"
      block-line
      expand-on-click
      checkable
      cascade
      virtual-scroll
      class="h-500px"
    />
    <template #footer>
      <NSpace justify="end">
        <NButton quaternary @click="closeModal">
          {{ $t('common.cancel') }}
        </NButton>
        <NButton type="primary" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped></style>
