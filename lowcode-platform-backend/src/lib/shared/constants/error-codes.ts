/**
 * 错误码定义
 * 统一管理系统中的所有错误码
 */

export enum ErrorCode {
  // 通用错误 (1000-1999)
  SUCCESS = 0,
  UNKNOWN_ERROR = 1000,
  INVALID_PARAMETER = 1001,
  MISSING_PARAMETER = 1002,
  INVALID_REQUEST = 1003,
  UNAUTHORIZED = 1004,
  FORBIDDEN = 1005,
  NOT_FOUND = 1006,
  METHOD_NOT_ALLOWED = 1007,
  CONFLICT = 1008,
  INTERNAL_SERVER_ERROR = 1009,
  SERVICE_UNAVAILABLE = 1010,
  TIMEOUT = 1011,
  TOO_MANY_REQUESTS = 1012,

  // 验证错误 (2000-2999)
  VALIDATION_ERROR = 2000,
  REQUIRED_FIELD_MISSING = 2001,
  INVALID_FORMAT = 2002,
  VALUE_TOO_LONG = 2003,
  VALUE_TOO_SHORT = 2004,
  VALUE_OUT_OF_RANGE = 2005,
  INVALID_EMAIL = 2006,
  INVALID_PHONE = 2007,
  INVALID_URL = 2008,
  INVALID_DATE = 2009,
  DUPLICATE_VALUE = 2010,

  // 认证授权错误 (3000-3999)
  AUTH_TOKEN_MISSING = 3000,
  AUTH_TOKEN_INVALID = 3001,
  AUTH_TOKEN_EXPIRED = 3002,
  AUTH_INSUFFICIENT_PERMISSIONS = 3003,
  AUTH_USER_NOT_FOUND = 3004,
  AUTH_INVALID_CREDENTIALS = 3005,
  AUTH_ACCOUNT_LOCKED = 3006,
  AUTH_ACCOUNT_DISABLED = 3007,

  // 数据库错误 (4000-4999)
  DATABASE_ERROR = 4000,
  DATABASE_CONNECTION_ERROR = 4001,
  DATABASE_QUERY_ERROR = 4002,
  DATABASE_CONSTRAINT_ERROR = 4003,
  DATABASE_DUPLICATE_KEY = 4004,
  DATABASE_FOREIGN_KEY_ERROR = 4005,
  DATABASE_TRANSACTION_ERROR = 4006,

  // 业务逻辑错误 (5000-5999)
  BUSINESS_ERROR = 5000,
  RESOURCE_NOT_FOUND = 5001,
  RESOURCE_ALREADY_EXISTS = 5002,
  RESOURCE_IN_USE = 5003,
  OPERATION_NOT_ALLOWED = 5004,
  INVALID_STATE = 5005,
  QUOTA_EXCEEDED = 5006,
  DEPENDENCY_ERROR = 5007,

  // 代码生成相关错误 (6000-6999)
  CODE_GENERATION_ERROR = 6000,
  TEMPLATE_NOT_FOUND = 6001,
  TEMPLATE_PARSE_ERROR = 6002,
  FILE_WRITE_ERROR = 6003,
  DIRECTORY_CREATE_ERROR = 6004,
  BACKUP_ERROR = 6005,
  ROLLBACK_ERROR = 6006,
  PRISMA_GENERATE_ERROR = 6007,
  SERVICE_RESTART_ERROR = 6008,

  // 实体相关错误 (7000-7999)
  ENTITY_ERROR = 7000,
  ENTITY_NOT_FOUND = 7001,
  ENTITY_VALIDATION_ERROR = 7002,
  ENTITY_RELATIONSHIP_ERROR = 7003,
  ENTITY_FIELD_ERROR = 7004,
  ENTITY_CONSTRAINT_ERROR = 7005,

  // 文件操作错误 (8000-8999)
  FILE_ERROR = 8000,
  FILE_NOT_FOUND = 8001,
  FILE_READ_ERROR = 8002,
  FILE_WRITE_ERROR_DETAILED = 8003,
  FILE_DELETE_ERROR = 8004,
  FILE_PERMISSION_ERROR = 8005,
  FILE_SIZE_EXCEEDED = 8006,
  FILE_TYPE_NOT_SUPPORTED = 8007,

  // 网络相关错误 (9000-9999)
  NETWORK_ERROR = 9000,
  CONNECTION_TIMEOUT = 9001,
  CONNECTION_REFUSED = 9002,
  DNS_ERROR = 9003,
  SSL_ERROR = 9004,
}

/**
 * 错误消息映射
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.SUCCESS]: '操作成功',
  [ErrorCode.UNKNOWN_ERROR]: '未知错误',
  [ErrorCode.INVALID_PARAMETER]: '参数无效',
  [ErrorCode.MISSING_PARAMETER]: '缺少必需参数',
  [ErrorCode.INVALID_REQUEST]: '请求无效',
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.FORBIDDEN]: '禁止访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.METHOD_NOT_ALLOWED]: '方法不允许',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.INTERNAL_SERVER_ERROR]: '服务器内部错误',
  [ErrorCode.SERVICE_UNAVAILABLE]: '服务不可用',
  [ErrorCode.TIMEOUT]: '请求超时',
  [ErrorCode.TOO_MANY_REQUESTS]: '请求过于频繁',

  [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCode.REQUIRED_FIELD_MISSING]: '必填字段缺失',
  [ErrorCode.INVALID_FORMAT]: '格式无效',
  [ErrorCode.VALUE_TOO_LONG]: '值过长',
  [ErrorCode.VALUE_TOO_SHORT]: '值过短',
  [ErrorCode.VALUE_OUT_OF_RANGE]: '值超出范围',
  [ErrorCode.INVALID_EMAIL]: '邮箱格式无效',
  [ErrorCode.INVALID_PHONE]: '手机号格式无效',
  [ErrorCode.INVALID_URL]: 'URL格式无效',
  [ErrorCode.INVALID_DATE]: '日期格式无效',
  [ErrorCode.DUPLICATE_VALUE]: '值重复',

  [ErrorCode.AUTH_TOKEN_MISSING]: '认证令牌缺失',
  [ErrorCode.AUTH_TOKEN_INVALID]: '认证令牌无效',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: '认证令牌已过期',
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: '权限不足',
  [ErrorCode.AUTH_USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: '凭据无效',
  [ErrorCode.AUTH_ACCOUNT_LOCKED]: '账户已锁定',
  [ErrorCode.AUTH_ACCOUNT_DISABLED]: '账户已禁用',

  [ErrorCode.DATABASE_ERROR]: '数据库错误',
  [ErrorCode.DATABASE_CONNECTION_ERROR]: '数据库连接错误',
  [ErrorCode.DATABASE_QUERY_ERROR]: '数据库查询错误',
  [ErrorCode.DATABASE_CONSTRAINT_ERROR]: '数据库约束错误',
  [ErrorCode.DATABASE_DUPLICATE_KEY]: '数据库重复键错误',
  [ErrorCode.DATABASE_FOREIGN_KEY_ERROR]: '数据库外键错误',
  [ErrorCode.DATABASE_TRANSACTION_ERROR]: '数据库事务错误',

  [ErrorCode.BUSINESS_ERROR]: '业务逻辑错误',
  [ErrorCode.RESOURCE_NOT_FOUND]: '资源不存在',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: '资源已存在',
  [ErrorCode.RESOURCE_IN_USE]: '资源正在使用中',
  [ErrorCode.OPERATION_NOT_ALLOWED]: '操作不被允许',
  [ErrorCode.INVALID_STATE]: '状态无效',
  [ErrorCode.QUOTA_EXCEEDED]: '配额已超出',
  [ErrorCode.DEPENDENCY_ERROR]: '依赖错误',

  [ErrorCode.CODE_GENERATION_ERROR]: '代码生成错误',
  [ErrorCode.TEMPLATE_NOT_FOUND]: '模板不存在',
  [ErrorCode.TEMPLATE_PARSE_ERROR]: '模板解析错误',
  [ErrorCode.FILE_WRITE_ERROR]: '文件写入错误',
  [ErrorCode.DIRECTORY_CREATE_ERROR]: '目录创建错误',
  [ErrorCode.BACKUP_ERROR]: '备份错误',
  [ErrorCode.ROLLBACK_ERROR]: '回滚错误',
  [ErrorCode.PRISMA_GENERATE_ERROR]: 'Prisma生成错误',
  [ErrorCode.SERVICE_RESTART_ERROR]: '服务重启错误',

  [ErrorCode.ENTITY_ERROR]: '实体错误',
  [ErrorCode.ENTITY_NOT_FOUND]: '实体不存在',
  [ErrorCode.ENTITY_VALIDATION_ERROR]: '实体验证错误',
  [ErrorCode.ENTITY_RELATIONSHIP_ERROR]: '实体关系错误',
  [ErrorCode.ENTITY_FIELD_ERROR]: '实体字段错误',
  [ErrorCode.ENTITY_CONSTRAINT_ERROR]: '实体约束错误',

  [ErrorCode.FILE_ERROR]: '文件错误',
  [ErrorCode.FILE_NOT_FOUND]: '文件不存在',
  [ErrorCode.FILE_READ_ERROR]: '文件读取错误',
  [ErrorCode.FILE_WRITE_ERROR_DETAILED]: '文件写入错误',
  [ErrorCode.FILE_DELETE_ERROR]: '文件删除错误',
  [ErrorCode.FILE_PERMISSION_ERROR]: '文件权限错误',
  [ErrorCode.FILE_SIZE_EXCEEDED]: '文件大小超出限制',
  [ErrorCode.FILE_TYPE_NOT_SUPPORTED]: '文件类型不支持',

  [ErrorCode.NETWORK_ERROR]: '网络错误',
  [ErrorCode.CONNECTION_TIMEOUT]: '连接超时',
  [ErrorCode.CONNECTION_REFUSED]: '连接被拒绝',
  [ErrorCode.DNS_ERROR]: 'DNS错误',
  [ErrorCode.SSL_ERROR]: 'SSL错误',
};

/**
 * 获取错误消息
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || ErrorMessages[ErrorCode.UNKNOWN_ERROR];
}

/**
 * 业务异常类
 */
export class BusinessException extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: any
  ) {
    super(message || getErrorMessage(code));
    this.name = 'BusinessException';
  }
}
