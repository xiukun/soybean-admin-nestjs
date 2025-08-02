import { request } from '../request';

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return request<Api.SystemManage.RoleList>({
    url: '/role',
    method: 'get',
    params
  });
}

/**
 * get all roles
 *
 * these roles are all enabled
 */
export function fetchGetAllRoles() {
  return request<Api.SystemManage.AllRole[]>({
    url: '/systemManage/getAllRoles',
    method: 'get'
  });
}

/** get user list */
export async function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  console.log(await request<Api.SystemManage.UserList>({
    url: '/user',
    method: 'get',
    params
  }));
  return request<Api.SystemManage.UserList>({
    url: '/user',
    method: 'get',
    params
  });
}

/** get menu list */
export const fetchGetMenuList = () =>
  request<Api.SystemManage.Menu[]>({
    url: '/route',
    method: 'get'
  })
    .then(response => {
      const menus = response.data || [];
      return {
        data: {
          records: menus,
          total: menus.length,
          current: 1,
          size: menus.length
        },
        error: null
      };
    })
    .catch(error => {
      return {
        data: null,
        error: error.message
      };
    });

/** get all pages */
export function fetchGetAllPages() {
  return request<string[]>({
    url: '/systemManage/getAllPages',
    method: 'get'
  });
}

/** get menu tree */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.Menu[]>({
    url: '/route/tree',
    method: 'get'
  });
}

/**
 * 获取角色对应菜单数组集合
 *
 * @param roleId 角色ID
 * @returns 菜单数组集合
 */
export function fetchGetRoleMenuIds(roleId: string) {
  return request<number[]>({
    url: `/route/auth-route/${roleId}`,
    method: 'get'
  });
}

/**
 * 角色授权菜单
 *
 * @param req 授权角色菜单实体
 * @returns nothing
 */
export function fetchAssignRoutes(req: Api.SystemManage.RoleMenu) {
  return request<boolean>({
    url: '/authorization/assign-routes',
    method: 'post',
    data: {
      ...req,
      // eslint-disable-next-line no-warning-comments
      // TODO 超级管理员主动选择 domain管理员默认自身
      domain: 'built-in'
    }
  });
}

/**
 * 创建路由
 *
 * @param req 路由实体
 * @returns nothing
 */
export function createRoute(req: RouteCreateModel) {
  return request({
    url: '/route',
    method: 'post',
    data: req
  });
}

/**
 * 更新路由
 *
 * @param req 路由实体
 * @returns nothing
 */
export function updateRoute(req: RouteUpdateModel) {
  return request({
    url: '/route',
    method: 'put',
    data: req
  });
}

/**
 * 删除路由
 *
 * @param id 路由ID
 * @returns nothing
 */
export function deleteRoute(id: number) {
  return request({
    url: `/route/${id}`,
    method: 'delete'
  });
}

export type UserCreateModel = Pick<
  Api.SystemManage.User,
  'username' | 'domain' | 'nickName' | 'phoneNumber' | 'email' | 'status'
> & {
  password: string;
  avatar?: string | null;
};

export type UserUpdateModel = Pick<
  Api.SystemManage.User,
  'id' | 'username' | 'nickName' | 'phoneNumber' | 'email' | 'status'
> & {
  avatar?: string | null;
};

export type UserModel = UserCreateModel | UserUpdateModel;

export type RoleCreateModel = {
  code: string;
  name: string;
  pid: string;
  status: Api.Common.EnableStatus;
  description?: string | null;
};

export type RoleUpdateModel = RoleCreateModel & {
  id: string;
};

export type RoleModel = RoleCreateModel | RoleUpdateModel;

export type RouteCreateModel = {
  menuName: string;
  menuType: Api.SystemManage.MenuType;
  iconType: Api.SystemManage.IconType | null;
  icon: string | null;
  routeName: string;
  routePath: string;
  component: string;
  pathParam?: string | null;
  status: Api.Common.EnableStatus;
  activeMenu: string | null;
  hideInMenu: boolean;
  pid: number;
  order: number;
  i18nKey: string | null;
  keepAlive: boolean;
  constant: boolean;
  href: string | null;
  multiTab: boolean;
  lowcodePageId?: string | null;
  fixedIndexInTab?: number | null;
};

export type RouteUpdateModel = RouteCreateModel & {
  id: number;
};

export type RouteModel = RouteCreateModel | RouteUpdateModel;

/**
 * 创建用户
 *
 * @param req 用户实体
 * @returns nothing
 */
export function createUser(req: UserCreateModel) {
  return request({
    url: '/user',
    method: 'post',
    data: req
  });
}

/**
 * 更新用户
 *
 * @param req 用户实体
 * @returns nothing
 */
export function updateUser(req: UserUpdateModel) {
  return request({
    url: '/user',
    method: 'put',
    data: req
  });
}

/**
 * 删除用户
 *
 * @param id 用户ID
 * @returns nothing
 */
export function deleteUser(id: string) {
  return request({
    url: `/user/${id}`,
    method: 'delete'
  });
}

/**
 * 创建角色
 *
 * @param req 角色实体
 * @returns nothing
 */
export function createRole(req: RoleCreateModel) {
  return request({
    url: '/role',
    method: 'post',
    data: req
  });
}

/**
 * 更新角色
 *
 * @param req 角色实体
 * @returns nothing
 */
export function updateRole(req: RoleUpdateModel) {
  return request({
    url: '/role',
    method: 'put',
    data: req
  });
}

/**
 * 删除角色
 *
 * @param id 角色ID
 * @returns nothing
 */
export function deleteRole(id: string) {
  return request({
    url: `/role/${id}`,
    method: 'delete'
  });
}

/**
 * 角色授权API
 *
 * @param req 授权角色API实体
 * @returns nothing
 */
export function fetchAssignPermission(req: Api.SystemManage.RolePermission) {
  return request<boolean>({
    url: '/authorization/assign-permission',
    method: 'post',
    data: {
      ...req,
      // eslint-disable-next-line no-warning-comments
      // TODO 超级管理员主动选择 domain管理员默认自身
      domain: 'built-in'
    }
  });
}

/** get api-endpoint tree */
export function fetchGetApiEndpointTree() {
  return request<Api.SystemManage.ApiEndpoint[]>({
    url: '/api-endpoint/tree',
    method: 'get'
  });
}

/**
 * 获取角色对应API数组集合
 *
 * @param roleCode 角色code
 * @returns API数组集合
 */
export async function fetchGetRoleApiEndpoints(roleCode: string) {
  const response = await request<any[]>({
    url: `/api-endpoint/auth-api-endpoint/${roleCode}`,
    method: 'get'
  });
  const casbinRules = response.data || [];
  return casbinRules.map(item => `${item.v1}:${item.v2}`);
}
