import to from 'await-to-js'
import agHttp from '@/utils/http'

export const getDict = () => {
  if (localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.dict))
    return JSON.parse(localStorage.getItem(window.AG_NEPTUNE_GLOBAL_VARS.dict) as string)
}
/**
 * 缓存数据字典
 * @returns
 */
export const cacheDictionary = async () => {
  // 一次性加载“字典 + 字典项 options”，避免频繁请求
  const [err, data] = await to<any>(agHttp.get('/dict/options-all'))
  if (err) return

  // backend ApiRes: { status, msg, data: { options: [{id,name,options:[{label,dictValue}]}] } }
  const dictAll = data?.data?.options || []

  const dictNameList = dictAll.map((d: any) => ({ id: d.id, name: d.name }))

  // 缓存全量字典（包含 options），供 getDictById 同步读取
  ;(window as any).MAITA_LOWCODE_DICT_ALL = dictAll
  localStorage.setItem('MAITA_LOWCODE_DICT_ALL', JSON.stringify(dictAll))
  // window[window.AG_NEPTUNE_GLOBAL_VARS.dict] = dictJson
  // 兼容原全局变量（如果存在）
  if ((window as any).AG_NEPTUNE_GLOBAL_VARS?.dictNameList) {
    ;(window as any)[(window as any).AG_NEPTUNE_GLOBAL_VARS.dictNameList] = dictNameList
    localStorage.setItem((window as any).AG_NEPTUNE_GLOBAL_VARS.dictNameList, JSON.stringify(dictNameList))
  }  // 供 AMIS ls:MAITA_LOWCODE_DICT_NAME_LIST 使用
  ;(window as any).MAITA_LOWCODE_DICT_NAME_LIST = dictNameList
  localStorage.setItem('MAITA_LOWCODE_DICT_NAME_LIST', JSON.stringify(dictNameList))
}
/**
 * 初始化时自动加载数据字典并缓存
 */
export const initDictionary = () => {
  const listKey = 'MAITA_LOWCODE_DICT_NAME_LIST'
  const allKey = 'MAITA_LOWCODE_DICT_ALL'

  const cachedAll = localStorage.getItem(allKey)
  if (cachedAll) {
    try {
      ;(window as any).MAITA_LOWCODE_DICT_ALL = JSON.parse(cachedAll)
    } catch {
      // ignore
    }
  }

  const cachedList = localStorage.getItem(listKey)
  if (cachedList) {
    try {
      ;(window as any).MAITA_LOWCODE_DICT_NAME_LIST = JSON.parse(cachedList)
      return
    } catch {
      // ignore parse error and refetch
    }
  }

  cacheDictionary()
}
