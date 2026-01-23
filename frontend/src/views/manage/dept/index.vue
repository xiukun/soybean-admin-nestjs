<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { TreeOption } from 'naive-ui';
import {
  NButton,
  NCard,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
  NTree
} from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { enableStatusRecord } from '@/constants/business';
import { $t } from '@/locales';
import {
  fetchGetDeptList,
  fetchGetDeptTree,
  createDept,
  updateDept,
  deleteDept
} from '@/service/api';

type Dept = {
  id: string;
  name: string;
  code: string;
  pid: string;
  sequence: number;
  status: Api.Common.EnableStatus;
  remark?: string | null;
};

type DeptForm = Pick<Dept, 'name' | 'pid' | 'sequence' | 'code' | 'status' | 'remark'>;

const { bool: deptModalVisible, setTrue: openDeptModal, setFalse: closeDeptModal } = useBoolean();
const deptOperateType = ref<'add' | 'edit'>('add');
const editingDeptId = ref<string | null>(null);
const selectedParentDept = ref<Dept | null>(null);

const deptLoading = ref(false);
const deptList = ref<Dept[]>([]);
const deptTree = ref<TreeOption[]>([]);
const treeKeyword = ref('');
const selectedTreeKeys = ref<string[]>([]);

const filteredDeptTree = computed<TreeOption[]>(() => {
  const kw = treeKeyword.value.trim().toLowerCase();
  if (!kw) return deptTree.value;

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

  return filter(deptTree.value);
});

const deptForm = reactive<DeptForm>({
  name: '',
  pid: '0',
  sequence: 0,
  code: '',
  status: 'ENABLED',
  remark: null
});

const deptModalTitle = computed(() => (deptOperateType.value === 'add' ? '新增' : '编辑') + '部门');

async function getDeptList() {
  deptLoading.value = true;
  const [listRes, treeRes] = await Promise.all([
    fetchGetDeptList(),
    fetchGetDeptTree()
  ]);
  deptLoading.value = false;

  if (listRes.error || treeRes.error) {
    window.$message?.error(listRes.error || treeRes.error || '获取部门列表失败');
    return;
  }

  deptList.value = listRes.data || [];
  deptTree.value = ((treeRes.data || []) as any[]).map(toTreeOption);

  // default select first node
  if (!selectedParentDept.value && deptTree.value.length) {
    const first = deptTree.value[0];
    selectedTreeKeys.value = [String(first.key)];
    handleSelectTreeNode(first);
  }

  // keep selection valid
  if (selectedParentDept.value && !deptList.value.some(d => d.id === selectedParentDept.value?.id)) {
    selectedParentDept.value = null;
  }
}

function toTreeOption(node: any): TreeOption {
  return {
    key: String(node.id),
    label: `${node.name}（${node.code}）`,
    raw: node as Dept,
    children: (node.children || []).map(toTreeOption)
  } as any;
}

function resetDeptForm() {
  deptForm.name = '';
  deptForm.pid = '0';
  deptForm.sequence = 0;
  deptForm.code = '';
  deptForm.status = 'ENABLED';
  deptForm.remark = null;
}

function handleAddDept() {
  deptOperateType.value = 'add';
  editingDeptId.value = null;
  resetDeptForm();
  deptForm.pid = selectedParentDept.value?.id || '0';
  deptForm.sequence = 0;
  openDeptModal();
}

function handleAddChildDept(parentDept: Dept) {
  deptOperateType.value = 'add';
  editingDeptId.value = null;
  resetDeptForm();
  deptForm.pid = parentDept.id;
  deptForm.sequence = 0;
  // 自动生成编码前缀（如果父部门编码为 001-01，子部门编码应该以 001-01- 开头）
  const parentCodePrefix = parentDept.code ? `${parentDept.code}-` : '';
  deptForm.code = parentCodePrefix;
  openDeptModal();
}

function handleEditDept(row: Dept) {
  deptOperateType.value = 'edit';
  editingDeptId.value = row.id;
  deptForm.name = row.name;
  deptForm.pid = row.pid ?? '0';
  deptForm.sequence = row.sequence ?? 0;
  deptForm.code = row.code;
  deptForm.status = row.status;
  deptForm.remark = row.remark ?? null;
  openDeptModal();
}

async function handleDeleteDept(id: string) {
  const { error } = await deleteDept(id);
  if (error) {
    window.$message?.error(error || '删除失败');
    return;
  }
  window.$message?.success('删除成功');
  await getDeptList();
}

async function handleSubmitDept() {
  if (deptOperateType.value === 'add') {
    const { error } = await createDept(deptForm);
    if (error) {
      window.$message?.error(error || '新增失败');
      return;
    }
    window.$message?.success('新增成功');
  } else if (editingDeptId.value) {
    const { error } = await updateDept(editingDeptId.value, deptForm);
    if (error) {
      window.$message?.error(error || '修改失败');
      return;
    }
    window.$message?.success('修改成功');
  }
  closeDeptModal();
  await getDeptList();
}

function handleSelectTreeNode(option: any) {
  const row = option?.raw as Dept | undefined;
  if (!row) return;
  selectedParentDept.value = row;
}

const statusTagMap: Record<Api.Common.EnableStatus, 'success' | 'warning'> = {
  ENABLED: 'success',
  DISABLED: 'warning'
};

// 构建部门选项列表（用于父部门选择）
const deptOptions = computed(() => {
  const options = [{ label: '根节点', value: '0' }];
  const addOptions = (nodes: any[]) => {
    for (const node of nodes) {
      options.push({
        label: `${node.name}（${node.code}）`,
        value: node.id
      });
      if (node.children && node.children.length) {
        addOptions(node.children);
      }
    }
  };
  addOptions(deptTree.value.map((n: any) => n.raw));
  return options;
});

getDeptList();
</script>

<template>
  <NCard title="部门管理" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
    <div class="flex gap-16px">
      <!-- left: dept tree -->
      <div class="w-full">
        <div class="mb-12px flex items-center justify-between">
          <div class="text-14px font-500">部门树</div>
          <NSpace>
            <NButton type="primary" @click="handleAddDept">新增根部门</NButton>
            <NButton
              :disabled="!selectedParentDept"
              @click="selectedParentDept && handleAddChildDept(selectedParentDept)"
            >
              添加子部门
            </NButton>
            <NButton
              :disabled="!selectedParentDept"
              @click="selectedParentDept && handleEditDept(selectedParentDept)"
            >
              编辑
            </NButton>
            <NPopconfirm
              :disabled="!selectedParentDept"
              @positive-click="selectedParentDept && handleDeleteDept(selectedParentDept.id)"
            >
              <template #trigger>
                <NButton type="error" ghost :disabled="!selectedParentDept">删除</NButton>
              </template>
              确认删除该部门？删除后无法恢复。
            </NPopconfirm>
            <NButton @click="getDeptList" :loading="deptLoading">刷新</NButton>
          </NSpace>
        </div>

        <div class="mb-12px">
          <NInput v-model:value="treeKeyword" clearable placeholder="搜索部门" />
        </div>

        <NTree
          v-model:selected-keys="selectedTreeKeys"
          :data="filteredDeptTree"
          block-line
          expand-on-click
          default-expand-all
          selectable
          virtual-scroll
          class="h-600px"
          @update:selected-keys="(_keys, options) => handleSelectTreeNode(options?.[0])"
        >
          <template #default="{ option }">
            <div class="flex items-center justify-between w-full">
              <span>{{ option.label }}</span>
              <NSpace size="small" @click.stop>
                <NButton
                  size="tiny"
                  type="primary"
                  ghost
                  @click="handleAddChildDept(option.raw)"
                >
                  添加子部门
                </NButton>
                <NButton size="tiny" type="primary" ghost @click="handleEditDept(option.raw)">
                  编辑
                </NButton>
                <NPopconfirm @positive-click="handleDeleteDept(option.key as string)">
                  <template #trigger>
                    <NButton size="tiny" type="error" ghost>删除</NButton>
                  </template>
                  确认删除该部门？
                </NPopconfirm>
              </NSpace>
            </div>
          </template>
        </NTree>
      </div>
    </div>

    <!-- dept modal -->
    <NModal v-model:show="deptModalVisible" :title="deptModalTitle" preset="card" class="w-520px">
      <NForm label-placement="left" :label-width="80">
        <NFormItem label="名称" required>
          <NInput v-model:value="deptForm.name" placeholder="请输入部门名称" />
        </NFormItem>
        <NFormItem label="父部门">
          <NSelect
            v-model:value="deptForm.pid"
            :options="deptOptions"
            filterable
            :disabled="deptOperateType === 'edit'"
          />
        </NFormItem>
        <NFormItem label="编码" required>
          <NInput v-model:value="deptForm.code" placeholder="请输入部门编码（层级编码）" />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber v-model:value="deptForm.sequence" :min="0" class="w-full" />
        </NFormItem>
        <NFormItem label="状态">
          <NSelect
            v-model:value="deptForm.status"
            :options="[
              { label: '启用', value: 'ENABLED' },
              { label: '禁用', value: 'DISABLED' }
            ]"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput v-model:value="deptForm.remark" placeholder="请输入备注" />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton quaternary @click="closeDeptModal">取消</NButton>
          <NButton type="primary" @click="handleSubmitDept">确认</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>

<style scoped></style>
