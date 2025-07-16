import { RateControlPlugin } from 'amis-editor'
import {
  BaseEventContext,
  defaultValue,
  getI18nEnabled,
  getSchemaTpl,
  isObject,
  tipedLabel,
  undefinedPipeOut,
} from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class RateControlPluginRefactor extends RateControlPlugin {
  // static id = 'RateControlPlugin';
  panelBodyCreator = (context: BaseEventContext) => {
    const i18nEnabled = getI18nEnabled()
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

              getSchemaTpl('label', {
                label: 'Label',
              }),

              getSchemaTpl('valueFormula', {
                rendererSchema: {
                  ...context?.schema,
                  type: 'input-number',
                },
                valueType: 'number', // 期望数值类型
                visibleOn: '!data.multiple',
              }),
              // 评分组件没有 min、max 属性，有 count 属性
              getSchemaTpl('valueFormula', {
                name: 'count',
                rendererSchema: {
                  ...context?.schema,
                  type: 'input-number',
                  max: 10,
                  min: 1,
                  step: 1,
                  precision: 0,
                },
                needDeleteProps: ['count'], // 避免自我限制
                label: '最大值',
                valueType: 'number',
              }),

              getSchemaTpl('switch', {
                name: 'allowClear',
                label: tipedLabel('可清除', '是否允许再次点击后清除'),
                value: false,
              }),

              getSchemaTpl('switch', {
                name: 'half',
                label: '允许半星',
                value: false,
              }),

              getSchemaTpl('labelRemark'),

              getSchemaTpl('remark'),
              getSchemaTpl('combo-container', {
                type: 'combo',
                label: '描述',
                mode: 'normal',
                name: 'texts',
                items: [
                  {
                    placeholder: 'Key',
                    type: 'input-number',
                    unique: true,
                    name: 'key',
                    columnClassName: 'w-xs flex-none',
                    min: 0,
                    step: 1,
                    max: 10,
                    precision: 0,
                  },
                  {
                    placeholder: '描述内容',
                    type: i18nEnabled ? 'input-text-i18n' : 'input-text',
                    name: 'value',
                  },
                ],
                draggable: false,
                multiple: true,
                pipeIn: (value: any) => {
                  if (!isObject(value)) {
                    return Array.isArray(value) ? value : []
                  }

                  const res = Object.keys(value).map((item: any) => {
                    return {
                      key: item || 0,
                      value: value[item] || '',
                    }
                  }) //.filter((item: any) => item.key <= this.count);

                  return res
                },
                pipeOut: (value: any[]) => {
                  if (!value.length) {
                    return undefined
                  }

                  const res: any = {}
                  const findMinCanUsedKey = (keys: string[], max: number): void | number => {
                    for (let i = 1; i <= max; i++) {
                      if (!keys.includes(String(i))) {
                        return i
                      }
                    }
                  }

                  value.forEach(item => {
                    const key =
                      item.key !== undefined
                        ? Number(item.key)
                        : findMinCanUsedKey(Object.keys(res), this.count)

                    // && key <= this.count
                    if (key) {
                      res[key] = item?.value || ''
                    }
                  })
                  return res
                },
              }),
              getSchemaTpl('autoFillApi'),
            ],
          },
          getSchemaTpl('status', { isFormItem: true, readonly: true }),
          getSchemaTpl('agValidation', {
            tag: ValidatorTag.Check,
          }),
        ]),
      },
      {
        title: '外观',
        body: [
          getSchemaTpl('collapseGroup', [
            getSchemaTpl('style:formItem', {
              renderer: context.info.renderer
            }),
            {
              title: '图标',
              body: [
                {
                  type: 'ae-switch-more',
                  label: '自定义',
                  mode: 'normal',
                  formType: 'extend',
                  form: {
                    body: [
                      {
                        type: 'input-text',
                        label: '字符',
                        name: 'char'
                      }
                    ]
                  }
                },

                {
                  type: 'input-color',
                  label: tipedLabel('未选中色值', '默认未选中色值为 #e7e7e8'),
                  name: 'inactiveColor',
                  pipeIn: defaultValue('#e7e7e8'),
                  pipeOut: undefinedPipeOut
                },

                getSchemaTpl('combo-container', {
                  type: 'combo',
                  label: '选中色值',
                  mode: 'normal',
                  name: 'colors',
                  items: [
                    {
                      placeholder: 'Key',
                      type: 'input-number',
                      unique: true,
                      name: 'key',
                      columnClassName: 'w-xs flex-none',
                      min: 0,
                      max: 10,
                      step: 1,
                      precision: 0
                    },

                    {
                      placeholder: 'Value',
                      type: 'input-color',
                      name: 'value'
                    }
                  ],
                  value: {
                    2: '#abadb1',
                    3: '#787b81',
                    5: '#ffa900'
                  },
                  draggable: false,
                  multiple: true,
                  pipeIn: (value: any) => {
                    if (!isObject(value)) {
                      return Array.isArray(value) ? value : [];
                    }

                    const res = Object.keys(value).map((item: any) => {
                      return {
                        key: item,
                        value: value[item] || ''
                      };
                    }); //.filter((item: any) => item.key <= this.count);

                    return res;
                  },
                  pipeOut: (value: any[]) => {
                    if (!value.length) {
                      return undefined;
                    }

                    const res: any = {};
                    const findMinCanUsedKey = (
                      keys: string[],
                      max: number
                    ): void | number => {
                      for (let i = 1; i <= max; i++) {
                        if (!keys.includes(String(i))) {
                          return i;
                        }
                      }
                    };

                    value.forEach(item => {
                      const key =
                        item.key !== undefined
                          ? Number(item.key)
                          : findMinCanUsedKey(Object.keys(res), this.count);

                      if (key) {
                        res[key] = item?.value || '';
                      }
                    });

                    return res;
                  }
                })
              ]
            },
            {
              title: '描述',
              body: [
                getSchemaTpl('horizontal-align', {
                  name: 'textPosition',
                  pipeIn: defaultValue('right')
                })
              ]
            },
            getSchemaTpl('style:classNames', {
              schema: [
                getSchemaTpl('className', {
                  label: '图标',
                  name: 'charClassName'
                }),

                getSchemaTpl('className', {
                  label: '评分描述',
                  name: 'textClassName'
                })
              ]
            })
          ])
        ]
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
