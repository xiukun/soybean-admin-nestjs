import { ServicePlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl, tipedLabel } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'

export class ServicePluginRefactor extends ServicePlugin {
  // static id = 'ServicePlugin'

  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        className: 'p-none',
        body: [
          getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              body: [
                getSchemaTpl('layout:originPosition', { value: 'left-top' }),
                // ...generateDSControls(),
                getSchemaTpl('apiControl', {
                  name: 'api',
                  label: 'api数据源',
                }),
              ],
            },
            {
              title: '高级',
              body: [
                getSchemaTpl('combo-container', {
                  type: 'input-kv',
                  mode: 'normal',
                  name: 'data',
                  label: '初始化静态数据',
                }),
                getSchemaTpl('apiControl', {
                  name: 'schemaApi',
                  label: tipedLabel('Schema数据源', '配置schemaApi后，可以实现动态渲染页面内容'),
                }),
                getSchemaTpl('initFetch', {
                  name: 'initFetchSchema',
                  label: '是否Schema初始加载',
                  visibleOn:
                    'typeof this.schemaApi === "string" ? this.schemaApi : this.schemaApi && this.schemaApi.url',
                }),
                {
                  name: 'ws',
                  type: 'input-text',
                  label: tipedLabel(
                    'WebSocket接口',
                    'Service 支持通过WebSocket(ws)获取数据，用于获取实时更新的数据。',
                  ),
                },
                {
                  type: 'js-editor',
                  allowFullscreen: true,
                  name: 'dataProvider',
                  label: tipedLabel(
                    '自定义函数获取数据',
                    '对于复杂的数据获取情况，可以使用外部函数获取数据',
                  ),
                  placeholder:
                    '/**\n * @param data 上下文数据\n * @param setData 更新数据的函数\n * @param env 环境变量\n */\ninterface DataProvider {\n   (data: any, setData: (data: any) => void, env: any): void;\n}\n',
                },
              ],
            },
            {
              title: '状态',
              body: [getSchemaTpl('visible'), getSchemaTpl('hidden')],
            },
          ]),
        ],
      },
      {
        title: '外观',
        body: [getSchemaTpl('className')],
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
