import { SearchBoxPlugin } from 'amis-editor'
import { BaseEventContext, getSchemaTpl } from 'amis-editor-core'
import { getEventControlConfig } from 'amis-editor'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class SearchBoxPluginRefactor extends SearchBoxPlugin {
  // static id = 'SearchBoxPlugin'
  // rendererName = 'search-box'

  panelBodyCreator = (context: BaseEventContext) => {
    return getSchemaTpl('tabs', [
      {
        title: '属性',
        body: getSchemaTpl('collapseGroup', [
          {
            title: '基础',
            body: [
              ...dataModelItemPlugin,
              // getSchemaTpl('formItemName', {
              //   required: true,
              // }),
              getSchemaTpl('switch', {
                label: '可清除',
                name: 'clearable',
              }),
              getSchemaTpl('switch', {
                label: '清除后立即搜索',
                name: 'clearAndSubmit',
              }),
              getSchemaTpl('switch', {
                label: '立即搜索',
                name: 'searchImediately',
              }),
              getSchemaTpl('switch', {
                label: 'mini版本',
                name: 'mini',
              }),
              getSchemaTpl('switch', {
                label: '加强样式',
                name: 'enhance',
                visibleOn: '!data.mini',
              }),
              getSchemaTpl('placeholder'),
            ],
          },
          getSchemaTpl('status'),
        ]),
      },
      {
        title: '外观',
        body: getSchemaTpl('collapseGroup', [
          getSchemaTpl('style:classNames', { isFormItem: false }),
        ]),
      },
      {
        title: '事件',
        className: 'p-none',
        body: getSchemaTpl('eventControl', {
          name: 'onEvent',
          ...getEventControlConfig(this.manager, context),
        }),
      },
    ])
  }
}
