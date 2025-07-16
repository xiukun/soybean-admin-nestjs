import { BaseEventContext, NumberControlPlugin, getI18nEnabled } from 'amis-editor'

import { defaultValue, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { inputStateTpl } from 'amis-editor/lib/renderer/style-control/helper'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class NumberControlPluginRefactor extends NumberControlPlugin {
  // static id = 'NumberControlPlugin'
  // // 关联渲染器名字
  // rendererName = 'input-number'

  priority = 100

  panelBodyCreator = (context: BaseEventContext) => {
    const i18nEnabled = getI18nEnabled()
    return getSchemaTpl('tabs', [
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
                {
                  type: 'switch',
                  label: tipedLabel('键盘事件', '通过键盘上下方向键来加减数据值'),
                  name: 'keyboard',
                  value: true,
                  inputClassName: 'is-inline',
                },
                getSchemaTpl('kilobitSeparator'),

                getSchemaTpl('valueFormula', {
                  rendererSchema: context?.schema,
                  valueType: 'number', // 期望数值类型
                }),

                getSchemaTpl('valueFormula', {
                  name: 'min',
                  rendererSchema: {
                    ...context?.schema,
                    value: context?.schema.min,
                  },
                  needDeleteProps: ['min'], // 避免自我限制
                  label: '最小值',
                  valueType: 'number',
                }),

                getSchemaTpl('valueFormula', {
                  name: 'max',
                  rendererSchema: {
                    ...context?.schema,
                    value: context?.schema.max,
                  },
                  needDeleteProps: ['max'], // 避免自我限制
                  label: '最大值',
                  valueType: 'number',
                }),

                {
                  type: 'input-number',
                  name: 'step',
                  label: '步长',
                  min: 0,
                  value: 1,
                  precision: '${precision}',
                },

                {
                  type: 'input-number',
                  name: 'precision',
                  label: tipedLabel('小数位数', '根据四舍五入精确保留设置的小数位数'),
                  min: 1,
                  max: 100,
                },
                getSchemaTpl('prefix'),
                getSchemaTpl('suffix'),
                getSchemaTpl('combo-container', {
                  type: 'combo',
                  label: '单位选项',
                  mode: 'normal',
                  name: 'unitOptions',
                  items: [
                    {
                      placeholder: '文本',
                      type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                      name: 'label',
                    },
                    {
                      placeholder: '值',
                      type: 'input-text',
                      name: 'value',
                    },
                  ],
                  draggable: false,
                  multiple: true,
                  pipeIn: (value: any) => {
                    if (Array.isArray(value)) {
                      return value.map(item =>
                        typeof item === 'string'
                          ? {
                              label: item,
                              value: item,
                            }
                          : item,
                      )
                    }
                    return []
                  },
                  pipeOut: (value: any[]) => {
                    if (!value.length) {
                      return undefined
                    }
                    return value.map(item =>
                      item.value ? item : { label: item.label, value: item.label },
                    )
                  },
                }),
                getSchemaTpl('labelRemark'),
                getSchemaTpl('remark'),
                getSchemaTpl('placeholder'),
                getSchemaTpl('description'),
                getSchemaTpl('autoFillApi'),
              ],
            },
            getSchemaTpl('status', { isFormItem: true }),
            getSchemaTpl('agValidation', { tag: ValidatorTag.MultiSelect }),
          ],
          { ...context?.schema, configTitle: 'props' },
        ),
      },
      {
        title: '外观',
        body: [
          getSchemaTpl(
            'collapseGroup',
            [
              getSchemaTpl('style:formItem', {
                renderer: context.info.renderer,
                schema: [
                  {
                    label: '快捷编辑',
                    name: 'displayMode',
                    type: 'select',
                    pipeIn: defaultValue('base'),
                    options: [
                      {
                        label: '单侧按钮',
                        value: 'base',
                      },
                      {
                        label: '两侧按钮',
                        value: 'enhance',
                      },
                    ],
                  },
                ],
              }),
              getSchemaTpl('theme:form-label'),
              getSchemaTpl('theme:form-description'),
              {
                title: '数字输入框样式',
                body: [...inputStateTpl('themeCss.inputControlClassName', 'inputNumber.base.base')],
              },
              getSchemaTpl('theme:cssCode', {
                themeClass: [
                  {
                    name: '数字输入框',
                    value: '',
                    className: 'inputControlClassName',
                    state: ['default', 'hover', 'active'],
                  },
                ],
                isFormItem: true,
              }),
            ],
            { ...context?.schema, configTitle: 'style' },
          ),
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

export const id = NumberControlPluginRefactor.id
