import { TextPluginRefactor } from '../CustomInputText/plugin'

export class PasswordControlPluginRefactor extends TextPluginRefactor {
  static id = 'PasswordControlPlugin'
  // 关联渲染器名字
  rendererName = 'input-password'
  $schema = '/schemas/TextControlSchema.json'
  name = '密码框'
  isBaseComponent = true
  icon = 'fa fa-asterisk'
  pluginIcon = 'input-password-plugin'

  description = '验证输入是否符合邮箱的格式'

  scaffold = {
    type: 'input-password',
    label: '密码',
    name: 'password',
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
export const id = PasswordControlPluginRefactor.id
