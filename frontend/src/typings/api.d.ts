/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records: T[];
    }

    /** common search params of table */
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = 'ENABLED' | 'DISABLED';

    /** common record */
    type CommonRecord<T = any> = {
      /** record id */
      id: number;
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
      /** record status */
      status: EnableStatus | null;
    } & T;
  }

  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      roles: string[];
      buttons: string[];
    }
  }

  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }

  /**
   * namespace SystemManage
   *
   * backend api module: "SystemManage"
   */
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /** role */
    type Role = Common.CommonRecord<{
      /** role name */
      name: string;
      /** role code */
      code: string;
      /** role parent id */
      pid: string;
      /** role description */
      description: string;
    }>;

    /** role search params */
    type RoleSearchParams = CommonSearchParams & Partial<Pick<Role, 'name' | 'code' | 'status'>>;

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>;

    /** all role */
    type AllRole = Pick<Role, 'id' | 'name' | 'code'>;

    /** role menu */
    type RoleMenu = {
      roleId: string;
      routeIds: number[];
    };

    /** role permission */
    type RolePermission = {
      roleId: string;
      permissions: string[];
    };

    /** user */
    type User = Common.CommonRecord<{
      /** user name */
      username: string;
      /** user domain */
      domain: string;
      /** user avatar */
      avatar: string;
      /** user gender */
      userGender: UserGender;
      /** user nick name */
      nickName: string;
      /** user phone */
      phoneNumber: string;
      /** user email */
      email: string;
      /** user role codes */
      userRoles: string[];
    }>;

    /** user gender */
    type UserGender = '1' | '2';

    /** user search params */
    type UserSearchParams = CommonSearchParams &
      Partial<Pick<User, 'username' | 'userGender' | 'nickName' | 'phoneNumber' | 'email' | 'status'>>;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;

    type MenuType = 'directory' | 'menu';
    type IconType = 1 | 2;

    /** menu */
    type Menu = Common.CommonRecord<{
      /** parent menu id */
      pid: number;
      /** menu type */
      menuType: MenuType;
      /** menu name */
      menuName: string;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
      /** component */
      component: string;
      /** iconify icon name or local icon name */
      icon: string | null;
      /** icon type */
      iconType: IconType | null;
      /** route path param */
      pathParam?: string | null;
      /** layout */
      layout?: string;
      /** page */
      page?: string;
      /** i18n key */
      i18nKey?: string | null;
      /** keep alive */
      keepAlive?: boolean;
      /** constant */
      constant?: boolean;
      /** href */
      href?: string | null;
      /** whether to hide in menu */
      hideInMenu?: boolean;
      /** active menu */
      activeMenu?: string | null;
      /** multi tab */
      multiTab?: boolean;
      /** fixed index in tab */
      fixedIndexInTab?: number | null;
      /** order */
      order: number;
      /** query */
      query?: { key: string; value: string }[] | null;
      /** button */
      button?: boolean;
      /** button code */
      buttonCode?: string;
      /** button description */
      buttonDesc?: string;
      /** children menu */
      children?: Menu[];
    }>;

    /** api endpoint */
    type ApiEndpoint = {
      id: string;
      path: string;
      method: string;
      action: string;
      resource: string;
      controller: string;
      summary: string;
      children?: ApiEndpoint[];
    };
  }
}
