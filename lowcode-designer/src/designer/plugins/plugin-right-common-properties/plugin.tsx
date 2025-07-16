import { render as renderAmis } from 'amis'
import { uuidv4 } from 'amis-core'
import {
  BuildPanelEventContext,
  BasePlugin,
  BasicPanelItem,
  BaseEventContext,
  tipedLabel,
} from 'amis-editor'
/**
 * 右侧组件通用面板
 */
export default class RightCommonProperties extends BasePlugin {
  // static id = 'rightCommonPluginPanel'
  // 组件名称
  name = 'rightCommonPluginPanel'
  order = 9999

  panelBodyCreatorNew = (context: BaseEventContext) => {
    const list = ['page']
    const hasHidden = !list.includes(context.node.schema?.type)
    let enValue = context.node.schema?.['en-US']?.label // 英文变量值
    let classNameValue = context.node.schema?.className // 样式变量值
    let id = context.node.schema?.id // 组件ID
    return [
      {
        type: 'tabs',
        tabsMode: 'tiled',

        tabs: [
          {
            title: '常规',
            body: [
              {
                name: 'id',
                type: 'input-text',
                label: tipedLabel('组件ID', '唯一标识，用于后续引用组件，轻易不要修改，鼠标离开文本框后修改内容生效'),
                value: id,
                onEvent: {
                  blur: {
                    weight: 0,
                    actions: [
                      {
                        ignoreError: false,
                        script: (_c: any, _do: any, e: any) => {
                          let value = e.data.value || `p:${uuidv4().substring(0, 8)}`
                          context.node.updateSchema({
                            ...context.node.schema,
                            'id': value,
                          })
                        },
                        actionType: 'custom',
                        args: {},
                      },
                    ],
                  },
                },
              },
              hasHidden
                ? {
                    type: 'combo',
                    label: tipedLabel('英文名称', '失去焦点后修改内容生效'),
                    name: 'en-US',
                    multiple: false,
                    addable: false,
                    removable: false,
                    removableMode: 'icon',
                    items: [
                      {
                        type: 'input-text',
                        label: '',
                        name: 'label',
                        clearable: true,
                        value: enValue,
                        onEvent: {
                          blur: {
                            weight: 0,
                            actions: [
                              {
                                ignoreError: false,
                                script: (_c: any, _do: any, e: any) => {
                                  let en_name = e.data?.value ? e.data.value : undefined
                                  context.node.updateSchema({
                                    ...context.node.schema,
                                    'en-US': en_name ? { label: en_name } : undefined,
                                  })
                                },
                                actionType: 'custom',
                                args: {},
                              },
                            ],
                          },
                        },
                      },
                    ],
                    strictMode: true,
                    syncFields: [],
                    draggable: false,
                    flat: false,
                  }
                : undefined,
            ],
          },

          {
            title: '外观',
            body: [
              {
                name: 'className',
                type: 'input-text',
                label: tipedLabel('css类名', '失去焦点后修改内容生效'),
                creatable: true,
                clearable: true,
                value: classNameValue,
                options: [
                  {
                    label: '侧边栏固定宽度样式amis-page-aside-width',
                    value: 'amis-page-aside-width',
                  },
                  {
                    label: '内容区域滚动amis-page-content-scroll',
                    value: 'amis-page-content-scroll',
                  },
                  {
                    label: 'crud表格不换行amis-crud-table-display-row',
                    value: 'amis-crud-table-display-row',
                  },
                  {
                    label: 'crud编辑表格公式样式',
                    value: 'amis-crud-quick-edit-formula',
                  },
                  {
                    label: 'crud表格隐藏上工具栏crud-hidden-headerTool',
                    value: 'crud-hidden-headerTool',
                  },
                  {
                    label: 'crud表格隐藏下工具栏crud-hidden-footerTool',
                    value: 'crud-hidden-footerTool',
                  },
                  {
                    label: '自定义form搜索栏amis-form-search-box',
                    value: 'amis-form-search-box',
                  },
                  {
                    label: 'form表单组件极小间距amis-antd-Form-item-mini',
                    value: 'amis-antd-Form-item-mini',
                  },
                  {
                    label: 'drawer抽屉内容区域展示滚动',
                    value: 'amis-drawer-content-scroll',
                  },
                  {
                    label: 'h5 form的label独占1行',
                    value: 'amis-layout-from-one-line',
                  }
                ],

                onEvent: {
                  blur: {
                    weight: 0,
                    actions: [
                      {
                        ignoreError: false,
                        script: (_c: any, _do: any, e: any) => {
                          context.node.updateSchema({
                            ...context.node.schema,
                            className: e.data?.value,
                          })
                        },
                        actionType: 'custom',
                        args: {},
                      },
                    ],
                  },
                },
                // pipeOut: (value: any, _form: any) => {
                //   let className = value ? value : undefined
                //   this.debounceGenerateFields(context, className)

                //   console.log(className, 'out11...')
                //   return className
                // },
              },
            ],
          },
        ],
      },
    ]
  }

  buildEditorPanel(context: BuildPanelEventContext, panels: Array<BasicPanelItem>) {
    panels.push({
      key: new Date().getTime().toString(), // 每次都重新渲染
      title: '设置',
      icon: 'fa fa-cogs',

      render: () => {
        return <div className="p-3">{renderAmis(this.panelBodyCreatorNew(context) as any)}</div>
      },
    })
  }
}
