/**
 * JWT载荷接口
 * 统一的JWT token载荷格式，用于所有微服务
 */
export interface JwtPayload {
  /** 用户ID */
  uid: string;
  
  /** 用户名 */
  username: string;
  
  /** 用户域 */
  domain: string;
  
  /** 用户角色 */
  roles?: string[];
  
  /** 用户权限 */
  permissions?: string[];
  
  /** 签发时间 */
  iat?: number;
  
  /** 过期时间 */
  exp?: number;
  
  /** 签发者 */
  iss?: string;
  
  /** 受众 */
  aud?: string;
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  /** 访问令牌 */
  token: string;
  
  /** 刷新令牌 */
  refreshToken: string;
  
  /** 令牌类型 */
  tokenType: string;
  
  /** 过期时间（秒） */
  expiresIn: number;
  
  /** 用户信息 */
  user: {
    uid: string;
    username: string;
    domain: string;
    roles?: string[];
    permissions?: string[];
  };
}

/**
 * 认证配置接口
 */
export interface AuthConfig {
  /** JWT密钥 */
  jwtSecret: string;
  
  /** JWT过期时间 */
  jwtExpiresIn: string;
  
  /** 刷新令牌密钥 */
  refreshTokenSecret: string;
  
  /** 刷新令牌过期时间 */
  refreshTokenExpiresIn: string;
  
  /** 签发者 */
  issuer: string;
  
  /** 受众 */
  audience: string;
}
