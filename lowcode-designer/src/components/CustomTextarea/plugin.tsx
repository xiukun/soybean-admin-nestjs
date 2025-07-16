import { TextareaControlPlugin } from 'amis-editor'
import { defaultValue, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import type { BaseEventContext } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { ValidatorTag } from 'amis-editor/lib/validator'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class TextareaControlPluginRefactor extends TextareaControlPlugin {
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
              // getSchemaTpl('valueFormula', {
              //   rendererSchema: context?.schema,
              //   mode: 'vertical' // 改成上下展示模式
              // }),
              getSchemaTpl('textareaDefaultValue'),
              getSchemaTpl('switch', {
                name: 'trimContents',
                pipeIn: defaultValue(true),
                label: tipedLabel('去除首尾空白', '开启后，将不允许用户输入前后空格'),
              }),
              getSchemaTpl('showCounter'),
              {
                name: 'maxLength',
                label: tipedLabel('最大字数', '限制输入最多文字数量'),
                type: 'input-number',
                min: 0,
                step: 1,
              },
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('placeholder'),
              getSchemaTpl('description'),
              getSchemaTpl('autoFillApi'),
            ],
          },
          getSchemaTpl('status', {
            isFormItem: true,
            readonly: true,
          }),
          getSchemaTpl('agValidation', {
            tag: ValidatorTag.Text,
          }),
        ]),
      },
      {
        title: '外观',
        body: [
          getSchemaTpl('collapseGroup', [
            getSchemaTpl('style:formItem', {
              renderer: context.info.renderer,
              schema: [
                {
                  type: 'input-number',
                  name: 'minRows',
                  value: 3,
                  label: '最小展示行数',
                  min: 1,
                },
                {
                  type: 'input-number',
                  name: 'maxRows',
                  value: 20,
                  label: '最大展示行数',
                  min: 1,
                },
              ],
            }),
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

export const id = TextareaControlPluginRefactor.id
