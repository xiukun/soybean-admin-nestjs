describe('Code Generation Workflow E2E Tests', () => {
  beforeEach(() => {
    // 登录系统
    cy.visit('/login');
    cy.get('[data-cy=username]').type('admin');
    cy.get('[data-cy=password]').type('admin123');
    cy.get('[data-cy=login-button]').click();

    // 等待登录完成
    cy.url().should('include', '/dashboard');
    cy.wait(1000);
  });

  describe('Complete Code Generation Workflow', () => {
    it('should complete full code generation workflow', () => {
      // 1. 创建项目
      cy.visit('/lowcode/project');
      cy.get('[data-cy=add-project-button]').click();

      cy.get('[data-cy=project-name]').type('E2E Test Project');
      cy.get('[data-cy=project-code]').type('e2e-test-project');
      cy.get('[data-cy=project-description]').type('Project created by E2E test');
      cy.get('[data-cy=save-project-button]').click();

      // 验证项目创建成功
      cy.get('[data-cy=success-message]').should('contain', '创建成功');
      cy.get('[data-cy=project-list]').should('contain', 'E2E Test Project');

      // 2. 创建实体
      cy.visit('/lowcode/entity');
      cy.get('[data-cy=add-entity-button]').click();

      cy.get('[data-cy=entity-name]').type('Test User');
      cy.get('[data-cy=entity-code]').type('testUser');
      cy.get('[data-cy=entity-description]').type('User entity for E2E testing');
      cy.get('[data-cy=entity-project]').select('E2E Test Project');
      cy.get('[data-cy=save-entity-button]').click();

      // 验证实体创建成功
      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 3. 添加字段
      cy.get('[data-cy=entity-list]').contains('Test User').click();
      cy.get('[data-cy=add-field-button]').click();

      // 添加姓名字段
      cy.get('[data-cy=field-name]').type('姓名');
      cy.get('[data-cy=field-code]').type('name');
      cy.get('[data-cy=field-type]').select('string');
      cy.get('[data-cy=field-required]').check();
      cy.get('[data-cy=save-field-button]').click();

      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 添加邮箱字段
      cy.get('[data-cy=add-field-button]').click();
      cy.get('[data-cy=field-name]').type('邮箱');
      cy.get('[data-cy=field-code]').type('email');
      cy.get('[data-cy=field-type]').select('string');
      cy.get('[data-cy=field-required]').check();
      cy.get('[data-cy=field-validation]').type('{"pattern": "^[\\\\w-\\\\.]+@([\\\\w-]+\\\\.)+[\\\\w-]{2,4}$"}');
      cy.get('[data-cy=save-field-button]').click();

      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 添加年龄字段
      cy.get('[data-cy=add-field-button]').click();
      cy.get('[data-cy=field-name]').type('年龄');
      cy.get('[data-cy=field-code]').type('age');
      cy.get('[data-cy=field-type]').select('number');
      cy.get('[data-cy=field-required]').uncheck();
      cy.get('[data-cy=save-field-button]').click();

      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 4. 验证实体和字段
      cy.get('[data-cy=field-list]').should('contain', '姓名');
      cy.get('[data-cy=field-list]').should('contain', '邮箱');
      cy.get('[data-cy=field-list]').should('contain', '年龄');

      // 5. 配置目标项目
      cy.visit('/lowcode/target-project');

      // 检查是否已有目标项目，如果没有则创建
      cy.get('body').then($body => {
        if (
          $body.find('[data-cy=project-list]').length === 0 ||
          !$body.find('[data-cy=project-list]').text().includes('amis-lowcode-backend')
        ) {
          cy.get('[data-cy=add-target-project-button]').click();

          cy.get('[data-cy=target-project-name]').type('amis-lowcode-backend');
          cy.get('[data-cy=target-project-display-name]').type('Amis Backend Service');
          cy.get('[data-cy=target-project-type]').select('nestjs');
          cy.get('[data-cy=target-project-framework]').type('NestJS');
          cy.get('[data-cy=target-project-language]').select('typescript');
          cy.get('[data-cy=target-project-path]').type('../amis-lowcode-backend');
          cy.get('[data-cy=save-target-project-button]').click();

          cy.get('[data-cy=success-message]').should('contain', '创建成功');
        }
      });

      // 6. 执行代码生成
      cy.visit('/lowcode/code-generation');

      // 选择实体
      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').contains('Test User').click();

      // 选择目标项目
      cy.get('[data-cy=target-project-selector]').select('amis-lowcode-backend');

      // 配置生成选项
      cy.get('[data-cy=overwrite-existing]').check();
      cy.get('[data-cy=create-directories]').check();
      cy.get('[data-cy=format-code]').check();

      // 配置Git选项（可选）
      cy.get('[data-cy=git-enabled]').uncheck(); // 为了测试简单，不启用Git

      // 执行生成
      cy.get('[data-cy=generate-code-button]').click();

      // 等待生成完成
      cy.get('[data-cy=generation-progress]', { timeout: 30000 }).should('be.visible');
      cy.get('[data-cy=generation-status]', { timeout: 60000 }).should('contain', '生成完成');

      // 验证生成结果
      cy.get('[data-cy=generation-result]').should('be.visible');
      cy.get('[data-cy=generated-files-count]').should('contain', '文件');
      cy.get('[data-cy=generation-success]').should('contain', '成功');

      // 7. 查看生成历史
      cy.get('[data-cy=generation-history-tab]').click();
      cy.get('[data-cy=history-list]').should('contain', 'Test User');
      cy.get('[data-cy=history-status]').should('contain', '成功');

      // 8. 预览生成的代码
      cy.get('[data-cy=preview-tab]').click();
      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').contains('Test User').click();
      cy.get('[data-cy=preview-button]').click();

      cy.get('[data-cy=preview-result]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-cy=preview-files]').should('contain', 'test-user');

      // 9. 清理测试数据
      cy.visit('/lowcode/entity');
      cy.get('[data-cy=entity-list]').contains('Test User').parent().find('[data-cy=delete-button]').click();
      cy.get('[data-cy=confirm-delete]').click();
      cy.get('[data-cy=success-message]').should('contain', '删除成功');

      cy.visit('/lowcode/project');
      cy.get('[data-cy=project-list]').contains('E2E Test Project').parent().find('[data-cy=delete-button]').click();
      cy.get('[data-cy=confirm-delete]').click();
      cy.get('[data-cy=success-message]').should('contain', '删除成功');
    });

    it('should handle code generation errors gracefully', () => {
      // 测试错误处理
      cy.visit('/lowcode/code-generation');

      // 不选择实体直接生成
      cy.get('[data-cy=generate-code-button]').click();
      cy.get('[data-cy=error-message]').should('contain', '请选择实体');

      // 选择无效的目标项目
      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').first().click();
      cy.get('[data-cy=target-project-selector]').select('');
      cy.get('[data-cy=generate-code-button]').click();
      cy.get('[data-cy=error-message]').should('contain', '请选择目标项目');
    });

    it('should support batch entity generation', () => {
      // 创建多个实体进行批量生成测试
      cy.visit('/lowcode/entity');

      // 创建第一个实体
      cy.get('[data-cy=add-entity-button]').click();
      cy.get('[data-cy=entity-name]').type('Batch Entity 1');
      cy.get('[data-cy=entity-code]').type('batchEntity1');
      cy.get('[data-cy=save-entity-button]').click();
      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 创建第二个实体
      cy.get('[data-cy=add-entity-button]').click();
      cy.get('[data-cy=entity-name]').type('Batch Entity 2');
      cy.get('[data-cy=entity-code]').type('batchEntity2');
      cy.get('[data-cy=save-entity-button]').click();
      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 批量生成代码
      cy.visit('/lowcode/code-generation');
      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').contains('Batch Entity 1').click();
      cy.get('[data-cy=entity-option]').contains('Batch Entity 2').click();
      cy.get('[data-cy=entity-selector]').click(); // 关闭下拉框

      cy.get('[data-cy=target-project-selector]').select('amis-lowcode-backend');
      cy.get('[data-cy=generate-code-button]').click();

      cy.get('[data-cy=generation-status]', { timeout: 60000 }).should('contain', '生成完成');
      cy.get('[data-cy=generated-files-count]').should('contain', '文件');

      // 清理
      cy.visit('/lowcode/entity');
      cy.get('[data-cy=entity-list]').contains('Batch Entity 1').parent().find('[data-cy=delete-button]').click();
      cy.get('[data-cy=confirm-delete]').click();
      cy.get('[data-cy=entity-list]').contains('Batch Entity 2').parent().find('[data-cy=delete-button]').click();
      cy.get('[data-cy=confirm-delete]').click();
    });
  });

  describe('User Interface Interactions', () => {
    it('should handle responsive design correctly', () => {
      // 测试不同屏幕尺寸
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 1024, height: 768, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      viewports.forEach(viewport => {
        cy.viewport(viewport.width, viewport.height);
        cy.visit('/lowcode/code-generation');

        // 验证页面元素在不同尺寸下都可见
        cy.get('[data-cy=page-title]').should('be.visible');
        cy.get('[data-cy=entity-selector]').should('be.visible');
        cy.get('[data-cy=generate-code-button]').should('be.visible');

        // 在移动设备上，侧边栏可能会折叠
        if (viewport.width < 768) {
          cy.get('[data-cy=mobile-menu-button]').should('be.visible');
        }
      });
    });

    it('should handle form validation correctly', () => {
      cy.visit('/lowcode/entity');
      cy.get('[data-cy=add-entity-button]').click();

      // 测试必填字段验证
      cy.get('[data-cy=save-entity-button]').click();
      cy.get('[data-cy=validation-error]').should('contain', '实体名称不能为空');

      // 测试字段格式验证
      cy.get('[data-cy=entity-name]').type('Test Entity');
      cy.get('[data-cy=entity-code]').type('invalid code with spaces');
      cy.get('[data-cy=save-entity-button]').click();
      cy.get('[data-cy=validation-error]').should('contain', '代码格式不正确');

      // 正确填写表单
      cy.get('[data-cy=entity-code]').clear().type('validEntityCode');
      cy.get('[data-cy=save-entity-button]').click();
      cy.get('[data-cy=success-message]').should('contain', '创建成功');

      // 清理
      cy.get('[data-cy=entity-list]').contains('Test Entity').parent().find('[data-cy=delete-button]').click();
      cy.get('[data-cy=confirm-delete]').click();
    });

    it('should handle loading states correctly', () => {
      cy.visit('/lowcode/code-generation');

      // 模拟慢网络条件
      cy.intercept('POST', '/api/v1/code-generation/generate', {
        delay: 2000,
        statusCode: 200,
        body: { success: true, data: { result: { success: true } } }
      }).as('generateCode');

      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').first().click();
      cy.get('[data-cy=target-project-selector]').select('amis-lowcode-backend');
      cy.get('[data-cy=generate-code-button]').click();

      // 验证加载状态
      cy.get('[data-cy=loading-spinner]').should('be.visible');
      cy.get('[data-cy=generate-code-button]').should('be.disabled');

      cy.wait('@generateCode');

      // 验证加载完成状态
      cy.get('[data-cy=loading-spinner]').should('not.exist');
      cy.get('[data-cy=generate-code-button]').should('not.be.disabled');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // 模拟网络错误
      cy.intercept('POST', '/api/v1/code-generation/generate', {
        statusCode: 500,
        body: { success: false, msg: 'Internal server error' }
      }).as('generateCodeError');

      cy.visit('/lowcode/code-generation');
      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').first().click();
      cy.get('[data-cy=target-project-selector]').select('amis-lowcode-backend');
      cy.get('[data-cy=generate-code-button]').click();

      cy.wait('@generateCodeError');

      cy.get('[data-cy=error-message]').should('contain', 'Internal server error');
      cy.get('[data-cy=error-notification]').should('be.visible');
    });

    it('should handle timeout errors', () => {
      // 模拟超时
      cy.intercept('POST', '/api/v1/code-generation/generate', {
        delay: 30000,
        statusCode: 408,
        body: { success: false, msg: 'Request timeout' }
      }).as('generateCodeTimeout');

      cy.visit('/lowcode/code-generation');
      cy.get('[data-cy=entity-selector]').click();
      cy.get('[data-cy=entity-option]').first().click();
      cy.get('[data-cy=target-project-selector]').select('amis-lowcode-backend');
      cy.get('[data-cy=generate-code-button]').click();

      cy.get('[data-cy=timeout-message]', { timeout: 35000 }).should('contain', '请求超时');
    });
  });

  describe('Performance Tests', () => {
    it('should load pages within acceptable time', () => {
      const pages = [
        '/lowcode/entity',
        '/lowcode/field',
        '/lowcode/project',
        '/lowcode/code-generation',
        '/lowcode/target-project'
      ];

      pages.forEach(page => {
        const startTime = Date.now();
        cy.visit(page);
        cy.get('[data-cy=page-content]').should('be.visible');

        cy.then(() => {
          const loadTime = Date.now() - startTime;
          expect(loadTime).to.be.lessThan(3000); // 页面应在3秒内加载完成
        });
      });
    });

    it('should handle large datasets efficiently', () => {
      // 这个测试需要预先准备大量测试数据
      cy.visit('/lowcode/entity');

      // 验证分页功能
      cy.get('[data-cy=pagination]').should('be.visible');
      cy.get('[data-cy=page-size-selector]').select('50');
      cy.get('[data-cy=entity-list]').should('be.visible');

      // 验证搜索功能
      cy.get('[data-cy=search-input]').type('test');
      cy.get('[data-cy=search-button]').click();
      cy.get('[data-cy=search-results]').should('be.visible');
    });
  });
});
