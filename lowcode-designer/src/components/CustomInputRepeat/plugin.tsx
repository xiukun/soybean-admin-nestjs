import { RepeatControlPlugin } from 'amis-editor'
import { getSchemaTpl } from 'amis-editor-core'
import { dataModelItemPlugin } from '../common/json/data-model-item-plugin'

export class RepeatControlPluginRefactor extends RepeatControlPlugin {
  // static id = 'RepeatControlPlugin'
  // rendererName = 'input-repeat'

  panelBody = [
    getSchemaTpl('layout:originPosition', { value: 'left-top' }),
    ...dataModelItemPlugin,
    getSchemaTpl('switchDefaultValue'),
    {
      type: 'input-text',
      name: 'value',
      label: '默认值',
      visibleOn: 'typeof this.value !== "undefined"',
    },

    {
      name: 'options',
      type: 'select',
      label: '启用单位',
      options: 'secondly,minutely,hourly,daily,weekdays,weekly,monthly,yearly'.split(','),
      value: 'hourly,daily,weekly,monthly',
      multiple: true,
    },
  ]
}
