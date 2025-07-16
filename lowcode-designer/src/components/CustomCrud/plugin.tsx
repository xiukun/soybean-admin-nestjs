import { CRUDPlugin, ScaffoldForm, defaultValue, getI18nEnabled, getSchemaTpl } from 'amis-editor'

import { getEnv } from 'mobx-state-tree'
import { normalizeApi, normalizeApiResponseData, uuidv4, guid } from 'amis-core'
import { toast } from 'amis-ui'
import { dataModelTablePlugin } from '@/components/common/json/data-model-table-plugin'
import findLastIndex from 'lodash/findLastIndex'
import cloneDeep from 'lodash/cloneDeep'
import { bulkDeleteBtnSchema, generateApiUrl } from './utils'

interface ColumnItem {
  label: string
  type: string
  name: string
}

// 将展现控件转成编辑控件
const viewTypeToEditType = (type: string) => {
  return type === 'tpl'
    ? 'input-text'
    : type === 'status' || type === 'mapping'
      ? 'select'
      : `input-${type}`
}

export class CrudPluginRefactor extends CRUDPlugin {
  constructor(props: any) {
    super(props)
    this.events.push({
      eventName: 'quickSaveSucc',
      eventLabel: '批量编辑保存成功',
      description: '快速编辑完后保存成功触发',
      dataSchema: [
        {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              title: '数据',
              properties: {
                result: {
                  type: 'object',
                  title: '响应数据'
                },
                rows: {
                  type: 'array',
                  title: '修改了的行集合',
                },
                rowsDiff: {
                  type: 'array',
                  title: '与 rows 不同的地方时，对象中只有修改的部分和主键字段',
                },
                indexes: {
                  type: 'array',
                  title: '修改的行索引，如果是树形模式，下标是字符串路劲如 0.1',
                },
                rowsOrigin: {
                  type: 'array',
                  title: '原始数据',
                }
              },
            },
          },
        },
      ],
    })
  }
  // tags = ['重构组件']

  // priority = 100

  get scaffoldForm(): ScaffoldForm {
    const i18nEnabled = getI18nEnabled()
    return {
      title: '增删改查快速开始-CRUD(新)',
      body: [
        {
          type: 'grid',
          columns: [
            {
              body: [
                getSchemaTpl('switch', {
                  name: 'enableDynimicColumn',
                  label: '是否开启动态列',
                  clearValueOnHidden: true,
                  labelRemark: `指定表格是否开启动态列功能，动态列功能会根据数据源自动生成显示的表格列，通过列选择器进行设置显示/隐藏及排序。`,
                }),
              ],
            },
            {
              body: [
                {
                  name: 'dynimicColumnKey',
                  type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                  label: '',
                  readOnly: true,
                },
              ],
            },
          ],
        },

        getSchemaTpl('apiControl', {
          label: '接口地址',
          sampleBuilder: (_schema: any) =>
            JSON.stringify(
              {
                status: 0,
                msg: '',
                data: {
                  items: [{ id: 1, engine: 'Webkit' }],
                  total: 1,
                },
              },
              null,
              2,
            ),
        }),
        {
          type: 'button',
          label: '格式校验并自动生成列配置',
          className: 'm-b-sm',
          visibleOn: '${api.url || api && ISTYPE(api, "string")}',
          onClick: async (e: Event, props: any) => {
            const data = props.data;
            const schemaFilter = getEnv(
              (window as any).editorStore
            ).schemaFilter;
            let api: any = data.api;
            // 主要是给爱速搭中替换 url
            if (schemaFilter) {
              api = schemaFilter({
                api: data.api
              }).api;
            }
            const response = await props.env.fetcher(api, data);
            const result = normalizeApiResponseData(response.data);
            let autoFillKeyValues: Array<any> = [];
            let items = result?.items ?? result?.rows;

            /** 非标返回，取data中的第一个数组作为返回值，和AMIS中处理逻辑同步 */
            if (!Array.isArray(items)) {
              for (const key of Object.keys(result)) {
                if (result.hasOwnProperty(key) && Array.isArray(result[key])) {
                  items = result[key];
                  break;
                }
              }
            }

            if (Array.isArray(items) && items[0]) {
              Object.keys(items[0]).forEach((key: any) => {
                const value = items[0][key];
                autoFillKeyValues.push({
                  label: key,
                  type: 'text',
                  name: key
                });
              });
              props.formStore.setValues({
                columns: autoFillKeyValues
              });
            } else {
              toast.warning(
                'API返回格式不正确，请点击接口地址右侧示例查看CRUD数据接口结构要求'
              );
            }
          }
        },
        dataModelTablePlugin,
        {
          name: '__features',
          label: '启用功能',
          type: 'checkboxes',
          joinValues: false,
          extractValue: true,
          itemClassName: 'max-w-lg',
          options: [
            { label: '添加', value: 'create' },
            { label: '查询', value: 'filter' },
            { label: '批量删除', value: 'bulkDelete' },
            { label: '批量修改', value: 'bulkUpdate' },
            { label: '操作栏-编辑', value: 'update' },
            { label: '操作栏-查看详情', value: 'view' },
            { label: '操作栏-删除', value: 'delete' },
          ],
        },
        {
          type: 'group',
          body: [
            {
              columnRatio: 10,
              type: 'checkboxes',
              label: '启用的查询字段',
              name: 'filterEnabledList',
              joinValues: false,
              source:
                '${ARRAYMAP(ARRAYFILTER(columns, item => item.name), item => ({label: item.label || item.name, value: item.name}))}'
            },
            {
              columnRatio: 2,
              type: 'input-number',
              label: '每列显示几个字段',
              value: 3,
              name: '__filterColumnCount',
            },
          ],
          visibleOn: "${__features && CONTAINS(__features, 'filter')}",
        },
        {
          type: 'button',
          label: '开启排序',
          onEvent: {
            click: {
              actions: [
                {
                  componentId: 'drag-input-table',
                  actionType: 'initDrag',
                },
              ],
            },
          },
        },
        {
          id: 'drag-input-table',
          name: 'columns',
          type: 'input-table',
          label: false,
          addable: true,
          removable: true,
          needConfirm: false,
          itemDraggableOn: true,
          columns: [
            {
              type: i18nEnabled ? 'input-text-i18n' : 'input-text',
              name: 'label',
              label: '标题',
            },
            {
              type: 'input-text',
              name: 'name',
              label: '绑定字段名',
            },
            {
              type: 'select',
              name: 'type',
              label: '类型',
              value: 'text',
              options: [
                {
                  value: 'text',
                  label: '纯文本',
                },
                {
                  value: 'tpl',
                  label: '模板',
                },
                {
                  value: 'image',
                  label: '图片',
                },
                {
                  value: 'date',
                  label: '日期',
                },
                {
                  value: 'datetime',
                  label: '日期时间',
                },
                {
                  value: 'time',
                  label: '时间',
                },
                {
                  value: 'progress',
                  label: '进度',
                },
                {
                  value: 'status',
                  label: '状态',
                },
                {
                  value: 'mapping',
                  label: '映射',
                },
                {
                  value: 'operation',
                  label: '操作栏',
                },
              ],
            },
          ],
        },
      ],
      pipeIn: (value: any) => {
        if (!value.dynimicColumnKey) {
          value.dynimicColumnKey = uuidv4().substring(0, 8)
        }
        if(value.alwaysShowPagination === undefined) {
          value.alwaysShowPagination = true
        }

        const __features = []
        // 收集 filter
        if (value.filter) {
          __features.push('filter')
        }
        // 收集 列操作
        const lastIndex = findLastIndex(
          value.columns || [],
          (item: any) => item.type === 'operation',
        )
        if (lastIndex !== -1) {
          const operBtns: Array<string> = ['update', 'view', 'delete']
          ;(value.columns[lastIndex].buttons || []).forEach((btn: any) => {
            if (operBtns.includes(btn.editorSetting?.behavior || '')) {
              __features.push(btn.editorSetting?.behavior)
            }
          })
        }
        // 收集批量操作
        if (Array.isArray(value.bulkActions)) {
          value.bulkActions.forEach((item: any) => {
            if (item.editorSetting?.behavior) {
              __features.push(item.editorSetting?.behavior)
            }
          })
        }
        // 收集新增
        if (
          Array.isArray(value.headerToolbar) &&
          value.headerToolbar.some((item: any) => item.editorSetting?.behavior === 'create')
        ) {
          __features.push('create')
        }
        return {
          ...value,
          ...(value.mode !== 'table'
            ? {
                columns:
                  value.columns ||
                  this.transformByMode({
                    from: value.mode,
                    to: 'table',
                    schema: value,
                  }),
              }
            : {}),
          __filterColumnCount: value?.filter?.columnCount || 3,
          __features: __features,
          __LastFeatures: [...__features],
        }
      },
      pipeOut: (value: any) => {
        let valueSchema = cloneDeep(value)
        // 初始化生成表格ID，给批量删除的刷新事件使用
        if(!valueSchema.id) {
          valueSchema.id = `u:${guid()}`
        }
        /** 统一api格式 */
        valueSchema.api =
          typeof valueSchema.api === 'string' ? normalizeApi(valueSchema.api) : valueSchema.api

        const features: string[] = valueSchema.__features
        const lastFeatures: string[] = valueSchema.__LastFeatures
        const willAddedList = features.filter(item => !lastFeatures.includes(item))
        const willRemoveList = lastFeatures.filter(item => !features.includes(item))

        const operButtons: any[] = []
        const operBtns: string[] = ['update', 'view', 'delete']

        if (!valueSchema.bulkActions) {
          valueSchema.bulkActions = []
        } else {
          // 删除 未勾选的批量操作
          valueSchema.bulkActions = valueSchema.bulkActions.filter(
            (item: any) => !willRemoveList.includes(item.editorSetting?.behavior),
          )
        }

        // 删除 未勾选的 filter
        if (willRemoveList.includes('filter') && valueSchema.filter) {
          delete valueSchema.filter
        }

        // 删除 未勾选的 新增
        if (willRemoveList.includes('create') && Array.isArray(valueSchema.headerToolbar)) {
          valueSchema.headerToolbar = valueSchema.headerToolbar.filter(
            (item: any) => item.editorSetting?.behavior !== 'create',
          )
        }

        willAddedList.length &&
          willAddedList.forEach((item: string) => {
            if (operBtns.includes(item)) {
              // 列操作按钮
              let schema
              if (item === 'update') {
                schema = cloneDeep(this.btnSchemas.update)
                schema.dialog.body.api = generateApiUrl(valueSchema.api, 'update')
                schema.dialog.body.body = value.columns
                  .filter(({ type }: any) => type !== 'progress' && type !== 'operation')
                  .map(({ type, ...rest }: any) => ({
                    ...rest,
                    type: viewTypeToEditType(type),
                  }))
              } else if (item === 'view') {
                schema = cloneDeep(this.btnSchemas.view)
                schema.dialog.body.body = value.columns.map(({ type, ...rest }: any) => ({
                  ...rest,
                  type: 'static',
                }))
              } else if (item === 'delete') {
                schema = cloneDeep(this.btnSchemas.delete)
                const newApi = { ...valueSchema.api }
                newApi.url = generateApiUrl(newApi, 'delete')
                newApi.data = { id: '${id}' }
                schema.api = valueSchema.api?.method?.match(/^(post|delete)$/i)
                  ? newApi
                  : { ...newApi, method: 'post' }
              }
              schema && operButtons.push(schema)
            } else {
              // 批量操作
              if (item === 'bulkUpdate') {
                this.addItem(valueSchema.bulkActions, cloneDeep(this.btnSchemas.bulkUpdate))
              }

              if (item === 'bulkDelete') {
                // const bulkDeleteSchema = cloneDeep(this.btnSchemas.bulkDelete)
                const bulkDeleteSchema: any = cloneDeep(bulkDeleteBtnSchema({
                  method: 'post',
                  url: generateApiUrl(valueSchema.api, 'bulkDelete'),
                  data: {
                    ids: '${ids}',
                  },
                }))
                bulkDeleteSchema.onEvent.click.actions.push({
                  "componentId": valueSchema.id,
                  "groupType": "component",
                  "actionType": "reload",
                  "description": "重新加载表格数据"
                })
                // @ts-ignore
                // bulkDeleteSchema.api = {
                //   method: 'post',
                //   url: generateApiUrl(valueSchema.api, 'bulkDelete'),
                //   data: {
                //     ids: '${ids}',
                //   },
                // }
                
                this.addItem(valueSchema.bulkActions, bulkDeleteSchema)
              }

              // 创建
              if (item === 'create') {
                const createSchemaBase = this.btnSchemas.create
                createSchemaBase.label = '添加'
                const newApi = { ...valueSchema.api }
                newApi.url = generateApiUrl(newApi, 'create')
                createSchemaBase.dialog.title = '添加'
                createSchemaBase.dialog.body = {
                  type: 'form',
                  api: valueSchema.api?.method?.match(/^(post|put)$/i)
                    ? newApi
                    : { ...newApi, method: 'post' },
                  body: valueSchema.columns
                    .filter(({ type }: any) => type !== 'progress' && type !== 'operation')
                    .map((column: ColumnItem) => {
                      const type = column.type
                      return {
                        type: viewTypeToEditType(type),
                        name: column.name,
                        label: column.label,
                      }
                    }),
                }
                valueSchema.headerToolbar = [createSchemaBase, 'bulkActions']

                console.log(valueSchema.headerToolbar, valueSchema)
              }
              // 查询
              let keysFilter = Object.keys(valueSchema.filter || {})
              if (item === 'filter' && !keysFilter.length) {
                if (valueSchema.filterEnabledList) {
                  valueSchema.filter = {
                    title: '',
                    // title: '查询条件',
                  }
                  valueSchema.filter.columnCount = value.__filterColumnCount
                  valueSchema.filter.mode = 'horizontal'
                  valueSchema.filter.body = valueSchema.filterEnabledList.map((item: any) => {
                    const columnType = valueSchema.columns.find((i: any) => i.name == item.value)
                    return {
                      type: columnType ? viewTypeToEditType(columnType.type) : 'input-text',
                      label: columnType ? columnType.label : item.label,
                      name: item.value,
                    }
                  })
                  // 开启搜索栏默认增加重置，查询按钮
                  if (!valueSchema.filter?.actions?.length) {
                    valueSchema.filter.actions = [
                      {
                        type: 'submit',
                        label: '查询',
                        primary: true,
                      },
                      {
                        type: 'reset',
                        label: '重置',
                      },
                      {
                        type: 'button',
                        label: '全部导出',
                        onEvent: {
                          click: {
                            actions: [
                              {
                                ignoreError: false,
                                actionType: 'download',
                                api: {
                                  url: '/system/ExcelExport/exportCsv',
                                  method: 'post',
                                  requestAdaptor: '',
                                  adaptor: '',
                                  messages: {},
                                  data: {
                                    '&': '$$',
                                    perPage: 30000,
                                    page: 1,
                                    headerInfo:
                                      "${getExportColumnsConfig({\nkey:'" +
                                      valueSchema.dynimicColumnKey +
                                      "',\nsourceUrl:'" +
                                      valueSchema.api?.url +
                                      "'\n})}",
                                  },
                                  responseType: 'blob',
                                },
                              },
                            ],
                          },
                        },
                      },
                      {
                        type: 'button',
                        label: '清空动态列',
                        onEvent: {
                          click: {
                            actions: [
                              {
                                ignoreError: false,
                                script:
                                  '// 清空动态列（接口+浏览器缓存），第三个参数为true，则清空\nwindow.__JSFunc.dynimicColumnSave(context, event, true)',
                                actionType: 'custom',
                              },
                            ],
                          },
                        },
                        visibleOn: '${dynimicColumnKey}',
                      },
                    ]
                    valueSchema.filter.bodyClassName = 'ag-bg-light antd-Panel-body'
                    valueSchema.filter.actionsClassName =
                      'ag-bg-light-important antd-Panel-btnToolbar antd-Panel-footer'
                  }
                }
              }
            }
          })

        // 处理列操作按钮
        const lastIndex = findLastIndex(
          value.columns || [],
          (item: any) => item.type === 'operation',
        )
        if (lastIndex === -1) {
          if (operButtons.length) {
            valueSchema.columns.push({
              type: 'operation',
              label: '操作',
              buttons: operButtons,
            })
          }
        } else {
          const operColumn = valueSchema.columns[lastIndex]
          operColumn.buttons = (operColumn.buttons || [])
            .filter((btn: any) => !willRemoveList.includes(btn.editorSetting?.behavior))
            .concat(operButtons)
        }

        let {
          card,
          columns,
          listItem,
          headerToolbar,
          footerToolbar,
          autoFillHeight,
          rowClassNameExpr,
          perPageAvailable,
          dynimicColumnKey,
          ...rest
        } = valueSchema

        // 增加动态列逻辑
        if (!dynimicColumnKey) {
          dynimicColumnKey = uuidv4().substring(0, 8)
        }
        // 新增加列操作逻辑
        const columnsTogglerItem = {
          type: 'columns-toggler',
          align: 'right',
          draggable: true,
        }
        if (!Array.isArray(headerToolbar)) {
          headerToolbar = [
            {
              type: 'bulk-actions',
              tpl: '操作栏',
            },
            columnsTogglerItem,
          ]
        } else if (!headerToolbar.some((item: any) => item.type == 'columns-toggler')) {
          headerToolbar.push(columnsTogglerItem)
        }
        if (autoFillHeight === undefined) {
          autoFillHeight = true
        }
        if (!Array.isArray(footerToolbar)) {
          // 增加分页逻辑
          footerToolbar = [
            {
              type: 'statistics',
            },
            {
              type: 'pagination',
              align: 'right',
              behavior: 'Pagination',
              layout: ['perPage', 'pager'],
              perPage: 10,
            },
          ]
        }
        // 增加行样式逻辑
        if (!rowClassNameExpr) {
          rowClassNameExpr = "${index % 2 ? 'bg-gray-100' : ''}"
        }
        // 增加分页逻辑
        if (!perPageAvailable) {
          perPageAvailable = [10, 20, 50, 100, 200]
        }
        // 如果启用了动态列，api 请求和响应需要带上动态列参数
        if (rest.enableDynimicColumn && dynimicColumnKey) {
          // 如果 api 请求没有处理动态列，需要手动添加
          if (rest.api.requestAdaptor?.length < 20) {
            rest.api.requestAdaptor = `return {\n  ...api,\n  data: {\n    ...api.data,\n    dynimicColumnKey: "${dynimicColumnKey}" // 表格动态列唯一KEY\n  }\n}`
          }
          // 如果 api 响应没有处理动态列，需要手动添加
          if (rest.api.adaptor?.length < 20) {
            rest.api.adaptor = `if (window.__JSEditStatus && payload.data.columns) {\n  delete payload.data.columns;\n}\npayload.data.dynimicColumnKey = "${dynimicColumnKey}"\nreturn payload;`
          }
          const customColumnToggled = {
            ignoreError: false,
            script: '// 动态列保存\nwindow.__JSFunc.dynimicColumnSave(context, event)',
            actionType: 'custom',
            args: {},
          }
          // 动态列保存事件，需要手动添加
          if (rest.onEvent && rest.onEvent.columnToggled) {
            if (rest.onEvent.columnToggled.actions?.length > 0) {
              if (
                !rest.onEvent.columnToggled.actions.find((item: any) =>
                  item?.script.includes('window.__JSFunc.dynimicColumnSave'),
                )
              ) {
                rest.onEvent.columnToggled.actions.unshfit(customColumnToggled)
              }
            } else {
              rest.onEvent.columnToggled.actions = [customColumnToggled]
            }
          } else if (rest.onEvent) {
            rest.onEvent.columnToggled = {
              weight: 0,
              actions: [customColumnToggled],
            }
          } else if (!rest.onEvent) {
            rest.onEvent = {
              columnToggled: {
                weight: 0,
                actions: [customColumnToggled],
              },
            }
          }
        }
        // 动态列浏览器缓存事件，需要手动添加
        const customColumnCache = {
          ignoreError: false,
          script: '// 动态列浏览器缓存 导出用\nwindow.__JSFunc.dynimicColumnCache(context, event);',
          actionType: 'custom',
        }
        if (rest.onEvent && rest.onEvent.fetchInited) {
          if (rest.onEvent.fetchInited.actions?.length > 0) {
            if (
              !rest.onEvent.fetchInited.actions.find((item: any) =>
                item?.script.includes('window.__JSFunc.dynimicColumnCache'),
              )
            ) {
              rest.onEvent.fetchInited.actions.unshfit({
                weight: 0,
                actions: [customColumnCache],
              })
            }
          } else {
            rest.onEvent.fetchInited.actions = [customColumnCache]
          }
        } else if (rest.onEvent) {
          rest.onEvent.fetchInited = {
            weight: 0,
            actions: [customColumnCache],
          }
        } else if (!rest.onEvent) {
          rest.onEvent = {
            fetchInited: {
              weight: 0,
              actions: [customColumnCache],
            },
          }
        }

        // rest.api
        return {
          ...rest,
          headerToolbar,
          footerToolbar,
          autoFillHeight,
          rowClassNameExpr,
          perPageAvailable,
          dynimicColumnKey,
          ...(valueSchema.mode === 'cards'
            ? {
                card: this.transformByMode({
                  from: 'table',
                  to: 'cards',
                  schema: valueSchema,
                }),
              }
            : valueSchema.mode === 'list'
              ? {
                  listItem: this.transformByMode({
                    from: 'table',
                    to: 'list',
                    schema: valueSchema,
                  }),
                }
              : columns
                ? { columns }
                : {}),
          __origin: 'scaffold', // 无需重新生成 ID，避免破坏事件动作
        }
      },
      canRebuild: true,
    }
  }
}

export const id = CrudPluginRefactor.id
