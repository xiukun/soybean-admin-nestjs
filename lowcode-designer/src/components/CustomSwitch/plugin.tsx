import { SwitchControlPlugin } from 'amis-editor'
import { BaseEventContext, defaultValue, getSchemaTpl, undefinedPipeOut } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
import { isExpression, isPureVariable } from 'amis-core'
import { omit } from 'lodash'
export class SwitchControlPluginRefactor extends SwitchControlPlugin {
  // static id = 'SwitchControlPlugin';
  // rendererName = 'switch';
  panelBodyCreator = (context: BaseEventContext) =>
    getSchemaTpl('tabs', [
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

              getSchemaTpl('switchOption'),

              {
                type: 'ae-switch-more',
                bulk: true,
                mode: 'normal',
                label: '填充文本',
                formType: 'extend',
                form: {
                  body: [getSchemaTpl('onText'), getSchemaTpl('offText')],
                },
              },
              {
                type: 'ae-switch-more',
                mode: 'normal',
                label: '值格式',
                formType: 'extend',
                form: {
                  body: [
                    {
                      type: 'ae-valueFormat',
                      name: 'trueValue',
                      label: '开启时',
                      pipeIn: defaultValue(true),
                      pipeOut: undefinedPipeOut,
                      onChange: (value: any, oldValue: any, model: any, form: any) => {
                        const { value: defaultValue, trueValue } = form?.data || {}
                        if (isPureVariable(defaultValue)) {
                          return
                        }
                        if (trueValue === defaultValue && trueValue !== value) {
                          form.setValues({ value })
                        }
                      },
                    },
                    {
                      type: 'ae-valueFormat',
                      name: 'falseValue',
                      label: '关闭时',
                      pipeIn: defaultValue(false),
                      pipeOut: undefinedPipeOut,
                      onChange: (value: any, oldValue: any, model: any, form: any) => {
                        const { value: defaultValue, falseValue } = form?.data || {}
                        if (isPureVariable(defaultValue)) {
                          return
                        }
                        if (falseValue === defaultValue && falseValue !== value) {
                          form.setValues({ value })
                        }
                      },
                    },
                  ],
                },
              },

              /* 旧版设置默认值
              getSchemaTpl('switch', {
                name: 'value',
                label: '默认开启',
                pipeIn: (value: any, data: any) => {
                  const {trueValue = true} = data.data || {};
                  return value === trueValue ? true : false;
                },
                pipeOut: (value: any, origin: any, data: any) => {
                  return value
                    ? data.trueValue || true
                    : data.falseValue || false;
                }
              }),
              */
              getSchemaTpl('valueFormula', {
                rendererSchema: {
                  ...omit(context?.schema, ['trueValue', 'falseValue']),
                  type: 'switch',
                },
                needDeleteProps: ['option'],
                rendererWrapper: true, // 浅色线框包裹一下，增加边界感
                valueType: 'boolean',
                pipeIn: (value: any, data: any) => {
                  if (isPureVariable(value)) {
                    return value
                  }
                  return value === (data?.data?.trueValue ?? true)
                },
                pipeOut: (value: any, origin: any, data: any) => {
                  // 如果是表达式，直接返回
                  if (isExpression(value)) return value
                  const { trueValue = true, falseValue = false } = data || {}
                  return value ? trueValue : falseValue
                },
              }),
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('description'),
              getSchemaTpl('autoFillApi'),
            ],
          },
          getSchemaTpl('status', { isFormItem: true }),
          getSchemaTpl('validation', { tag: ValidatorTag.Check }),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          getSchemaTpl('style:formItem', { renderer: context.info.renderer }),
          {
            title: '说明',
            body: [
              getSchemaTpl('horizontal-align', {
                name: 'optionAtLeft',
                pipeIn: (v: boolean) => (v ? 'left' : 'right'),
                pipeOut: (v: string) => (v === 'left' ? true : undefined),
              }),
            ],
          },
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
