import to from 'await-to-js'
import agHttp from '@/utils/http'
import { getScodeAllApi } from '@/api/amis'

export const getDict = () => {
  if (localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.dict))
    return JSON.parse(localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.dict) as string)
}
/**
 * 缓存数据字典
 * @returns
 */
export const cacheDictionary = async () => {
  const [err, data] = await to<any>(getScodeAllApi())
  if (err) return

  const dict = data.data?.options
  // window[window.AG_NEPTUNE_GLOBAL_VARS.dict] = dictJson
  ;(window as any)[window.AG_NEPTUNE_GLOBAL_VARS.dict] = dict
  localStorage.setItem(window.AG_NEPTUNE_GLOBAL_VARS.dict, JSON.stringify(dict))

  const dictNameList = (dict as any).map((item: any) => {
    return {
      appName: item.appName,
      id: item.keyName,
      name: item.name,
    }
  })

  window[window.AG_NEPTUNE_GLOBAL_VARS.dictNameList] = dictNameList

  localStorage.setItem(window.AG_NEPTUNE_GLOBAL_VARS.dictNameList, JSON.stringify(dictNameList))
}

/**
 * 初始化时自动加载数据字典并缓存
 */
export const initDictionary = () => {
  if (!localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.dict)) {
    cacheDictionary()
  }
}
