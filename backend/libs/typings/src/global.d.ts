export interface IAuthentication {
  uid: string;
  username: string;
  domain: string;
  /** 用户状态 */
  status?: string;
  /** 过期时间 */
  exp?: number;
  /** JWT ID */
  jti?: string;
  /** 用户角色 */
  roles?: string[];
  /** 用户权限 */
  permissions?: string[];
  /** 用户邮箱 */
  email?: string;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  // timestamp: string;
  // requestId: string;
  // path: string;
  error?: {
    code: number;
    message: string;
  };
  data?: T;
}

export type CreationAuditInfoProperties = Readonly<{
  createdAt: Date;
  createdBy: string;
}>;

export type UpdateAuditInfoProperties = Readonly<{
  updatedAt: Date | null;
  updatedBy: string | null;
}>;
