<script setup lang="ts">
import { defineOptions, ref } from 'vue';
import AmisRenderer from '@/components/amis-renderer/amis.vue';

defineOptions({
  name: 'ManageVersionPage'
});

const amisRef = ref();

// AMIS Schema for version management
const schema = ref({
  type: 'page',
  body: [
    {
      type: 'crud',
      syncLocation: false,
      api: {
        method: 'post',
        url: '/version/list',
        data: {
          '&': '$$',
          versionNum: '${versionNum}'
        }
      },
      headerToolbar: [
        {
          type: 'search-box',
          name: 'versionNum',
          placeholder: '请输入版本号搜索',
          clearable: true
        },
        {
          type: 'button',
          label: '新建版本',
          actionType: 'dialog',
          level: 'primary',
          dialog: {
            title: '新增版本',
            size: 'md',
            body: {
              type: 'form',
              api: {
                method: 'post',
                url: '/version/create'
              },
              body: [
                {
                  type: 'input-text',
                  name: 'versionName',
                  label: '版本名称',
                  required: true,
                  placeholder: '请输入版本名称'
                },
                {
                  type: 'input-text',
                  name: 'versionNum',
                  label: '版本号',
                  required: true,
                  placeholder: '请输入版本号（如：1.0.0）',
                  validations: {
                    matchRegexp: '/^\\d+\\.\\d+\\.\\d+$/'
                  },
                  validationErrors: {
                    matchRegexp: '版本号格式不正确，应为：x.y.z'
                  }
                },
                {
                  type: 'textarea',
                  name: 'description',
                  label: '描述',
                  placeholder: '请输入版本描述'
                }
              ]
            }
          }
        }
      ],
      columns: [
        {
          name: 'versionName',
          label: '版本名称',
          searchable: false
        },
        {
          name: 'versionNum',
          label: '版本号',
          searchable: false
        },
        {
          name: 'status',
          label: '状态',
          type: 'mapping',
          map: {
            ENABLED: "<span class='label label-success'>启用</span>",
            DISABLED: "<span class='label label-default'>关闭</span>"
          }
        },
        {
          name: 'createdAt',
          label: '发布时间',
          type: 'datetime',
          format: 'YYYY-MM-DD HH:mm:ss'
        },
        {
          type: 'operation',
          label: '操作',
          buttons: [
            {
              type: 'button',
              label: '详情',
              level: 'link',
              actionType: 'dialog',
              dialog: {
                title: '版本详情',
                size: 'md',
                body: {
                  type: 'form',
                  mode: 'horizontal',
                  wrapWithPanel: false,
                  body: [
                    {
                      type: 'static',
                      name: 'versionName',
                      label: '版本名称'
                    },
                    {
                      type: 'static',
                      name: 'versionNum',
                      label: '版本号'
                    },
                    {
                      type: 'static-mapping',
                      name: 'status',
                      label: '状态',
                      map: {
                        ENABLED: '启用',
                        DISABLED: '关闭'
                      }
                    },
                    {
                      type: 'static',
                      name: 'createdBy',
                      label: '发布人'
                    },
                    {
                      type: 'static-datetime',
                      name: 'createdAt',
                      label: '发布时间',
                      format: 'YYYY-MM-DD HH:mm:ss'
                    },
                    {
                      type: 'static',
                      name: 'description',
                      label: '描述'
                    }
                  ]
                }
              }
            },
            {
              type: 'button',
              label: '修改',
              level: 'link',
              actionType: 'dialog',
              dialog: {
                title: '编辑版本',
                size: 'md',
                body: {
                  type: 'form',
                  api: {
                    method: 'post',
                    url: '/version/update',
                  },
                  body: [
                    {
                      type: 'hidden',
                      name: 'id'
                    },
                    {
                      type: 'input-text',
                      name: 'versionName',
                      label: '版本名称',
                      required: true
                    },
                    {
                      type: 'input-text',
                      name: 'versionNum',
                      label: '版本号',
                      required: true,
                      validations: {
                        matchRegexp: '/^\\d+\\.\\d+\\.\\d+$/'
                      }
                    },
                    {
                      type: 'textarea',
                      name: 'description',
                      label: '描述'
                    }
                  ]
                }
              }
            },
            {
              type: 'button',
              label: '启用',
              level: 'link',
              actionType: 'ajax',
              visibleOn: "${status === 'DISABLED'}",
              confirmText: '启用此版本将关闭其他版本，确认启用吗？',
              api: {
                method: 'post',
                url: '/version/enable',
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
