<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <TemplateSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard :title="$t('page.lowcode.template.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="columnChecks"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
    <TemplateOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData"
      :project-id="projectId"
      @submitted="getDataByPage"
    />
  </div>
</template>

<script setup lang="tsx">
import { reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { fetchDeleteTemplate, fetchGetTemplateList, fetchPublishTemplate } from '@/service/api';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { enableStatusRecord, enableStatusTag } from '@/constants/business';
import TemplateOperateDrawer from './modules/template-operate-drawer.vue';
import TemplateSearch from './modules/template-search.vue';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';

const appStore = useAppStore();

const props = defineProps<{
  projectId: string;
}>();

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  getDataByPage,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchGetTemplateList,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10,
    projectId: props.projectId
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'name',
      title: $t('page.lowcode.template.name'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'category',
      title: $t('page.lowcode.template.category'),
      align: 'center',
      width: 100,
      render: row => <NTag type="info">{row.category}</NTag>
    },
    {
      key: 'language',
      title: $t('page.lowcode.template.language'),
      align: 'center',
      width: 100,
      render: row => <NTag type="success">{row.language}</NTag>
    },
    {
      key: 'framework',
      title: $t('page.lowcode.template.framework'),
      align: 'center',
      width: 100,
      render: row => row.framework ? <NTag type="warning">{row.framework}</NTag> : '-'
    },
    {
      key: 'tags',
      title: $t('page.lowcode.template.tags'),
      align: 'center',
      width: 150,
      render: row => (
        <NSpace>
          {row.tags?.slice(0, 3).map((tag: string) => (
            <NTag key={tag} size="small" type="default">{tag}</NTag>
          ))}
          {row.tags?.length > 3 && <span>...</span>}
        </NSpace>
      )
    },
    {
      key: 'status',
      title: $t('common.status'),
      align: 'center',
      width: 100,
      render: row => {
        const tagMap: Record<Api.Lowcode.TemplateStatus, NaiveUI.ThemeColor> = {
          DRAFT: 'warning',
          PUBLISHED: 'success',
          DEPRECATED: 'error'
        };
        
        const label = $t(`page.lowcode.template.status.${row.status}`);
        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'usageCount',
      title: $t('page.lowcode.template.usageCount'),
      align: 'center',
      width: 80,
      render: row => row.usageCount || 0
    },
    {
      key: 'isPublic',
      title: $t('page.lowcode.template.isPublic'),
      align: 'center',
      width: 80,
      render: row => (
        <NTag type={row.isPublic ? 'success' : 'default'}>
          {row.isPublic ? $t('common.yes') : $t('common.no')}
        </NTag>
      )
    },
    {
      key: 'description',
      title: $t('page.lowcode.template.description'),
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'createdAt',
      title: $t('common.createTime'),
      align: 'center',
      width: 180,
      render: row => new Date(row.createdAt).toLocaleString()
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 200,
      render: row => (
        <div class="flex-center gap-8px">
          {row.status === 'DRAFT' && (
            <NButton type="success" ghost size="small" onClick={() => handlePublish(row.id)}>
              {$t('page.lowcode.template.publish')}
            </NButton>
          )}
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

const {
  drawerVisible,
  operateType,
  editingData,
  handleAdd,
  handleEdit,
  checkedRowKeys,
  onBatchDeleted
} = useTableOperate(data, getData);

async function handleDelete(id: string) {
  await fetchDeleteTemplate(id);
  await getDataByPage();
}

async function handleBatchDelete() {
  await Promise.all(checkedRowKeys.value.map(id => fetchDeleteTemplate(id)));
  onBatchDeleted();
}

async function handlePublish(id: string) {
  try {
    await fetchPublishTemplate(id);
    window.$message?.success($t('page.lowcode.template.publishSuccess'));
    await getDataByPage();
  } catch (error) {
    window.$message?.error($t('page.lowcode.template.publishFailed'));
  }
}

// Watch for projectId changes
watch(() => props.projectId, () => {
  if (props.projectId) {
    searchParams.projectId = props.projectId;
    getDataByPage();
  }
}, { immediate: true });
</script>

<style scoped></style>
