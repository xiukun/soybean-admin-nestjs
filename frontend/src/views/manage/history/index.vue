<script setup lang="ts">
import { defineOptions, ref } from 'vue';
import AmisRenderer from '@/components/amis-renderer/amis.vue';

defineOptions({
  name: 'ManageHistoryPage'
});

const amisRef = ref();

// AMIS Schema for history pages management
const schema = ref({
  type: 'page',
  title: '历史页面管理',
  body: [
    {
      type: 'crud',
      syncLocation: false,
      api: {
        method: 'post',
        url: '/api/lowcode/history/list',
        data: {
          '&': '$$',
          mainId: '${mainId}',
          versionNum: '${versionNum}',
          pageNum: '${page}',
          pageSize: '${perPage}'
        },
        adaptor: 'return { ...payload, data: payload.options || [] };'
      },
      headerToolbar: [
        {
          type: 'form',
          wrapWithPanel: false,
          mode: 'inline',
          body: [
            {
              type: 'select',
              name: 'mainId',
              label: '菜单页面',
              placeholder: '请选择菜单页面',
              clearable: true,
              source: {
                method: 'get',
                url: '/api/lowcode/pages/list'
              }
            },
            {
              type: 'select',
              name: 'versionNum',
              label: '页面版本',
              placeholder: '请选择页面版本',
              clearable: true,
              source: {
                method: 'get',
                url: '/api/version/list'
              }
            },
            {
              type: 'submit',
              label: '搜索',
              level: 'primary'
            },
            {
              type: 'reset',
              label: '重置'
            }
          ]
        },
        'bulkActions',
        {
          type: 'button',
          label: '批量删除',
          actionType: 'ajax',
          level: 'danger',
          confirmText: '确认删除选中的历史版本吗？',
          api: {
            method: 'post',
            url: '/api/lowcode/history/batch-delete',
            data: {
              ids: '${ids}'
            }
          }
        }
      ],
      bulkActions: [
        {
          label: '批量删除',
          actionType: 'ajax',
          api: {
            method: 'post',
            url: '/api/lowcode/history/batch-delete',
            data: {
              ids: '${ids}'
            }
          },
          confirmText: '确认删除选中的 ${ids.length} 条历史版本吗？'
        }
      ],
      columns: [
        {
          name: 'menuPage',
          label: '菜单页面',
          searchable: false
        },
        {
          name: 'pageVersion',
          label: '页面版本',
          searchable: false
        },
        {
          name: 'createdAt',
          label: '创建时间',
          type: 'datetime',
          format: 'YYYY-MM-DD HH:mm:ss',
          sortable: true
        },
        {
          name: 'creator',
          label: '创建人'
        },
        {
          type: 'operation',
          label: '操作',
          buttons: [
            {
              type: 'button',
              label: '查看页面',
              level: 'link',
              actionType: 'url',
              url: '/lowcode-designer?pageId=${pageId}&versionId=${id}',
              blank: true
            },
            {
              type: 'button',
              label: '删除',
              level: 'link',
              className: 'text-danger',
              actionType: 'ajax',
              confirmText: '确认删除此历史版本吗？',
              api: {
                method: 'post',
                url: '/api/lowcode/history/delete',
                data: {
                  id: '${id}'
                }
              }
            }
          ]
        }
      ]
    }
  ]
});
</script>

<template>
  <div class="maita-amis-container">
    <AmisRenderer ref="amisRef" :schema="schema" />
  </div>
</template>

<style lang="scss" scoped>
.maita-amis-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
