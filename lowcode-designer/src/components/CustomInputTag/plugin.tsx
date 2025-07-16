import { formItemControl, TagControlPlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { Schema } from 'amis-core'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class TagControlPluginRefactor extends TagControlPlugin {
  // static id = 'TagControlPlugin';
  // rendererName = 'input-tag'
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
            getSchemaTpl('clearable'),
            getSchemaTpl('optionsTip'),
            getSchemaTpl('valueFormula', {
              rendererSchema: (schema: Schema) => schema,
              mode: 'vertical', // 改成上下展示模式
            }),
            getSchemaTpl('joinValues'),
            getSchemaTpl('delimiter'),
            getSchemaTpl('extractValue'),
            {
              type: 'input-number',
              name: 'max',
              label: tipedLabel('最大标签数量', '最多选择的标签数量'),
              min: 1,
            },
            getSchemaTpl('autoFillApi', {
              visibleOn: '!this.autoFill || this.autoFill.scene && this.autoFill.action',
            }),
            getSchemaTpl('autoFill', {
              visibleOn: '!this.autoFill || !this.autoFill.scene && !this.autoFill.action',
            }),
          ],
        },
        option: {
          body: [
            getSchemaTpl('optionControlV2', {
              description: '设置选项后，输入时会下拉这些选项供用户参考。',
            }),
          ],
        },
        status: {},
      },
      context,
    )
  }
}
