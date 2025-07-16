export interface State {
  theme: 'cxd' | 'antd' // 主题
  title: string // 标题
  isMobile: boolean // 浏览模式 默认false
  isProview: boolean // 是否预览 默认false
  language?: string // 显示语言
  shortcutKey?: string // 快捷键
  defaultSchema?: any // schema
  emptySchema?: any // 空 schema
}

export interface Action {
  setData: (_key: DataKey, _value: any) => void
  onChangeLocale: (_e: any) => void
}

export type DataKey =
  | 'theme'
  | 'title'
  | 'isMobile'
  | 'isProview'
  | 'language'
  | 'shortcutKey'
  | 'defaultSchema'
