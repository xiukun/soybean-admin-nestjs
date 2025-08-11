// 自定义Cypress命令

/** 登录命令 */
Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('[data-cy=username]').type(username);
    cy.get('[data-cy=password]').type(password);
    cy.get('[data-cy=login-button]').click();

    // 等待登录完成
    cy.url().should('include', '/dashboard');
    cy.window().its('localStorage').should('have.property', 'token');
  });
});

/** 等待页面加载完成 */
Cypress.Commands.add('waitForPageLoad', () => {
  // 等待页面内容加载
  cy.get('[data-cy=page-content]', { timeout: 10000 }).should('be.visible');

  // 等待所有图片加载完成
  cy.get('img')
    .should('be.visible')
    .and($imgs => {
      $imgs.each((index, img) => {
        expect(img.naturalWidth).to.be.greaterThan(0);
      });
    });

  // 等待所有API请求完成
  cy.wait(500);
});

/** 创建测试实体 */
Cypress.Commands.add('createTestEntity', entityData => {
  const defaultData = {
    name: 'Test Entity',
    code: 'testEntity',
    description: 'Test entity created by Cypress',
    projectId: null,
    fields: [
      {
        name: 'Name',
        code: 'name',
        type: 'string',
        required: true
      },
      {
        name: 'Email',
        code: 'email',
        type: 'string',
        required: true
      }
    ]
  };

  const data = { ...defaultData, ...entityData };

  // 通过API创建实体
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/v1/entities`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: data
  }).then(response => {
    expect(response.status).to.eq(201);
    cy.wrap(response.body.data).as('createdEntity');
  });
});

/** 清理测试数据 */
Cypress.Commands.add('cleanupTestData', () => {
  // 清理实体
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/api/v1/entities`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    failOnStatusCode: false
  }).then(response => {
    if (response.status === 200 && response.body.data?.entities) {
      response.body.data.entities.forEach((entity: any) => {
        if (entity.name.includes('Test') || entity.name.includes('E2E')) {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/api/v1/entities/${entity.id}`,
            headers: {
              Authorization: `Bearer ${window.localStorage.getItem('token')}`
            },
            failOnStatusCode: false
          });
        }
      });
    }
  });

  // 清理项目
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/api/v1/projects`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`
    },
    failOnStatusCode: false
  }).then(response => {
    if (response.status === 200 && response.body.data?.projects) {
      response.body.data.projects.forEach((project: any) => {
        if (project.name.includes('Test') || project.name.includes('E2E')) {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/api/v1/projects/${project.id}`,
            headers: {
              Authorization: `Bearer ${window.localStorage.getItem('token')}`
            },
            failOnStatusCode: false
          });
        }
      });
    }
  });
});

/** 检查响应式设计 */
Cypress.Commands.add('checkResponsive', () => {
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop Large' },
    { width: 1280, height: 720, name: 'Desktop' },
    { width: 1024, height: 768, name: 'Tablet' },
    { width: 768, height: 1024, name: 'Tablet Portrait' },
    { width: 375, height: 667, name: 'Mobile' }
  ];

  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.wait(500);

    // 检查页面元素是否正确显示
    cy.get('[data-cy=page-content]').should('be.visible');

    // 检查导航菜单
    if (viewport.width < 768) {
      // 移动设备应该显示汉堡菜单
      cy.get('[data-cy=mobile-menu-button]').should('be.visible');
    } else {
      // 桌面设备应该显示完整菜单
      cy.get('[data-cy=desktop-menu]').should('be.visible');
    }

    // 检查表格响应式
    cy.get('table').then($table => {
      if ($table.length > 0) {
        if (viewport.width < 768) {
          // 移动设备上表格应该可以横向滚动
          cy.get('.table-responsive').should('exist');
        }
      }
    });
  });

  // 恢复默认视口
  cy.viewport(1280, 720);
});

/** 等待API请求完成 */
Cypress.Commands.add('waitForApi', alias => {
  cy.wait(`@${alias}`).then(interception => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

/** 模拟网络延迟 */
Cypress.Commands.add('simulateNetworkDelay', delay => {
  cy.intercept('**', req => {
    req.reply(res => {
      res.delay(delay);
      return res;
    });
  });
});

/** 检查可访问性 */
Cypress.Commands.add('checkA11y', () => {
  // 检查页面标题
  cy.title().should('not.be.empty');

  // 检查主要地标
  cy.get('main, [role="main"]').should('exist');

  // 检查表单标签
  cy.get('input, select, textarea').each($el => {
    const id = $el.attr('id');
    const ariaLabel = $el.attr('aria-label');
    const ariaLabelledby = $el.attr('aria-labelledby');

    if (id) {
      cy.get(`label[for="${id}"]`).should('exist');
    } else {
      expect(ariaLabel || ariaLabelledby).to.exist;
    }
  });

  // 检查按钮可访问性
  cy.get('button').each($btn => {
    const text = $btn.text().trim();
    const ariaLabel = $btn.attr('aria-label');
    const title = $btn.attr('title');

    expect(text || ariaLabel || title).to.not.be.empty;
  });

  // 检查图片alt属性
  cy.get('img').each($img => {
    const alt = $img.attr('alt');
    const ariaLabel = $img.attr('aria-label');
    const role = $img.attr('role');

    if (role !== 'presentation' && role !== 'none') {
      expect(alt || ariaLabel).to.exist;
    }
  });

  // 检查颜色对比度（基本检查）
  cy.get('body').should('have.css', 'color').and('not.equal', 'rgba(0, 0, 0, 0)');
  cy.get('body').should('have.css', 'background-color').and('not.equal', 'rgba(0, 0, 0, 0)');
});

// 扩展cy对象类型
declare global {
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      createTestEntity(entityData: any): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      checkResponsive(): Chainable<void>;
      waitForApi(alias: string): Chainable<void>;
      simulateNetworkDelay(delay: number): Chainable<void>;
      checkA11y(): Chainable<void>;
    }
  }
}

export {};
