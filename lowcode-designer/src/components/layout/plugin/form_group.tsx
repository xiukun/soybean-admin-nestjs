import { GroupControlPlugin } from 'amis-editor/lib/plugin/Form/Group'

export default class FormGroupPlugin extends GroupControlPlugin {
  name = '表单项分组'
  isBaseComponent = false
  disabledRendererPlugin = false
  pluginIcon = 'flex-container-plugin'
  tags = ['表单']
  order = 600
  scaffold: any = {
    type: 'group',
    body: [
      {
        type: 'input-text',
        name: 'text1',
        label: '文本1',
      },
    ],
  }
}
