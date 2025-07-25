// Jest测试设置文件
// 在所有测试运行前执行的全局设置

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_TOKEN_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d';

// 模拟Redis客户端
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// 全局测试超时设置
jest.setTimeout(10000);

// 清理控制台输出（可选）
global.console = {
  ...console,
  // 在测试中静默某些日志
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
