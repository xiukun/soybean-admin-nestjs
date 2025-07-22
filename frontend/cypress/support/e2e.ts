// Cypress E2E 支持文件
import './commands';

// 全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略某些预期的错误
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // 让其他错误正常抛出
  return true;
});

// 全局钩子
beforeEach(() => {
  // 设置视口
  cy.viewport(1280, 720);
  
  // 清除本地存储
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // 设置默认等待时间
  cy.intercept('**', (req) => {
    req.reply((res) => {
      // 为所有请求添加延迟以模拟真实网络条件
      res.delay(100);
      return res;
    });
  });
});

afterEach(() => {
  // 测试后清理
  cy.clearLocalStorage();
  cy.clearCookies();
});

// 全局命令扩展
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 登录命令
       */
      login(username?: string, password?: string): Chainable<void>;
      
      /**
       * 等待页面加载完成
       */
      waitForPageLoad(): Chainable<void>;
      
      /**
       * 创建测试实体
       */
      createTestEntity(entityData: any): Chainable<void>;
      
      /**
       * 清理测试数据
       */
      cleanupTestData(): Chainable<void>;
      
      /**
       * 检查响应式设计
       */
      checkResponsive(): Chainable<void>;
      
      /**
       * 等待API请求完成
       */
      waitForApi(alias: string): Chainable<void>;
      
      /**
       * 模拟网络延迟
       */
      simulateNetworkDelay(delay: number): Chainable<void>;
      
      /**
       * 检查可访问性
       */
      checkA11y(): Chainable<void>;
    }
  }
}
