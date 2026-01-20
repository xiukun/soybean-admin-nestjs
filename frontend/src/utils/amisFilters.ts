import { useFilters } from '@maita/amis-tools'
import { useAuthStore } from '@/store/modules/auth'

/**
 * 注册自定义过滤方法 amis使用
 */
export function registerCustomFilters() {
  // 初始化amis自定义过滤方法
  const filtersObj: any = useFilters()
  const authStore = useAuthStore()

  filtersObj.getPermissionByCode = (_val: any) => {
    return false
  }

  /**
   * 保留函数名 getPermissionById（设计器 schemaTpl 依赖）
   * - val 实际上传入的是 buttonCode（字符串）
   * - 返回 true 表示「无权限」 => 组件 hiddenOn 生效
   */
  filtersObj.getPermissionById = (val: string) => {
    const code = String(val || '')
    const owned = authStore.userInfo.buttons || []
    return !owned.includes(code)
  }
  filtersObj.getExportColumnsConfig = (obj: { key: string, sourceUrl: string }) => {
    const jsonStr = sessionStorage.getItem(obj.key)
    if (jsonStr) {
      return {
        columns: JSON.parse(jsonStr),
        sourceUrl: obj?.sourceUrl,
      }
    }
    else {
      return {
        columns: [],
        sourceUrl: obj?.sourceUrl,
      }
    }
  }
  Object.keys(filtersObj).forEach((key) => {
    ;(window as any).amisRequire('amis-core').registerFilter(key, (filtersObj as any)[key])
  })
}
