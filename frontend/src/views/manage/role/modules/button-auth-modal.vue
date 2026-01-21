<script setup lang="ts">
import { computed, h, reactive, shallowRef, watch } from 'vue';
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

/** button tree data (original) */
const tree = shallowRef<TreeOption[]>([]);

/** search keyword */
const keyword = shallowRef('');

const filteredTree = computed(() => {
  const kw = keyword.value.trim();
  if (!kw) return tree.value;

  const match = (label: unknown) => String(label ?? '').toLowerCase().includes(kw.toLowerCase());

  const filter = (nodes: TreeOption[]): TreeOption[] => {
    const result: TreeOption[] = [];

    for (const n of nodes) {
      const children = Array.isArray(n.children) ? (n.children as TreeOption[]) : [];
      const filteredChildren = children.length ? filter(children) : [];
      const selfMatched = match(n.label);

      if (selfMatched || filteredChildren.length) {
        result.push({
          ...n,
          // keep same key, keep checked behavior
          ...(filteredChildren.length ? { children: filteredChildren } : {})
        });
      }
    }

    return result;
  };

  return filter(tree.value);
});

function renderLabel({ option }: { option: TreeOption }) {
  const kw = keyword.value.trim();
  const text = String(option.label ?? '');

  if (!kw) return text;

  const lower = text.toLowerCase();
  const kwLower = kw.toLowerCase();
  const index = lower.indexOf(kwLower);

  if (index < 0) return text;

  // 多段命中高亮
  const parts: Array<{ text: string; hit: boolean }> = [];
  let cursor = 0;
  while (cursor < text.length) {
    const next = lower.indexOf(kwLower, cursor);
    if (next < 0) {
      parts.push({ text: text.slice(cursor), hit: false });
      break;
    }
    if (next > cursor) {
      parts.push({ text: text.slice(cursor, next), hit: false });
    }
    parts.push({ text: text.slice(next, next + kw.length), hit: true });
    cursor = next + kw.length;
  }

  return h(
    'span',
    { class: 'inline-flex items-center flex-wrap gap-x-2px' },
    parts.map(p =>
      p.hit
        ? h('span', { class: 'rounded-2px bg-primary/10 px-4px text-primary' }, p.text)
        : p.text
    )
  );
}

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
  keyword.value = '';
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
    <div class="mb-12px">
      <NInput v-model:value="keyword" clearable placeholder="搜索菜单/按钮/buttonCode" />
    </div>

    <div v-if="filteredTree.length === 0" class="h-500px flex-center">
      <NEmpty :description="keyword.trim() ? '无匹配结果' : '暂无数据'" />
    </div>
    <NTree
      v-else
      v-model:checked-keys="checks"
      :data="filteredTree"
      :render-label="renderLabel"
      block-line
      expand-on-click
      default-expand-all
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
