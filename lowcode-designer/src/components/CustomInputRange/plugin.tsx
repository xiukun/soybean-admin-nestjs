import { IFormItemStore, IFormStore } from 'amis-core'
import { RangeControlPlugin } from 'amis-editor'
import { defaultValue, getSchemaTpl, BaseEventContext } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class RangeControlPluginRefactor extends RangeControlPlugin {
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
              getSchemaTpl('switch', {
                label: '双滑块',
                name: 'multiple',
              }),
              {
                type: 'container',
                className: 'ae-sub-content',
                visibleOn: 'this.multiple',
                body: [
                  getSchemaTpl('joinValues', {
                    onChange: (
                      value: boolean,
                      oldValue: boolean,
                      model: IFormItemStore,
                      form: IFormStore,
                    ) => {
                      form.deleteValueByName('value')
                    },
                  }),
                  getSchemaTpl('delimiter', {
                    onChange: (
                      value: string,
                      oldValue: string,
                      model: IFormItemStore,
                      form: IFormStore,
                    ) => {
                      form.deleteValueByName('value')
                    },
                  }),
                ],
              },
              {
                type: 'ae-input-range-value',
                name: 'value',
                label: '默认值',
                visibleOn: 'this.multiple',
                precision: '${precision}',
              },

              getSchemaTpl('valueFormula', {
                name: 'value',
                rendererSchema: {
                  ...context?.schema,
                  type: 'input-number',
                },
                valueType: 'number', // 期望数值类型
                visibleOn: '!this.multiple',
                pipeIn: defaultValue(0),
              }),

              getSchemaTpl('valueFormula', {
                name: 'min',
                rendererSchema: {
                  ...context?.schema,
                  type: 'input-number',
                },
                pipeIn: defaultValue(0),
                needDeleteProps: ['min'], // 避免自我限制
                label: '最小值',
                valueType: 'number',
              }),
              getSchemaTpl('valueFormula', {
                name: 'max',
                rendererSchema: {
                  ...context?.schema,
                  type: 'input-number',
                },
                pipeIn: defaultValue(100),
                needDeleteProps: ['max'], // 避免自我限制
                label: '最大值',
                valueType: 'number',
              }),
              {
                label: '步长',
                name: 'step',
                type: 'input-number',
                value: 1,
                pipeOut: (value?: number) => {
                  return value || 1
                },
              },

              getSchemaTpl('unit'),

              // tooltipVisible 为true时，会一直显示，为undefined时，才会鼠标移入显示
              getSchemaTpl('switch', {
                name: 'tooltipVisible',
                label: '值标签',
                value: undefined,
                pipeOut: (value?: boolean) => {
                  return value ? undefined : false
                },
                pipeIn: (value?: boolean) => {
                  return value === undefined || value === true ? true : false
                },
              }),

              {
                type: 'container',
                className: 'ae-ExtendMore mb-2',
                visibleOn: 'this.tooltipVisible === undefined',
                body: [
                  {
                    type: 'select',
                    name: 'tooltipPlacement',
                    label: '方向',
                    value: 'auto',
                    options: [
                      { label: '自动', value: 'auto' },
                      { label: '上', value: 'top' },
                      { label: '下', value: 'bottom' },
                      { label: '左', value: 'left' },
                      { label: '右', value: 'right' },
                    ],
                  },
                ],
              },

              getSchemaTpl('switch', {
                name: 'showInput',
                label: '可输入',
                value: false,
              }),

              getSchemaTpl('switch', {
                name: 'clearable',
                label: '可重置',
                value: false,
                visibleOn: '!!this.showInput',
              }),
              getSchemaTpl('autoFillApi'),
            ],
          },
          {
            title: '轨道',
            body: [
              {
                type: 'ae-partsControl',
                mode: 'normal',
              },
              {
                type: 'ae-marksControl',
                mode: 'normal',
                name: 'marks',
              },
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
            getSchemaTpl('style:formItem', { renderer: context.info.renderer }),
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
