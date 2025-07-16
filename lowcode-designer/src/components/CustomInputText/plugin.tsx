import {
  BaseEventContext,
  TextControlPlugin,
  defaultValue,
  getSchemaTpl,
  tipedLabel,
} from 'amis-editor'
import { getEventControlConfig } from 'amis-editor'
import { inputStateTpl } from 'amis-editor/lib/renderer/style-control/helper'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

const isText = 'this.type === "input-text"'
const isPassword = 'this.type === "input-password"'
const isUrl = 'this.type === "input-url"'

export class TextPluginRefactor extends TextControlPlugin {
  // static id = 'TextControlPlugin'
  // priority = 100
  panelBodyCreator = (context: BaseEventContext) => {
    const renderer: any = context.info.renderer
    const tpl = getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl(
          'collapseGroup',
          [
            {
              title: '基本',
              body: [
                getSchemaTpl('layout:originPosition', { value: 'left-top' }),
                ...dataModelItemPlugin,
                // getSchemaTpl('formItemName', {
                //   required: true,
                // }),
                getSchemaTpl('label'),
                getSchemaTpl('inputType', {
                  value: this.scaffold.type,
                  onChange: (value: string, oldValue: string, model: any, form: any) => {
                    const {
                      showCounter,
                      validations,
                      validationErrors = {},
                      autoComplete,
                    } = form.data

                    const is_old_email = oldValue === 'input-email'
                    const is_old_url = oldValue === 'input-url'

                    if (is_old_email) {
                      validations && delete validations.isEmail
                      validationErrors && delete validationErrors.isEmail
                    }

                    if (is_old_url) {
                      validations && delete validations.isUrl
                      validationErrors && delete validationErrors.isUrl
                    }

                    form.setValues({
                      type: value,
                      showCounter: ['input-url', 'input-email'].includes(value)
                        ? undefined
                        : !!showCounter,
                      autoComplete: ['input-text'].includes(value) ? autoComplete : undefined,
                    })
                    form.changeValue('validations', { ...validations })
                    form.changeValue('validationErrors', { ...validationErrors })
                  },
                }),
                getSchemaTpl('tplFormulaControl', {
                  name: 'value',
                  label: '默认值',
                }),
                getSchemaTpl('clearable'),
                getSchemaTpl('showCounter', {
                  visibleOn: `${isText} || ${isPassword}`,
                }),
                {
                  name: 'maxLength',
                  label: tipedLabel('最大字数', '限制输入最多文字数量'),
                  type: 'input-number',
                  min: 0,
                  step: 1,
                },
                {
                  name: 'transform',
                  label: tipedLabel('大小写转换', '输入框内容大小写转换'),
                  type: 'ae-switch-more',
                  mode: 'normal',
                  formType: 'extend',
                  title: '大小写转换',
                  bulk: false,
                  defaultData: {},
                  form: {
                    body: [
                      getSchemaTpl('switch', {
                        name: 'lowerCase',
                        label: '开启小写',
                      }),
                      getSchemaTpl('switch', {
                        name: 'upperCase',
                        label: '开启大写',
                      }),
                    ],
                  },
                },
                {
                  name: 'addOn',
                  label: tipedLabel('AddOn', '输入框左侧或右侧的附加挂件'),
                  type: 'ae-switch-more',
                  mode: 'normal',
                  formType: 'extend',
                  title: 'AddOn',
                  bulk: false,
                  defaultData: {
                    label: '按钮',
                    type: 'button',
                  },
                  form: {
                    body: [
                      {
                        name: 'type',
                        label: '类型',
                        type: 'button-group-select',
                        inputClassName: 'items-center',
                        pipeIn: defaultValue('button'),
                        options: [
                          {
                            label: '文本',
                            value: 'text',
                          },

                          {
                            label: '按钮',
                            value: 'button',
                          },

                          {
                            label: '提交',
                            value: 'submit',
                          },
                        ],
                      },
                      getSchemaTpl('horizontal-align', {
                        name: 'position',
                        pipeIn: defaultValue('right'),
                      }),
                      getSchemaTpl('addOnLabel'),
                      getSchemaTpl('icon'),
                    ],
                  },
                },
                getSchemaTpl('labelRemark'),
                getSchemaTpl('remark'),
                getSchemaTpl('placeholder'),
                getSchemaTpl('description'),
                getSchemaTpl('autoFillApi'),
              ],
            },
            {
              title: '选项',
              visibleOn: `${isText} && (this.options  || this.autoComplete || this.source)`,
              body: [
                getSchemaTpl('optionControlV2'),
                getSchemaTpl('multiple', {
                  visibleOn: `${isText} || ${isUrl}`,
                }),
                {
                  type: 'ae-Switch-More',
                  mode: 'normal',
                  label: tipedLabel(
                    '自动补全',
                    '根据输入内容，调用接口提供选项。当前输入值可用${term}变量',
                  ),
                  visibleOn: isText,
                  formType: 'extend',
                  defaultData: {
                    autoComplete: {
                      method: 'get',
                      url: '',
                    },
                  },
                  form: {
                    body: [
                      getSchemaTpl('apiControl', {
                        name: 'autoComplete',
                        label: '接口',
                        description: '',
                        visibleOn: 'this.autoComplete !== false',
                      }),
                      {
                        label: tipedLabel(
                          '显示字段',
                          '选项文本对应的数据字段，多字段合并请通过模板配置',
                        ),
                        type: 'input-text',
                        name: 'labelField',
                        placeholder: '选项文本对应的字段',
                      },
                      {
                        label: '值字段',
                        type: 'input-text',
                        name: 'valueField',
                        placeholder: '值对应的字段',
                      },
                    ],
                  },
                },
              ],
            },
            getSchemaTpl('status', {
              isFormItem: true,
              readonly: true,
            }),
            getSchemaTpl('agValidation', {
              tag: (data: any) => {
                switch (data.type) {
                  case 'input-password':
                    return ValidatorTag.Password
                  case 'input-email':
                    return ValidatorTag.Email
                  case 'input-url':
                    return ValidatorTag.URL
                  default:
                    return ValidatorTag.Text
                }
              },
            }),
            // {
            //   title: '高级',
            //   body: [
            //     getSchemaTpl('autoFill')
            //   ]
            // }
          ],
          // { ...context?.schema, configTitle: 'props' },
        ),
      },
      {
        title: '外观',
        body: getSchemaTpl(
          'collapseGroup',
          [
            getSchemaTpl('theme:formItem'),
            getSchemaTpl('theme:form-label'),
            getSchemaTpl('theme:form-description'),
            {
              title: '输入框样式',
              body: [
                ...inputStateTpl(
                  'themeCss.inputControlClassName',
                  '--input-default'
                )
              ]
            },
            {
              title: 'AddOn样式',
              visibleOn: 'this.addOn && this.addOn.type === "text"',
              body: [
                getSchemaTpl('theme:font', {
                  label: '文字',
                  name: 'themeCss.addOnClassName.font:default'
                }),
                getSchemaTpl('theme:paddingAndMargin', {
                  name: 'themeCss.addOnClassName.padding-and-margin:default'
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
                  label: '文本框基本样式',
                  selector: '.cxd-TextControl'
                },
                {
                  label: '输入框外层样式',
                  selector: '.cxd-TextControl-input'
                },
                {
                  label: '输入框样式',
                  selector: '.cxd-TextControl-input input'
                }
              ]
            })
          ],
          {...context?.schema, configTitle: 'style'}
        )
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
    return tpl
  }
}
export const id = 'TextControlPlugin'
