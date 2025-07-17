# 低代码平台后端测试指南

## 概述

本指南提供了低代码平台后端项目的完整测试策略、测试结构和最佳实践。

## 测试架构

### 测试金字塔
```
    /\
   /  \     E2E Tests (端到端测试)
  /____\    
 /      \   Integration Tests (集成测试)
/________\  Unit Tests (单元测试)
```

### 测试分层

#### 1. 单元测试 (Unit Tests)
- **位置**: `src/**/*.spec.ts`
- **目的**: 测试单个组件、类或函数的行为
- **覆盖范围**: 域模型、处理器、服务、工具函数

#### 2. 集成测试 (Integration Tests)
- **位置**: `src/api/**/*.spec.ts`
- **目的**: 测试多个组件之间的交互
- **覆盖范围**: API控制器、数据库集成、外部服务集成

#### 3. 端到端测试 (E2E Tests)
- **位置**: `test/e2e/**/*.e2e-spec.ts`
- **目的**: 测试完整的用户场景和业务流程
- **覆盖范围**: 完整的API流程、跨模块交互

## 测试结构

### 目录结构
```
src/
├── lib/
│   └── bounded-contexts/
│       ├── entity/
│       │   ├── test/
│       │   │   ├── entity.model.spec.ts
│       │   │   ├── entity.handlers.spec.ts
│       │   │   └── field.model.spec.ts
│       │   └── ...
│       ├── project/
│       │   ├── test/
│       │   │   ├── project.model.spec.ts
│       │   │   └── project.handlers.spec.ts
│       │   └── ...
│       └── ...
├── api/
│   └── lowcode/
│       └── test/
│           └── entity.controller.spec.ts
└── ...
test/
├── e2e/
│   └── lowcode-platform.e2e-spec.ts
└── jest-e2e.json
```

## 测试命令

### 基本命令
```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:cov

# 监视模式运行测试
npm run test:watch

# 运行端到端测试
npm run test:e2e
```

### 特定测试
```bash
# 运行特定文件的测试
npm test -- entity.model.spec.ts

# 运行特定模式的测试
npm test -- --testPathPattern=entity

# 运行特定测试套件
npm test -- --testNamePattern="Entity Model"
```

## 测试编写指南

### 1. 单元测试最佳实践

#### 域模型测试示例
```typescript
describe('Entity Model', () => {
  describe('create', () => {
    it('should create entity with valid data', () => {
      const entityData = {
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        createdBy: 'user123',
      };

      const entity = Entity.create(entityData);

      expect(entity.projectId).toBe(entityData.projectId);
      expect(entity.name).toBe(entityData.name);
      expect(entity.status).toBe(EntityStatus.DRAFT);
    });

    it('should throw error when name is empty', () => {
      const entityData = {
        projectId: 'project-123',
        name: '',
        code: 'user',
        tableName: 'users',
        createdBy: 'user123',
      };

      expect(() => Entity.create(entityData)).toThrow('Entity name is required');
    });
  });
});
```

#### 处理器测试示例
```typescript
describe('CreateEntityHandler', () => {
  let handler: CreateEntityHandler;
  let mockRepository: jest.Mocked<EntityRepository>;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findByCode: jest.fn(),
      existsByTableName: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        CreateEntityHandler,
        { provide: 'EntityRepository', useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<CreateEntityHandler>(CreateEntityHandler);
  });

  it('should create entity successfully', async () => {
    const command = new CreateEntityCommand(/* ... */);
    const mockEntity = Entity.create(/* ... */);

    mockRepository.findByCode.mockResolvedValue(null);
    mockRepository.existsByTableName.mockResolvedValue(false);
    mockRepository.save.mockResolvedValue(mockEntity);

    const result = await handler.execute(command);

    expect(result).toBe(mockEntity);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### 2. 集成测试最佳实践

#### 控制器测试示例
```typescript
describe('EntityController', () => {
  let controller: EntityController;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    mockCommandBus = { execute: jest.fn() } as any;
    mockQueryBus = { execute: jest.fn() } as any;

    const module = await Test.createTestingModule({
      controllers: [EntityController],
      providers: [
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    controller = module.get<EntityController>(EntityController);
  });

  it('should create entity successfully', async () => {
    const createDto = { /* ... */ };
    const mockEntity = Entity.create(/* ... */);

    mockCommandBus.execute.mockResolvedValue(mockEntity);

    const result = await controller.createEntity(createDto);

    expect(result).toHaveProperty('id');
    expect(mockCommandBus.execute).toHaveBeenCalled();
  });
});
```

### 3. 端到端测试最佳实践

#### E2E测试示例
```typescript
describe('Entity Management Flow', () => {
  let app: INestApplication;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create and manage entity lifecycle', async () => {
    // 1. 创建项目
    const projectResponse = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({ name: 'Test Project', type: 'web' })
      .expect(201);

    projectId = projectResponse.body.id;

    // 2. 创建实体
    const entityResponse = await request(app.getHttpServer())
      .post('/v1/entities')
      .send({
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
      })
      .expect(201);

    // 3. 验证实体创建
    expect(entityResponse.body).toHaveProperty('id');
    expect(entityResponse.body.name).toBe('User');
  });
});
```

## 测试数据管理

### 1. 测试数据工厂
```typescript
// test/factories/entity.factory.ts
export class EntityFactory {
  static create(overrides: Partial<EntityCreateProperties> = {}): Entity {
    return Entity.create({
      projectId: 'test-project-id',
      name: 'Test Entity',
      code: 'testEntity',
      tableName: 'test_entities',
      createdBy: 'test-user',
      ...overrides,
    });
  }

  static createMultiple(count: number): Entity[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({ name: `Entity ${i + 1}`, code: `entity${i + 1}` })
    );
  }
}
```

### 2. 测试数据清理
```typescript
afterEach(async () => {
  // 清理测试数据
  await prisma.entity.deleteMany();
  await prisma.project.deleteMany();
});
```

## Mock策略

### 1. 仓储Mock
```typescript
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByCode: jest.fn(),
  delete: jest.fn(),
} as jest.Mocked<EntityRepository>;
```

### 2. 外部服务Mock
```typescript
const mockExternalService = {
  generateCode: jest.fn().mockResolvedValue('generated-code'),
  validateSchema: jest.fn().mockResolvedValue(true),
} as jest.Mocked<ExternalService>;
```

## 测试覆盖率

### 覆盖率目标
- **语句覆盖率**: >90%
- **分支覆盖率**: >85%
- **函数覆盖率**: >95%
- **行覆盖率**: >90%

### 覆盖率检查
```bash
# 生成覆盖率报告
npm run test:cov

# 查看详细覆盖率报告
open coverage/lcov-report/index.html
```

## 持续集成

### GitHub Actions配置
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:cov
      - run: npm run test:e2e
```

## 调试测试

### 1. 调试单个测试
```bash
# 使用调试模式运行特定测试
npm test -- --testNamePattern="should create entity" --verbose
```

### 2. 使用VS Code调试
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

## 常见问题

### 1. 测试超时
```typescript
// 增加测试超时时间
describe('Long running test', () => {
  it('should handle long operation', async () => {
    // 测试代码
  }, 10000); // 10秒超时
});
```

### 2. 异步测试
```typescript
// 正确处理异步操作
it('should handle async operation', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});
```

### 3. Mock清理
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## 最佳实践总结

1. **测试命名**: 使用描述性的测试名称
2. **测试隔离**: 每个测试应该独立运行
3. **数据清理**: 测试后清理数据
4. **Mock使用**: 适当使用Mock隔离依赖
5. **覆盖率监控**: 定期检查测试覆盖率
6. **持续改进**: 根据反馈持续改进测试质量

## 参考资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [NestJS测试文档](https://docs.nestjs.com/fundamentals/testing)
- [Supertest文档](https://github.com/visionmedia/supertest)
- [测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
