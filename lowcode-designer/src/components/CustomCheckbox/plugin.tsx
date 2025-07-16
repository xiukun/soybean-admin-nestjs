import { isPureVariable } from 'amis-core'
import { CheckboxControlPlugin } from 'amis-editor'
import {
  defaultValue,
  getSchemaTpl,
  BaseEventContext,
  valuePipeOut,
  setSchemaTpl,
  tipedLabel,
} from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { inputStateTpl } from 'amis-editor/lib/renderer/style-control/helper'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { omit } from 'lodash'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
setSchemaTpl('option', {
  name: 'option',
  type: 'input-text',
  label: tipedLabel('说明', '选项说明'),
})
export class CheckboxControlPluginRefactor extends CheckboxControlPlugin {
  // static id = 'CheckboxControlPlugin'
  // // 关联渲染器名字
  // rendererName = 'checkbox'
  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              getSchemaTpl('layout:originPosition', { value: 'left-top' }),
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: true,
              // }),
              getSchemaTpl('label'),
              getSchemaTpl('option'),
              {
                type: 'ae-switch-more',
                hiddenOnDefault: false,
                mode: 'normal',
                label: '值格式',
                formType: 'extend',
                form: {
                  body: [
                    {
                      type: 'input-text',
                      label: '勾选值',
                      name: 'trueValue',
                      pipeIn: defaultValue(true),
                      pipeOut: valuePipeOut,
                      onChange: (value: any, oldValue: any, _model: any, form: any) => {
                        const defaultValue = form?.data?.value
                        if (isPureVariable(defaultValue)) {
                          return
                        }
                        if (oldValue === defaultValue) {
                          form.setValues({ value })
                        }
                      },
                    },
                    {
                      type: 'input-text',
                      label: '未勾选值',
                      name: 'falseValue',
                      pipeIn: defaultValue(false),
                      pipeOut: valuePipeOut,
                      onChange: (value: any, _oldValue: any, _model: any, form: any) => {
                        const { value: defaultValue, trueValue } = form?.data || {}
                        if (isPureVariable(defaultValue)) {
                          return
                        }
                        if (trueValue !== defaultValue) {
                          form.setValues({ value })
                        }
                      },
                    },
                  ],
                },
              },
              getSchemaTpl('valueFormula', {
                rendererSchema: {
                  ...omit(context?.schema, ['trueValue', 'falseValue']),
                  type: 'switch',
                },
                needDeleteProps: ['option'],
                label: '默认勾选',
                rendererWrapper: true, // 浅色线框包裹一下，增加边界感
                valueType: 'boolean',
                pipeIn: (value: any, data: any) => {
                  if (isPureVariable(value)) {
                    return value
                  }
                  return value === (data?.data?.trueValue ?? true)
                },
                pipeOut: (value: any, _origin: any, data: any) => {
                  if (isPureVariable(value)) {
                    return value
                  }
                  const { trueValue = true, falseValue = false } = data
                  return value ? trueValue : falseValue
                },
              }),
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('description'),
              getSchemaTpl('autoFillApi', {
                trigger: 'change',
              }),
            ],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
        ]),
      },
      {
        title: '外观',
        body: [
          getSchemaTpl('collapseGroup', [
            getSchemaTpl('theme:formItem', {
              schema: [
                {
                  type: 'select',
                  label: '模式',
                  name: 'optionType',
                  value: 'default',
                  options: [
                    {
                      label: '默认',
                      value: 'default',
                    },
                    {
                      label: '按钮',
                      value: 'button',
                    },
                  ],
                },
              ],
            }),
            getSchemaTpl('theme:form-label'),
            getSchemaTpl('theme:form-description'),
            {
              title: '选项样式',
              body: [
                ...inputStateTpl('themeCss.checkboxControlClassName', '', {
                  fontToken(state) {
                    const s = state.split('-')
                    if (s[0] === 'checked') {
                      return {
                        color: `--checkbox-\${optionType}-checked-${s[1]}-text-color`,
                        '*': '--checkbox-${optionType}-default',
                      }
                    }
                    return {
                      color: `--checkbox-\${optionType}-${s[1]}-text-color`,
                      '*': '--checkbox-${optionType}-default',
                    }
                  },
                  backgroundToken(state) {
                    const s = state.split('-')
                    if (s[0] === 'checked') {
                      return `\${optionType === "button" ? "--checkbox-" + optionType + "-checked-${s[1]}-bg-color" : ""}`
                    }
                    return `\${optionType === "button" ? "--checkbox-" + optionType + "-${s[1]}-bg-color" : ""}`
                  },
                  borderToken(state) {
                    const s = state.split('-')
                    const fn = (type: string, checked?: boolean) => {
                      return `\${optionType === "button" ? "--checkbox-" + optionType + "${
                        checked ? '-checked' : ''
                      }-${s[1]}-${type}" : ""}`
                    }
                    if (s[0] === 'checked') {
                      return {
                        topBorderColor: fn('top-border-color', true),
                        rightBorderColor: fn('right-border-color', true),
                        bottomBorderColor: fn('bottom-border-color', true),
                        leftBorderColor: fn('left-border-color', true),
                        '*': '--checkbox-${optionType}-default',
                      }
                    }
                    return {
                      topBorderColor: fn('top-border-color'),
                      rightBorderColor: fn('right-border-color'),
                      bottomBorderColor: fn('bottom-border-color'),
                      leftBorderColor: fn('left-border-color'),
                      '*': '--checkbox-${optionType}-default',
                    }
                  },
                  radiusToken(state) {
                    return '${optionType === "button" ? "--checkbox-" + optionType + "-default": "-"}'
                  },
                  state: [
                    {
                      label: '常规',
                      value: 'checkbox-default',
                    },
                    {
                      label: '悬浮',
                      value: 'checkbox-hover',
                    },
                    {
                      label: '禁用',
                      value: 'checkbox-disabled',
                    },
                    {
                      label: '选中',
                      value: 'checked-default',
                    },
                    {
                      label: '选中态悬浮',
                      value: 'checked-hover',
                    },
                    {
                      label: '选中禁用',
                      value: 'checked-disabled',
                    },
                  ],
                }),
              ],
            },
            {
              title: '勾选框样式',
              body: [
                {
                  label: '隐藏勾选框',
                  type: 'switch',
                  name: 'themeCss?.checkboxShowClassName.display',
                  trueValue: 'none',
                },
                ...inputStateTpl('themeCss.checkboxClassName', '', {
                  hideFont: true,
                  hideMargin: true,
                  hidePadding: true,
                  hiddenOn: 'themeCss?.checkboxShowClassName.display === "none"',
                  backgroundToken(state) {
                    const s = state.split('-')
                    if (s[0] === 'checked') {
                      return `--checkbox-\${optionType}-checked-${s[1]}-\${optionType ==='button' ? 'icon-' : ''}bg-color`
                    }
                    return `--checkbox-\${optionType}-${s[1]}-\${optionType ==='button' ? 'icon-' : ''}bg-color`
                  },
                  borderToken(state) {
                    const s = state.split('-')
                    if (s[0] === 'checked') {
                      return `--checkbox-\${optionType}-checked-${s[1]}\${optionType ==='button' ? '-icon' : ''}`
                    }
                    return `--checkbox-\${optionType}-${s[1]}\${optionType ==='button' ? '-icon' : ''}`
                  },
                  radiusToken(state) {
                    const s = state.split('-')
                    if (s[0] === 'checked') {
                      return `--checkbox-\${optionType}-checked-${s[1]}`
                    }
                    return `--checkbox-\${optionType}-${s[1]}\${optionType ==='button' ? '-icon' : ''}`
                  },
                  state: [
                    {
                      label: '常规',
                      value: 'checkbox-default',
                    },
                    {
                      label: '悬浮',
                      value: 'checkbox-hover',
                    },
                    {
                      label: '禁用',
                      value: 'checkbox-disabled',
                    },
                    {
                      label: '选中',
                      value: 'checked-default',
                    },
                    {
                      label: '选中态悬浮',
                      value: 'checked-hover',
                    },
                    {
                      label: '选中禁用',
                      value: 'checked-disabled',
                    },
                  ],
                  schema: [
                    {
                      name: 'themeCss.checkboxShowClassName.--checkbox-default-checked-default-icon',
                      visibleOn:
                        '${__editorStatethemeCss.checkboxClassName == "checked-default" || __editorStatethemeCss.checkboxClassName == "checked-hover" || __editorStatethemeCss.checkboxClassName == "checked-disabled"}',
                      label: '图标',
                      type: 'icon-select',
                      returnSvg: true,
                      noSize: true,
                    },
                    getSchemaTpl('theme:colorPicker', {
                      name: 'themeCss.checkboxInnerClassName.color:default',
                      visibleOn: '${__editorStatethemeCss.checkboxClassName == "checked-default"}',
                      label: '图标颜色',
                      labelMode: 'input',
                      editorValueToken: '--checkbox-${optionType}-checked-default-icon-color',
                    }),
                    getSchemaTpl('theme:colorPicker', {
                      name: 'themeCss.checkboxInnerClassName.color:hover',
                      visibleOn: '${__editorStatethemeCss.checkboxClassName == "checked-hover"}',
                      label: '图标颜色',
                      labelMode: 'input',
                      editorValueToken: '--checkbox-${optionType}-checked-default-icon-color',
                    }),
                    getSchemaTpl('theme:colorPicker', {
                      name: 'themeCss.checkboxInnerClassName.color:disabled',
                      visibleOn: '${__editorStatethemeCss.checkboxClassName == "checked-disabled"}',
                      label: '图标颜色',
                      labelMode: 'input',
                      editorValueToken: '--checkbox-${optionType}-checked-disabled-icon-color',
                    }),
                  ],
                }),
              ],
            },
            getSchemaTpl('theme:cssCode'),
            getSchemaTpl('style:classNames'),
          ]),
        ],
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
