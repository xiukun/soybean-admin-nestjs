import { ComboControlPlugin } from 'amis-editor'
import {
  BaseEventContext,
  defaultValue,
  getSchemaTpl,
  tipedLabel,
  getI18nEnabled,
} from 'amis-editor-core'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
export class ComboControlPluginRefactor extends ComboControlPlugin {
  // static id = 'ComboControlPlugin'

  panelBodyCreator = (context: BaseEventContext) => {
    const i18nEnabled = getI18nEnabled()
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: [
          getSchemaTpl('collapseGroup', [
            {
              className: 'p-none',
              title: '常用',
              body: [
                ...dataModelItemPlugin,
                // getSchemaTpl('formItemName', {
                //   required: true,
                // }),
                getSchemaTpl('label'),

                getSchemaTpl('valueFormula', {
                  rendererSchema: {
                    ...context?.schema,
                    type: 'textarea',
                  },
                  label: tipedLabel(
                    '默认值',
                    '支持 <code>now、+1day、-2weeks、+1hours、+2years</code>等这种相对值用法',
                  ),
                  pipeOut: (value: any) => {
                    try {
                      return typeof JSON.parse(value) === 'number' ? value : JSON.parse(value)
                    } catch (err) {
                      return value
                    }
                  },
                }),
                // 多选模式和条数绑定了，所以设定了多选，条数开启
                getSchemaTpl('switch', {
                  name: 'multiple',
                  label: '可多选',
                  pipeIn: defaultValue(true),
                  onChange: (value: any, oldValue: any, model: any, form: any) => {
                    form.setValueByName('addable', value)
                    form.setValueByName('removable', value)
                    !value && form.setValueByName('draggable', false)
                    form.setValueByName('flat', false)
                  },
                }),
                {
                  type: 'container',
                  className: 'ae-ExtendMore mb-3',
                  visibleOn: 'this.multiple',
                  body: [
                    {
                      label: '最多条数',
                      name: 'maxLength',
                      type: 'input-number',
                    },
                    {
                      label: '最少条数',
                      name: 'minLength',
                      type: 'input-number',
                    },
                  ],
                },
                getSchemaTpl('switch', {
                  name: 'flat',
                  label: tipedLabel(
                    '打平值',
                    '默认数组内的数据结构为对象，如果只有一个表单项，可以配置将值打平，那么数组内放置的就是那个表单项的值',
                  ),
                  visibleOn:
                    'Array.isArray(this.items) && this.items.length === 1 && this.multiple',
                }),
                {
                  type: 'container',
                  className: 'ae-ExtendMore mb-3',
                  visibleOn: 'this.multiple && this.flat',
                  body: [getSchemaTpl('joinValues'), getSchemaTpl('delimiter')],
                },
                // 可排序，排序和新增无关，和多选模式有关
                getSchemaTpl('switch', {
                  name: 'draggable',
                  label: '可排序',
                  pipeIn: defaultValue(false),
                  visibleOn: 'this.multiple',
                }),
                {
                  type: 'container',
                  className: 'ae-ExtendMore mb-3',
                  visibleOn: 'this.draggable',
                  body: [getSchemaTpl('draggableTip')],
                },

                // 可新增
                getSchemaTpl('switch', {
                  name: 'addable',
                  label: tipedLabel(
                    '可新增',
                    '如需要拓展自定义的新增功能，可通过配置组件-新增项来拓展',
                  ),
                  visibleOn: 'this.multiple',
                  pipeIn: defaultValue(false),
                  onChange: (value: any, oldValue: any, model: any, form: any) => {
                    if (value) {
                      form.setValueByName('addBtn', {
                        label: '新增',
                        icon: 'fa fa-plus',
                        level: 'primary',
                        size: 'sm',
                      })
                    }
                  },
                }),

                // 可删除
                getSchemaTpl('switch', {
                  name: 'removable',
                  label: '可删除',
                  pipeIn: defaultValue(false),
                  visibleOn: 'this.multiple',
                  onChange: (value: any, oldValue: any, model: any, form: any) => {
                    if (value) {
                      form.setValueByName('removableMode', 'icon')
                      form.setValueByName('deleteIcon', undefined)
                      form.setValueByName('deleteBtn', undefined)
                    }
                  },
                }),
                {
                  type: 'container',
                  className: 'ae-ExtendMore mb-3',
                  visibleOn: 'this.removable',
                  body: [
                    // 自定义删除按钮开关
                    {
                      type: 'button-group-select',
                      name: 'removableMode',
                      label: '按钮模式',
                      options: [
                        {
                          label: '图标',
                          value: 'icon',
                        },
                        {
                          label: '按钮',
                          value: 'button',
                        },
                      ],
                      onChange: (value: any, oldValue: any, model: any, form: any) => {
                        if (value === 'icon') {
                          form.setValueByName('deleteBtn', undefined)
                        } else if (value === 'button') {
                          form.setValueByName('deleteBtn', {
                            label: '删除',
                            level: 'default',
                          })
                        }
                      },
                    },
                    // getSchemaTpl('icon', {
                    //   name: 'deleteIcon',
                    //   label: '图标',
                    //   visibleOn: 'this.removableMode === "icon"'
                    // }),
                    {
                      label: '文案',
                      name: 'deleteBtn.label',
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                      visibleOn: 'this.removableMode === "button"',
                    },
                    getSchemaTpl('buttonLevel', {
                      label: '样式',
                      name: 'deleteBtn.level',
                      visibleOn: 'this.removableMode === "button"',
                    }),
                    getSchemaTpl('apiControl', {
                      name: 'deleteApi',
                      label: '删除',
                      renderLabel: false,
                      mode: 'normal',
                    }),
                    getSchemaTpl('deleteConfirmText'),
                  ],
                },
                {
                  type: 'select',
                  name: '__uniqueItems',
                  label: '配置唯一项',
                  source: '${items|pick:name}',
                  pipeIn: (value: any, form: any) => {
                    // 从 items 中获取设置了 unique: true 的项的 name
                    const items = form.data.items || []
                    return items.filter((item: any) => item.unique).map((item: any) => item.name)
                  },
                  onChange: (value: string[], oldValue: any, model: any, form: any) => {
                    // 获取当前的 items
                    const items = [...(form.data.items || [])]
                    // 修改 items 中的 unique 属性
                    const updatedItems = items.map(item => {
                      if (value === item.name) {
                        return { ...item, unique: true }
                      } else {
                        const newItem = { ...item }
                        delete newItem.unique
                        return newItem
                      }
                    })
                    // 更新 items
                    form.setValueByName('items', updatedItems)
                  },
                },
                getSchemaTpl('labelRemark'),
                getSchemaTpl('remark'),

                getSchemaTpl('placeholder'),
                getSchemaTpl('description'),
              ],
            },
            getSchemaTpl('collapseGroup', [
              {
                className: 'p-none',
                title: '高级',
                body: [
                  getSchemaTpl('switch', {
                    name: 'canAccessSuperData',
                    label: '自动填充父级变量',
                    pipeIn: defaultValue(false),
                  }),

                  getSchemaTpl('switch', {
                    name: 'strictMode',
                    label: tipedLabel(
                      '严格模式',
                      '如果你希望环境变量的值实时透传到 Combo 中，请关闭此选项。',
                    ),
                    value: true,
                  }),

                  getSchemaTpl('combo-container', {
                    name: 'syncFields',
                    visibleOn: '!this.strictMode',
                    label: tipedLabel(
                      '同步字段',
                      '如果 Combo 层级比较深，底层的获取外层的数据可能不同步。但是给 combo 配置这个属性就能同步下来。',
                    ),
                    type: 'combo',
                    mode: 'normal',
                    multiple: true,
                    canAccessSuperData: true,
                    items: [
                      {
                        name: 'field',
                        type: 'input-text',
                      },
                    ],
                    value: [],
                    pipeIn(value?: Array<string>) {
                      return (value ?? []).map(item => ({ field: item }))
                    },
                    pipeOut(value?: Array<{ field: string }>) {
                      return (value ?? []).map(item => {
                        const keys = Object.keys(item)
                        return keys.length > 0 ? item.field : ''
                      })
                    },
                  }),

                  getSchemaTpl('switch', {
                    name: 'lazyLoad',
                    label: tipedLabel('懒加载', '如果数据比较多，比较卡顿时，可开启此配置项'),
                    pipeIn: defaultValue(false),
                    visibleOn: 'this.multiple && !this.tabsMode',
                  }),
                ],
              },
            ]),
            getSchemaTpl('status', {
              isFormItem: true,
              readonly: true,
            }),
            getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
          ]),
        ],
      },
      {
        title: '外观',
        className: 'p-none',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            visibleOn: 'this.multiple',
            body: [
              {
                name: 'tabsMode',
                label: '展示形式',
                type: 'button-group-select',
                inputClassName: 'items-center',
                size: 'sm',
                options: [
                  { label: '表单', value: false },
                  { label: '选项卡', value: true },
                ],
                pipeIn: defaultValue(false),
                onChange: (value: any, oldValue: any, model: any, form: any) => {
                  if (value) {
                    form.setValueByName('lazyLoad', undefined)
                  }
                },
              },
              {
                type: 'container',
                className: 'ae-ExtendMore mb-3',
                visibleOn: 'this.tabsMode',
                body: [
                  {
                    type: 'select',
                    name: 'tabsStyle',
                    label: '样式',
                    pipeIn: defaultValue(''),
                    options: [
                      {
                        label: '默认',
                        value: '',
                      },
                      {
                        label: '线型',
                        value: 'line',
                      },
                      {
                        label: '卡片',
                        value: 'card',
                      },
                      {
                        label: '选择器',
                        value: 'radio',
                      },
                    ],
                  },
                  getSchemaTpl('formulaControl', {
                    label: '标题模版',
                    name: 'tabsLabelTpl',
                  }),
                ],
              },
              // 表单多行展示
              getSchemaTpl('switch', {
                name: 'multiLine',
                label: '多行展示',
                pipeIn: defaultValue(false),
                visibleOn: '!this.tabsMode',
                onChange: (value: boolean, oldValue: any, model: any, form: any) => {
                  if (!value) {
                    form.setValueByName('subFormMode', undefined)
                    form.setValueByName('noBorder', undefined)
                  }
                },
              }),
              getSchemaTpl('switch', {
                visibleOn: '!this.tabsMode && this.multiLine',
                name: 'noBorder',
                label: '去掉边框',
                pipeIn: defaultValue(false),
              }),
            ],
          },
          getSchemaTpl('style:formItem', {
            renderer: context.info.renderer,
            schema: [
              getSchemaTpl('subFormItemMode', {
                visibleOn: 'this.multiLine',
                type: 'select',
                label: '子表单',
              }),
            ],
          }),
          getSchemaTpl('style:classNames'),
        ]),
      },
      {
        title: '事件',
        className: 'p-none',
        body: [
          getSchemaTpl('eventControl', {
            name: 'onEvent',
            ...getEventControlConfig(this.manager, context),
          }),
        ],
      },
    ])
  }
}
