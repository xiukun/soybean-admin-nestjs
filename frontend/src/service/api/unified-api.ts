import { request, lowcodeRequest, amisRequest } from '../request';

/**
 * 统一API服务
 * 整合主后端、低代码平台后端、Amis后端的API调用
 */

// =============================================================================
// 🔧 主后端API (Backend Service)
// =============================================================================

/**
 * 用户认证相关API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login: (data: Api.Auth.LoginParams) => {
    return request<Api.Auth.LoginResponse>({
      url: '/auth/login',
      method: 'post',
      data
    });
  },

  /**
   * 刷新令牌
   */
  refreshToken: (refreshToken: string) => {
    return request<Api.Auth.LoginResponse>({
      url: '/auth/refresh',
      method: 'post',
      data: { refreshToken }
    });
  },

  /**
   * 获取用户信息
   */
  getUserInfo: () => {
    return request<Api.Auth.UserInfo>({
      url: '/auth/user-info',
      method: 'get'
    });
  },

  /**
   * 用户登出
   */
  logout: () => {
    return request({
      url: '/auth/logout',
      method: 'post'
    });
  }
};

/**
 * 用户管理API
 */
export const userApi = {
  /**
   * 获取用户列表
   */
  getUserList: (params?: Api.SystemManage.UserSearchParams) => {
    return request<Api.SystemManage.UserList>({
      url: '/users',
      method: 'get',
      params
    });
  },

  /**
   * 创建用户
   */
  createUser: (data: Api.SystemManage.UserEdit) => {
    return request<Api.SystemManage.User>({
      url: '/users',
      method: 'post',
      data
    });
  },

  /**
   * 更新用户
   */
  updateUser: (id: string, data: Api.SystemManage.UserEdit) => {
    return request<Api.SystemManage.User>({
      url: `/users/${id}`,
      method: 'put',
      data
    });
  },

  /**
   * 删除用户
   */
  deleteUser: (id: string) => {
    return request({
      url: `/users/${id}`,
      method: 'delete'
    });
  }
};

// =============================================================================
// 🏗️ 低代码平台API (Lowcode Platform Service)
// =============================================================================

/**
 * 项目管理API
 */
export const projectApi = {
  /**
   * 获取项目列表
   */
  getProjectList: (params?: Api.Lowcode.ProjectSearchParams) => {
    return lowcodeRequest<Api.Lowcode.ProjectList>({
      url: '/projects/paginated',
      method: 'get',
      params
    });
  },

  /**
   * 获取所有项目
   */
  getAllProjects: () => {
    return lowcodeRequest<Api.Lowcode.Project[]>({
      url: '/projects',
      method: 'get'
    });
  },

  /**
   * 创建项目
   */
  createProject: (data: Api.Lowcode.ProjectEdit) => {
    return lowcodeRequest<Api.Lowcode.Project>({
      url: '/projects',
      method: 'post',
      data
    });
  },

  /**
   * 更新项目
   */
  updateProject: (id: string, data: Api.Lowcode.ProjectEdit) => {
    return lowcodeRequest<Api.Lowcode.Project>({
      url: `/projects/${id}`,
      method: 'put',
      data
    });
  },

  /**
   * 删除项目
   */
  deleteProject: (id: string) => {
    return lowcodeRequest({
      url: `/projects/${id}`,
      method: 'delete'
    });
  }
};

/**
 * 模板管理API
 */
export const templateApi = {
  /**
   * 获取模板列表
   */
  getTemplateList: (params?: Api.Lowcode.TemplateSearchParams) => {
    return lowcodeRequest<Api.Lowcode.TemplateList>({
      url: '/templates',
      method: 'get',
      params
    });
  },

  /**
   * 验证模板
   */
  validateTemplate: (id: string, data?: any) => {
    return lowcodeRequest<Api.Lowcode.TemplateValidationResult>({
      url: `/templates/${id}/validate`,
      method: 'post',
      data
    });
  },

  /**
   * 预览模板
   */
  previewTemplate: (id: string, data: Api.Lowcode.TemplatePreviewRequest) => {
    return lowcodeRequest<Api.Lowcode.TemplatePreviewResult>({
      url: `/templates/${id}/preview`,
      method: 'post',
      data
    });
  },

  /**
   * 生成代码
   */
  generateCode: (id: string, data: Api.Lowcode.CodeGenerationRequest) => {
    return lowcodeRequest<Api.Lowcode.CodeGenerationResult>({
      url: `/templates/${id}/generate`,
      method: 'post',
      data
    });
  }
};

/**
 * API配置管理API
 */
export const apiConfigApi = {
  /**
   * 获取API配置列表（平台管理格式）
   */
  getApiConfigList: (projectId: string, params?: Api.Lowcode.ApiConfigSearchParams) => {
    return lowcodeRequest<Api.Lowcode.ApiConfigList>({
      url: `/api-configs/project/${projectId}/paginated`,
      method: 'get',
      params
    });
  },

  /**
   * 获取API配置列表（低代码页面格式）
   */
  getApiConfigListForLowcode: (projectId: string, params?: any) => {
    return lowcodeRequest<any>({
      url: `/api-configs/project/${projectId}/lowcode-paginated`,
      method: 'get',
      params
    });
  },

  /**
   * 获取所有API配置
   */
  getAllApiConfigs: (projectId: string) => {
    return lowcodeRequest<Api.Lowcode.ApiConfig[]>({
      url: `/api-configs/project/${projectId}`,
      method: 'get'
    });
  },

  /**
   * 测试API配置
   */
  testApiConfig: (id: string, data?: any) => {
    return lowcodeRequest<Api.Lowcode.ApiTestResult>({
      url: `/api-configs/${id}/test`,
      method: 'post',
      data
    });
  }
};

// =============================================================================
// 📱 Amis低代码API (Amis Lowcode Service)
// =============================================================================

/**
 * Amis页面管理API
 */
export const amisPageApi = {
  /**
   * 获取Amis页面配置
   */
  getPageConfig: (pageId: string) => {
    return amisRequest<any>({
      url: `/pages/${pageId}`,
      method: 'get'
    });
  },

  /**
   * 保存Amis页面配置
   */
  savePageConfig: (pageId: string, data: any) => {
    return amisRequest<any>({
      url: `/pages/${pageId}`,
      method: 'put',
      data
    });
  },

  /**
   * 获取页面列表
   */
  getPageList: (params?: any) => {
    return amisRequest<any>({
      url: '/pages',
      method: 'get',
      params
    });
  }
};

/**
 * Amis认证API
 */
export const amisAuthApi = {
  /**
   * Amis用户登录
   */
  login: (data: { username: string; password: string }) => {
    return amisRequest<any>({
      url: '/auth/login',
      method: 'post',
      data
    });
  },

  /**
   * 刷新Amis令牌
   */
  refreshToken: (data: { refreshToken: string }) => {
    return amisRequest<any>({
      url: '/auth/refresh',
      method: 'post',
      data
    });
  }
};

// =============================================================================
// 🔄 统一服务API
// =============================================================================

/**
 * 健康检查API
 */
export const healthApi = {
  /**
   * 主后端健康检查
   */
  checkBackendHealth: () => {
    return request<any>({
      url: '/health',
      method: 'get'
    });
  },

  /**
   * 低代码平台健康检查
   */
  checkLowcodeHealth: () => {
    return lowcodeRequest<any>({
      url: '/health',
      method: 'get'
    });
  },

  /**
   * Amis后端健康检查
   */
  checkAmisHealth: () => {
    return amisRequest<any>({
      url: '/health',
      method: 'get'
    });
  },

  /**
   * 检查所有服务健康状态
   */
  checkAllServicesHealth: async () => {
    const results = await Promise.allSettled([
      healthApi.checkBackendHealth(),
      healthApi.checkLowcodeHealth(),
      healthApi.checkAmisHealth()
    ]);

    return {
      backend: results[0].status === 'fulfilled' ? results[0].value : null,
      lowcode: results[1].status === 'fulfilled' ? results[1].value : null,
      amis: results[2].status === 'fulfilled' ? results[2].value : null,
      allHealthy: results.every(result => result.status === 'fulfilled')
    };
  }
};

/**
 * 统一导出所有API
 */
export const unifiedApi = {
  auth: authApi,
  user: userApi,
  project: projectApi,
  template: templateApi,
  apiConfig: apiConfigApi,
  amisPage: amisPageApi,
  amisAuth: amisAuthApi,
  health: healthApi
};

export default unifiedApi;
