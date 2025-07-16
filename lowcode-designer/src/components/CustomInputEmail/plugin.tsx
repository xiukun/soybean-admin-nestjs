import { TextPluginRefactor } from '../CustomInputText/plugin'
export class EmailControlPluginRefactor extends TextPluginRefactor {
  static id = 'EmailControlPlugin'
  // 关联渲染器名字
  rendererName = 'input-email'
  $schema = '/schemas/TextControlSchema.json'
  name = '邮箱框'
  isBaseComponent = true
  icon = 'fa fa-envelope-o'
  pluginIcon = 'input-email-plugin'

  description = '验证输入是否符合邮箱的格式'

  scaffold = {
    type: 'input-email',
    label: '邮箱',
    name: 'email',
  }

  disabledRendererPlugin = true
  previewSchema = {
    type: 'form',
    className: 'text-left',
    mode: 'horizontal',
    wrapWithPanel: false,
    body: {
      ...this.scaffold,
    },
  }

  panelTitle = this.name
}
export const id = EmailControlPluginRefactor.id
