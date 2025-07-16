import { BaseEventContext, StaticControlPlugin } from 'amis-editor'
import { getSchemaTpl } from 'amis-editor-core'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class StaticControlPluginRefactor extends StaticControlPlugin {
  // static id = 'StaticControlPlugin'

  panelBodyCreator = (context: BaseEventContext) => {
    const renderer: any = context.info.renderer

    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基本',
            body: [
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: false,
              // }),

              getSchemaTpl('label'),
              // getSchemaTpl('value'),
              getSchemaTpl('valueFormula', {
                name: 'tpl',
                // rendererSchema: {
                //   ...context?.schema,
                //   type: 'textarea', // 改用多行文本编辑
                //   value: context?.schema.tpl // 避免默认值丢失
                // }
              }),
              getSchemaTpl('quickEdit', {}, this.manager),
              getSchemaTpl('morePopOver', {}, this.manager),
              getSchemaTpl('copyable'),
              getSchemaTpl('labelRemark'),
              getSchemaTpl('remark'),
              getSchemaTpl('placeholder'),
              getSchemaTpl('description'),
              /*{
                  children: (
                    <Button
                      size="sm"
                      level="info"
                      className="m-b"
                      block
                      onClick={this.exchangeRenderer.bind(this, context.id)}
                    >
                      更改渲染器类型
                    </Button>
                  )
              },*/
            ],
          },
          getSchemaTpl('status', {
            isFormItem: true,
            unsupportStatic: true,
          }),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          getSchemaTpl('style:formItem', { renderer }),
          {
            title: '控件',
            body: [getSchemaTpl('borderMode')],
          },
          {
            title: 'CSS类名',
            body: [
              getSchemaTpl('className', {
                label: '整体',
              }),
              getSchemaTpl('className', {
                label: '标签',
                name: 'labelClassName',
              }),
              getSchemaTpl('className', {
                label: '控件',
                name: 'inputClassName',
              }),
              getSchemaTpl('className', {
                label: '描述',
                name: 'descriptionClassName',
                visibleOn: 'this.description',
              }),
            ],
          },
        ]),
      },
    ])
  }
}
