import { createContext, createElement, useContext } from 'react'
import { create } from 'zustand'
import { currentLocale } from 'i18n-runtime'
// import { immer } from 'zustand/middleware/immer'

import { Action, DataKey, State } from './types/amis-store'

// 默认schema
const defaultSchema =
  window[window.AG_NEPTUNE_GLOBAL_VARS.json] ||
  localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.json)
    ? JSON.parse(localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.json) as any)
    : {
        type: 'page',
        body: [],
        regions: ['body'],
        config:{
          globalVals:[]
        }
      }
/**
 * amis设计器 状态管理
 */
// 使用zustand推荐的最优性能结构创建store
const useAmisStore = create<State & Action>((set) => ({
  // 基础主题和配置
  theme: 'antd',
  title: 'amis设计器',
  isMobile: false,
  isProview: false,
  language: localStorage.getItem('suda-i18n-locale') || currentLocale() || 'zh-CN',
  shortcutKey: '',
  
  // Schema相关
  defaultSchema,
  emptySchema: {
    type: 'page',
    body: [],
    regions: ['body'],
    config: {
      globalVals: []
    }
  },
  
  // 页面信息相关状态
  pageKey: '',
  lowcodePageId: '',
  lowcodePageInfo: null,
  
  // Action: 设置单个状态
  setData: (key, value) => set({ [key]: value }),
  
  // Action: 设置页面信息
  setPageInfo: (pageInfo) => set({
    pageKey: pageInfo.pageKey || '',
    lowcodePageId: pageInfo.lowcodePageId || '',
    title: pageInfo.title || ''
  }),
  
  // Action: 切换语言
  onChangeLocale: (value) => {
    localStorage.setItem('suda-i18n-locale', value)
    window.location.reload()
  },
}))

/**
 * 定义
 */
const AmisStoreContext = createContext<any>({
  // schemaJson: defaultSchema,
  onDictionarySave: () => {},
  onChange: () => {},
  onSave: () => {},
  onClear: () => {},
  setSchemaJson: () => {},
  onAsyncChange: () => {},
})

const AmisStoreProvider = ({ value, children }: { value: any; children: any }) =>
  createElement(AmisStoreContext.Provider, { value }, children)

const useAmisStoreContext = () => useContext(AmisStoreContext)
export { useAmisStore, AmisStoreContext, AmisStoreProvider, useAmisStoreContext }
export default useAmisStore
