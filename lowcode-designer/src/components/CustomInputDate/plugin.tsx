import { Schema } from 'amis-core'
import { DateControlPlugin } from 'amis-editor'
import { BaseEventContext, tipedLabel } from 'amis-editor-core'
import { defaultValue, getSchemaTpl } from 'amis-editor-core'
import { FormulaDateType } from 'amis-editor/lib/renderer/FormulaControl'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

const formatX = [
  {
    label: 'X(时间戳)',
    value: 'X',
  },
  {
    label: 'x(毫秒时间戳)',
    value: 'x',
  },
]

const DateType: {
  [key: string]: {
    format: string // 各类型时间的默认格式
    placeholder: string
    formatOptions: Array<{ label: string; value: string; timeFormat?: string }> // 各类型时间支持展示格式
  }
} = {
  date: {
    format: 'YYYY-MM-DD',
    placeholder: '请选择日期',
    formatOptions: [
      ...formatX,
      {
        label: 'YYYY-MM-DD',
        value: 'YYYY-MM-DD',
      },
      {
        label: 'YYYY/MM/DD',
        value: 'YYYY/MM/DD',
      },
      {
        label: 'YYYY年MM月DD日',
        value: 'YYYY年MM月DD日',
      },
    ],
  },
  datetime: {
    format: 'YYYY-MM-DD HH:mm:ss',
    placeholder: '请选择日期以及时间',
    formatOptions: [
      ...formatX,
      {
        label: 'YYYY-MM-DD HH:mm:ss',
        value: 'YYYY-MM-DD HH:mm:ss',
      },
      {
        label: 'YYYY/MM/DD HH:mm:ss',
        value: 'YYYY/MM/DD HH:mm:ss',
      },
      {
        label: 'YYYY年MM月DD日 HH时mm分ss秒',
        value: 'YYYY年MM月DD日 HH时mm分ss秒',
      },
    ],
  },
  time: {
    format: 'HH:mm',
    placeholder: '请选择时间',
    formatOptions: [
      {
        label: 'HH:mm',
        value: 'HH:mm',
      },
      {
        label: 'HH:mm:ss',
        value: 'HH:mm:ss',
      },
      {
        label: 'HH时mm分',
        value: 'HH时mm分',
      },
      {
        label: 'HH时mm分ss秒',
        value: 'HH时mm分ss秒',
      },
    ],
  },
  month: {
    format: 'YYYY-MM',
    placeholder: '请选择月份',
    formatOptions: [
      ...formatX,
      {
        label: 'YYYY-MM',
        value: 'YYYY-MM',
      },
      {
        label: 'MM',
        value: 'MM',
      },
      {
        label: 'M',
        value: 'M',
      },
    ],
  },
  quarter: {
    format: 'YYYY [Q]Q',
    placeholder: '请选择季度',
    formatOptions: [
      ...formatX,
      {
        label: 'YYYY-[Q]Q',
        value: 'YYYY-[Q]Q',
      },
      {
        label: 'Q',
        value: 'Q',
      },
    ],
  },
  year: {
    format: 'YYYY',
    placeholder: '请选择年',
    formatOptions: [
      ...formatX,
      {
        label: 'YYYY',
        value: 'YYYY',
      },
    ],
  },
}

const dateTooltip =
  '支持例如: <code>now、+3days、-2weeks、+1hour、+2years</code> 等（minute|min|hour|day|week|month|year|weekday|second|millisecond）这种相对值用法'

export class DateControlPluginRefactor extends DateControlPlugin {
  // static id = 'DateControlPlugin'
  panelBodyCreator = (context: BaseEventContext) => {
    const renderer: any = context.info.renderer

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
                getSchemaTpl('selectDateType', {
                  value: this.scaffold.type,
                  onChange: (value: string, oldValue: any, model: any, form: any) => {
                    const type: string = value.split('-')[1]

                    form.setValues({
                      placeholder: DateType[type]?.placeholder,
                      valueFormat: 'X',
                      displayFormat: DateType[type]?.format,
                      minDate: '',
                      maxDate: '',
                      value: '',
                    })
                  },
                }),
                {
                  type: 'input-text',
                  name: 'valueFormat',
                  label: tipedLabel(
                    '值格式',
                    '提交数据前将根据设定格式化数据，请参考 <a href="https://momentjs.com/" target="_blank">moment</a> 中的格式用法。',
                  ),
                  pipeIn: defaultValue('X'),
                  clearable: true,
                  onChange: (value: string, oldValue: any, model: any, form: any) => {
                    const type = form.data.type.split('-')[1]
                    model.setOptions(DateType[type].formatOptions)
                  },
                  options: DateType[this.scaffold.type.split('-')[1]].formatOptions,
                },
                {
                  type: 'input-text',
                  name: 'displayFormat',
                  label: tipedLabel(
                    '显示格式',
                    '请参考 <a href="https://momentjs.com/" target="_blank">moment</a> 中的格式用法。',
                  ),
                  pipeIn: defaultValue('YYYY-MM-DD'),
                  clearable: true,
                  onChange: (value: string, oldValue: any, model: any, form: any) => {
                    const type = form.data.type.split('-')[1]
                    model.setOptions(DateType[type].formatOptions)
                  },
                  options: DateType[this.scaffold.type.split('-')[1]].formatOptions,
                },
                getSchemaTpl('utc'),
                getSchemaTpl('clearable', {
                  pipeIn: defaultValue(true),
                }),
                getSchemaTpl('valueFormula', {
                  rendererSchema: (schema: Schema) => schema,
                  placeholder: '请选择静态值',
                  header: '表达式或相对值',
                  DateTimeType: FormulaDateType.IsDate,
                  label: tipedLabel('默认值', dateTooltip),
                }),
                getSchemaTpl('valueFormula', {
                  name: 'minDate',
                  header: '表达式或相对值',
                  DateTimeType: FormulaDateType.IsDate,
                  rendererSchema: (schema: Schema) => {
                    return {
                      ...schema,
                      value: context?.schema.minDate,
                    }
                  },
                  placeholder: '请选择静态值',
                  needDeleteProps: ['minDate'], // 避免自我限制
                  label: tipedLabel('最小值', dateTooltip),
                }),
                getSchemaTpl('valueFormula', {
                  name: 'maxDate',
                  header: '表达式或相对值',
                  DateTimeType: FormulaDateType.IsDate,
                  rendererSchema: (schema: Schema) => {
                    return {
                      ...schema,
                      value: context?.schema.maxDate,
                    }
                  },
                  needDeleteProps: ['maxDate'], // 避免自我限制
                  label: tipedLabel('最大值', dateTooltip),
                }),
                getSchemaTpl('placeholder', {
                  pipeIn: defaultValue('请选择日期'),
                }),
                getSchemaTpl('remark'),
                getSchemaTpl('labelRemark'),
                getSchemaTpl('description'),
                getSchemaTpl('autoFillApi'),
              ],
            },
            getSchemaTpl('status', { isFormItem: true }),
            getSchemaTpl('agValidation', {
              tag: ValidatorTag.Date,
              rendererSchema: (schema: Schema) => {
                return {
                  ...schema,
                  label: '值内容',
                  validateName: 'equals',
                }
              },
            }),
          ],
          { ...context?.schema, configTitle: 'props' },
        ),
      },
      {
        title: '外观',
        body: getSchemaTpl(
          'collapseGroup',
          [
            getSchemaTpl('style:formItem', renderer),
            getSchemaTpl('style:classNames', [
              getSchemaTpl('className', {
                label: '描述',
                name: 'descriptionClassName',
                visibleOn: 'this.description',
              }),
              getSchemaTpl('className', {
                name: 'addOn.className',
                label: 'AddOn',
                visibleOn: 'this.addOn && this.addOn.type === "text"',
              }),
            ]),
            getSchemaTpl('style:others', [
              {
                name: 'embed',
                type: 'button-group-select',
                size: 'md',
                label: '模式',
                mode: 'row',
                pipeIn: defaultValue(false),
                options: [
                  {
                    label: '浮层',
                    value: false,
                  },
                  {
                    label: '内嵌',
                    value: true,
                  },
                ],
              },
            ]),
          ],
          { ...context?.schema, configTitle: 'style' },
        ),
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
