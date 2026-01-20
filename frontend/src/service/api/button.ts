import { request } from '../request';

export function fetchButtonList(params: { menuId?: number }) {
  return request<Api.SystemManage.Button[]>({
    url: '/button/list',
    method: 'get',
    params
  });
}

export function fetchCreateButton(data: {
  code: string;
  description?: string | null;
  menuId?: number | null;
  status?: Api.Common.EnableStatus;
  order?: number;
}) {
  return request<{ id: string }>({
    url: '/button',
    method: 'post',
    data
  });
}

export function fetchUpdateButton(id: string, data: {
  description?: string | null;
  menuId?: number | null;
  status?: Api.Common.EnableStatus;
  order?: number;
}) {
  return request<boolean>({
    url: `/button/${id}`,
    method: 'put',
    data
  });
}

export function fetchDeleteButton(id: string) {
  return request<boolean>({
    url: `/button/${id}`,
    method: 'delete'
  });
}
