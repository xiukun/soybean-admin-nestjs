import { formItemControl, ListControlPlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl } from 'amis-editor-core'
import { Schema } from 'amis-core'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class ListControlPluginRefactor extends ListControlPlugin {
  // static id = 'ListControlPlugin'
  // rendererName = 'list-select'
  panelBodyCreator = (context: BaseEventContext) => {
    return formItemControl(
      {
        common: {
          replace: true,
          body: [
            getSchemaTpl('layout:originPosition', { value: 'left-top' }),
            ...dataModelItemPlugin,
            // getSchemaTpl('formItemName', {
            //   required: true,
            // }),
            getSchemaTpl('label'),
            getSchemaTpl('multiple'),
            getSchemaTpl('extractValue'),
            getSchemaTpl('valueFormula', {
              // 边栏渲染不渲染自定义样式，会干扰css生成
              rendererSchema: (schema: Schema) => ({
                ...(schema || {}),
                itemSchema: null
              }),
              mode: 'vertical',
              useSelectMode: true, // 改用 Select 设置模式
              visibleOn: 'this.options && this.options.length > 0'
            })
          ],
        },
        option: {
          body: [
            getSchemaTpl('optionControlV2'),
            {
              type: 'ae-switch-more',
              mode: 'normal',
              label: '自定义显示模板',
              formType: 'extend',
              form: {
                body: [
                  {
                    type: 'dropdown-button',
                    label: '配置显示模板',
                    level: 'enhance',
                    buttons: [
                      {
                        type: 'button',
                        block: true,
                        onClick: this.editDetail.bind(
                          this,
                          context.id,
                          'itemSchema'
                        ),
                        label: '配置默认态模板'
                      },
                      {
                        type: 'button',
                        block: true,
                        onClick: this.editDetail.bind(
                          this,
                          context.id,
                          'activeItemSchema'
                        ),
                        label: '配置激活态模板'
                      }
                    ]
                  }
                ]
              },
              pipeIn: (value: any) => {
                return value !== undefined;
              },
              pipeOut: (value: any, originValue: any, data: any) => {
                if (value === true) {
                  return {
                    type: 'container',
                    body: [
                      {
                        type: 'tpl',
                        tpl: `\${${this.getDisplayField(data)}}`,
                        wrapperComponent: '',
                        inline: true
                      }
                    ]
                  };
                }
                return value ? value : undefined;
              }
            }
          ]
        },
        status: {},
      },
      context,
    )
  }
}
