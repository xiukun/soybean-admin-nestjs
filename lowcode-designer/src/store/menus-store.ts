import to from 'await-to-js'
import { create } from 'zustand'
import { getButtonMenusTreeApi } from '@/api/amis'
import { treeFindPath } from '@/utils/utils'

const searchParams = new URLSearchParams(location.hash || location.search)
const menusName = 'AG_NEPTUNE_LOWCODE_MENUS' // 菜单缓存key
const useMenusStore = create((set: any, get: any) => ({
  pageId: '', // 菜单页面id
  menusTree: [], //菜单树数据
  originMenusTree: [], //原始菜单树数据
  // menusList: [], //打平的菜单列表数据
  cacheMenus: async () => {
    const [err, data] = await to<any>(getButtonMenusTreeApi())
    if (err) return
    const treeData = data.data.options
    get().setMenus(treeData)
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
      let getNodeData = treeFindPath(treeData, node => node.menuId === id).pop()

      set(() => ({ originMenusTree: treeData, menusTree: [getNodeData], pageId: id }))
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
