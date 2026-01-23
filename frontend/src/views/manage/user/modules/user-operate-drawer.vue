<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { TreeOption } from 'naive-ui';
import { enableStatusOptions } from '@/constants/business';
import type { UserCreateModel, UserUpdateModel } from '@/service/api';
import { createUser, updateUser, fetchGetDeptTree } from '@/service/api';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { $t } from '@/locales';

type UserFormModel = UserCreateModel & Partial<Pick<UserUpdateModel, 'id'>>;

// 部门树选项
const deptTreeOptions = ref<TreeOption[]>([]);

async function loadDeptOptions() {
  const { data, error } = await fetchGetDeptTree();
  if (error || !data) return;

  const buildTreeOptions = (nodes: any[]): TreeOption[] => {
    return nodes.map(node => ({
      key: node.id,
      label: `${node.name}（${node.code}）`,
      children: node.children && node.children.length ? buildTreeOptions(node.children) : []
    }));
  };
  deptTreeOptions.value = buildTreeOptions(data);
}

onMounted(() => {
  loadDeptOptions();
});

defineOptions({
  name: 'UserOperateDrawer'
});

interface Props {
  /** the type of operation */
  operateType: NaiveUI.TableOperateType;
  /** the edit row data */
  rowData?: (Api.SystemManage.User & {
    departments?: Array<{
      id: string;
      name: string;
      code: string;
    }>;
  }) | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useNaiveForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<NaiveUI.TableOperateType, string> = {
    add: $t('page.manage.user.addUser'),
    edit: $t('page.manage.user.editUser')
  };
  return titles[props.operateType];
});

const model: UserFormModel = reactive(createDefaultModel());

function createDefaultModel(): UserFormModel {
  return {
    username: '',
    password: '',
    domain: 'built-in',
    nickName: '',
    phoneNumber: '',
    email: '',
    status: 'ENABLED' as Api.Common.EnableStatus,
    avatar: null,
    deptIds: []
  };
}

type RuleKey = Extract<keyof UserFormModel, 'username' | 'nickName' | 'status' | 'domain'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  username: defaultRequiredRule,
  nickName: defaultRequiredRule,
  domain: defaultRequiredRule,
  status: defaultRequiredRule
};

/** the enabled role options */
// const roleOptions = ref<CommonType.Option<string>[]>([]);
//
// async function getRoleOptions() {
//   const { error, data } = await fetchGetAllRoles();
//
//   if (!error) {
//     const options = data.map(item => ({
//       label: item.roleName,
//       value: item.roleCode
//     }));
//
//     // the mock data does not have the roleCode, so fill it
//     // if the real request, remove the following code
//     const userRoleOptions = model.userRoles.map(item => ({
//       label: item,
//       value: item
//     }));
//     // end
//
//     roleOptions.value = [...userRoleOptions, ...options];
//   }
// }

function handleInitModel() {
  Object.assign(model, createDefaultModel());

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, props.rowData);
    // 处理部门数据
    const departments = props.rowData.departments || [];
    model.deptIds = departments.map(d => d.id);
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();
  // request
  if (props.operateType === 'add') {
    const createData: UserCreateModel = {
      username: model.username,
      password: model.password,
      domain: model.domain,
      nickName: model.nickName,
      phoneNumber: model.phoneNumber,
      email: model.email,
      status: model.status,
      avatar: model.avatar,
      deptIds: model.deptIds || []
    };
    const { error } = await createUser(createData);
    if (error) return;
    window.$message?.success($t('common.addSuccess'));
  } else {
    if (!model.id) {
      window.$message?.error('用户ID不能为空');
      return;
    }
    const updateData: UserUpdateModel = {
      id: model.id,
      username: model.username,
      nickName: model.nickName,
      phoneNumber: model.phoneNumber,
      email: model.email,
      status: model.status,
      avatar: model.avatar,
      deptIds: model.deptIds || []
    };
    const { error } = await updateUser(updateData);
    if (error) return;
    window.$message?.success($t('common.updateSuccess'));
  }
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
    // getRoleOptions();
  }
});
</script>

<template>
  <NDrawer v-model:show="visible" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="$t('page.manage.user.userName')" path="username">
          <NInput v-model:value="model.username" :placeholder="$t('page.manage.user.form.userName')" />
        </NFormItem>
        <NFormItem v-if="props.operateType === 'add'" :label="$t('page.manage.user.password')" path="password">
          <NInput v-model:value="model.password" :placeholder="$t('page.manage.user.form.password')" />
        </NFormItem>
        <NFormItem v-if="props.operateType === 'add'" :label="$t('page.manage.user.domain')" path="domain">
          <NInput v-model:value="model.domain" :placeholder="$t('page.manage.user.form.domain')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.user.nickName')" path="nickName">
          <NInput v-model:value="model.nickName" :placeholder="$t('page.manage.user.form.nickName')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.user.userPhone')" path="userPhone">
          <NInput v-model:value="model.phoneNumber" :placeholder="$t('page.manage.user.form.userPhone')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.user.userEmail')" path="email">
          <NInput v-model:value="model.email" :placeholder="$t('page.manage.user.form.userEmail')" />
        </NFormItem>
        <NFormItem :label="$t('page.manage.user.userStatus')" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="所属部门" path="deptIds">
          <NTreeSelect
            v-model:value="model.deptIds"
            :options="deptTreeOptions"
            placeholder="请选择部门（可多选）"
            multiple
            filterable
            clearable
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
