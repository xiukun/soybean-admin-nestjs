import agHttp from '@/utils/http'

export const amisPageFindDetail = (data: { id: string }) => {
  // 根据菜单ID获取低代码页面
  return agHttp.get(`/lowcode/pages/menu/${data.id}`)
}

export const amisPageSave = (data: { id: string; content: string; unitType?: string }) => {
  // 保存低代码页面到后端
  const schema = JSON.parse(data.content)
  return agHttp.post(`/lowcode/pages/menu/${data.id}/save`, {
    schema,
    title: undefined, // 可以从URL参数中获取
    changelog: `设计器保存 - ${new Date().toLocaleString()}`
  })
}

/**
 * 获取低代码页面历史版本列表
 * @param data 
 * @returns 
 */
export const amisPageFindHistoryListById = (data: {
  mainId?: string
  versionNum?: string
  pageNum?: number
  pageSize?: number
}) => {
  return agHttp.post('/lowcode/history/list', data)
}

/**
 * 根据版本ID获取历史版本详情
 * @param pageId 页面ID
 * @param versionId 版本ID
 * @returns 
 */
export const amisPageFindVersionById = (pageId: string, versionId: string) => {
  return agHttp.get(`/lowcode/pages/${pageId}/versions/${versionId}`)
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
