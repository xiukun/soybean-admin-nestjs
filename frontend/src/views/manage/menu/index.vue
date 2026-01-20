<script setup lang="tsx">
// @ts-nocheck

import { ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NDropdown, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { yesOrNoRecord } from '@/constants/common';
import { enableStatusRecord, menuTypeRecord } from '@/constants/business';
import { deleteRoute, fetchGetMenuList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable, useTableOperate } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import MenuOperateModal, { type OperateType } from './modules/menu-operate-modal.vue';
import MenuButtonDrawer from './modules/menu-button-drawer.vue';

const appStore = useAppStore();

const { bool: visible, setTrue: openModal } = useBoolean();

const { bool: buttonDrawerVisible, setTrue: openButtonDrawer, setFalse: closeButtonDrawer } = useBoolean();
const buttonDrawerMenuId = ref<number | null>(null);
const buttonDrawerMenuType = ref<Api.SystemManage.MenuType | null>(null);
function handleManageButtons(row: Api.SystemManage.Menu) {
  // Api typings: id 为 string，这里统一转 number
  buttonDrawerMenuId.value = Number(row.id);
  buttonDrawerMenuType.value = row.menuType;
  openButtonDrawer();
}

const wrapperRef = ref<HTMLElement | null>(null);

const { columns, columnChecks, data, loading, getData, getDataByPage } = useTable({
  apiFn: fetchGetMenuList as any,
  columns: () => [

    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'id',
      title: $t('page.manage.menu.id'),
      align: 'center'
    },
    {
      key: 'menuType',
      title: $t('page.manage.menu.menuType'),
      align: 'center',
      width: 80,
      render: row => {
        const tagMap: Record<Api.SystemManage.MenuType, NaiveUI.ThemeColor> = {
          directory: 'default',
          menu: 'primary',
          lowcode: 'info'
        };

        const label = $t(menuTypeRecord[row.menuType]);

        return <NTag type={tagMap[row.menuType]}>{label}</NTag>;
      }
    },
    {
      key: 'menuName',
      title: $t('page.manage.menu.menuName'),
      align: 'center',
      minWidth: 120,
      render: row => {
        const { i18nKey, menuName } = row;

        const label = i18nKey ? $t(i18nKey) : menuName;

        return <span>{label}</span>;
      }
    },
    {
      key: 'icon',
      title: $t('page.manage.menu.icon'),
      align: 'center',
      width: 60,
      render: row => {
        const icon = row.iconType === 1 ? row.icon : undefined;

        const localIcon = row.iconType === 2 ? row.icon : undefined;

        return (
          <div class="flex-center">
            <SvgIcon icon={icon} localIcon={localIcon} class="text-icon" />
          </div>
        );
      }
    },
    {
      key: 'routeName',
      title: $t('page.manage.menu.routeName'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'routePath',
      title: $t('page.manage.menu.routePath'),
      align: 'center',
      minWidth: 120
    },
    {
      key: 'status',
      title: $t('page.manage.menu.menuStatus'),
      align: 'center',
      width: 80,
      render: row => {
        if (row.status === null || row.status === undefined) {
          return null;
        }

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          ENABLED: 'success',
          DISABLED: 'warning'
        };

        const statusKey = enableStatusRecord[row.status];
        if (!statusKey) {
          return <NTag type="default">{row.status}</NTag>;
        }

        const label = $t(statusKey);

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'hideInMenu',
      title: $t('page.manage.menu.hideInMenu'),
      align: 'center',
      width: 80,
      render: row => {
        const hide: CommonType.YesOrNo = row.hideInMenu ? 'Y' : 'N';

        const tagMap: Record<CommonType.YesOrNo, NaiveUI.ThemeColor> = {
          Y: 'error',
          N: 'default'
        };

        const label = $t(yesOrNoRecord[hide]);

        return <NTag type={tagMap[hide]}>{label}</NTag>;
      }
    },
    {
      key: 'pid',
      title: $t('page.manage.menu.parentId'),
      width: 90,
      align: 'center'
    },
    {
      key: 'order',
      title: $t('page.manage.menu.order'),
      align: 'center',
      width: 60
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 260,
      render: row => {
        const options = [
          {
            label: '按钮管理',
            key: 'buttons'
          },
          {
            label: $t('common.delete'),
            key: 'delete'
          }
        ];

        return (
          <div class="flex-center justify-end gap-12px">
            {row.menuType === 'directory' && (
              <NButton
                
                type="primary"
                ghost
                size="small"
                onClick={() => handleAddChildMenu(row)}
              >
                {$t('page.manage.menu.addChildMenu')}
              </NButton>
            )}
            <NButton type="primary" ghost size="small" onClick={() => handleEdit(row)}>
              {$t('common.edit')}
            </NButton>
            <NDropdown
              options={options}
              trigger="click"
              onSelect={(key: string) => {
                if (key === 'buttons') {
                  handleManageButtons(row);
                } else if (key === 'delete') {
                  confirmDelete(row.id);
                }
              }}
            >
              <NButton size="small" type="default" ghost>
                更多
              </NButton>
            </NDropdown>
          </div>
        );
      }
    }
  ]
});

const { checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(data, getData);

const operateType = ref<OperateType>('add');

function handleAdd() {
  operateType.value = 'add';
  openModal();
}

async function handleBatchDelete() {
  // request
  console.log(checkedRowKeys.value);

  onBatchDeleted();
}

async function handleDelete(id: number) {
  // request
  const { error } = await deleteRoute(id);
  if (error) return;
  await onDeleted();
}

function confirmDelete(id: number) {
  window.$dialog?.warning({
    title: $t('common.warning'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await handleDelete(id);
    }
  });
}

/** the edit menu data or the parent menu data when adding a child menu */
const editingData: Ref<Api.SystemManage.Menu | null> = ref(null);

function handleEdit(item: Api.SystemManage.Menu) {
  operateType.value = 'edit';
  editingData.value = { ...item };

  openModal();
}

function handleAddChildMenu(item: Api.SystemManage.Menu) {
  operateType.value = 'addChild';

  editingData.value = { ...item };

  openModal();
}

const allPages = ref<string[]>([]);

// async function getAllPages() {
//   const { data: pages } = await fetchGetAllPages();
//   allPages.value = pages || [];
// }

// function init() {
//   getAllPages();
// }

// init
// init();
</script>

<template>
  <div ref="wrapperRef" class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <MenuButtonDrawer
      v-model:show="buttonDrawerVisible"
      :menu-id="buttonDrawerMenuId"
      :menu-type="buttonDrawerMenuType"
    />

    <MenuOperateModal
      v-model:visible="visible"
      :operate-type="operateType"
      :row-data="editingData"
      :all-pages="allPages"
      @submitted="getData"
      @open-buttons="({ id, menuType }) => { buttonDrawerMenuId.value = id; buttonDrawerMenuType.value = menuType; openButtonDrawer(); }"
    />
    <NCard :title="$t('page.manage.menu.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
          <!-- 注意：TableHeaderOperation 内部按钮无法直接加指令，这里仅对表格行内操作按钮做权限隐藏 -->
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1088"
        :loading="loading"
        :row-key="row => row.id"
        remote
        class="sm:h-full"
      />

    </NCard>
  </div>
</template>

<style scoped></style>
