import agHttp from '@/utils/http'

export const amisPageFindDetail = (data: object) => {
  return agHttp.post('/system/amisPage/findOne', data)
}

export const amisPageSave = (data: object) => {
  return agHttp.post('/system/amisPage/save', data)
}

export const amisPageFindHistoryListById = (data: object) => {
  return agHttp.post('/system/amisPage/findHistory', data)
}

export const amisPageFindPageById = (data: object) => {
  return agHttp.post('/system/amisPage/findByPageId', data)
}
/**
 * 按钮菜单 绑定权限时使用
 * @param data
 * @returns
 */
export const getButtonMenusTreeApi = () => {
  return agHttp.post('/system/WbMenuRes/findVueMenuBtn')
}

/**
 * 数据字典
 * @returns
 */
export const getScodeAllApi = () => {
  return agHttp.post('/system/redis/getScodeAll', {})
}

/**
 * 保存列配置
 * @param data
 * @returns
 */
export const saveColumns = (data: { key: string; columns: string | undefined | null }) => {
  return agHttp.post('/system/amisPage/saveColumns', data)
}

/**
 * 查询列配置
 * @param data
 * @returns
 */
export const queryColumns = (data: { dynimicColumnKey: string }) => {
  return agHttp.post('/system/amisPage/queryColumns', data)
}
