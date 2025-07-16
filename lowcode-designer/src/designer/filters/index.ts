import { registerFilter } from 'amis'
import { useFilters } from '@ag-neptune/bu-ui'

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
