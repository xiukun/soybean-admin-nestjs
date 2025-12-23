export interface State {
  theme: 'cxd' | 'antd' // 主题
  title: string // 标题
  isMobile: boolean // 浏览模式 默认false
  isProview: boolean // 是否预览 默认false
  language?: string // 显示语言
  shortcutKey?: string // 快捷键
  defaultSchema?: any // schema
  emptySchema?: any // 空 schema
  // 新增页面信息相关状态
  pageKey: string // URL中的pageKey参数（menuId）
  lowcodePageId: string // 实际的lowcode页面ID
}

export interface Action {
  setData: (_key: DataKey, _value: any) => void
  onChangeLocale: (_e: any) => void
  setPageInfo: (_pageInfo: any) => void // 新增：设置页面信息
}

export type DataKey =
  | 'theme'
  | 'title'
  | 'isMobile'
  | 'isProview'
  | 'language'
  | 'shortcutKey'
  | 'defaultSchema'
  | 'pageKey'
  | 'lowcodePageId'
