import { registerFilter } from 'amis'
import { useFilters } from '@ag-neptune/bu-ui'
import to from 'await-to-js'
import agHttp from '@/utils/http'

/**
 * 注册自定义过滤方法
 */
export function registerCustomFilters() {
  const filtersObj: any = useFilters()
  filtersObj.getPermissionByCode = (val: any) => {
    return false
  }
  filtersObj.getPermissionById = (val: any) => {
    return false
  }

  // 数据字典：根据 dictId 动态加载字典项（返回数组，供 AMIS select 使用）
  /**
   * 数据字典：同步从缓存中取 options，避免异步 filter 导致 AMIS 不渲染 & 避免重复请求
   * - window.AG_NEPTUNE_LOWCODE_DICT_ALL: [{id,name,options:[{label,dictValue}]}]
   */
  filtersObj.getDictById = (dictId: string) => {
    if (!dictId) return undefined

    const cacheKey = 'AG_NEPTUNE_LOWCODE_DICT_ALL'
    if (!(window as any).AG_NEPTUNE_LOWCODE_DICT_ALL) {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          ;(window as any).AG_NEPTUNE_LOWCODE_DICT_ALL = JSON.parse(cached)
        } catch {
          // ignore
        }
      }
    }

    const dictAll = (window as any).AG_NEPTUNE_LOWCODE_DICT_ALL as any[] | undefined
    const found = dictAll?.find(d => d.id === dictId)
    console.log('found?.options', found?.options)
    return found?.options || undefined
  }

  // 获取导出列配置
  filtersObj.getExportColumnsConfig = (obj: { key: string; sourceUrl: string }) => {
    const jsonStr = sessionStorage.getItem(obj.key)
    // if (obj.sourceUrl) {
    //   obj.sourceUrl = window.__PRODUCTION__APP__CONF__.VITE_APP_API_BASEURL + obj?.sourceUrl
    // }
    if (jsonStr) {
      return {
        key: obj.key,
        columns: JSON.parse(jsonStr),
        sourceUrl: obj?.sourceUrl,
      }
    } else {
      return {
        key: obj.key,
        columns: [],
        sourceUrl: obj?.sourceUrl,
      }
    }
  }

  Object.keys(filtersObj).forEach(key => {
    registerFilter(key, filtersObj[key])
  })
}
