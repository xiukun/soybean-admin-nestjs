import { useFilters } from '@maita/amis-tools'
import { request } from '@/service/request'
import { useAuthStore } from '@/store/modules/auth'

/**
 * 注册自定义过滤方法 amis使用
 */
export async function preloadDictAllOnce() {
  const key = 'MAITA_LOWCODE_DICT_ALL'
  const { data, error } = await request<any>({ url: '/dict/options-all', method: 'get' })
  if (error) return
  const all = data?.options || []
  localStorage.setItem(key, JSON.stringify(all))
}

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

  /**
   * 数据字典：根据 dictId 返回字典项 options
   * - 设计器侧 schema: source: "${'<dictId>'|getDictById}"
   * - 这里必须同步返回数组，否则 AMIS select 可能不渲染
   */
  filtersObj.getDictById = (dictId: string) => {
    const id = String(dictId || '')
    if (!id) return []

    try {
      const raw = localStorage.getItem('MAITA_LOWCODE_DICT_ALL')
      if (!raw) return []
      const all = JSON.parse(raw) as Array<{ id: string; options?: any[] }>
      return all.find(d => d.id === id)?.options || []
    } catch {
      return []
    }
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
  const amisRequire = (window as any).amisRequire
  if (typeof amisRequire !== 'function') return

  Object.keys(filtersObj).forEach((key) => {
    amisRequire('amis-core').registerFilter(key, (filtersObj as any)[key])
  })
}
