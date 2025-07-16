import { FormPluginRefactor } from '@/components/CustomForm/plugin'

export default class FormGroupPlugin extends FormPluginRefactor {
  name = '表单搜索栏'
  isBaseComponent = false
  disabledRendererPlugin = false
  pluginIcon = 'form-plugin'
  tags = ['表单']
  order = 601
  scaffold: any = {
    type: 'form',
    title: '表单',
    mode: 'inline',
    dsType: 'api',
    feat: 'Insert',
    body: [
      {
        type: 'input-text',
        label: '参数1:',
        name: 'text',
        size: '10rem',
      },
      {
        type: 'button',
        name: 'customResetBtn',
        label: '重置',
        onEvent: {
          click: {
            actions: [],
          },
        },
      },
    ],
    actions: [],
    resetAfterSubmit: false,
    wrapWithPanel: false,
    className: 'amis-form-search-box',
    onEvent: {
      submit: {
        weight: 0,
        actions: [],
      },
    },
    labelWidth: '5rem',
  }
}
