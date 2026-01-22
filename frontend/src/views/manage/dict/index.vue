<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { DataTableColumns, TreeOption } from 'naive-ui';
import {
  NButton,
  NCard,
  NDataTable,
  NDivider,
  NInput,
  NPopconfirm,
  NTree,
  NForm,
  NFormItem,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NTag
} from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { request } from '@/service/request';
import { preloadDictAllOnce } from '@/utils/amisFilters';
type Dict = {
  id: string;
  name: string;
  code: string;
  pid: string;
  sequence: number;
  status: Api.Common.EnableStatus;
  remark?: string | null;
};

type DictItem = {
  id: string;
  dictId: string;
  label: string;
  dictValue: string;
  sequence: number;
  status: Api.Common.EnableStatus;
  remark?: string | null;
};

type DictForm = Pick<Dict, 'name' | 'pid' | 'sequence' | 'code' | 'status' | 'remark'>;

type DictItemForm = Pick<DictItem, 'label' | 'dictValue' | 'sequence' | 'status' | 'remark'>;

// ---------------- dict (left) ----------------

const { bool: dictModalVisible, setTrue: openDictModal, setFalse: closeDictModal } = useBoolean();
const dictOperateType = ref<'add' | 'edit'>('add');
const editingDictId = ref<string | null>(null);

const dictLoading = ref(false);
const dictList = ref<Dict[]>([]);
const dictTree = ref<TreeOption[]>([]);
const treeKeyword = ref('');
const selectedTreeKeys = ref<string[]>([]);

const filteredDictTree = computed<TreeOption[]>(() => {
  const kw = treeKeyword.value.trim().toLowerCase();
  if (!kw) return dictTree.value;

  const filter = (nodes: TreeOption[]): TreeOption[] => {
    const result: TreeOption[] = [];

    for (const n of nodes) {
      const children = Array.isArray(n.children) ? (n.children as TreeOption[]) : [];
      const nextChildren = children.length ? filter(children) : [];
      const selfMatched = String(n.label ?? '').toLowerCase().includes(kw);

      if (selfMatched || nextChildren.length) {
        result.push({ ...n, children: nextChildren });
      }
    }

    return result;
  };

  return filter(dictTree.value);
});


const dictForm = reactive<DictForm>({
  name: '',
  pid: '0',
  sequence: 0,
  code: '',
  status: 'ENABLED',
  remark: null
});

const dictModalTitle = computed(() => (dictOperateType.value === 'add' ? '新增' : '编辑') + '字典');

async function getDictList() {
  dictLoading.value = true;
  const [listRes, treeRes] = await Promise.all([
    request<Dict[]>({ url: '/dict', method: 'get' }),
    request<any[]>({ url: '/dict/tree', method: 'get' })
  ]);
  dictLoading.value = false;

  dictList.value = listRes.data || [];
  dictTree.value = ((treeRes.data || []) as any[]).map(toTreeOption);

  // default select first node
  if (!selectedDict.value && dictTree.value.length) {
    const first = dictTree.value[0];
    selectedTreeKeys.value = [String(first.key)];
    handleSelectTreeNode(first);
  }

  // keep selection valid
  if (selectedDict.value && !dictList.value.some(d => d.id === selectedDict.value?.id)) {
    selectedDict.value = null;
    dictItems.value = [];
  }
}

function toTreeOption(node: any): TreeOption {
  return {
    key: String(node.id),
    label: `${node.name}（${node.code}）`,
    // keep raw for selection to Dict
    raw: node as Dict,
    children: (node.children || []).map(toTreeOption)
  } as any;
}

function resetDictForm() {
  dictForm.name = '';
  dictForm.pid = '0';
  dictForm.sequence = 0;
  dictForm.code = '';
  dictForm.status = 'ENABLED';
  dictForm.remark = null;
}

function handleAddDict() {
  dictOperateType.value = 'add';
  editingDictId.value = null;
  resetDictForm();
  dictForm.pid = '0';
  dictForm.sequence = 0;
  openDictModal();
}

function handleEditDict(row: Dict) {
  dictOperateType.value = 'edit';
  editingDictId.value = row.id;
  dictForm.name = row.name;
  dictForm.pid = (row as any).pid ?? '0';
  dictForm.sequence = (row as any).sequence ?? 0;
  dictForm.code = row.code;
  dictForm.status = row.status;
  dictForm.remark = row.remark ?? null;
  openDictModal();
}

async function handleDeleteDict(id: string) {
  const { error } = await request({ url: `/dict/${id}`, method: 'delete' });
  if (error) {
    return;
  }
  window.$message?.success('删除成功');
  await getDictList();
}

const dictCacheLoading = ref(false);

async function handleUpdateDictCache() {
  if (dictCacheLoading.value) return;

  dictCacheLoading.value = true;
  try {
    await preloadDictAllOnce();
    window.$message?.success('字典缓存已更新');
  } catch {
    // ignore
  } finally {
    dictCacheLoading.value = false;
  }
}

async function handleSubmitDict() {
  if (dictOperateType.value === 'add') {
    await request({ url: '/dict', method: 'post', data: dictForm });
    window.$message?.success('新增成功');
  } else if (editingDictId.value) {
    await request({ url: `/dict/${editingDictId.value}`, method: 'put', data: dictForm });
    window.$message?.success('修改成功');
  }
  closeDictModal();
  await getDictList();
}

// ---------------- dict items (right) ----------------

const selectedDict = ref<Dict | null>(null);
const itemsLoading = ref(false);
const dictItems = ref<DictItem[]>([]);
const checkedItemKeys = ref<string[]>([]);

const { bool: itemModalVisible, setTrue: openItemModal, setFalse: closeItemModal } = useBoolean();
const itemOperateType = ref<'add' | 'edit'>('add');
const editingItemId = ref<string | null>(null);

const itemForm = reactive<DictItemForm>({
  label: '',
  dictValue: '',
  sequence: 0,
  status: 'ENABLED',
  remark: null
});

const itemModalTitle = computed(() => `${itemOperateType.value === 'add' ? '新增' : '编辑'}字典项`);

async function loadItems(dictId: string) {
  itemsLoading.value = true;
  const res = await request<DictItem[]>({ url: `/dict/${dictId}/items`, method: 'get' });
  itemsLoading.value = false;
  dictItems.value = res.data || [];
  checkedItemKeys.value = [];
}

function resetItemForm() {
  itemForm.label = '';
  itemForm.dictValue = '';
  itemForm.sequence = 0;
  itemForm.status = 'ENABLED';
  itemForm.remark = null;
}

function handleSelectDict(row: Dict) {
  selectedDict.value = row;
  loadItems(row.id);
}

function handleSelectTreeNode(option: any) {
  const row = option?.raw as Dict | undefined;
  if (!row) return;
  selectedDict.value = row;
  loadItems(row.id);
}

function handleAddItem() {
  if (!selectedDict.value) {
    window.$message?.warning('请先选择一个字典');
    return;
  }
  itemOperateType.value = 'add';
  editingItemId.value = null;
  resetItemForm();
  openItemModal();
}

function handleEditItem(row: DictItem) {
  itemOperateType.value = 'edit';
  editingItemId.value = row.id;
  itemForm.label = row.label;
  itemForm.dictValue = row.dictValue;
  itemForm.sequence = row.sequence ?? 0;
  itemForm.status = row.status;
  itemForm.remark = row.remark ?? null;
  openItemModal();
}

async function handleDeleteItem(row: DictItem) {
  if (!selectedDict.value) return;
  await request({ url: `/dict/${selectedDict.value.id}/items/${row.id}`, method: 'delete' });
  window.$message?.success('删除成功');
  await loadItems(selectedDict.value.id);
}

async function handleBatchDeleteItems() {
  if (!selectedDict.value) return;
  const ids = checkedItemKeys.value;
  if (!ids.length) return;

  const { error } = await request({
    url: `/dict/${selectedDict.value.id}/items/batch-delete`,
    method: 'post',
    data: { ids }
  });
  if (error) return;

  window.$message?.success('删除成功');
  await loadItems(selectedDict.value.id);
}

async function handleSubmitItem() {
  if (!selectedDict.value) return;

  if (itemOperateType.value === 'add') {
    const { error } = await request({
      url: `/dict/${selectedDict.value.id}/items`,
      method: 'post',
      data: itemForm
    });
    if (error) return;
    window.$message?.success('新增成功');
  } else if (editingItemId.value) {
    const { error } = await request({
      url: `/dict/${selectedDict.value.id}/items/${editingItemId.value}`,
      method: 'put',
      data: itemForm
    });
    if (error) return;
    window.$message?.success('修改成功');
  }

  closeItemModal();
  await loadItems(selectedDict.value.id);
}

const statusTagMap: Record<Api.Common.EnableStatus, 'success' | 'warning'> = {
  ENABLED: 'success',
  DISABLED: 'warning'
};

const dictColumns = computed<DataTableColumns<Dict>>(() => [
{
    key: 'name',
    title: '名称',
    align: 'center'
  },
  {
    key: 'code',
    title: '编码',
    align: 'center'
  },
  {
    key: 'status',
    title: '状态',
    align: 'center',
    render: row => {      return <NTag type={statusTagMap[row.status]}>{row.status}</NTag>;
    }
  },
  {
    key: 'operate',
    title: '操作',
    align: 'center',
    render: row => (
      <NSpace justify="center">
        <NButton size="small" type="primary" ghost onClick={() => handleSelectDict(row)}>
          选择
        </NButton>
        <NButton size="small" type="primary" ghost onClick={() => handleEditDict(row)}>
          编辑
        </NButton>
        <NButton size="small" type="error" ghost onClick={() => handleDeleteDict(row.id)}>
          删除
        </NButton>
      </NSpace>
    )
  }
]);

const itemColumns = computed<DataTableColumns<DictItem>>(() => [
  {
    type: 'selection',
    align: 'center',
    width: 48
  },
  { key: 'label', title: '标签', align: 'center' },
  { key: 'dictValue', title: '值', align: 'center' },
  // { key: 'sequence', title: '排序', align: 'center', width: 80 },
  {
    key: 'status',
    title: '状态',
    align: 'center',
    width: 90,
    render: row => {
      return <NTag type={statusTagMap[row.status]}>{row.status}</NTag>;
    }
  },
  {
    key: 'operate',
    title: '操作',
    align: 'center',
    width: 140,
    render: row => (
      <NSpace justify="center">
        <NButton size="small" type="primary" ghost onClick={() => handleEditItem(row)}>
          编辑
        </NButton>
        <NButton size="small" type="error" ghost onClick={() => handleDeleteItem(row)}>
          删除
        </NButton>
      </NSpace>
    )
  }
]);

getDictList();
</script>

<template>
  <NCard title="" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
    <div class="flex gap-16px">
      <!-- left: dict -->
      <div class="w-1/2">
        <div class="mb-12px flex items-center justify-between">
          <div class="text-14px font-500">字典目录（树）</div>
          <NSpace>
            <NButton type="primary" @click="handleAddDict">新增</NButton>
            <NButton :disabled="!selectedDict" @click="selectedDict && handleEditDict(selectedDict)">
              编辑
            </NButton>
            <NPopconfirm
              :disabled="!selectedDict"
              @positive-click="selectedDict && handleDeleteDict(selectedDict.id)"
            >
              <template #trigger>
                <NButton type="error" ghost :disabled="!selectedDict">删除</NButton>
              </template>
              确认删除该字典目录？
            </NPopconfirm>
            <NButton @click="getDictList" :loading="dictLoading">刷新</NButton>
            <NButton :loading="dictCacheLoading" @click="handleUpdateDictCache">更新字典</NButton>
          </NSpace>
        </div>

        <div class="mb-12px">
          <NInput v-model:value="treeKeyword" clearable placeholder="搜索字典目录" />
        </div>

        <NTree
          v-model:selected-keys="selectedTreeKeys"
          :data="filteredDictTree"
          block-line
          expand-on-click
          default-expand-all
          selectable
          virtual-scroll
          class="h-420px"
          @update:selected-keys="(_keys, options) => handleSelectTreeNode(options?.[0])"
        />
      </div>

      <NDivider vertical />

      <!-- right: dict items -->
      <div class="w-1/2">
        <div class="mb-12px flex items-center justify-between">
          <div class="text-14px font-500">
            字典项
            <span v-if="selectedDict" class="text-12px text-gray-500">
              （{{ selectedDict.name }} / {{ selectedDict.code }}）
            </span>
          </div>

          <NSpace>
            <NButton type="primary" :disabled="!selectedDict" @click="handleAddItem">新增</NButton>

            <NPopconfirm
              :disabled="!selectedDict || checkedItemKeys.length === 0"
              @positive-click="handleBatchDeleteItems"
            >
              <template #trigger>
                <NButton type="error" ghost :disabled="!selectedDict || checkedItemKeys.length === 0">
                  批量删除
                </NButton>
              </template>
              确认批量删除已选字典项？
            </NPopconfirm>

            <NButton :disabled="!selectedDict" @click="selectedDict && loadItems(selectedDict.id)" :loading="itemsLoading">
              刷新
            </NButton>
          </NSpace>
        </div>        <NDataTable
          v-model:checked-row-keys="checkedItemKeys"
          :columns="itemColumns"
          :data="dictItems"
          :loading="itemsLoading"
          size="small"
          :row-key="row => row.id"
        />
      </div>
    </div>

    <!-- dict modal -->
    <NModal v-model:show="dictModalVisible" :title="dictModalTitle" preset="card" class="w-520px">
      <NForm label-placement="left" :label-width="80">
        <NFormItem label="名称">
          <NInput v-model:value="dictForm.name" placeholder="请输入名称" />
        </NFormItem>
        <NFormItem label="父节点">
          <NSelect
            v-model:value="dictForm.pid"
            :options="[{ label: '根节点', value: '0' }, ...dictList.map(d => ({ label: `${d.name}（${d.code}）`, value: d.id }))]"
            filterable
            clearable
          />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="dictForm.sequence" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem label="编码">
          <NInput v-model:value="dictForm.code" placeholder="请输入编码" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="dictForm.remark" placeholder="请输入备注" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton quaternary @click="closeDictModal">取消</NButton>
          <NButton type="primary" @click="handleSubmitDict">确认</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- item modal -->
    <NModal v-model:show="itemModalVisible" :title="itemModalTitle" preset="card" class="w-560px">
      <NForm label-placement="left" :label-width="90">
        <NFormItem label="标签">
          <NInput v-model:value="itemForm.label" placeholder="例如：启用" />
        </NFormItem>
        <NFormItem label="值">
          <NInput v-model:value="itemForm.dictValue" placeholder="例如：ENABLED" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="itemForm.sequence" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="itemForm.remark" placeholder="请输入备注" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton quaternary @click="closeItemModal">取消</NButton>
          <NButton type="primary" @click="handleSubmitItem">确认</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>

<style scoped></style>
