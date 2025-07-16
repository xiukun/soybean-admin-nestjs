import { getSchemaTpl } from 'amis-editor'
import APIControl from 'amis-editor/lib/renderer/APIControl'

export default class AeApiControlRefactor extends APIControl {
  // render() {
  //   const el = super.render()
  //   return el
  // }
  renderApiConfigTabs(submitOnChange: boolean) {
    const res = super.renderApiConfigTabs(submitOnChange)
    res.body[0].tabs[0].title = '新接口配置'
    getSchemaTpl('select', {
      label: '单行显示选中值',
      name: 'valuesNoWrap',
    })
    res.body[0].tabs[0].tab[0].value = 'post'
    res.body[0].tabs[0].tab[1] = json

    return res
  }
}

const json = {
  type: 'tree-select',
  label: '接口',
  name: 'url',
  multiple: false,
  clearable: true,
  searchable: true,
  creatable: true,
  placeholder: '请选择接口',
  initiallyOpen: true,
  source: {
    url: '/system/amisInterface/query',
    method: 'post',
    requestAdaptor: '',
    adaptor: '',
    messages: {},
    data: {
      id: '-1',
    },
  },
  labelField: 'nodeName',
  valueField: 'nodeUrl',
  removable: true,
  onlyLeaf: true,
}
