import { request } from '../request';

/**
 * 低代码页面相关API
 */

/** 获取低代码页面列表 */
export function fetchGetLowcodePages(params: {
  current?: number;
  size?: number;
  search?: string;
}) {
  return request<Api.Lowcode.PageListResponse>({
    url: '/lowcode/pages',
    method: 'get',
    params
  });
}

/** 根据ID获取低代码页面 */
export function fetchGetLowcodePageById(id: string) {
  return request<Api.Lowcode.PageInfo>({
    url: `/lowcode/pages/${id}`,
    method: 'get'
  });
}

/** 根据编码获取低代码页面 */
export function fetchGetLowcodePageByCode(code: string) {
  return request<Api.Lowcode.PageInfo>({
    url: `/lowcode/pages/code/${code}`,
    method: 'get'
  });
}

/** 根据菜单ID获取低代码页面JSON数据 */
export function fetchGetLowcodePageByMenuId(menuId: number) {
  return request<Api.Lowcode.PageInfo | null>({
    url: `/lowcode/pages/menu/${menuId}`,
    method: 'get'
  });
}

/** 创建低代码页面 */
export function fetchCreateLowcodePage(data: Api.Lowcode.CreatePageRequest) {
  return request<Api.Lowcode.PageInfo>({
    url: '/lowcode/pages',
    method: 'post',
    data
  });
}

/** 更新低代码页面 */
export function fetchUpdateLowcodePage(id: string, data: Api.Lowcode.UpdatePageRequest) {
  return request<Api.Lowcode.PageInfo>({
    url: `/lowcode/pages/${id}`,
    method: 'put',
    data
  });
}

/** 保存低代码页面（设计器专用） */
export function fetchSaveLowcodePage(menuId: number, schema: any, title?: string) {
  return request<Api.Lowcode.PageInfo>({
    url: `/lowcode/pages/menu/${menuId}/save`,
    method: 'post',
    data: {
      schema,
      title,
      changelog: `设计器保存 - ${new Date().toLocaleString()}`
    }
  });
}

/** 删除低代码页面 */
export function fetchDeleteLowcodePage(id: string) {
  return request<boolean>({
    url: `/lowcode/pages/${id}`,
    method: 'delete'
  });
}
