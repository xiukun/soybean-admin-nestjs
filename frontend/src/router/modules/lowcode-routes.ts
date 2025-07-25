import type { RouteRecordRaw } from 'vue-router';
import { unifiedApi } from '@/service/api/unified-api';

/**
 * 低代码路由管理器
 * 支持动态路由生成和低代码页面路由
 */

/**
 * 低代码页面路由配置
 */
export interface LowcodeRouteConfig {
  /** 路由ID */
  id: string;
  /** 路由路径 */
  path: string;
  /** 路由名称 */
  name: string;
  /** 页面标题 */
  title: string;
  /** 页面类型 */
  pageType: 'amis' | 'lowcode' | 'custom';
  /** 页面ID */
  pageId: string;
  /** 图标 */
  icon?: string;
  /** 是否需要认证 */
  requiresAuth?: boolean;
  /** 权限要求 */
  permissions?: string[];
  /** 角色要求 */
  roles?: string[];
  /** 是否缓存 */
  keepAlive?: boolean;
  /** 菜单排序 */
  order?: number;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 父级路由ID */
  parentId?: string;
  /** 额外的元数据 */
  meta?: Record<string, any>;
}

/**
 * 基础低代码路由
 */
const baseLowcodeRoutes: RouteRecordRaw[] = [
  {
    name: 'lowcode',
    path: '/lowcode',
    component: () => import('@/layouts/base-layout/index.vue'),
    meta: {
      title: '低代码平台',
      icon: 'ic:round-code',
      order: 10
    },
    children: [
      {
        name: 'lowcode_dashboard',
        path: '/lowcode/dashboard',
        component: () => import('@/views/lowcode/dashboard/index.vue'),
        meta: {
          title: '控制台',
          icon: 'ic:round-dashboard',
          order: 1
        }
      },
      {
        name: 'lowcode_projects',
        path: '/lowcode/projects',
        component: () => import('@/views/lowcode/projects/index.vue'),
        meta: {
          title: '项目管理',
          icon: 'ic:round-folder',
          order: 2
        }
      },
      {
        name: 'lowcode_templates',
        path: '/lowcode/templates',
        component: () => import('@/views/lowcode/templates/index.vue'),
        meta: {
          title: '模板管理',
          icon: 'ic:round-template',
          order: 3
        }
      },
      {
        name: 'lowcode_api_config',
        path: '/lowcode/api-config',
        component: () => import('@/views/lowcode/api-config/index.vue'),
        meta: {
          title: 'API配置',
          icon: 'ic:round-api',
          order: 4
        }
      },
      {
        name: 'lowcode_code_generation',
        path: '/lowcode/code-generation',
        component: () => import('@/views/lowcode/code-generation/index.vue'),
        meta: {
          title: '代码生成',
          icon: 'ic:round-code',
          order: 5
        }
      }
    ]
  },
  {
    name: 'amis-pages',
    path: '/amis-pages',
    component: () => import('@/layouts/base-layout/index.vue'),
    meta: {
      title: 'Amis页面',
      icon: 'ic:round-web',
      order: 11
    },
    children: [
      {
        name: 'amis_page_dynamic',
        path: '/amis-pages/:pageId',
        component: () => import('@/components/lowcode/unified-page-manager.vue'),
        props: route => ({
          pageId: route.params.pageId,
          pageType: 'amis',
          canEdit: true
        }),
        meta: {
          title: '动态页面',
          hidden: true,
          keepAlive: false
        }
      }
    ]
  }
];

/**
 * 低代码路由管理器类
 */
export class LowcodeRouteManager {
  private routes: Map<string, LowcodeRouteConfig> = new Map();
  private dynamicRoutes: RouteRecordRaw[] = [];

  /**
   * 初始化路由管理器
   */
  async initialize() {
    try {
      // 加载动态路由配置
      await this.loadDynamicRoutes();
      
      // 生成Vue路由
      this.generateVueRoutes();
      
      console.log('低代码路由管理器初始化完成');
    } catch (error) {
      console.error('低代码路由管理器初始化失败:', error);
    }
  }

  /**
   * 加载动态路由配置
   */
  private async loadDynamicRoutes() {
    try {
      // 从后端加载路由配置
      // 这里可以根据实际需求调用不同的API
      const [amisPages, lowcodePages] = await Promise.allSettled([
        this.loadAmisPages(),
        this.loadLowcodePages()
      ]);

      if (amisPages.status === 'fulfilled') {
        amisPages.value.forEach(page => this.addRoute(page));
      }

      if (lowcodePages.status === 'fulfilled') {
        lowcodePages.value.forEach(page => this.addRoute(page));
      }
    } catch (error) {
      console.error('加载动态路由失败:', error);
    }
  }

  /**
   * 加载Amis页面配置
   */
  private async loadAmisPages(): Promise<LowcodeRouteConfig[]> {
    try {
      const response = await unifiedApi.amisPage.getPageList();
      const pages = response.data || [];
      
      return pages.map((page: any) => ({
        id: page.id,
        path: `/amis-pages/${page.id}`,
        name: `amis_page_${page.id}`,
        title: page.title || '未命名页面',
        pageType: 'amis' as const,
        pageId: page.id,
        icon: page.icon || 'ic:round-web',
        requiresAuth: page.requiresAuth !== false,
        permissions: page.permissions || [],
        roles: page.roles || [],
        keepAlive: page.keepAlive || false,
        order: page.order || 999,
        hidden: page.hidden || false,
        parentId: page.parentId,
        meta: page.meta || {}
      }));
    } catch (error) {
      console.warn('加载Amis页面失败:', error);
      return [];
    }
  }

  /**
   * 加载低代码页面配置
   */
  private async loadLowcodePages(): Promise<LowcodeRouteConfig[]> {
    try {
      // 这里可以调用低代码平台的API获取页面配置
      // 暂时返回空数组
      return [];
    } catch (error) {
      console.warn('加载低代码页面失败:', error);
      return [];
    }
  }

  /**
   * 添加路由配置
   */
  addRoute(config: LowcodeRouteConfig) {
    this.routes.set(config.id, config);
  }

  /**
   * 移除路由配置
   */
  removeRoute(id: string) {
    this.routes.delete(id);
  }

  /**
   * 获取路由配置
   */
  getRoute(id: string): LowcodeRouteConfig | undefined {
    return this.routes.get(id);
  }

  /**
   * 获取所有路由配置
   */
  getAllRoutes(): LowcodeRouteConfig[] {
    return Array.from(this.routes.values());
  }

  /**
   * 生成Vue路由
   */
  private generateVueRoutes() {
    const routeGroups = new Map<string, LowcodeRouteConfig[]>();
    
    // 按父级分组
    this.routes.forEach(route => {
      const parentId = route.parentId || 'root';
      if (!routeGroups.has(parentId)) {
        routeGroups.set(parentId, []);
      }
      routeGroups.get(parentId)!.push(route);
    });

    // 生成路由树
    this.dynamicRoutes = this.buildRouteTree(routeGroups, 'root');
  }

  /**
   * 构建路由树
   */
  private buildRouteTree(
    routeGroups: Map<string, LowcodeRouteConfig[]>,
    parentId: string
  ): RouteRecordRaw[] {
    const routes: RouteRecordRaw[] = [];
    const children = routeGroups.get(parentId) || [];

    children
      .sort((a, b) => (a.order || 999) - (b.order || 999))
      .forEach(config => {
        const route: RouteRecordRaw = {
          name: config.name,
          path: config.path,
          component: () => import('@/components/lowcode/unified-page-manager.vue'),
          props: {
            pageId: config.pageId,
            pageType: config.pageType,
            canEdit: true,
            title: config.title
          },
          meta: {
            title: config.title,
            icon: config.icon,
            requiresAuth: config.requiresAuth,
            permissions: config.permissions,
            roles: config.roles,
            keepAlive: config.keepAlive,
            order: config.order,
            hidden: config.hidden,
            ...config.meta
          }
        };

        // 递归添加子路由
        const childRoutes = this.buildRouteTree(routeGroups, config.id);
        if (childRoutes.length > 0) {
          route.children = childRoutes;
        }

        routes.push(route);
      });

    return routes;
  }

  /**
   * 获取生成的Vue路由
   */
  getVueRoutes(): RouteRecordRaw[] {
    return [...baseLowcodeRoutes, ...this.dynamicRoutes];
  }

  /**
   * 刷新路由配置
   */
  async refresh() {
    this.routes.clear();
    this.dynamicRoutes = [];
    await this.initialize();
  }

  /**
   * 根据权限过滤路由
   */
  filterRoutesByPermissions(
    userPermissions: string[],
    userRoles: string[]
  ): RouteRecordRaw[] {
    const filteredRoutes = this.getVueRoutes().map(route => {
      return this.filterRouteRecursive(route, userPermissions, userRoles);
    }).filter(Boolean) as RouteRecordRaw[];

    return filteredRoutes;
  }

  /**
   * 递归过滤路由
   */
  private filterRouteRecursive(
    route: RouteRecordRaw,
    userPermissions: string[],
    userRoles: string[]
  ): RouteRecordRaw | null {
    const meta = route.meta as any;
    
    // 检查权限
    if (meta?.permissions?.length > 0) {
      const hasPermission = meta.permissions.some((permission: string) =>
        userPermissions.includes(permission)
      );
      if (!hasPermission) return null;
    }

    // 检查角色
    if (meta?.roles?.length > 0) {
      const hasRole = meta.roles.some((role: string) =>
        userRoles.includes(role)
      );
      if (!hasRole) return null;
    }

    // 过滤子路由
    const filteredRoute = { ...route };
    if (route.children) {
      const filteredChildren = route.children
        .map(child => this.filterRouteRecursive(child, userPermissions, userRoles))
        .filter(Boolean) as RouteRecordRaw[];
      
      if (filteredChildren.length > 0) {
        filteredRoute.children = filteredChildren;
      } else {
        delete filteredRoute.children;
      }
    }

    return filteredRoute;
  }
}

// 创建全局路由管理器实例
export const lowcodeRouteManager = new LowcodeRouteManager();

// 导出基础路由
export { baseLowcodeRoutes };
