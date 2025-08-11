<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NCard, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';
import { fetchDeleteField, fetchGetFieldList, fetchMoveField } from '@/service/api';
import { fetchGetAllEntities } from '@/service/api/lowcode-entity';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import TableHeaderOperation from '@/components/advanced/table-header-operation.vue';
import FieldOperateDrawer from './modules/field-operate-drawer.vue';

const appStore = useAppStore();
const route = useRoute();

interface Props {
  entityId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  entityId: ''
});

// Entity selection state
const selectedEntityId = ref<string>('');
const entityOptions = ref<Array<{ label: string; value: string }>>([]);
const entityLoading = ref(false);

// Get entityId from props or route query
const currentEntityId = computed(() => {
  return props.entityId || (route.query.entityId as string) || selectedEntityId.value;
});

// Get current entity name for display
const currentEntityName = computed(() => {
  const entityId = currentEntityId.value;
  if (!entityId) return '';
  const entity = entityOptions.value.find(opt => opt.value === entityId);
  return entity?.label || '';
});

// Create a wrapper function for the API call
const getFieldListApi = (
  params: any
): Promise<NaiveUI.FlatResponseData<Api.Common.PaginatingQueryRecord<Api.Lowcode.Field>>> => {
  const entityId = currentEntityId.value;
  if (!entityId) {
    return Promise.resolve({
      data: {
        records: [] as Api.Lowcode.Field[],
        total: 0,
        current: 1,
        size: 10
      },
      error: null,
      response: {} as any
    });
  }

  // Transform the field array response to match the expected paginated format
  return fetchGetFieldList(entityId)
    .then(response => {
      const fields = response.data || [];
      return {
        data: {
          records: fields,
          total: fields.length,
          current: 1,
          size: fields.length
        },
        error: null,
        response: response.response
      };
    })
    .catch(error => {
      return {
        data: null,
        error,
        response: error.response
      };
    });
};

const { columns, columnChecks, data, loading, getData, mobilePagination, searchParams, resetSearchParams } = useTable({
  apiFn: getFieldListApi,
  showTotal: true,
  apiParams: {
    current: 1,
    size: 10
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'order',
      title: '排序',
      align: 'center',
      width: 80,
      render: (row, index) => {
        return (
          <NSpace justify="center">
            <span>{index + 1}</span>
            <NSpace vertical size={2}>
              <NButton
                size="tiny"
                type="primary"
                text
                disabled={index === 0}
                onClick={() => handleMoveField(row.id, 'up')}
              >
                ↑
              </NButton>
              <NButton
                size="tiny"
                type="primary"
                text
                disabled={index === data.value.length - 1}
                onClick={() => handleMoveField(row.id, 'down')}
              >
                ↓
              </NButton>
            </NSpace>
          </NSpace>
        );
      }
    },
    {
      key: 'name',
      title: $t('page.lowcode.field.name'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'code',
      title: $t('page.lowcode.field.code'),
      align: 'center',
      width: 120,
      render: row => <code>{row.code}</code>
    },
    {
      key: 'dataType',
      title: '数据类型',
      align: 'center',
      width: 120,
      render: row => {
        let typeDisplay = row.dataType;
        if (row.length && ['STRING'].includes(row.dataType)) {
          typeDisplay += `(${row.length})`;
        } else if (row.precision && ['DECIMAL'].includes(row.dataType)) {
          typeDisplay += `(${row.precision})`;
        }
        return <NTag type="info">{typeDisplay}</NTag>;
      }
    },
    {
      key: 'attributes' as any,
      title: '属性',
      align: 'center',
      width: 200,
      render: row => {
        const attributes = [];
        if (row.unique)
          attributes.push(
            <NTag type="warning" size="small">
              UK
            </NTag>
          );
        if (row.required)
          attributes.push(
            <NTag type="info" size="small">
              NN
            </NTag>
          );
        return <NSpace>{attributes}</NSpace>;
      }
    },
    {
      key: 'defaultValue',
      title: $t('page.lowcode.field.defaultValue'),
      align: 'center',
      width: 100,
      render: row => (row.defaultValue ? <code>{String(row.defaultValue)}</code> : '-')
    },
    {
      key: 'description',
      title: '描述',
      align: 'center',
      minWidth: 150,
      ellipsis: {
        tooltip: true
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 130,
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm
            onPositiveClick={() => handleDelete(row.id)}
            v-slots={{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {$t('common.delete')}
                </NButton>
              )
            }}
          />
        </div>
      )
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted } =
  useTableOperate(data as any, getData);

async function handleDelete(id: string) {
  await fetchDeleteField(id);
  await getData();
}

async function handleBatchDelete() {
  await Promise.all(checkedRowKeys.value.map(id => fetchDeleteField(id)));
  onBatchDeleted();
}

async function handleMoveField(id: string, direction: 'up' | 'down') {
  if (!currentEntityId.value) return;
  await fetchMoveField(id, direction);
  await getData();
}

// Load entities for selection
async function loadEntities() {
  if (props.entityId) return; // Don't load if entityId is provided as prop

  entityLoading.value = true;
  try {
    const projectId = route.query.projectId as string;
    if (projectId) {
      const { data } = await fetchGetAllEntities(projectId);
      if (data) {
        entityOptions.value = data.map(entity => ({
          label: entity.name,
          value: entity.id
        }));

        // 如果URL中有entityId参数，设置为默认选中
        const urlEntityId = route.query.entityId as string;
        if (urlEntityId && !selectedEntityId.value) {
          selectedEntityId.value = urlEntityId;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load entities:', error);
    window.$message?.error('加载实体列表失败');
  } finally {
    entityLoading.value = false;
  }
}

// Handle entity selection change
function handleEntityChange(entityId: string | null) {
  selectedEntityId.value = entityId || '';
  if (entityId) {
    getData();
  }
}

// Watch for entityId changes
watch(
  () => currentEntityId.value,
  () => {
    if (currentEntityId.value) {
      getData();
    }
  },
  { immediate: true }
);

// 监听路由参数变化
watch(
  () => route.query,
  newQuery => {
    const entityId = newQuery.entityId as string;
    const projectId = newQuery.projectId as string;

    if (entityId && entityId !== selectedEntityId.value) {
      selectedEntityId.value = entityId;
    }

    if (projectId) {
      loadEntities();
    }
  },
  { immediate: true }
);

// Load entities on component mount
onMounted(() => {
  loadEntities();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <!-- Entity selector when no entityId is provided -->
    <NCard v-if="!currentEntityId" :bordered="false" size="small">
      <NSpace align="center">
        <span>选择实体：</span>
        <NSelect
          v-model:value="selectedEntityId"
          :options="entityOptions"
          placeholder="请选择实体"
          style="width: 300px"
          :loading="entityLoading"
          clearable
          @update:value="handleEntityChange"
        />
      </NSpace>
    </NCard>

    <!-- 显示当前选中的实体信息 -->
    <NCard v-if="currentEntityId && currentEntityName" :bordered="false" size="small">
      <NSpace align="center">
        <NIcon><icon-mdi-table /></NIcon>
        <span>
          当前实体：
          <strong>{{ currentEntityName }}</strong>
        </span>
        <NTag type="info">{{ data.length }} 个字段</NTag>
      </NSpace>
    </NCard>

    <NCard :title="$t('page.lowcode.field.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
        :row-key="(row: any) => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
    </NCard>
    <FieldOperateDrawer
      v-model:visible="drawerVisible"
      :operate-type="operateType"
      :row-data="editingData as any"
      :entity-id="currentEntityId"
      @submitted="getData"
    />
  </div>
</template>

<style scoped></style>
