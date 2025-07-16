import { getVariable } from 'amis-core'
import { TableCellPlugin } from 'amis-editor'
import {
  BaseEventContext,
  defaultValue,
  getI18nEnabled,
  getSchemaTpl,
  tipedLabel,
} from 'amis-editor-core'
import { Button, Icon } from 'amis-ui'
import get from 'lodash/get'
import { dataModelItemPlugin, tplModeObj } from '../common/json/data-model-item-plugin'
import { flattenDeep } from 'lodash'

export type TableCell2DynamicControls = Partial<
  Record<
    'name' | 'key' | 'sortable' | 'relationBuildSetting' | 'searchable' | 'quickEdit' | 'popover',
    (context: BaseEventContext) => any
  >
>

export class TableCellPluginRefactor extends TableCellPlugin {
  // static id = 'TableCellPlugin'
  // panelTitle = '列配置'

  protected _dynamicControls: TableCell2DynamicControls = {
    /** 字段配置 */
    name: () =>
      getSchemaTpl('formItemName', {
        name: 'name',
        label: '列字段',
        visibleOn: 'this.name !== undefined || this.key === undefined',
      }),
    /** 字段配置，兼容key */
    key: () =>
      getSchemaTpl('formItemName', {
        name: 'key',
        label: '列字段',
        visibleOn: 'this.name === undefined && this.key',
      }),
    /** 排序配置 */
    sortable: () =>
      getSchemaTpl('switch', {
        name: 'sortable',
        hidden: this._isOpColumn,
        label: tipedLabel('可排序', '开启后可以根据当前列排序(后端排序)，接口类型将增加排序参数。'),
      }),
    /** 可搜索 */
    searchable: () => {
      return [
        getSchemaTpl('switch', {
          name: 'searchable',
          label: '可搜索',
          hidden: this._isOpColumn,
          pipeIn: (value: any) => !!value,
        }),
        {
          name: 'searchable',
          visibleOn: 'this.searchable',
          asFormItem: true,
          label: false,
          children: ({ value, onChange, data }: any) => {
            if (value === true) {
              value = {}
            } else if (typeof value === 'undefined') {
              value = getVariable(data, 'searchable')
            }

            const originMode = value.mode
            value = {
              ...value,
              type: 'form',
              mode: 'normal',
              wrapWithPanel: false,
              body: value?.body?.length
                ? value.body
                : [
                    {
                      type: 'input-text',
                      name: data.key,
                    },
                  ],
            }

            delete value.mode
            // todo 多个快速编辑表单模式看来只能代码模式编辑了。
            return (
              <Button
                className="w-full flex flex-col items-center"
                onClick={() => {
                  this.manager.openSubEditor({
                    title: '配置列搜索类型',
                    value: value,
                    onChange: value => {
                      onChange(value?.body?.[0] ? value?.body?.[0] : true, 'searchable')
                    },
                  })
                }}
              >
                <span className="inline-flex items-center">
                  <Icon icon="edit" className="mr-1 w-3" />
                  配置列搜索类型
                </span>
              </Button>
            )
          },
        },
      ]
    },
    /** 快速查看 */
    popover: () => {
      return {
        name: 'popOver',
        label: '弹出框',
        type: 'ae-switch-more',
        hidden: this._isOpColumn,
        mode: 'normal',
        formType: 'extend',
        bulk: true,
        defaultData: {
          popOver: {
            mode: 'popOver',
          },
        },
        trueValue: {
          mode: 'popOver',
          body: [
            {
              type: 'tpl',
              tpl: '弹出框内容',
            },
          ],
        },
        isChecked: (e: any) => {
          const { data, name } = e
          return get(data, name)
        },
        form: {
          body: [
            {
              name: 'popOver.mode',
              type: 'button-group-select',
              label: '模式',
              value: 'popOver',
              options: [
                {
                  label: '提示',
                  value: 'popOver',
                },
                {
                  label: '弹窗',
                  value: 'dialog',
                },
                {
                  label: '抽屉',
                  value: 'drawer',
                },
              ],
            },
            getSchemaTpl('formItemSize', {
              name: 'popOver.size',
              clearValueOnHidden: true,
              visibleOn: 'popOver.mode !== "popOver"',
            }),
            {
              type: 'select',
              name: 'popOver.position',
              label: '弹出位置',
              visibleOn: 'popOver.mode === "popOver"',
              options: ['center', 'left-top', 'right-top', 'left-bottom', 'right-bottom'],
              clearValueOnHidden: true,
            },
            {
              name: 'popOver.trigger',
              type: 'button-group-select',
              label: '触发方式',
              options: [
                {
                  label: '点击',
                  value: 'click',
                },
                {
                  label: '鼠标移入',
                  value: 'hover',
                },
              ],
              pipeIn: defaultValue('click'),
            },
            getSchemaTpl('switch', {
              name: 'popOver.showIcon',
              label: '显示图标',
              value: true,
            }),
            {
              type: 'input-text',
              name: 'popOver.title',
              label: '标题',
            },
            {
              name: 'popOver.body',
              asFormItem: true,
              label: false,
              children: ({ value, onBulkChange, onChange, name, data }: any) => {
                value = {
                  body:
                    value && value.body
                      ? value.body
                      : [
                          {
                            type: 'tpl',
                            tpl: '弹出框内容',
                          },
                        ],
                }

                return (
                  <Button
                    className="w-full flex flex-col items-center"
                    onClick={() => {
                      this.manager.openSubEditor({
                        title: '配置弹出框',
                        value: value,
                        onChange: value => {
                          onChange(
                            value
                              ? Array.isArray(value)
                                ? value
                                : value?.body
                                  ? value.body
                                  : []
                              : [],
                          )
                        },
                      })
                    }}
                  >
                    <span className="inline-flex items-center">
                      <Icon icon="edit" className="mr-1 w-3" />
                      配置弹出框
                    </span>
                  </Button>
                )
              },
            },
          ],
        },
      }
    },
    /** 快速编辑 */
    quickEdit: () => {
      return {
        name: 'quickEdit',
        label: tipedLabel('快速编辑', '输入框左侧或右侧的附加挂件'),
        type: 'ae-switch-more',
        hidden: this._isOpColumn,
        mode: 'normal',
        formType: 'extend',
        bulk: true,
        trueValue: {
          mode: 'popOver',
        },
        isChecked: (e: any) => {
          const { data, name } = e
          return !!get(data, name)
        },
        form: {
          body: [
            {
              name: 'quickEdit.mode',
              type: 'select',
              label: '模式',
              value: 'popOver',
              options: [
                {
                  label: '下拉',
                  value: 'popOver',
                },
                {
                  label: '内嵌',
                  value: 'inline',
                },
              ],
            },

            getSchemaTpl('icon', {
              name: 'quickEdit.icon',
            }),

            getSchemaTpl('switch', {
              name: 'quickEdit.saveImmediately',
              label: tipedLabel(
                '修改立即保存',
                '开启后修改即提交，而不是批量提交，需要配置快速保存接口用于提交数据',
              ),
              pipeIn: (value: any) => !!value,
            }),

            getSchemaTpl('apiControl', {
              label: '立即保存接口',
              description:
                '默认使用表格的「快速保存单条」接口，若单独给立即保存配置接口，则优先使用局部配置。',
              name: 'quickEdit.saveImmediately.api',
              visibleOn: 'this.quickEdit && this.quickEdit.saveImmediately',
            }),

            {
              name: 'quickEdit',
              asFormItem: true,
              label: false,
              children: ({ value, onBulkChange, name, data }: any) => {
                if (value === true) {
                  value = {}
                } else if (typeof value === 'undefined') {
                  value = getVariable(data, 'quickEdit')
                }
                value = { ...value }
                const originMode = value.mode || 'popOver'
                if (value.mode) {
                  delete value.mode
                }
                const originSaveImmediately = value.saveImmediately
                if (value.saveImmediately) {
                  delete value.saveImmediately
                }
                value =
                  value.body && ['container', 'wrapper'].includes(value.type)
                    ? {
                        // schema中存在容器，用自己的就行
                        type: 'wrapper',
                        body: [],
                        ...value,
                      }
                    : {
                        // schema中不存在容器，打开子编辑器时需要包裹一层
                        type: 'wrapper',
                        body: [
                          {
                            type: 'input-text',
                            name: data.name,
                            ...value,
                          },
                        ],
                      }

                // todo 多个快速编辑表单模式看来只能代码模式编辑了。
                return (
                  <Button
                    className="w-full flex flex-col items-center"
                    onClick={() => {
                      this.manager.openSubEditor({
                        title: '配置快速编辑类型',
                        value: value,
                        onChange: value =>
                          onBulkChange({
                            [name]: {
                              ...value,
                              mode: originMode,
                              saveImmediately: originSaveImmediately,
                            },
                          }),
                      })
                    }}
                  >
                    <span className="inline-flex items-center">
                      <Icon icon="edit" className="mr-1 w-3" />
                      配置编辑表单
                    </span>
                  </Button>
                )
              },
            },
          ],
        },
      }
    },
  }
  private _isOpColumn: boolean = false

  /** 需要动态控制的控件 */
  get dynamicControls() {
    return this._dynamicControls
  }

  panelBodyCreator = (context: BaseEventContext) => {
    this._isOpColumn = context?.schema?.type === 'operation'
    const dc = this.dynamicControls
    const i18nEnabled = getI18nEnabled()
    let obj: any = dataModelItemPlugin
    if (context.info?.name == '<操作>列') {
      obj = []
    }
    return [
      getSchemaTpl('tabs', [
        {
          title: '常规',
          body: [
            /*{
              children: (
                <Button
                  size="sm"
                  level="info"
                  className="m-b"
                  block
                  onClick={this.exchangeRenderer.bind(this, context.id)}
                >
                  更改渲染器类型
                </Button>
              )
            },*/
            getSchemaTpl('collapseGroup', [
              {
                title: '基础配置',
                body: flattenDeep([
                  getSchemaTpl('label', {
                    ...tplModeObj,
                    label: '列名称',
                  }),
                  ...obj,
                  // getSchemaTpl('formItemName', {
                  //   label: '绑定字段名',
                  // }),

                  getSchemaTpl('tableCellRemark', tplModeObj),

                  getSchemaTpl('tableCellPlaceholder', tplModeObj),
                ]),
              },
              {
                title: '列设置',
                body: flattenDeep([
                  {
                    type: 'ae-columnWidthControl',
                    name: 'width',
                    label: false,
                    formLabel: '列宽',
                  },
                  {
                    ...tplModeObj,
                    type: 'select',
                    name: 'align',
                    label: '对齐方式',
                    hidden: this._isOpColumn,
                    options: [
                      { label: '左对齐', value: 'left' },
                      { label: '居中对齐', value: 'center' },
                      { label: '右对齐', value: 'right' },
                    ],
                  },
                  {
                    ...tplModeObj,
                    type: 'select',
                    name: 'fixed',
                    label: '固定当前列',
                    // hidden: this._isOpColumn,
                    options: [
                      { label: '不固定', value: 'none' },
                      { label: '左侧固定', value: 'left' },
                      { label: '右侧固定', value: 'right' },
                    ],
                  },
                  {
                    type: 'ae-Switch-More',
                    mode: 'normal',
                    name: 'copyable',
                    label: '可复制',
                    hiddenOnDefault: true,
                    formType: 'extend',
                    form: {
                      body: [
                        {
                          name: 'copyable.content',
                          visibleOn: 'this.copyable',
                          type: 'ae-formulaControl',
                          label: '复制内容',
                        },
                      ],
                    },
                  },
                  /** 排序设置 */
                  dc?.sortable?.(context),
                  /** 可搜索 */
                  dc?.searchable?.(context),
                  /** 快速查看 */
                  dc?.popover?.(context),
                  /** 快速编辑 */
                  dc?.quickEdit?.(context),
                ]).filter(Boolean),
              },
            ]),
          ],
        },
        {
          title: '高级',
          body: [
            {
              name: 'groupName',
              label: '列分组名称',
              type: i18nEnabled ? 'input-text-i18n' : 'input-text',
              description:
                '当多列的分组名称设置一致时，表格会在显示表头的上层显示超级表头，<a href="https://baidu.github.io/amis/zh-CN/components/table#%E8%B6%85%E7%BA%A7%E8%A1%A8%E5%A4%B4" target="_blank">示例</a>',
            },

            getSchemaTpl('switch', {
              name: 'quickEdit',
              label: '启用快速编辑',
              isChecked: (e: any) => {
                const { data, name } = e
                return !!get(data, name)
              },
              pipeIn: (value: any) => !!value,
            }),

            {
              visibleOn: 'this.quickEdit',
              name: 'quickEdit.mode',
              type: 'button-group-select',
              value: 'popOver',
              label: '快速编辑模式',
              size: 'xs',
              mode: 'inline',
              className: 'w-full',
              options: [
                {
                  label: '下拉',
                  value: 'popOver',
                },
                {
                  label: '内嵌',
                  value: 'inline',
                },
              ],
            },

            getSchemaTpl('icon', {
              name: 'quickEdit.icon',
            }),

            getSchemaTpl('switch', {
              name: 'quickEdit.saveImmediately',
              label: '是否立即保存',
              visibleOn: 'this.quickEdit',
              description: '开启后修改即提交，而不是标记修改批量提交。',
              descriptionClassName: 'help-block m-b-none',
              pipeIn: (value: any) => !!value,
            }),

            getSchemaTpl('apiControl', {
              label: '立即保存接口',
              description: '是否单独给立即保存配置接口，如果不配置，则默认使用quickSaveItemApi。',
              name: 'quickEdit.saveImmediately.api',
              visibleOn: 'this.quickEdit && this.quickEdit.saveImmediately',
            }),

            {
              visibleOn: 'this.quickEdit',
              name: 'quickEdit',
              asFormItem: true,
              children: ({ value, onChange, data }: any) => {
                if (value === true) {
                  value = {}
                } else if (typeof value === 'undefined') {
                  value = getVariable(data, 'quickEdit')
                }
                value = { ...value }
                const originMode = value.mode || 'popOver'
                if (value.mode) {
                  delete value.mode
                }
                const originSaveImmediately = value.saveImmediately
                if (value.saveImmediately) {
                  delete value.saveImmediately
                }
                value =
                  value.body && ['container', 'wrapper'].includes(value.type)
                    ? {
                        // schema中存在容器，用自己的就行
                        type: 'wrapper',
                        body: [],
                        ...value,
                      }
                    : {
                        // schema中不存在容器，打开子编辑器时需要包裹一层
                        type: 'wrapper',
                        body: [
                          {
                            type: 'input-text',
                            name: data.name,
                            ...value,
                          },
                        ],
                      }

                // todo 多个快速编辑表单模式看来只能代码模式编辑了。
                return (
                  <Button
                    level="info"
                    className="m-b"
                    size="sm"
                    block
                    onClick={() => {
                      this.manager.openSubEditor({
                        title: '配置快速编辑类型',
                        value: value,
                        onChange: value =>
                          onChange(
                            {
                              ...value,
                              mode: originMode,
                              saveImmediately: originSaveImmediately,
                            },
                            'quickEdit',
                          ),
                      })
                    }}
                  >
                    配置快速编辑
                  </Button>
                )
              },
            },

            getSchemaTpl('switch', {
              name: 'popOver',
              label: '启用查看更多展示',
              pipeIn: (value: any) => !!value,
            }),

            {
              name: 'popOver.mode',
              label: '查看更多弹出模式',
              type: 'select',
              visibleOn: 'this.popOver',
              pipeIn: defaultValue('popOver'),
              options: [
                {
                  label: '默认',
                  value: 'popOver',
                },

                {
                  label: '弹框',
                  value: 'dialog',
                },

                {
                  label: '抽出式弹框',
                  value: 'drawer',
                },
              ],
            },

            {
              name: 'popOver.position',
              label: '查看更多弹出模式',
              type: 'select',
              visibleOn: 'this.popOver && this.popOver.mode === "popOver"',
              pipeIn: defaultValue('center'),
              options: [
                {
                  label: '目标中部',
                  value: 'center',
                },

                {
                  label: '目标左上角',
                  value: 'left-top',
                },

                {
                  label: '目标右上角',
                  value: 'right-top',
                },

                {
                  label: '目标左下角',
                  value: 'left-bottom',
                },

                {
                  label: '目标右下角',
                  value: 'right-bottom',
                },

                {
                  label: '页面左上角',
                  value: 'fixed-left-top',
                },

                {
                  label: '页面右上角',
                  value: 'fixed-right-top',
                },

                {
                  label: '页面左下角',
                  value: 'fixed-left-bottom',
                },

                {
                  label: '页面右下角',
                  value: 'fixed-right-bottom',
                },
              ],
            },

            {
              visibleOn: 'this.popOver',
              name: 'popOver',
              asFormItem: true,
              children: ({ value, onChange }: any) => {
                value = {
                  type: 'panel',
                  title: '查看详情',
                  body: '内容详情',
                  ...value,
                }

                return (
                  <Button
                    level="info"
                    className="m-b"
                    size="sm"
                    block
                    onClick={() => {
                      this.manager.openSubEditor({
                        title: '配置查看更多展示内容',
                        value: value,
                        onChange: value => onChange(value, 'popOver'),
                      })
                    }}
                  >
                    查看更多内容配置
                  </Button>
                )
              },
            },

            getSchemaTpl('switch', {
              name: 'copyable',
              label: '启用内容复制功能',
              pipeIn: (value: any) => !!value,
            }),

            {
              visibleOn: 'this.copyable',
              name: 'copyable.content',
              type: 'textarea',
              label: '复制内容模板',
              description: '默认为当前字段值，可定制。',
            },
          ],
        },
        {
          title: '外观',
          body: [
            {
              type: 'select',
              name: 'align',
              label: '对齐方式',
              pipeIn: defaultValue('left'),
              options: [
                { label: '左对齐', value: 'left' },
                { label: '居中对齐', value: 'center' },
                { label: '右对齐', value: 'right' },
                { label: '两端对齐', value: 'justify' },
              ],
            },
            {
              type: 'select',
              name: 'headerAlign',
              label: '表头对齐方式',
              pipeIn: defaultValue(''),
              options: [
                { label: '复用对齐方式', value: '' },
                { label: '左对齐', value: 'left' },
                { label: '居中对齐', value: 'center' },
                { label: '右对齐', value: 'right' },
                { label: '两端对齐', value: 'justify' },
              ],
            },
            {
              type: 'select',
              name: 'vAlign',
              label: '垂直对齐方式',
              pipeIn: defaultValue('middle'),
              options: [
                { label: '顶部对齐', value: 'top' },
                { label: '垂直居中', value: 'middle' },
                { label: '底部对齐', value: 'bottom' },
              ],
            },
            {
              name: 'fixed',
              type: 'button-group-select',
              label: '固定位置',
              pipeIn: defaultValue(''),
              size: 'xs',
              mode: 'inline',
              inputClassName: 'mt-1 w-full',
              options: [
                {
                  value: '',
                  label: '不固定',
                },

                {
                  value: 'left',
                  label: '左侧',
                },

                {
                  value: 'right',
                  label: '右侧',
                },
              ],
            },

            getSchemaTpl('switch', {
              name: 'toggled',
              label: '默认展示',
              pipeIn: defaultValue(true),
            }),

            {
              name: 'breakpoint',
              type: 'button-group-select',
              label: '触发底部显示条件',
              visibleOn: 'this.tableFootableEnabled',
              size: 'xs',
              multiple: true,
              options: [
                {
                  label: '总是',
                  value: '*',
                },
                {
                  label: '手机端',
                  value: 'xs',
                },
                {
                  label: '平板',
                  value: 'sm',
                },
                {
                  label: 'PC小屏',
                  value: 'md',
                },
                {
                  label: 'PC大屏',
                  value: 'lg',
                },
              ],
              pipeIn: (value: any) => (value ? (typeof value === 'string' ? value : '*') : ''),
              pipeOut: (value: any) =>
                typeof value === 'string' && ~value.indexOf('*') && /xs|sm|md|lg/.test(value)
                  ? value.replace(/\*\s*,\s*|\s*,\s*\*/g, '')
                  : value,
            },

            getSchemaTpl('switch', {
              name: 'className',
              label: '内容强制换行',
              pipeIn: (value: any) => typeof value === 'string' && /\word\-break\b/.test(value),
              pipeOut: (value: any, originValue: any) =>
                (value ? 'word-break ' : '') +
                (originValue || '').replace(/\bword\-break\b/g, '').trim(),
            }),

            getSchemaTpl('className'),
            getSchemaTpl('className', {
              name: 'innerClassName',
              label: '内部 CSS 类名',
            }),

            {
              name: 'width',
              type: 'input-number',
              label: '列宽',
              description: '固定列的宽度，不推荐设置。',
            },
          ],
        },
      ]),
    ]
  }
}
