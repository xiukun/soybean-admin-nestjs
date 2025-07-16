import { TabsTransferPlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'
export class TabsTransferPluginRefactor extends TabsTransferPlugin {
  // static id = 'TabsTransferPlugin'

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
              {
                label: '左侧选项展示',
                name: 'selectMode',
                type: 'select',
                value: 'tree',
                options: [
                  {
                    label: '列表形式',
                    value: 'list',
                  },
                  {
                    label: '表格形式',
                    value: 'table',
                  },
                  {
                    label: '树形选择形式',
                    value: 'tree',
                  },
                  {
                    label: '级联选择形式',
                    value: 'chained',
                  },
                ],
              },
              {
                label: '右侧结果标题',
                name: 'resultTitle',
                type: 'input-text',
                inputClassName: 'is-inline ',
                placeholder: '已选项',
              },
              getSchemaTpl('sortable'),
              getSchemaTpl('searchable', {
                onChange: (value: any, origin: any, item: any, form: any) => {
                  if (!value) {
                    form.setValues({
                      searchApi: undefined,
                    })
                  }
                },
              }),

              getSchemaTpl('apiControl', {
                label: tipedLabel(
                  '检索接口',
                  '可以通过接口获取检索结果，检索值可以通过变量\\${term}获取，如："https://xxx/search?name=\\${term}"',
                ),
                mode: 'normal',
                name: 'searchApi',
                visibleOn: '!!searchable',
              }),
            ],
          },
          {
            title: '选项',
            body: [
              {
                $ref: 'options',
                name: 'options',
              },
              getSchemaTpl('apiControl', {
                label: tipedLabel('获取选项接口', '可以通过接口获取动态选项，一次拉取全部'),
                mode: 'normal',
                name: 'source',
              }),
              getSchemaTpl(
                'loadingConfig',
                {
                  visibleOn: 'this.source || !this.options',
                },
                { context },
              ),
              getSchemaTpl('joinValues'),
              getSchemaTpl('delimiter'),
              getSchemaTpl('extractValue'),
              // getSchemaTpl('autoFillApi', {
              //   visibleOn:
              //     '!this.autoFill || this.autoFill.scene && this.autoFill.action'
              // })
            ],
          },
          {
            title: '高级',
            body: [getSchemaTpl('virtualThreshold'), getSchemaTpl('virtualItemHeight')],
          },
          getSchemaTpl('status', { isFormItem: true }),
        ]),
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
