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
/* @ts-ignore */
const useAmisStore = create<State & Action>((set: any) => ({
  theme: 'antd',
  title: 'ag amis设计器',
  isMobile: false,
  isProview: false,
  language: localStorage.getItem('suda-i18n-locale') || currentLocale() || 'zh-CN', // 当前语言类型
  shortcutKey: '',
  defaultSchema,
  emptySchema: {
    type: 'page',
    body: [],
    regions: ['body'],
    config:{
      globalVals:[]
    }
  },

  /**
   * 设置数据
   * @param key 变更的属性名称
   * @param value 变更的属性值
   */
  setData: (key: DataKey, value: any) => {
    set(() => ({ [key]: value }))
  },

  /**
   * 切换语言，local storage保存
   * @param value zh-CN | en-US
   */
  onChangeLocale: (value: string) => {
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
