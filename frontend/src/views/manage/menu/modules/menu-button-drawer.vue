<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { NButton, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NInputNumber, NPopconfirm, NSelect, NSpace, NTable, NTag, useMessage } from 'naive-ui';
import type { FormInst } from 'naive-ui';
import { fetchButtonList, fetchCreateButton, fetchDeleteButton, fetchUpdateButton } from '@/service/api';

const props = defineProps<{
  show: boolean;
  menuId: number | null;
  menuType?: Api.SystemManage.MenuType | null;
  routeName?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:show', v: boolean): void;
}>();

const message = useMessage();

const visible = computed({
  get: () => props.show,
  set: v => emit('update:show', v)
});

type ButtonRow = {
  id: string;
  code: string;
  description: string | null;
  menuId: number | null;
  status: Api.Common.EnableStatus;
  order: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  editing?: boolean;
};

const loading = ref(false);
const rows = ref<ButtonRow[]>([]);

const formRef = ref<FormInst | null>(null);
const createForm = reactive({
  code: '',
  description: '',
  order: 0
});

async function load() {
  if (!props.menuId) {
    rows.value = [];
    return;
  }

  loading.value = true;
  const { data, error } = await fetchButtonList({ menuId: props.menuId });
  loading.value = false;

  if (error) return;
  rows.value = (data || []).map(r => ({ ...r, editing: false }));
}

watch(
  () => [props.show, props.menuId] as const,
  ([show]) => {
    if (show) load();
  }
);

function startEdit(r: ButtonRow) {
  r.editing = true;
}

async function saveEdit(r: ButtonRow) {
  if (!r.id) return;
  const { error } = await fetchUpdateButton(r.id, {
    description: r.description ?? null,
    menuId: props.menuId,
    status: r.status,
    order: r.order
  });
  if (error) return;
  r.editing = false;
  message.success('保存成功');
}

async function toggleStatus(r: ButtonRow) {
  if (!r.id) return;
  const next = r.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
  const { error } = await fetchUpdateButton(r.id, {
    description: r.description ?? null,
    menuId: props.menuId,
    status: next,
    order: r.order
  });
  if (error) return;
  r.status = next;
  message.success('状态已更新');
}

async function remove(r: ButtonRow) {
  const { error } = await fetchDeleteButton(r.id);
  if (error) return;
  message.success('删除成功');
  await load();
}

async function swapOrder(a: ButtonRow, b: ButtonRow) {
  const aOrder = a.order;
  const bOrder = b.order;

  // optimistic
  a.order = bOrder;
  b.order = aOrder;

  // persist sequentially to reduce conflict
  const r1 = await fetchUpdateButton(a.id, {
    description: a.description ?? null,
    menuId: props.menuId,
    status: a.status,
    order: a.order
  });
  if (r1.error) {
    // rollback
    a.order = aOrder;
    b.order = bOrder;
    return;
  }

  const r2 = await fetchUpdateButton(b.id, {
    description: b.description ?? null,
    menuId: props.menuId,
    status: b.status,
    order: b.order
  });
  if (r2.error) {
    // rollback
    a.order = aOrder;
    b.order = bOrder;
    await fetchUpdateButton(a.id, {
      description: a.description ?? null,
      menuId: props.menuId,
      status: a.status,
      order: aOrder
    });
    return;
  }

  rows.value = [...rows.value].sort((x, y) => (x.order ?? 0) - (y.order ?? 0) || x.id.localeCompare(y.id));
  message.success('排序已更新');
}

async function moveUp(index: number) {
  if (index <= 0) return;
  await swapOrder(rows.value[index], rows.value[index - 1]);
}

async function moveDown(index: number) {
  if (index >= rows.value.length - 1) return;
  await swapOrder(rows.value[index], rows.value[index + 1]);
}

async function create() {
  if (!props.menuId) {
    message.warning('请先保存菜单后再创建按钮');
    return;
  }

  const code = createForm.code.trim();
  if (!code) {
    message.warning('请输入 buttonCode');
    return;
  }

  const { error } = await fetchCreateButton({
    code,
    description: createForm.description?.trim() || null,
    menuId: props.menuId,
    status: 'ENABLED',
    order: createForm.order
  });

  if (error) return;

  createForm.code = '';
  createForm.description = '';
  createForm.order = 0;

  message.success('创建成功');
  await load();
}
</script>

<template>
  <NDrawer v-model:show="visible" :width="800" placement="right">
    <NDrawerContent :title="`按钮管理（${routeName || ''}#${menuId ?? '-'}）`" closable>
      <div class="flex-col gap-12px">
        <NForm ref="formRef" :model="createForm" label-placement="left" label-width="90">
          <div class="flex gap-12px">
            <NFormItem label="buttonCode" path="code" class="flex-1">
              <NInput v-model:value="createForm.code" placeholder="例如：manage_menu:delete" />
            </NFormItem>
            <NFormItem label="排序" path="order" class="w-180px">
              <NInputNumber v-model:value="createForm.order" :min="0" />
            </NFormItem>
          </div>
          <NFormItem label="说明" path="description">
            <NInput v-model:value="createForm.description" placeholder="例如：删除菜单" />
          </NFormItem>
          <NSpace justify="end">
            <NButton type="primary" @click="create">创建按钮</NButton>
          </NSpace>
        </NForm>

        <div class="flex items-center justify-between">
          <div class="text-14px font-500">按钮列表</div>
          <NButton size="small" @click="load" :loading="loading">刷新</NButton>
        </div>

        <NTable size="small" :single-line="false">
          <thead>
            <tr>
              <th style="width: 180px">code</th>
              <th>说明</th>
              <th style="width: 70px">排序</th>
              <th style="width: 70px">状态</th>
              <th style="width: 150px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, index) in rows" :key="r.id">
              <td>
                <div class="break-all">{{ r.code }}</div>
              </td>
              <td>
                <NInput v-if="r.editing" v-model:value="(r.description as any)" size="small" />
                <div v-else>{{ r.description }}</div>
              </td>
              <td>
                <NInputNumber v-if="r.editing" v-model:value="(r.order as any)" size="small" :min="0" />
                <div v-else>{{ r.order }}</div>
              </td>
              <td>
                <NButton size="tiny" tertiary @click="toggleStatus(r)">
                  <NTag :type="r.status === 'ENABLED' ? 'success' : 'warning'">{{ r.status }}</NTag>
                </NButton>
              </td>
              <td>
                <NSpace>
                  <NButton v-if="!r.editing" size="small" type="primary" ghost @click="startEdit(r)">编辑</NButton>
                  <NButton v-else size="small" type="primary" @click="saveEdit(r)">保存</NButton>
                  <NButton size="small" quaternary :disabled="index === 0" @click="moveUp(index)">上移</NButton>
                  <NButton size="small" quaternary :disabled="index === rows.length - 1" @click="moveDown(index)">下移</NButton>
                  <NPopconfirm @positive-click="remove(r)">
                    <template #trigger>
                      <NButton size="small" type="error" ghost>删除</NButton>
                    </template>
                    确认删除该按钮？
                  </NPopconfirm>
                </NSpace>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="text-center py-12px">暂无按钮</td>
            </tr>
          </tbody>
        </NTable>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>
