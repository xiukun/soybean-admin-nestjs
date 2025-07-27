/**
 * Environment utility functions
 * 环境变量工具函数
 */

export const isDevEnvironment = process.env.NODE_ENV === 'development';
export const isProdEnvironment = process.env.NODE_ENV === 'production';

/**
 * Get boolean value from environment variable
 * 从环境变量获取布尔值
 */
export const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value !== undefined ? value === 'true' : defaultValue;
};

/**
 * Get string value from environment variable
 * 从环境变量获取字符串值
 */
export const getEnvString = (key: string, defaultValue: string): string => {
  const value = process.env[key];
  return value ?? defaultValue;
};

/**
 * Get number value from environment variable
 * 从环境变量获取数字值
 */
export const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value) {
    const parsed = parseInt(value, 10);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

/**
 * Get array value from environment variable (comma-separated)
 * 从环境变量获取数组值（逗号分隔）
 */
export const getEnvArray = <T = string>(
  key: string,
  defaultValue: T[] = [],
): T[] => {
  const value = process.env[key];
  return value === undefined ? defaultValue : (value.split(',').map(item => item.trim()) as T[]);
};

/**
 * Get port number from environment variable
 * 从环境变量获取端口号
 */
export const getPort = (defaultPort: number = 3000): number => {
  return getEnvNumber('PORT', defaultPort);
};

/**
 * Get host from environment variable
 * 从环境变量获取主机地址
 */
export const getHost = (defaultHost: string = '0.0.0.0'): string => {
  return getEnvString('HOST', defaultHost);
};
