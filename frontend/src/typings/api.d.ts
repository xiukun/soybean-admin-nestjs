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
     * - "ENABLED": enabled
     * - "DISABLED": disabled
     */
    type EnableStatus = 'ENABLED' | 'DISABLED';

    /**
     * object enable status
     *
     * - "ACTIVE": active
     * - "INACTIVE": inactive
     * - "ARCHIVED": archived
     */
    type ObjectEnableStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

    /** common record */
    type CommonRecord<T = any> = {
      /** record id */
      id: string;
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
      /** record status */
      status: EnableStatus | null | ObjectEnableStatus;
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

    type MenuType = 'directory' | 'menu' | 'lowcode';
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
      /** lowcode page id */
      lowcodePageId?: string | null;
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

  /**
   * /** /** namespace Lowcode
   *
   * 低代码相关接口类型定义
   */
  namespace Lowcode {
    /** 低代码页面状态 */
    type PageStatus = 'ENABLED' | 'DISABLED';

    /** 低代码页面基本信息 */
    interface PageInfo {
      /** 页面ID */
      id: string;
      /** 页面名称 */
      name: string;
      /** 页面标题 */
      title: string;
      /** 页面编码 */
      code: string;
      /** 页面描述 */
      description?: string | null;
      /** AMIS JSON Schema */
      schema: any;
      /** 页面状态 */
      status: PageStatus;
      /** 创建时间 */
      createdAt: string;
      /** 创建者 */
      createdBy: string;
      /** 更新时间 */
      updatedAt?: string | null;
      /** 更新者 */
      updatedBy?: string | null;
    }

    /** 创建低代码页面请求 */
    interface CreatePageRequest {
      /** 页面名称 */
      name: string;
      /** 页面标题 */
      title: string;
      /** 页面编码 */
      code: string;
      /** 页面描述 */
      description?: string;
      /** AMIS JSON Schema */
      schema: any;
      /** 页面状态 */
      status?: PageStatus;
    }

    /** 更新低代码页面请求 */
    interface UpdatePageRequest {
      /** 页面名称 */
      name?: string;
      /** 页面标题 */
      title?: string;
      /** 页面编码 */
      code?: string;
      /** 页面描述 */
      description?: string;
      /** AMIS JSON Schema */
      schema?: any;
      /** 页面状态 */
      status?: PageStatus;
      /** 变更日志 */
      changelog?: string;
    }

    /** 低代码页面列表响应 */
    interface PageListResponse {
      /** 页面列表 */
      items: PageInfo[];
      /** 当前页码 */
      current: number;
      /** 每页数量 */
      size: number;
      /** 总数量 */
      total: number;
      /** 总页数 */
      pages: number;
    }
  }
}
