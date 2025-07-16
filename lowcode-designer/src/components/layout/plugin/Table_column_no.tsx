import { TplPlugin } from 'amis-editor/lib/plugin/Tpl'

// tplPlugin 继承后 tpl组件加载异常，报错，国际化失效。
export class TableColumnNo extends TplPlugin {
  // 组件名称（组件面板显示的Title）
  name = '表格列序号'
  description = '表格的自增序号列，展示1，2，3...,表格专属组件'
  isBaseComponent = false
  // disabledRendererPlugin = false
  tags = ['表格'] // 自定义组件分类
  order = 100 // 组件面板中的展示优先级，越小越靠前展示
  scaffold = {
    label: '序号',
    type: 'tpl',
    tpl: '${(start - 1) * size + index + 1}',
  }
}

export default TableColumnNo
