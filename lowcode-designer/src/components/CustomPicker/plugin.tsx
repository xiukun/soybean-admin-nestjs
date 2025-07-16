import uniq from 'lodash/uniq'
import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import { PickerControlPlugin } from 'amis-editor'
import { BaseEventContext, defaultValue, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { Schema } from 'amis-core'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { getEventControlConfig } from 'amis-editor'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class PickerControlPluginRefactor extends PickerControlPlugin {
  // static id = 'PickerControlPlugin';
  // // 关联渲染器名字
  // rendererName = 'picker';

  panelBodyCreator = (context: BaseEventContext) => {
    const pickStyleStateFunc = (visibleOn: string, state: string) => {
      return [
        getSchemaTpl('theme:border', {
          name: `themeCss.pickControlClassName.border:${state}`,
          editorThemePath: `pick.status.body.${state}-border`,
          visibleOn: visibleOn,
        }),
        getSchemaTpl('theme:colorPicker', {
          label: '背景',
          labelMode: 'input',
          needGradient: true,
          needImage: true,
          name: `themeCss.pickControlClassName.background:${state}`,
          editorThemePath: `pick.status.body.${state}-bgColor`,
          visibleOn: visibleOn,
        }),
      ]
    }
    const pickDisabledSateFunc = (visibleOn: string, state: string) => {
      return [
        getSchemaTpl('theme:border', {
          name: `themeCss.pickControlDisabledClassName.border`,
          editorThemePath: `pick.status.body.${state}-border`,
          visibleOn: visibleOn,
        }),
        getSchemaTpl('theme:colorPicker', {
          label: '背景',
          labelMode: 'input',
          needGradient: true,
          needImage: true,
          name: `themeCss.pickControlDisabledClassName.background`,
          editorThemePath: `pick.status.body.${state}-bgColor`,
          visibleOn: visibleOn,
        }),
      ]
    }
    const pickStyleFunc = (visibleOn: string, state: string) => {
      return [
        getSchemaTpl('theme:border', {
          name: `themeCss.pickControlClassName.border:${state}`,
          editorThemePath: `pick.base.body.border`,
          visibleOn: visibleOn,
        }),
        getSchemaTpl('theme:colorPicker', {
          label: '背景',
          labelMode: 'input',
          needGradient: true,
          needImage: true,
          name: `themeCss.pickControlClassName.background:${state}`,
          editorThemePath: `pick.base.body.bgColor`,
          visibleOn: visibleOn,
        }),
      ]
    }
    const getOverflowTagPopoverTpl = (schema: any = {}) => {
      const { namePre, title, key } = schema
      delete schema.namePre
      return {
        type: 'container',
        body: [
          {
            type: 'switch',
            label: title,
            name: `${namePre}.${key}`,
            inputClassName: 'is-inline',
            onChange: (value: any, origin: any, item: any, form: any) => {
              const overflowConfig = cloneDeep(form.data.overflowConfig) || {}
              const displayPosition = overflowConfig.displayPosition || []
              if (value) {
                overflowConfig.displayPosition = uniq([...displayPosition, key])
              } else {
                overflowConfig.displayPosition = displayPosition.filter((_: string) => _ !== key)
                const configKey =
                  key === 'select' ? 'overflowTagPopover' : 'overflowTagPopoverInCRUD'
                delete overflowConfig[configKey]
              }
              form.setValues({
                overflowConfig,
              })
            },
          },
          {
            name: namePre ? `${namePre}.trigger` : 'trigger',
            type: 'select',
            label: tipedLabel('触发方式', '默认方式为”鼠标悬停“'),
            multiple: true,
            value: ['hover'],
            pipeIn: (value: any) => (Array.isArray(value) ? value.join(',') : []),
            pipeOut: (value: any) => (value && value.length ? value.split(',') : undefined),
            options: [
              {
                label: '鼠标悬停',
                value: 'hover',
              },

              {
                label: '点击',
                value: 'click',
              },
            ],
            visibleOn: `${namePre}.${key}`,
          },
          {
            type: 'button-group-select',
            name: namePre ? `${namePre}.placement` : 'placement',
            label: '提示位置',
            size: 'sm',
            options: [
              {
                label: '上',
                value: 'top',
              },
              {
                label: '下',
                value: 'bottom',
              },
              {
                label: '左',
                value: 'left',
              },
              {
                label: '右',
                value: 'right',
              },
            ],
            pipeIn: defaultValue('top'),
            visibleOn: `${namePre}.${key}`,
          },
          {
            type: 'switch',
            label: tipedLabel('展示浮层箭头', '关闭后提示浮层不展示指向箭头'),
            name: namePre ? `${namePre}.showArrow` : 'showArrow',
            inputClassName: 'is-inline',
            visibleOn: `${namePre}.${key}`,
          },
          {
            type: 'input-group',
            label: tipedLabel('浮层偏移量', '提示浮层位置相对”水平“、”垂直“的偏移量'),
            body: [
              {
                type: 'input-number',
                name: namePre ? `${namePre}.offset` : 'offset',
                prefix: 'X：',
                pipeIn: (value: any) => (Array.isArray(value) ? value[0] || 0 : 0),
                pipeOut: (value: any, oldValue: any, data: any) => {
                  const offset = get(data, namePre ? `${namePre}.offset` : 'offset') || []
                  return [value, offset[1] || 0]
                },
              },
              {
                type: 'input-number',
                name: namePre ? `${namePre}.offset` : 'offset',
                prefix: 'Y：',
                pipeIn: (value: any) => (Array.isArray(value) ? value[1] || 0 : 0),
                pipeOut: (value: any, oldValue: any, data: any) => {
                  const offset = get(data, namePre ? `${namePre}.offset` : 'offset') || []
                  return [offset[0] || 0, value]
                },
              },
            ],
            visibleOn: `${namePre}.${key}`,
          },
        ],
        ...schema,
      }
    }
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('layout:originPosition', {value: 'left-top'}),
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: true
              // }),
              getSchemaTpl('label'),
              {
                type: 'select',
                label: tipedLabel(
                  '选框类型',
                  '内嵌：以平铺方式展示在页面，其它两种以弹框或抽屉形式弹出展示'
                ),
                name: 'modalMode',
                options: [
                  {
                    label: '内嵌',
                    value: 'inner'
                  },
                  {
                    label: '弹框',
                    value: 'dialog'
                  },
                  {
                    label: '抽屉',
                    value: 'drawer'
                  }
                ],
                pipeIn: defaultValue('dialog'),
                onChange: (value: any, origin: any, item: any, form: any) => {
                  form.setValues({
                    embed: value === 'inner'
                  });
                  if (value !== 'inner') {
                    form.setValues({
                      modalMode: value
                    });
                  } else {
                    const overflowConfig = cloneDeep(form.data.overflowConfig);
                    delete overflowConfig.overflowTagPopoverInCRUD;
                    overflowConfig.displayPosition = ['select'];
                    form.setValues({
                      overflowConfig
                    });
                  }
                }
              },
              {
                label: '弹框尺寸',
                type: 'select',
                name: 'size',
                pipeIn: defaultValue(''),
                visibleOn: '${modalMode !== "inner"}',
                options: [
                  {
                    label: '默认',
                    value: ''
                  },
                  {
                    label: '小',
                    value: 'sm'
                  },
                  {
                    label: '中',
                    value: 'md'
                  },
                  {
                    label: '大',
                    value: 'lg'
                  },
                  {
                    label: '特大',
                    value: 'xl'
                  }
                ]
              },
              {
                label: '弹框尺寸',
                type: 'select',
                name: 'size',
                pipeIn: defaultValue(''),
                visibleOn: '${modalMode !== "inner"}',
                options: [
                  {
                    label: '默认',
                    value: '',
                  },
                  {
                    label: '小',
                    value: 'sm',
                  },
                  {
                    label: '中',
                    value: 'md',
                  },
                  {
                    label: '大',
                    value: 'lg',
                  },
                  {
                    label: '特大',
                    value: 'xl',
                  },
                ],
              },
              getSchemaTpl('multiple'),
              {
                type: 'ae-switch-more',
                mode: 'normal',
                formType: 'extend',
                name: 'overflowConfig',
                bulk: false,
                isChecked: (v: any) => !!v,
                label: tipedLabel(
                  '标签收纳',
                  '当值数量超出一定数量时，可进行收纳显示'
                ),
                extendData: ['embed'],
                form: {
                  body: [
                    {
                      type: 'input-number',
                      name: 'maxTagCount',
                      label: '最大标签数',
                      defaultValue: -1
                    },
                    getOverflowTagPopoverTpl({
                      namePre: 'overflowTagPopover',
                      title: '选择器收纳器',
                      key: 'select',
                      className: 'm-b-sm'
                    }),
                    getOverflowTagPopoverTpl({
                      namePre: 'overflowTagPopoverInCRUD',
                      title: 'CRUD收纳器',
                      key: 'crud',
                      className: 'm-b-sm',
                      hiddenOn: '!!embed'
                    })
                  ]
                },
                visibleOn: 'this.multiple'
              },
              {
                type: 'switch',
                name: 'itemClearable',
                label: '选中项可删除',
                pipeIn: defaultValue(true),
                inputClassName: 'is-inline '
              },
              {
                type: 'switch',
                name: 'itemClearable',
                label: '选中项可删除',
                pipeIn: defaultValue(true),
                inputClassName: 'is-inline ',
              },
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('placeholder'),
              getSchemaTpl('description')
            ]
          },
          {
            title: '选项',
            body: [
              getSchemaTpl('optionControlV2'),
              getSchemaTpl('valueFormula', {
                mode: 'vertical',
                rendererSchema: (schema: Schema) => schema,
                useSelectMode: true,
                label: tipedLabel(
                  '默认值',
                  `当在fx中配置多选值时，需要适配值格式，示例：
                  选项值为
                  <pre>${JSON.stringify(
                    [
                      {label: '选项A', value: 'A'},
                      {label: '选项B', value: 'B'}
                    ],
                    null,
                    2
                  )}
                  </pre>选中选项A和选项B：
                  <ul>
                    <li>开启拼接值且拼接符为 ‘,’ ：值示例 'A,B'</li>
                    <li>关闭拼接值，开启仅提取值，值示例：['A', 'B']</li>
                    <li>关闭拼接值，关闭仅提取值，值示例：[
                      {label: '选项A', value: 'A'},
                      {label: '选项B', value: 'B'}
                    ]</li>
                  </ul>`
                )
              }),
              getSchemaTpl('textareaFormulaControl', {
                label: tipedLabel('标签模板', '已选定数据的label展示内容'),
                name: 'labelTpl',
                mode: 'normal',
                visibleOn: '!this.embed'
              }),
              {
                type: 'button',
                label: '配置选框详情',
                block: true,
                level: 'primary',
                visibleOn: '!this.pickerSchema',
                onClick: this.editDetail.bind(this, context.id)
              },
              {
                type: 'button',
                label: '已配置选框详情',
                block: true,
                level: 'primary',
                visibleOn: 'this.pickerSchema',
                onClick: this.editDetail.bind(this, context.id)
              }
            ]
          },
          getSchemaTpl('status', {isFormItem: true}),
          getSchemaTpl('agValidation', {tag: ValidatorTag.MultiSelect})
        ])
      },
      {
        title: '外观',
        body: [
          getSchemaTpl(
            'collapseGroup',
            [
              getSchemaTpl('style:formItem', {
                renderer: context.info.renderer,
                hiddenList: ['labelHide']
              }),
              {
                title: '基本',
                body: [
                  {
                    type: 'select',
                    name: '__editorState',
                    label: '状态',
                    selectFirst: true,
                    options: [
                      {
                        label: '常规',
                        value: 'default'
                      },
                      {
                        label: '悬浮',
                        value: 'hover'
                      },
                      {
                        label: '聚焦',
                        value: 'focused'
                      },
                      {
                        label: '禁用',
                        value: 'disabled'
                      }
                    ]
                  },
                  ...pickStyleStateFunc(
                    "${__editorState == 'default' || !__editorState}",
                    'default'
                  ),
                  ...pickStyleStateFunc("${__editorState == 'hover'}", 'hover'),
                  ...pickStyleStateFunc(
                    "${__editorState == 'focused'}",
                    'focused'
                  ),
                  ...pickStyleStateFunc(
                    "${__editorState == 'disabled'}",
                    'disabled'
                  )
                ]
              },
              {
                title: '选中值',
                body: [
                  getSchemaTpl('theme:font', {
                    name: 'themeCss.pickFontClassName.font:default',
                    editorValueToken: '--Pick-base-value'
                  }),
                  getSchemaTpl('theme:colorPicker', {
                    label: '背景',
                    labelMode: 'input',
                    needGradient: true,
                    needImage: true,
                    name: 'themeCss.pickValueWrapClassName.background',
                    editorValueToken: '--Pick-base-value-bgColor'
                  }),
                  getSchemaTpl('theme:border', {
                    name: 'themeCss.pickValueWrapClassName.border:default',
                    editorValueToken: '--Pick-base-value'
                  }),
                  getSchemaTpl('theme:radius', {
                    name: 'themeCss.pickValueWrapClassName.radius',
                    editorValueToken: '--Pick-base'
                  }),
                  getSchemaTpl('theme:colorPicker', {
                    label: '图标颜色',
                    labelMode: 'input',
                    needGradient: true,
                    needImage: true,
                    name: 'themeCss.pickValueIconClassName.color',
                    editorValueToken: '--Pick-base-value-icon-color'
                  }),
                  getSchemaTpl('theme:colorPicker', {
                    label: '图标hover颜色',
                    labelMode: 'input',
                    needGradient: true,
                    needImage: true,
                    name: 'themeCss.pickValueIconClassName.color:hover',
                    editorValueToken: '--Pick-base-value-hover-icon-color'
                  })
                ]
              },
              {
                title: '图标',
                body: [
                  {
                    name: 'themeCss.pickControlClassName.--Pick-base-icon',
                    label: '选择图标',
                    type: 'icon-select',
                    returnSvg: true
                  },
                  // 新版大小设置不兼容，先不加
                  // getSchemaTpl('theme:size', {
                  //   name: 'themeCss.pickControlClassName.--Pick-base-icon-size',
                  //   label: '图标大小',
                  //   editorValueToken: `default.body.icon-size`
                  // }),
                  getSchemaTpl('theme:colorPicker', {
                    label: '颜色',
                    labelMode: 'input',
                    needGradient: true,
                    needImage: true,
                    name: 'themeCss.pickIconClassName.color',
                    editorValueToken: '--Pick-base-icon-color'
                  })
                ]
              },
              getSchemaTpl('theme:singleCssCode', {
                selectors: [
                  {
                    label: '表单项基本样式',
                    isRoot: true,
                    selector: '.cxd-from-item'
                  },
                  {
                    label: '标题样式',
                    selector: '.cxd-Form-label'
                  },
                  {
                    label: '列表选取基本样式',
                    selector: '.cxd-Picker'
                  },
                  {
                    label: '输入框样式',
                    selector: '.cxd-Picker-input'
                  }
                ]
              })
            ],
            {...context?.schema, configTitle: 'style'}
          )
        ]
      },
      {
        title: '事件',
        className: 'p-none',
        body: [
          getSchemaTpl('eventControl', {
            name: 'onEvent',
            ...getEventControlConfig(this.manager, context)
          })
        ]
      }
    ]);
  }
}
