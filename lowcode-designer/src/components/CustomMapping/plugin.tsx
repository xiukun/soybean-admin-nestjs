import { MappingPlugin } from 'amis-editor'
import { BaseEventContext, defaultValue, getSchemaTpl } from 'amis-editor-core'
import { dictIdProp } from '../common/utils'
export class MappingPluginRefactor extends MappingPlugin {
  // static id = 'MappingPlugin'
  // rendererName = 'mapping'

  panelBodyCreator = (context: BaseEventContext) => {
    const isUnderField = /\/field\/\w+$/.test(context.path as string)
    return [
      getSchemaTpl('tabs', [
        {
          title: '属性',
          body: getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              id: 'properties-basic',
              body: [
                isUnderField
                  ? {
                      type: 'tpl',
                      inline: false,
                      className: 'text-info text-sm',
                      tpl: '<p>当前为字段内容节点配置，选择上层还有更多配置</p>'
                    }
                  : null,
                dictIdProp(context),
                {
                  type: 'input-text',
                  label: '映射label',
                  name: 'labelField',
                },
                {
                  type: 'input-text',
                  label: '映射value',
                  name: 'valueField',
                },
                getSchemaTpl('mapSourceControl'),
                {
                  type: 'ae-switch-more',
                  mode: 'normal',
                  label: '自定义显示模板',
                  bulk: false,
                  name: 'itemSchema',
                  formType: 'extend',
                  defaultData: this.scaffold.itemSchema,
                  form: {
                    body: [
                      {
                        type: 'button',
                        level: 'primary',
                        size: 'sm',
                        block: true,
                        onClick: this.editDetail.bind(this, context.id),
                        label: '配置显示模板'
                      }
                    ]
                  },
                  pipeIn: (value: any) => {
                    return value !== undefined;
                  },
                  pipeOut: (value: any, originValue: any, data: any) => {
                    if (value === true) {
                      return {
                        type: 'tag',
                        label: `\${${this.getDisplayField(
                          data
                        )} | default: "-"}`
                      };
                    }
                    return value ? value : undefined;
                  }
                },
                getSchemaTpl('valueFormula', {
                  pipeOut: (value: any) => {
                    return value == null || value === '' ? undefined : value;
                  }
                }),
                getSchemaTpl('placeholder', {
                  pipeIn: defaultValue('-'),
                  label: '占位符'
                })
              ]
            },
            getSchemaTpl('status')
          ])
        },
        {
          title: '外观',
          body: getSchemaTpl('collapseGroup', [
            {
              title: 'CSS类名',
              body: [
                getSchemaTpl('className', {
                  label: '外层'
                })
              ]
            }
          ])
        }
      ])
    ]
  }
}
