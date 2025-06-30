import { request } from '../request';

/** 获取低代码页面列表 */
export function fetchGetLowcodePageList(params?: Api.LowcodePage.PageSearchParams) {
  return request<Api.LowcodePage.PageList>({
    url: '/lowcode/pages',
    method: 'get',
    params
  });
}

/** 获取低代码页面详情 */
export function fetchGetLowcodePage(id: string) {
  return request<Api.LowcodePage.Page>({
    url: `/lowcode/pages/${id}`,
    method: 'get'
  });
}

/** 根据编码获取低代码页面 */
export function fetchGetLowcodePageByCode(code: string) {
  return request<Api.LowcodePage.Page>({
    url: `/lowcode/pages/code/${code}`,
    method: 'get'
  });
}

/** 添加低代码页面 */
export function fetchAddLowcodePage(data: Api.LowcodePage.PageEdit) {
  return request<Api.LowcodePage.Page>({
    url: '/lowcode/pages',
    method: 'post',
    data
  });
}

/** 更新低代码页面 */
export function fetchUpdateLowcodePage(id: string, data: Api.LowcodePage.PageEdit) {
  return request<Api.LowcodePage.Page>({
    url: `/lowcode/pages/${id}`,
    method: 'put',
    data
  });
}

/** 更新低代码页面状态 */
export function fetchUpdateLowcodePageStatus(id: string, status: Api.Common.EnableStatus) {
  return request<Api.LowcodePage.Page>({
    url: `/lowcode/pages/${id}/status`,
    method: 'put',
    data: { status }
  });
}

/** 删除低代码页面 */
export function fetchDeleteLowcodePage(id: string) {
  return request({
    url: `/lowcode/pages/${id}`,
    method: 'delete'
  });
}

/** 获取低代码模型列表 */
export function fetchGetLowcodeModelList(params?: Api.LowcodeModel.ModelSearchParams) {
  return request<Api.LowcodeModel.ModelList>({
    url: '/lowcode/models',
    method: 'get',
    params
  });
}

/** 获取低代码模型详情 */
export function fetchGetLowcodeModel(id: string) {
  return request<Api.LowcodeModel.Model>({
    url: `/lowcode/models/${id}`,
    method: 'get'
  });
}

/** 添加低代码模型 */
export function fetchAddLowcodeModel(data: Api.LowcodeModel.ModelEdit) {
  return request<Api.LowcodeModel.Model>({
    url: '/lowcode/models',
    method: 'post',
    data
  });
}

/** 更新低代码模型 */
export function fetchUpdateLowcodeModel(id: string, data: Api.LowcodeModel.ModelEdit) {
  return request<Api.LowcodeModel.Model>({
    url: `/lowcode/models/${id}`,
    method: 'put',
    data
  });
}

/** 删除低代码模型 */
export function fetchDeleteLowcodeModel(id: string) {
  return request({
    url: `/lowcode/models/${id}`,
    method: 'delete'
  });
}
