import to from 'await-to-js'
import agHttp from '@/utils/amis-http'

const BUTTONS_KEY = 'LOWCODE_USER_BUTTON_CODES'
const DESIGNER_BUTTON_TREE_KEY = 'AG_NEPTUNE_LOWCODE_MENUS'

export async function fetchUserButtonCodes(): Promise<string[]> {
  const [err, res] = await to<any>(agHttp.get('/authorization/getUserButtons'))
  if (err) return []
  // 后端返回 { status, msg, data }
  const codes: string[] = res?.data?.data || []
  localStorage.setItem(BUTTONS_KEY, JSON.stringify(codes))
  return codes
}

/**
 * 设计器用于“绑定权限”的按钮树（按 lowcode 菜单分组）
 * 写入 window.AG_NEPTUNE_LOWCODE_MENUS 供 amis schemaTpl tree-select 使用
 */
export async function fetchDesignerButtonsTree(): Promise<any[]> {
  const [err, res] = await to<any>(agHttp.get('/lowcode/designer/buttons-tree'))
  if (err) return []
  const tree = res?.data?.data || []
  ;(window as any)[DESIGNER_BUTTON_TREE_KEY] = tree
  return tree
}

export function getUserButtonCodes(): string[] {
  try {
    return JSON.parse(localStorage.getItem(BUTTONS_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * 是否拥有任一按钮权限
 * - code: string | string[]
 */
export function hasButtonAuth(code: string | string[]): boolean {
  const required = Array.isArray(code) ? code : [code]
  const owned = getUserButtonCodes()
  return required.some(c => owned.includes(c))
}
