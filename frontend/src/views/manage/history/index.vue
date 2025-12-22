<script setup lang="ts">
import { ref } from 'vue';
import AmisRenderer from '@/components/amis-renderer/amis.vue';

defineOptions({
  name: 'ManageHistoryPage'
});

const amisRef = ref();

// AMIS Schema for history pages management
const schema = ref({
  "type": "page",
  "body": [
    {
      "type": "crud",
      "syncLocation": false,
      "api": {
        "method": "post",
        "url": "/lowcode/history/list",
        "data": {
          "&": "$$",
          "mainId": "${mainId}",
          "versionNum": "${versionNum}",
          "pageNum": "${page}",
          "pageSize": "${perPage}"
        },
        "adaptor": "",
        "messages": {},
        "requestAdaptor": ""
      },
      "bulkActions": [],
      "id": "u:5d449ca9aeda",
      "alwaysShowPagination": true,
      "messages": {},
      "filterEnabledList": [
        {
          "label": "菜单页面",
          "value": "menuPage"
        },
        {
          "label": "页面版本",
          "value": "pageVersion"
        }
      ],
      "filter": {
        "title": "",
        "columnCount": 3,
        "mode": "horizontal",
        "body": [
          {
            "type": "select",
            "name": "mainId",
            "label": "菜单页面",
            "placeholder": "请选择菜单页面",
            "clearable": true,
            "source": {
              "method": "get",
              "url": "/lowcode/pages/list"
            },
            "id": "u:4c26739d27e1"
          },
          {
            "type": "select",
            "name": "versionNum",
            "label": "页面版本",
            "placeholder": "请选择页面版本",
            "clearable": true,
            "source": {
              "method": "get",
              "url": "/version/list"
            },
            "id": "u:a2673af7cbb5"
          }
        ],
        "actions": [
          {
            "type": "submit",
            "label": "查询",
            "primary": true,
            "id": "u:515d44162bbf"
          },
          {
            "type": "reset",
            "label": "重置",
            "id": "u:eec61d9ad98e"
          }
        ],
        "bodyClassName": "ag-bg-light antd-Panel-body",
        "actionsClassName": "ag-bg-light-important antd-Panel-btnToolbar antd-Panel-footer",
        "id": "u:22c21392853c",
        "feat": "Insert"
      },
      "onEvent": {
        "fetchInited": {
          "weight": 0,
          "actions": [
            {
              "ignoreError": false,
              "script": "// 动态列浏览器缓存 导出用\nwindow.__JSFunc.dynimicColumnCache(context, event);",
              "actionType": "custom"
            }
          ]
        }
      },
      "headerToolbar": [
        "bulkActions",
        {
          "type": "columns-toggler",
          "align": "right",
          "draggable": true
        }
      ],
      "footerToolbar": [
        {
          "type": "statistics"
        },
        {
          "type": "pagination",
          "align": "right",
          "behavior": "Pagination",
          "layout": [
            "perPage",
            "pager"
          ],
          "perPage": 10
        }
      ],
      "autoFillHeight": true,
      "rowClassNameExpr": "${index % 2 ? 'bg-gray-100' : ''}",
      "perPageAvailable": [
        5,
        10,
        20,
        50,
        100
      ],
      "dynimicColumnKey": "98b5254b",
      "columns": [
        {
          "label": "菜单页面",
          "name": "menuPage",
          "searchable": false,
          "id": "u:ecac59ebdb8f",
          "type": "text"
        },
        {
          "label": "页面版本",
          "name": "pageVersion",
          "searchable": false,
          "id": "u:295a6524cc54",
          "type": "text"
        },
        {
          "label": "创建时间",
          "type": "datetime",
          "name": "createdAt",
          "format": "YYYY-MM-DD HH:mm:ss",
          "sortable": true,
          "id": "u:7d929c12eb2a",
          "placeholder": "-"
        },
        {
          "label": "创建人",
          "name": "creator",
          "id": "u:6fe55179a8d1",
          "type": "text"
        },
        {
          "label": "操作",
          "type": "operation",
          "buttons": [
            {
              "type": "button",
              "label": "查看页面",
              "level": "link",
              "actionType": "url",
              "url": "/lowcode-designer?pageId=${pageId}&versionId=${id}",
              "blank": true,
              "id": "u:eaa20bfc6e2d"
            },
            {
              "type": "button",
              "label": "删除",
              "level": "link",
              "className": "text-danger",
              "actionType": "ajax",
              "confirmText": "确认删除此历史版本吗？",
              "api": {
                "method": "post",
                "url": "/lowcode/history/delete",
                "data": {
                  "id": "${id}"
                }
              },
              "id": "u:9d8397e793a0"
            }
          ],
          "id": "u:60801c5a92d5"
        }
      ]
    }
  ],
  "title": "历史页面管理",
  "id": "u:4ec12592c3e4",
  "asideResizor": false,
  "pullRefresh": {
    "disabled": true
  },
  "regions": [
    "body"
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
