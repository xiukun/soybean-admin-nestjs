import { Schema } from 'amis-core'
import { CityControlPlugin } from 'amis-editor'
import { BaseEventContext, defaultValue, getSchemaTpl } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { cloneDeep } from 'lodash'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class CityControlPluginRefacotr extends CityControlPlugin {
  // static id = 'CityControlPlugin'
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
              getSchemaTpl('valueFormula', {
                rendererSchema: (schema: Schema) => schema,
                rendererWrapper: true,
                mode: 'vertical', // 改成上下展示模式
              }),
              {
                name: 'extractValue',
                label: '值格式',
                type: 'button-group-select',
                size: 'sm',
                options: [
                  { label: '行政编码', value: true },
                  { label: '对象结构', value: false },
                ],
              },

              getSchemaTpl('switch', {
                name: 'allowCity',
                label: '可选城市',
                pipeIn: defaultValue(true),
                onChange: (value: string, oldValue: string, item: any, form: any) => {
                  if (!value) {
                    const schema = cloneDeep(form.data)
                    form.setValueByName('allowDistrict', undefined)
                    form.setValueByName('value', schema.extractValue ? '' : {})
                  }
                },
              }),

              getSchemaTpl('switch', {
                name: 'allowDistrict',
                label: '可选区域',
                visibleOn: 'this.allowCity',
                pipeIn: defaultValue(true),
                onChange: (value: string, oldValue: string, item: any, form: any) => {
                  if (!value) {
                    const schema = cloneDeep(form.data)
                    form.setValueByName('value', schema.extractValue ? '' : {})
                  }
                },
              }),

              getSchemaTpl('switch', {
                name: 'searchable',
                label: '可搜索',
                pipeIn: defaultValue(false),
              }),

              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('description'),
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
