import { ExcelControlPlugin, formItemControl } from 'amis-editor'
import { BaseEventContext, defaultValue, getSchemaTpl } from 'amis-editor-core'
export class ExcelControlPluginRefactor extends ExcelControlPlugin {
  // static id = 'ExcelControlPlugin';
  // // 关联渲染器名字
  // rendererName = 'input-excel';

  panelBodyCreator = (context: BaseEventContext) => {
    return formItemControl(
      {
        common: {
          body: [
            getSchemaTpl('layout:originPosition', { value: 'left-top' }),
            {
              label: '解析模式',
              name: 'parseMode',
              type: 'select',
              options: [
                {
                  label: '对象',
                  value: 'object',
                },
                { label: '数组', value: 'array' },
              ],
            },
            getSchemaTpl('switch', {
              name: 'allSheets',
              label: '是否解析所有 Sheet',
            }),

            getSchemaTpl('switch', {
              name: 'plainText',
              label: '是否解析为纯文本',
              pipeIn: defaultValue(true),
            }),

            getSchemaTpl('switch', {
              name: 'includeEmpty',
              label: '是否包含空内容',
              visibleOn: 'this.parseMode === "array"',
            }),
          ],
        },
      },
      context,
    )
  }
}
