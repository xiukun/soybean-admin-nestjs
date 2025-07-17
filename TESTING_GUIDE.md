# 低代码平台测试指南

## 📋 测试概述

本文档提供了低代码平台完整的测试策略、运行指南和最佳实践。我们的测试套件涵盖了从单元测试到端到端测试的各个层面，确保系统的可靠性和稳定性。

## 🏗️ 测试架构

### 测试金字塔

```
                    /\
                   /  \
                  / E2E \
                 /______\
                /        \
               /Integration\
              /__________\
             /            \
            /  Unit Tests  \
           /________________\
```

### 测试类型分布

| 测试类型 | 占比 | 目的 | 运行频率 |
|----------|------|------|----------|
| 单元测试 | 70% | 验证单个组件功能 | 每次提交 |
| 集成测试 | 20% | 验证组件间交互 | 每次构建 |
| 端到端测试 | 10% | 验证完整用户流程 | 每日/发布前 |

## 🚀 快速开始

### 运行所有测试
```bash
# 使用测试脚本（推荐）
./run-tests.sh

# 或者分别运行
./run-tests.sh --backend
./run-tests.sh --frontend
./run-tests.sh --api
```

### 运行特定类型测试
```bash
# 后端测试
cd lowcode-platform-backend
npm run test:unit          # 单元测试
npm run test:integration   # 集成测试
npm run test:e2e          # 端到端测试
npm run test:performance  # 性能测试

# 前端测试
cd frontend
pnpm run test:unit        # 单元测试
pnpm run test:integration # 集成测试
pnpm run test:component   # 组件测试
```

## 📁 测试文件结构

```
soybean-admin-nestjs/
├── lowcode-platform-backend/
│   ├── src/
│   │   └── **/*.spec.ts              # 单元测试
│   ├── test/
│   │   ├── unit/                     # 单元测试
│   │   ├── integration/              # 集成测试
│   │   │   ├── project-management.integration.spec.ts
│   │   │   └── entity-management.integration.spec.ts
│   │   ├── e2e/                      # 端到端测试
│   │   │   └── lowcode-workflow.e2e-spec.ts
│   │   └── performance/              # 性能测试
│   │       └── load-test.spec.ts
│   └── jest.config.js                # Jest配置
├── frontend/
│   └── src/
│       └── tests/
│           ├── unit/                 # 单元测试
│           ├── integration/          # 集成测试
│           └── component/            # 组件测试
├── run-tests.sh                     # 测试运行脚本
└── TESTING_GUIDE.md                 # 本文档
```

## 🧪 测试类型详解

### 1. 单元测试 (Unit Tests)

**目的**: 测试单个函数、类或组件的功能

**特点**:
- 快速执行
- 隔离性强
- 覆盖率高

**示例**:
```typescript
// 后端单元测试
describe('ProjectService', () => {
  it('should create a project', async () => {
    const projectData = { name: 'Test Project' };
    const result = await projectService.create(projectData);
    expect(result.name).toBe('Test Project');
  });
});

// 前端单元测试
describe('ProjectList Component', () => {
  it('should render project list', () => {
    const wrapper = mount(ProjectList, { props: { projects: mockProjects } });
    expect(wrapper.find('.project-item').exists()).toBe(true);
  });
});
```

### 2. 集成测试 (Integration Tests)

**目的**: 测试多个组件或服务之间的交互

**特点**:
- 测试真实的数据流
- 验证API契约
- 检查数据库交互

**示例**:
```typescript
describe('Project Management Integration', () => {
  it('should create project with entities', async () => {
    // 创建项目
    const project = await request(app)
      .post('/projects')
      .send(projectData)
      .expect(201);

    // 在项目中创建实体
    const entity = await request(app)
      .post('/entities')
      .send({ ...entityData, projectId: project.body.id })
      .expect(201);

    expect(entity.body.projectId).toBe(project.body.id);
  });
});
```

### 3. 端到端测试 (E2E Tests)

**目的**: 模拟完整的用户工作流程

**特点**:
- 测试完整业务场景
- 跨服务验证
- 用户体验验证

**示例**:
```typescript
describe('Complete Low-code Workflow', () => {
  it('should complete full development cycle', async () => {
    // 1. 创建项目
    const project = await createProject();
    
    // 2. 创建实体
    const entities = await createEntities(project.id);
    
    // 3. 添加字段
    await addFields(entities);
    
    // 4. 创建关系
    await createRelationships(entities);
    
    // 5. 生成代码
    const result = await generateCode(project.id);
    
    expect(result.success).toBe(true);
  });
});
```

### 4. 性能测试 (Performance Tests)

**目的**: 验证系统在负载下的表现

**特点**:
- 并发测试
- 响应时间验证
- 资源使用监控

**示例**:
```typescript
describe('Performance Tests', () => {
  it('should handle concurrent requests', async () => {
    const promises = Array.from({ length: 100 }, () =>
      request(app).get('/projects').expect(200)
    );
    
    const startTime = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // 5秒内完成
  });
});
```

## 🔧 测试配置

### Jest配置 (后端)

```javascript
// jest.config.js
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.spec.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/test/integration/**/*.spec.ts']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.spec.ts']
    }
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Vitest配置 (前端)

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      threshold: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  }
});
```

## 📊 测试覆盖率

### 覆盖率目标

| 组件类型 | 目标覆盖率 | 当前状态 |
|----------|------------|----------|
| 核心业务逻辑 | 90%+ | ✅ |
| API控制器 | 85%+ | ✅ |
| 服务层 | 90%+ | ✅ |
| 数据访问层 | 80%+ | ✅ |
| 前端组件 | 80%+ | 🔄 |
| 工具函数 | 95%+ | ✅ |

### 查看覆盖率报告

```bash
# 后端覆盖率
cd lowcode-platform-backend
npm run test:coverage
open coverage/lcov-report/index.html

# 前端覆盖率
cd frontend
pnpm run test:coverage
open coverage/index.html
```

## 🛠️ 测试工具和库

### 后端测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| Jest | 测试框架 | ^29.0.0 |
| Supertest | HTTP测试 | ^6.3.0 |
| @nestjs/testing | NestJS测试工具 | ^10.0.0 |
| ts-jest | TypeScript支持 | ^29.0.0 |

### 前端测试工具

| 工具 | 用途 | 版本 |
|------|------|------|
| Vitest | 测试框架 | ^1.0.0 |
| @vue/test-utils | Vue测试工具 | ^2.4.0 |
| jsdom | DOM模拟 | ^23.0.0 |
| @testing-library/vue | 测试库 | ^8.0.0 |

## 🎯 测试最佳实践

### 1. 测试命名规范

```typescript
// ✅ 好的命名
describe('ProjectService', () => {
  describe('create', () => {
    it('should create project with valid data', () => {});
    it('should throw error when name is missing', () => {});
    it('should set default status to ACTIVE', () => {});
  });
});

// ❌ 不好的命名
describe('test', () => {
  it('works', () => {});
});
```

### 2. 测试数据管理

```typescript
// ✅ 使用工厂函数
const createProjectData = (overrides = {}) => ({
  name: 'Test Project',
  description: 'Test description',
  version: '1.0.0',
  status: 'ACTIVE',
  ...overrides
});

// ✅ 使用beforeEach清理
beforeEach(async () => {
  await cleanupDatabase();
});
```

### 3. 异步测试

```typescript
// ✅ 正确的异步测试
it('should create project', async () => {
  const result = await projectService.create(projectData);
  expect(result).toBeDefined();
});

// ❌ 错误的异步测试
it('should create project', () => {
  projectService.create(projectData).then(result => {
    expect(result).toBeDefined(); // 可能不会执行
  });
});
```

### 4. Mock使用

```typescript
// ✅ 适当的Mock
const mockPrismaService = {
  project: {
    create: jest.fn(),
    findMany: jest.fn(),
  }
};

// ✅ 验证Mock调用
expect(mockPrismaService.project.create).toHaveBeenCalledWith({
  data: projectData
});
```

## 🚨 常见问题和解决方案

### 1. 测试超时

**问题**: 测试运行超时
**解决方案**:
```typescript
// 增加超时时间
jest.setTimeout(30000);

// 或在特定测试中
it('should handle long operation', async () => {
  // 测试代码
}, 30000);
```

### 2. 数据库连接问题

**问题**: 测试中数据库连接失败
**解决方案**:
```typescript
// 使用测试数据库
beforeAll(async () => {
  await app.init();
});

afterAll(async () => {
  await app.close();
});
```

### 3. 异步操作未完成

**问题**: 异步操作在测试结束前未完成
**解决方案**:
```typescript
// 等待所有异步操作完成
afterEach(async () => {
  await new Promise(resolve => setImmediate(resolve));
});
```

## 📈 持续集成

### GitHub Actions配置

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: ./run-tests.sh --ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 测试报告

测试完成后，可以在以下位置查看报告：
- 覆盖率报告: `coverage/lcov-report/index.html`
- 测试结果: `test-results/test-report.html`
- JUnit报告: `test-results/junit.xml`

## 🔍 调试测试

### 调试单个测试

```bash
# 运行特定测试文件
npm test -- project.spec.ts

# 调试模式
npm test -- --inspect-brk project.spec.ts

# 监听模式
npm test -- --watch project.spec.ts
```

### 使用VSCode调试

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## 📚 参考资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [NestJS测试指南](https://docs.nestjs.com/fundamentals/testing)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/)

## 🤝 贡献指南

### 添加新测试

1. 确定测试类型和位置
2. 遵循命名规范
3. 编写清晰的测试用例
4. 确保测试覆盖率
5. 更新相关文档

### 测试审查清单

- [ ] 测试名称清晰描述功能
- [ ] 测试覆盖正常和异常情况
- [ ] 使用适当的断言
- [ ] 清理测试数据
- [ ] 测试运行稳定
- [ ] 覆盖率达标

---

**记住**: 好的测试不仅能发现bug，更能提高代码质量和开发效率！
