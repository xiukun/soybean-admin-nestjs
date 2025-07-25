export const CacheConstant = {
  SYSTEM: 'soybean:',
  CACHE_PREFIX: 'soybean:cache:',
  AUTH_TOKEN_PREFIX: 'soybean:cache:user:',

  // JWT相关缓存键
  /** 用户token前缀 */
  USER_TOKEN_PREFIX: 'soybean:jwt:token:',
  /** token黑名单前缀 */
  TOKEN_BLACKLIST_PREFIX: 'soybean:jwt:blacklist:',
  /** 用户会话前缀 */
  USER_SESSION_PREFIX: 'soybean:jwt:session:',
  /** 刷新token前缀 */
  REFRESH_TOKEN_PREFIX: 'soybean:jwt:refresh:',
  /** JWT统计信息 */
  JWT_STATS_PREFIX: 'soybean:jwt:stats:',

  // 权限相关缓存键
  /** 用户权限前缀 */
  USER_PERMISSIONS_PREFIX: 'soybean:auth:permissions:',
  /** 用户角色前缀 */
  USER_ROLES_PREFIX: 'soybean:auth:roles:',
  /** 角色权限前缀 */
  ROLE_PERMISSIONS_PREFIX: 'soybean:auth:role_permissions:',

  // 微服务相关缓存键
  /** 服务注册前缀 */
  SERVICE_REGISTRY_PREFIX: 'soybean:service:registry:',
  /** 服务健康检查前缀 */
  SERVICE_HEALTH_PREFIX: 'soybean:service:health:',
  /** 跨服务认证前缀 */
  CROSS_SERVICE_AUTH_PREFIX: 'soybean:service:auth:',
};
