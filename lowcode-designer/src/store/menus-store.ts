import to from 'await-to-js'
import { create } from 'zustand'
import { getButtonMenusTreeApi } from '@/api/amis'
import { treeFindPath } from '@/utils/utils'

const searchParams = new URLSearchParams(location.hash || location.search)
const menusName = 'MAITA_LOWCODE_MENUS' // 菜单缓存key
const useMenusStore = create((set: any, get: any) => ({
  pageId: '', // 菜单页面id
  menusTree: [], //菜单树数据
  originMenusTree: [], //原始菜单树数据
  // menusList: [], //打平的菜单列表数据
  cacheMenus: async () => {
    const id = searchParams.get('pageKey')
    const [err, data] = await to<any>(getButtonMenusTreeApi(id || undefined))
    if (err) return
    // 适配设计器专用返回：{ status, msg, data: { menusTree, buttons } }
    const treeData = data.data?.data?.menusTree || []
    get().setMenus(treeData)
    // buttons 由设计器其它 store/面板处理；这里不缓存到 menus-store
  },
  /**
   *
   * @returns 返回菜单树数据
   */
  getMenus: () => {
    if (localStorage.getItem(menusName))
      return JSON.parse(localStorage.getItem(menusName) as string)
  },
  setMenus: (treeData: any) => {
    const type = searchParams.get('unitType')
    const id = searchParams.get('pageKey')
    if (type) {
      set(() => ({ originMenusTree: treeData, menusTree: treeData, pageId: id }))
    } else {
      const menuId = id ? Number(id) : undefined
      const getNodeData = treeFindPath(treeData, node => node.id === menuId).pop()

      set(() => ({ originMenusTree: treeData, menusTree: getNodeData ? [getNodeData] : [], pageId: id }))
    }
    localStorage.setItem(menusName, JSON.stringify(treeData))
    ;(window as any)[menusName] = get().menusTree
  },
  /**
   * 初始化菜单
   */
  initMenus: () => {
    if (!localStorage.getItem(menusName)) {
      get().cacheMenus()
    } else {
      const data = localStorage.getItem(menusName) || ''
      get().setMenus(JSON.parse(data) || [])
    }
  },
}))

export default useMenusStore
