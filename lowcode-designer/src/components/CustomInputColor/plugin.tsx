import { ColorControlPlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { ValidatorTag } from 'amis-editor/lib/validator'
import tinyColor from 'tinycolor2'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
function convertColor(value: string[], format: string): string[]
function convertColor(value: string, format: string): string
function convertColor(value: any, format: string): any {
  format = format.toLocaleLowerCase()

  function convert(v: string) {
    const color = tinyColor(v)
    if (!color.isValid()) {
      return ''
    }
    if (format !== 'rgba') {
      color.setAlpha(1)
    }
    switch (format) {
      case 'hex':
        return color.toHexString()
      case 'hsl':
        return color.toHslString()
      case 'rgb':
        return color.toRgbString()
      case 'rgba':
        const { r, g, b, a } = color.toRgb() as any
        return `rgba(${r}, ${g}, ${b}, ${a})`
      default:
        return color.toString()
    }
  }

  return Array.isArray(value) ? value.map(convert) : convert(value)
}

const presetColors = [
  '#ffffff',
  '#000000',
  '#d0021b',
  '#f5a623',
  '#f8e71c',
  '#7ED321',
  '#4A90E2',
  '#9013fe',
]
const colorFormat = ['hex', 'hexa', 'rgb', 'rgba', 'hsl']
const presetColorsByFormat = colorFormat.reduce<{
  [propsName: string]: string[]
}>((res, fmt) => {
  res[fmt] = convertColor(presetColors, fmt)
  return res
}, {})

export class ColorControlPluginRefactor extends ColorControlPlugin {
  // static id = 'ColorControlPlugin'

  panelBodyCreator = (context: BaseEventContext) => {
    const renderer: any = context.info.renderer
    const formatOptions = colorFormat.map(value => ({
      label: value.toUpperCase(),
      value,
    }))

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
                  type: 'select',
                  label: '值格式',
                  name: 'format',
                  value: 'hex',
                  options: formatOptions,
                  onChange: (format: any, oldFormat: any, model: any, form: any) => {
                    const { value, presetColors } = form.data
                    if (value) {
                      form.setValueByName('value', convertColor(value, format))
                    }
                    if (Array.isArray(presetColors)) {
                      form.setValueByName('presetColors', convertColor(presetColors, format))
                    }
                  },
                },
                // todo: 待优化
                [...formatOptions.map(({ value }) => this.getConditionalColorPanel(value))],
                // {
                //   label: '默认值',
                //   name: 'value',
                //   type: 'input-color',
                //   format: '${format}'
                // },
                getSchemaTpl('clearable'),
                getSchemaTpl('labelRemark'),
                getSchemaTpl('remark'),
                getSchemaTpl('placeholder'),
                getSchemaTpl('description'),
                getSchemaTpl('autoFillApi'),
              ],
            },
            {
              title: '拾色器',
              body: [
                getSchemaTpl('switch', {
                  label: tipedLabel('隐藏调色盘', '开启时，禁止手动输入颜色，只能从备选颜色中选择'),
                  name: 'allowCustomColor',
                  disabledOn: 'Array.isArray(presetColors) && presetColors.length === 0',
                  pipeIn: (value: any) => (typeof value === 'undefined' ? false : !value),
                  pipeOut: (value: boolean) => !value,
                }),
                getSchemaTpl('switch', {
                  label: tipedLabel('备选色', '拾色器底部的备选颜色'),
                  name: 'presetColors',
                  onText: '自定义',
                  offText: '默认',
                  pipeIn: (value: any) => (typeof value === 'undefined' ? false : true),
                  pipeOut: (value: any, originValue: any, { format = 'hex' }: any) => {
                    return !value ? undefined : presetColorsByFormat[format]
                  },
                  onChange: (colors: any, oldValue: any, model: any, form: any) => {
                    if (Array.isArray(colors) && colors.length === 0) {
                      form.setValueByName('allowCustomColor', true)
                    }
                  },
                }),
                ...formatOptions.map(({ value }) => this.getConditionalColorComb(value)),
              ],
            },
            getSchemaTpl('status', {
              isFormItem: true,
            }),
            getSchemaTpl('agValidation', {
              tag: ValidatorTag.MultiSelect,
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
            getSchemaTpl('style:formItem', { renderer }),
            getSchemaTpl('style:classNames', {
              schema: [
                getSchemaTpl('className', {
                  label: '描述',
                  name: 'descriptionClassName',
                  visibleOn: 'this.description',
                }),
              ],
            }),
          ],
          { ...context?.schema, configTitle: 'style' },
        ),
      },
      // {
      //   title: '事件',
      //   className: 'p-none',
      //   body: [
      //     getSchemaTpl('eventControl', {
      //       name: 'onEvent',
      //       ...getEventControlConfig(this.manager, context)
      //     })
      //   ]
      // }
    ])
  }
}
