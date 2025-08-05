# 低代码平台测试计划

## 测试概述

本测试计划涵盖低代码平台的全面测试策略，包括单元测试、集成测试、接口测试、前端测试和国际化测试，确保系统的稳定性、可靠性和用户体验。

## 测试环境

### 测试环境配置
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_DB: soybean_admin_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - ./deploy/postgres:/docker-entrypoint-initdb.d

  redis-test:
    image: redis:7-alpine
    ports:
      - "6380:6379"

  lowcode-platform-test:
    build: 
      context: ./lowcode-platform-backend
      dockerfile: Dockerfile.test
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/soybean_admin_test
      REDIS_URL: redis://redis-test:6379
    depends_on:
      - postgres-test
      - redis-test
    ports:
      - "3004:3002"

  amis-lowcode-test:
    build:
      context: ./amis-lowcode-backend
      dockerfile: Dockerfile.test
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://test_user:test_password@postgres-test:5432/soybean_admin_test
    depends_on:
      - postgres-test
    ports:
      - "3005:3003"
```

### 测试数据准备
```typescript
// test/fixtures/test-data.ts
export class TestDataFactory {
  static createProject(overrides?: Partial<Project>): Project {
    return {
      id: 'test-project-1',
      name: '测试项目',
      code: 'test_project',
      description: '用于测试的项目',
      version: '1.0.0',
      status: 'ACTIVE',
      config: {},
      createdBy: 'test-user',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createEntity(projectId: string, overrides?: Partial<Entity>): Entity {
    return {
      id: 'test-entity-1',
      projectId,
      name: '用户',
      code: 'user',
      tableName: 'users',
      description: '用户实体',
      status: 'DRAFT',
      config: {},
      version: '1.0.0',
      createdBy: 'test-user',
      createdAt: new Date(),
      ...overrides
    };
  }

  static createField(entityId: string, overrides?: Partial<Field>): Field {
    return {
      id: 'test-field-1',
      entityId,
      name: '姓名',
      code: 'name',
      type: 'STRING',
      length: 100,
      nullable: false,
      required: true,
      sortOrder: 1,
      createdBy: 'test-user',
      createdAt: new Date(),
      ...overrides
    };
  }
}
```

## 单元测试

### 1. 服务层测试

#### 项目服务测试
```typescript
// test/unit/services/project.service.spec.ts
describe('ProjectService', () => {
  let service: ProjectService;
  let prismaService: PrismaService;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>()
        }
      ]
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prismaService = module.get<PrismaService>(PrismaService);
    mockPrisma = prismaService as DeepMockProxy<PrismaClient>;
  });

  describe('create', () => {
    it('应该成功创建项目', async () => {
      // Arrange
      const createProjectDto: CreateProjectDto = {
        name: '测试项目',
        code: 'test_project',
        description: '测试描述'
      };
      const expectedProject = TestDataFactory.createProject(createProjectDto);
      mockPrisma.project.create.mockResolvedValue(expectedProject);

      // Act
      const result = await service.create(createProjectDto, 'test-user');

      // Assert
      expect(result).toEqual(expectedProject);
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          ...createProjectDto,
          createdBy: 'test-user'
        }
      });
    });

    it('当项目代码重复时应该抛出异常', async () => {
      // Arrange
      const createProjectDto: CreateProjectDto = {
        name: '测试项目',
        code: 'existing_project',
        description: '测试描述'
      };
      mockPrisma.project.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          { code: 'P2002', clientVersion: '4.0.0' }
        )
      );

      // Act & Assert
      await expect(service.create(createProjectDto, 'test-user'))
        .rejects.toThrow(BusinessException);
    });
  });

  describe('findAll', () => {
    it('应该返回分页的项目列表', async () => {
      // Arrange
      const query: ProjectQueryDto = { page: 1, limit: 10 };
      const projects = [TestDataFactory.createProject()];
      const total = 1;
      
      mockPrisma.project.findMany.mockResolvedValue(projects);
      mockPrisma.project.count.mockResolvedValue(total);

      // Act
      const result = await service.findAll(query);

      // Assert
      expect(result).toEqual({
        data: projects,
        total,
        page: 1,
        limit: 10
      });
    });
  });

  describe('update', () => {
    it('应该成功更新项目', async () => {
      // Arrange
      const projectId = 'test-project-1';
      const updateDto: UpdateProjectDto = { name: '更新的项目名' };
      const existingProject = TestDataFactory.createProject();
      const updatedProject = { ...existingProject, ...updateDto };
      
      mockPrisma.project.findUnique.mockResolvedValue(existingProject);
      mockPrisma.project.update.mockResolvedValue(updatedProject);

      // Act
      const result = await service.update(projectId, updateDto, 'test-user');

      // Assert
      expect(result).toEqual(updatedProject);
      expect(mockPrisma.project.update).toHaveBeenCalledWith({
        where: { id: projectId },
        data: {
          ...updateDto,
          updatedBy: 'test-user',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('当项目不存在时应该抛出异常', async () => {
      // Arrange
      const projectId = 'non-existent-project';
      const updateDto: UpdateProjectDto = { name: '更新的项目名' };
      
      mockPrisma.project.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(projectId, updateDto, 'test-user'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
```

#### 实体服务测试
```typescript
// test/unit/services/entity.service.spec.ts
describe('EntityService', () => {
  let service: EntityService;
  let fieldService: FieldService;
  let mockPrisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>()
        },
        {
          provide: FieldService,
          useValue: {
            createDefaultFields: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<EntityService>(EntityService);
    fieldService = module.get<FieldService>(FieldService);
    mockPrisma = module.get<PrismaService>(PrismaService) as DeepMockProxy<PrismaClient>;
  });

  describe('create', () => {
    it('应该创建实体并自动添加默认字段', async () => {
      // Arrange
      const createEntityDto: CreateEntityDto = {
        projectId: 'test-project-1',
        name: '用户',
        code: 'user',
        tableName: 'users'
      };
      const expectedEntity = TestDataFactory.createEntity(createEntityDto.projectId, createEntityDto);
      
      mockPrisma.entity.create.mockResolvedValue(expectedEntity);
      jest.spyOn(fieldService, 'createDefaultFields').mockResolvedValue([]);

      // Act
      const result = await service.create(createEntityDto, 'test-user');

      // Assert
      expect(result).toEqual(expectedEntity);
      expect(fieldService.createDefaultFields).toHaveBeenCalledWith(expectedEntity.id, 'test-user');
    });
  });

  describe('validateEntityName', () => {
    it('应该验证实体名称的唯一性', async () => {
      // Arrange
      const projectId = 'test-project-1';
      const entityCode = 'user';
      
      mockPrisma.entity.findFirst.mockResolvedValue(null);

      // Act
      const result = await service.validateEntityName(projectId, entityCode);

      // Assert
      expect(result).toBe(true);
    });

    it('当实体名称重复时应该返回false', async () => {
      // Arrange
      const projectId = 'test-project-1';
      const entityCode = 'user';
      const existingEntity = TestDataFactory.createEntity(projectId, { code: entityCode });
      
      mockPrisma.entity.findFirst.mockResolvedValue(existingEntity);

      // Act
      const result = await service.validateEntityName(projectId, entityCode);

      // Assert
      expect(result).toBe(false);
    });
  });
});
```

### 2. 控制器测试

```typescript
// test/unit/controllers/project.controller.spec.ts
describe('ProjectController', () => {
  let controller: ProjectController;
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get<ProjectService>(ProjectService);
  });

  describe('create', () => {
    it('应该创建项目并返回结果', async () => {
      // Arrange
      const createProjectDto: CreateProjectDto = {
        name: '测试项目',
        code: 'test_project',
        description: '测试描述'
      };
      const expectedProject = TestDataFactory.createProject(createProjectDto);
      const mockRequest = { user: { id: 'test-user' } } as any;
      
      jest.spyOn(service, 'create').mockResolvedValue(expectedProject);

      // Act
      const result = await controller.create(createProjectDto, mockRequest);

      // Assert
      expect(result).toEqual({
        success: true,
        data: expectedProject,
        message: '项目创建成功'
      });
      expect(service.create).toHaveBeenCalledWith(createProjectDto, 'test-user');
    });
  });
});
```

### 3. 工具类测试

```typescript
// test/unit/utils/code-generation.util.spec.ts
describe('CodeGenerationUtil', () => {
  describe('generateEntityModel', () => {
    it('应该生成正确的实体模型代码', () => {
      // Arrange
      const entity = TestDataFactory.createEntity('project-1');
      const fields = [
        TestDataFactory.createField(entity.id, { name: '姓名', code: 'name', type: 'STRING' }),
        TestDataFactory.createField(entity.id, { name: '年龄', code: 'age', type: 'INTEGER' })
      ];

      // Act
      const result = CodeGenerationUtil.generateEntityModel(entity, fields);

      // Assert
      expect(result).toContain('export class User');
      expect(result).toContain('name: string');
      expect(result).toContain('age: number');
    });
  });

  describe('generateDTO', () => {
    it('应该生成带验证装饰器的DTO', () => {
      // Arrange
      const entity = TestDataFactory.createEntity('project-1');
      const fields = [
        TestDataFactory.createField(entity.id, {
          name: '邮箱',
          code: 'email',
          type: 'STRING',
          required: true,
          validationRules: { format: 'email' }
        })
      ];

      // Act
      const result = CodeGenerationUtil.generateCreateDTO(entity, fields);

      // Assert
      expect(result).toContain('@IsEmail()');
      expect(result).toContain('@IsNotEmpty()');
      expect(result).toContain('email: string');
    });
  });
});
```

## 集成测试

### 1. 数据库集成测试

```typescript
// test/integration/database.integration.spec.ts
describe('Database Integration', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
    
    // 清理测试数据
    await prismaService.cleanDatabase();
  });

  afterAll(async () => {
    await prismaService.cleanDatabase();
    await app.close();
  });

  describe('Project CRUD Operations', () => {
    it('应该完成项目的完整CRUD操作', async () => {
      // Create
      const createData = {
        name: '集成测试项目',
        code: 'integration_test',
        description: '用于集成测试',
        createdBy: 'test-user'
      };
      
      const createdProject = await prismaService.project.create({
        data: createData
      });
      
      expect(createdProject.id).toBeDefined();
      expect(createdProject.name).toBe(createData.name);

      // Read
      const foundProject = await prismaService.project.findUnique({
        where: { id: createdProject.id }
      });
      
      expect(foundProject).toBeTruthy();
      expect(foundProject.code).toBe(createData.code);

      // Update
      const updateData = { name: '更新的项目名' };
      const updatedProject = await prismaService.project.update({
        where: { id: createdProject.id },
        data: updateData
      });
      
      expect(updatedProject.name).toBe(updateData.name);

      // Delete
      await prismaService.project.delete({
        where: { id: createdProject.id }
      });
      
      const deletedProject = await prismaService.project.findUnique({
        where: { id: createdProject.id }
      });
      
      expect(deletedProject).toBeNull();
    });
  });

  describe('Entity-Field Relationship', () => {
    it('应该正确处理实体和字段的级联关系', async () => {
      // 创建项目
      const project = await prismaService.project.create({
        data: {
          name: '关系测试项目',
          code: 'relationship_test',
          createdBy: 'test-user'
        }
      });

      // 创建实体
      const entity = await prismaService.entity.create({
        data: {
          projectId: project.id,
          name: '测试实体',
          code: 'test_entity',
          tableName: 'test_entities',
          createdBy: 'test-user'
        }
      });

      // 创建字段
      const field = await prismaService.field.create({
        data: {
          entityId: entity.id,
          name: '测试字段',
          code: 'test_field',
          type: 'STRING',
          createdBy: 'test-user'
        }
      });

      // 验证关系
      const entityWithFields = await prismaService.entity.findUnique({
        where: { id: entity.id },
        include: { fields: true }
      });

      expect(entityWithFields.fields).toHaveLength(1);
      expect(entityWithFields.fields[0].id).toBe(field.id);

      // 测试级联删除
      await prismaService.entity.delete({
        where: { id: entity.id }
      });

      const orphanField = await prismaService.field.findUnique({
        where: { id: field.id }
      });

      expect(orphanField).toBeNull();
    });
  });
});
```

### 2. 服务间集成测试

```typescript
// test/integration/code-generation.integration.spec.ts
describe('Code Generation Integration', () => {
  let app: INestApplication;
  let codeGenerationService: CodeGenerationService;
  let templateService: TemplateService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    codeGenerationService = app.get<CodeGenerationService>(CodeGenerationService);
    templateService = app.get<TemplateService>(TemplateService);
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('应该完成完整的代码生成流程', async () => {
    // 1. 创建测试数据
    const project = await prismaService.project.create({
      data: {
        name: '代码生成测试',
        code: 'codegen_test',
        createdBy: 'test-user'
      }
    });

    const entity = await prismaService.entity.create({
      data: {
        projectId: project.id,
        name: '用户',
        code: 'user',
        tableName: 'users',
        createdBy: 'test-user'
      }
    });

    await prismaService.field.createMany({
      data: [
        {
          entityId: entity.id,
          name: '姓名',
          code: 'name',
          type: 'STRING',
          required: true,
          createdBy: 'test-user'
        },
        {
          entityId: entity.id,
          name: '邮箱',
          code: 'email',
          type: 'STRING',
          required: true,
          createdBy: 'test-user'
        }
      ]
    });

    // 2. 执行代码生成
    const generationConfig = {
      projectId: project.id,
      entityIds: [entity.id],
      templates: ['ENTITY_MODEL', 'ENTITY_DTO', 'ENTITY_SERVICE', 'ENTITY_CONTROLLER'],
      outputPath: '/tmp/test-output'
    };

    const task = await codeGenerationService.generateCode(generationConfig, 'test-user');

    // 3. 等待生成完成
    let completedTask;
    let attempts = 0;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      completedTask = await prismaService.codegenTask.findUnique({
        where: { id: task.id }
      });
      attempts++;
    } while (completedTask.status === 'RUNNING' && attempts < 30);

    // 4. 验证结果
    expect(completedTask.status).toBe('COMPLETED');
    expect(completedTask.result).toBeDefined();
    expect(completedTask.result.generatedFiles).toHaveLength(4);

    // 5. 验证生成的文件内容
    const fs = require('fs');
    const path = require('path');
    
    const modelFile = path.join(completedTask.outputPath, 'entities/user.entity.ts');
    expect(fs.existsSync(modelFile)).toBe(true);
    
    const modelContent = fs.readFileSync(modelFile, 'utf8');
    expect(modelContent).toContain('export class User');
    expect(modelContent).toContain('name: string');
    expect(modelContent).toContain('email: string');
  });
});
```

## 接口测试 (API Testing)

### 1. REST API测试

```typescript
// test/e2e/api/project.e2e-spec.ts
describe('Project API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
    
    // 获取认证token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@example.com',
        password: 'test123'
      });
    
    authToken = authResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prismaService.cleanDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await prismaService.cleanDatabase();
  });

  describe('POST /api/lowcode/projects', () => {
    it('应该成功创建项目', async () => {
      const createProjectDto = {
        name: 'API测试项目',
        code: 'api_test_project',
        description: '用于API测试的项目'
      };

      const response = await request(app.getHttpServer())
        .post('/api/lowcode/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createProjectDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(createProjectDto.name);
      expect(response.body.data.code).toBe(createProjectDto.code);
      expect(response.body.data.id).toBeDefined();
    });

    it('当项目代码重复时应该返回400错误', async () => {
      // 先创建一个项目
      await prismaService.project.create({
        data: {
          name: '已存在的项目',
          code: 'existing_project',
          createdBy: 'test-user'
        }
      });

      const createProjectDto = {
        name: '新项目',
        code: 'existing_project', // 重复的代码
        description: '测试重复代码'
      };

      const response = await request(app.getHttpServer())
        .post('/api/lowcode/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createProjectDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('项目代码已存在');
    });

    it('当缺少必填字段时应该返回400错误', async () => {
      const invalidDto = {
        name: 'API测试项目'
        // 缺少code字段
      };

      const response = await request(app.getHttpServer())
        .post('/api/lowcode/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('code');
    });
  });

  describe('GET /api/lowcode/projects', () => {
    beforeEach(async () => {
      // 创建测试数据
      await prismaService.project.createMany({
        data: [
          {
            name: '项目1',
            code: 'project_1',
            status: 'ACTIVE',
            createdBy: 'test-user'
          },
          {
            name: '项目2',
            code: 'project_2',
            status: 'INACTIVE',
            createdBy: 'test-user'
          }
        ]
      });
    });

    it('应该返回项目列表', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/lowcode/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('应该支持分页查询', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/lowcode/projects?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
      expect(response.body.data.total).toBe(2);
    });

    it('应该支持状态过滤', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/lowcode/projects?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].status).toBe('ACTIVE');
    });
  });

  describe('PUT /api/lowcode/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await prismaService.project.create({
        data: {
          name: '待更新项目',
          code: 'update_test',
          createdBy: 'test-user'
        }
      });
      projectId = project.id;
    });

    it('应该成功更新项目', async () => {
      const updateDto = {
        name: '更新后的项目名',
        description: '更新后的描述'
      };

      const response = await request(app.getHttpServer())
        .put(`/api/lowcode/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateDto.name);
      expect(response.body.data.description).toBe(updateDto.description);
    });

    it('当项目不存在时应该返回404错误', async () => {
      const updateDto = {
        name: '更新后的项目名'
      };

      await request(app.getHttpServer())
        .put('/api/lowcode/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(404);
    });
  });
});
```

### 2. 代码生成API测试

```typescript
// test/e2e/api/code-generation.e2e-spec.ts
describe('Code Generation API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let testProject: any;
  let testEntity: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    
    await app.init();
    
    // 获取认证token
    const authResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'test@example.com',
        password: 'test123'
      });
    
    authToken = authResponse.body.data.accessToken;
  });

  beforeEach(async () => {
    await prismaService.cleanDatabase();
    
    // 创建测试项目和实体
    testProject = await prismaService.project.create({
      data: {
        name: '代码生成测试项目',
        code: 'codegen_test',
        createdBy: 'test-user'
      }
    });

    testEntity = await prismaService.entity.create({
      data: {
        projectId: testProject.id,
        name: '用户',
        code: 'user',
        tableName: 'users',
        createdBy: 'test-user'
      }
    });

    await prismaService.field.createMany({
      data: [
        {
          entityId: testEntity.id,
          name: 'ID',
          code: 'id',
          type: 'UUID',
          primaryKey: true,
          createdBy: 'test-user'
        },
        {
          entityId: testEntity.id,
          name: '姓名',
          code: 'name',
          type: 'STRING',
          required: true,
          createdBy: 'test-user'
        }
      ]
    });
  });

  describe('POST /api/lowcode/code-generation/generate', () => {
    it('应该成功启动代码生成任务', async () => {
      const generateDto = {
        projectId: testProject.id,
        type: 'ENTITY',
        config: {
          entityIds: [testEntity.id],
          templates: ['ENTITY_MODEL', 'ENTITY_DTO'],
          outputPath: '/tmp/test-output'
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/lowcode/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.type).toBe('ENTITY');
    });

    it('当项目不存在时应该返回400错误', async () => {
      const generateDto = {
        projectId: 'non-existent-project',
        type: 'ENTITY',
        config: {
          entityIds: [testEntity.id],
          templates: ['ENTITY_MODEL']
        }
      };

      await request(app.getHttpServer())
        .post('/api/lowcode/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateDto)
        .expect(400);
    });
  });

  describe('GET /api/lowcode/code-generation/tasks/:id', () => {
    it('应该返回任务详情', async () => {
      // 先创建一个任务
      const task = await prismaService.codegenTask.create({
        data: {
          projectId: testProject.id,
          name: '测试任务',
          type: 'ENTITY',
          status: 'COMPLETED',
          progress: 100,
          createdBy: 'test-user'
        }
      });

      const response = await request(app.getHttpServer())
        .get(`/api/lowcode/code-generation/tasks/${task.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(task.id);
      expect(response.body.data.status).toBe('COMPLETED');
      expect(response.body.data.progress).toBe(100);
    });
  });
});
```

## 前端测试

### 1. Vue组件测试

```typescript
// frontend/src/components/__tests__/ProjectForm.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import ProjectForm from '../ProjectForm.vue';
import { useProjectStore } from '@/stores/project';

// Mock API
vi.mock('@/api/project', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn()
}));

describe('ProjectForm', () => {
  let wrapper: any;
  let pinia: any;

  beforeEach(() => {
    pinia = createPinia();
    wrapper = mount(ProjectForm, {
      global: {
        plugins: [pinia]
      },
      props: {
        mode: 'create'
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('应该正确渲染表单', () => {
    expect(wrapper.find('[data-testid="project-name-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-code-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-description-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="submit-button"]').exists()).toBe(true);
  });

  it('应该验证必填字段', async () => {
    // 点击提交按钮而不填写任何内容
    await wrapper.find('[data-testid="submit-button"]').trigger('click');

    // 检查验证错误消息
    expect(wrapper.find('.error-message').text()).toContain('项目名称不能为空');
  });

  it('应该在创建模式下调用创建API', async () => {
    const projectStore = useProjectStore();
    const createSpy = vi.spyOn(projectStore, 'createProject').mockResolvedValue({});

    // 填写表单
    await wrapper.find('[data-testid="project-name-input"]').setValue('测试项目');
    await wrapper.find('[data-testid="project-code-input"]').setValue('test_project');
    await wrapper.find('[data-testid="project-description-input"]').setValue('测试描述');

    // 提交表单
    await wrapper.find('[data-testid="submit-button"]').trigger('click');

    expect(createSpy).toHaveBeenCalledWith({
      name: '测试项目',
      code: 'test_project',
      description: '测试描述'
    });
  });

  it('应该在编辑模式下预填充数据', async () => {
    const existingProject = {
      id: '1',
      name: '现有项目',
      code: 'existing_project',
      description: '现有描述'
    };

    wrapper = mount(ProjectForm, {
      global: {
        plugins: [pinia]
      },
      props: {
        mode: 'edit',
        project: existingProject
      }
    });

    expect(wrapper.find('[data-testid="project-name-input"]').element.value).toBe('现有项目');
    expect(wrapper.find('[data-testid="project-code-input"]').element.value).toBe('existing_project');
    expect(wrapper.find('[data-testid="project-description-input"]').element.value).toBe('现有描述');
  });
});
```

### 2. AMIS页面测试

```typescript
// frontend/src/pages/__tests__/ProjectManagement.spec.ts
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import ProjectManagement from '../ProjectManagement.vue';
import { useProjectStore } from '@/stores/project';

// Mock AMIS
vi.mock('@/components/AmisRenderer', () => ({
  default: {
    name: 'AmisRenderer',
    template: '<div data-testid="amis-renderer">{{ schema }}</div>',
    props: ['schema']
  }
}));

describe('ProjectManagement', () => {
  let wrapper: any;
  let pinia: any;
  let projectStore: any;

  beforeEach(() => {
    pinia = createPinia();
    projectStore = useProjectStore();
    
    // Mock store methods
    vi.spyOn(projectStore, 'fetchProjects').mockResolvedValue([]);
    vi.spyOn(projectStore, 'deleteProject').mockResolvedValue({});
    
    wrapper = mount(ProjectManagement, {
      global: {
        plugins: [pinia]
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it('应该正确渲染AMIS页面', () => {
    expect(wrapper.find('[data-testid="amis-renderer"]').exists()).toBe(true);
  });

  it('应该在组件挂载时获取项目列表', () => {
    expect(projectStore.fetchProjects).toHaveBeenCalled();
  });

  it('应该生成正确的AMIS Schema', () => {
    const schema = wrapper.vm.amisSchema;
    
    expect(schema.type).toBe('page');
    expect(schema.body.type).toBe('crud');
    expect(schema.body.api).toBe('/api/lowcode/projects');
    expect(schema.body.columns).toHaveLength(5); // id, name, code, status, actions
  });

  it('应该处理删除操作', async () => {
    const deleteHandler = wrapper.vm.handleDelete;
    
    await deleteHandler({ id: 'test-project-1' });
    
    expect(projectStore.deleteProject).toHaveBeenCalledWith('test-project-1');
  });
});
```

## 国际化测试

### 1. 多语言资源测试

```typescript
// test/i18n/resources.spec.ts
import { describe, it, expect } from 'vitest';
import zhCN from '@/locales/zh-CN.json';
import enUS from '@/locales/en-US.json';

describe('I18n Resources', () => {
  it('中英文资源键应该保持一致', () => {
    const zhKeys = extractKeys(zhCN);
    const enKeys = extractKeys(enUS);
    
    // 检查中文有但英文没有的键
    const missingInEn = zhKeys.filter(key => !enKeys.includes(key));
    expect(missingInEn).toHaveLength(0);
    
    // 检查英文有但中文没有的键
    const missingInZh = enKeys.filter(key => !zhKeys.includes(key));
    expect(missingInZh).toHaveLength(0);
  });

  it('所有翻译值都不应该为空', () => {
    const zhValues = extractValues(zhCN);
    const enValues = extractValues(enUS);
    
    const emptyZhValues = zhValues.filter(value => !value || value.trim() === '');
    expect(emptyZhValues).toHaveLength(0);
    
    const emptyEnValues = enValues.filter(value => !value || value.trim() === '');
    expect(emptyEnValues).toHaveLength(0);
  });

  it('应该包含所有必需的业务术语', () => {
    const requiredKeys = [
      'project.name',
      'project.code',
      'project.description',
      'entity.name',
      'entity.tableName',
      'field.name',
      'field.type',
      'relation.type',
      'common.create',
      'common.edit',
      'common.delete',
      'common.save',
      'common.cancel'
    ];
    
    const zhKeys = extractKeys(zhCN);
    const missingKeys = requiredKeys.filter(key => !zhKeys.includes(key));
    
    expect(missingKeys).toHaveLength(0);
  });
});

function extractKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(extractKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function extractValues(obj: any): string[] {
  let values: string[] = [];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      values = values.concat(extractValues(obj[key]));
    } else {
      values.push(obj[key]);
    }
  }
  
  return values;
}
```

### 2. 国际化组件测试

```typescript
// frontend/src/components/__tests__/I18nProjectForm.spec.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ProjectForm from '../ProjectForm.vue';
import zhCN from '@/locales/zh-CN.json';
import enUS from '@/locales/en-US.json';

describe('ProjectForm I18n', () => {
  let i18n: any;

  beforeEach(() => {
    i18n = createI18n({
      locale: 'zh-CN',
      fallbackLocale: 'en-US',
      messages: {
        'zh-CN': zhCN,
        'en-US': enUS
      }
    });
  });

  it('应该在中文环境下显示中文标签', () => {
    i18n.global.locale = 'zh-CN';
    
    const wrapper = mount(ProjectForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'create'
      }
    });

    expect(wrapper.find('label[for="name"]').text()).toBe('项目名称');
    expect(wrapper.find('label[for="code"]').text()).toBe('项目代码');
    expect(wrapper.find('label[for="description"]').text()).toBe('项目描述');
    expect(wrapper.find('[data-testid="submit-button"]').text()).toBe('创建');
  });

  it('应该在英文环境下显示英文标签', () => {
    i18n.global.locale = 'en-US';
    
    const wrapper = mount(ProjectForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'create'
      }
    });

    expect(wrapper.find('label[for="name"]').text()).toBe('Project Name');
    expect(wrapper.find('label[for="code"]').text()).toBe('Project Code');
    expect(wrapper.find('label[for="description"]').text()).toBe('Description');
    expect(wrapper.find('[data-testid="submit-button"]').text()).toBe('Create');
  });

  it('应该在语言切换时更新界面文本', async () => {
    const wrapper = mount(ProjectForm, {
      global: {
        plugins: [i18n]
      },
      props: {
        mode: 'create'
      }
    });

    // 初始为中文
    expect(wrapper.find('label[for="name"]').text()).toBe('项目名称');

    // 切换到英文
    i18n.global.locale = 'en-US';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('label[for="name"]').text()).toBe('Project Name');
  });
});
```

### 3. 后端国际化测试

```typescript
// test/unit/i18n/i18n.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from '@/shared/i18n/i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [I18nService]
    }).compile();

    service = module.get<I18nService>(I18nService);
  });

  describe('translate', () => {
    it('应该返回中文翻译', () => {
      const result = service.translate('project.name', 'zh-CN');
      expect(result).toBe('项目名称');
    });

    it('应该返回英文翻译', () => {
      const result = service.translate('project.name', 'en-US');
      expect(result).toBe('Project Name');
    });

    it('当翻译不存在时应该返回键名', () => {
      const result = service.translate('non.existent.key', 'zh-CN');
      expect(result).toBe('non.existent.key');
    });

    it('应该支持参数插值', () => {
      const result = service.translate('validation.minLength', 'zh-CN', { min: 5 });
      expect(result).toBe('最少需要5个字符');
    });
  });

  describe('getAvailableLocales', () => {
    it('应该返回支持的语言列表', () => {
      const locales = service.getAvailableLocales();
      expect(locales).toContain('zh-CN');
      expect(locales).toContain('en-US');
    });
  });
});
```

## 性能测试

### 1. API性能测试

```typescript
// test/performance/api.performance.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/shared/prisma/prisma.service';

describe('API Performance Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = app.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Project API Performance', () => {
    it('获取项目列表应该在200ms内完成', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/lowcode/projects')
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(200);
    });

    it('创建项目应该在500ms内完成', async () => {
      const createDto = {
        name: '性能测试项目',
        code: 'performance_test',
        description: '用于性能测试'
      };
      
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/api/lowcode/projects')
        .send(createDto)
        .expect(201);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Concurrent Request Performance', () => {
    it('应该能处理100个并发请求', async () => {
      const concurrentRequests = 100;
      const requests = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/api/lowcode/projects')
            .expect(200)
        );
      }
      
      const startTime = Date.now();
      await Promise.all(requests);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      const avgResponseTime = duration / concurrentRequests;
      
      expect(avgResponseTime).toBeLessThan(100); // 平均响应时间小于100ms
    });
  });
});
```

### 2. 代码生成性能测试

```typescript
// test/performance/code-generation.performance.spec.ts
describe('Code Generation Performance', () => {
  let codeGenerationService: CodeGenerationService;
  let templateService: TemplateService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [CodeGenerationService, TemplateService]
    }).compile();

    codeGenerationService = module.get<CodeGenerationService>(CodeGenerationService);
    templateService = module.get<TemplateService>(TemplateService);
  });

  it('生成单个实体代码应该在5秒内完成', async () => {
    const entity = TestDataFactory.createEntity('project-1');
    const fields = [
      TestDataFactory.createField(entity.id, { name: '字段1', code: 'field1' }),
      TestDataFactory.createField(entity.id, { name: '字段2', code: 'field2' })
    ];
    
    const startTime = Date.now();
    
    await codeGenerationService.generateEntityCode(entity, fields);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(5000);
  });

  it('生成包含10个实体的项目应该在30秒内完成', async () => {
    const project = TestDataFactory.createProject();
    const entities = [];
    
    for (let i = 0; i < 10; i++) {
      entities.push(TestDataFactory.createEntity(project.id, {
        name: `实体${i}`,
        code: `entity_${i}`
      }));
    }
    
    const startTime = Date.now();
    
    await codeGenerationService.generateProjectCode(project, entities);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(30000);
  });
});
```

## 测试执行策略

### 1. 测试分层执行

```bash
# 单元测试 - 快速反馈
npm run test:unit

# 集成测试 - 中等速度
npm run test:integration

# 端到端测试 - 较慢但全面
npm run test:e2e

# 性能测试 - 专门执行
npm run test:performance

# 全量测试
npm run test:all
```

### 2. CI/CD集成

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: docker-compose -f docker-compose.test.yml up -d
      - run: npm run test:e2e
      - run: docker-compose -f docker-compose.test.yml down
```

### 3. 测试覆盖率要求

```json
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/lowcode/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts'
  ]
};
```

## 测试数据管理

### 1. 测试数据工厂

```typescript
// test/factories/index.ts
export class TestDataManager {
  private static instance: TestDataManager;
  private createdData: Map<string, any[]> = new Map();

  static getInstance(): TestDataManager {
    if (!TestDataManager.instance) {
      TestDataManager.instance = new TestDataManager();
    }
    return TestDataManager.instance;
  }

  async createTestProject(overrides?: Partial<Project>): Promise<Project> {
    const project = await prisma.project.create({
      data: {
        name: '测试项目',
        code: `test_project_${Date.now()}`,
        description: '用于测试的项目',
        createdBy: 'test-user',
        ...overrides
      }
    });

    this.trackCreatedData('projects', project);
    return project;
  }

  async createTestEntity(projectId: string, overrides?: Partial<Entity>): Promise<Entity> {
    const entity = await prisma.entity.create({
      data: {
        projectId,
        name: '测试实体',
        code: `test_entity_${Date.now()}`,
        tableName: `test_table_${Date.now()}`,
        createdBy: 'test-user',
        ...overrides
      }
    });

    this.trackCreatedData('entities', entity);
    return entity;
  }

  private trackCreatedData(type: string, data: any): void {
    if (!this.createdData.has(type)) {
      this.createdData.set(type, []);
    }
    this.createdData.get(type)!.push(data);
  }

  async cleanup(): Promise<void> {
    // 按依赖关系逆序清理
    const cleanupOrder = ['fields', 'entities', 'projects'];
    
    for (const type of cleanupOrder) {
      const items = this.createdData.get(type) || [];
      for (const item of items) {
        try {
          await this.deleteByType(type, item.id);
        } catch (error) {
          console.warn(`Failed to cleanup ${type} ${item.id}:`, error);
        }
      }
    }
    
    this.createdData.clear();
  }

  private async deleteByType(type: string, id: string): Promise<void> {
    switch (type) {
      case 'projects':
        await prisma.project.delete({ where: { id } });
        break;
      case 'entities':
        await prisma.entity.delete({ where: { id } });
        break;
      case 'fields':
        await prisma.field.delete({ where: { id } });
        break;
    }
  }
}
```

### 2. 测试环境隔离

```typescript
// test/setup/test-environment.ts
export class TestEnvironment {
  private static testDbName: string;

  static async setup(): Promise<void> {
    // 为每次测试运行创建独立的数据库
    this.testDbName = `test_db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建测试数据库
    await this.createTestDatabase();
    
    // 运行迁移
    await this.runMigrations();
    
    // 设置环境变量
    process.env.DATABASE_URL = `postgresql://test_user:test_password@localhost:5433/${this.testDbName}`;
  }

  static async teardown(): Promise<void> {
    // 清理测试数据库
    await this.dropTestDatabase();
  }

  private static async createTestDatabase(): Promise<void> {
    const { execSync } = require('child_process');
    execSync(`createdb -h localhost -p 5433 -U test_user ${this.testDbName}`);
  }

  private static async runMigrations(): Promise<void> {
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: `postgresql://test_user:test_password@localhost:5433/${this.testDbName}`
      }
    });
  }

  private static async dropTestDatabase(): Promise<void> {
    const { execSync } = require('child_process');
    try {
      execSync(`dropdb -h localhost -p 5433 -U test_user ${this.testDbName}`);
    } catch (error) {
      console.warn('Failed to drop test database:', error);
    }
  }
}
```

## 测试报告和监控

### 1. 测试报告生成

```typescript
// test/reporters/custom-reporter.ts
export class CustomTestReporter {
  private results: TestResult[] = [];
  private startTime: number;
  private endTime: number;

  onRunStart(): void {
    this.startTime = Date.now();
    console.log('🚀 开始执行测试套件...');
  }

  onTestResult(test: Test, testResult: TestResult): void {
    this.results.push(testResult);
    
    if (testResult.numFailingTests > 0) {
      console.log(`❌ ${test.path} - ${testResult.numFailingTests} 个测试失败`);
    } else {
      console.log(`✅ ${test.path} - 所有测试通过`);
    }
  }

  onRunComplete(): void {
    this.endTime = Date.now();
    this.generateReport();
  }

  private generateReport(): void {
    const totalTests = this.results.reduce((sum, result) => sum + result.numTotalTests, 0);
    const failedTests = this.results.reduce((sum, result) => sum + result.numFailingTests, 0);
    const passedTests = totalTests - failedTests;
    const duration = this.endTime - this.startTime;

    const report = {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      },
      details: this.results.map(result => ({
        file: result.testFilePath,
        tests: result.numTotalTests,
        failures: result.numFailingTests,
        duration: `${result.perfStats.end - result.perfStats.start}ms`
      }))
    };

    // 保存报告到文件
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'test-reports', `test-report-${Date.now()}.json`);
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 测试报告已生成: ${reportPath}`);
    console.log(`\n📈 测试统计:`);
    console.log(`   总计: ${totalTests}`);
    console.log(`   通过: ${passedTests}`);
    console.log(`   失败: ${failedTests}`);
    console.log(`   耗时: ${duration}ms`);
  }
}
```

### 2. 测试监控和告警

```typescript
// test/monitoring/test-monitor.ts
export class TestMonitor {
  private static readonly PERFORMANCE_THRESHOLDS = {
    UNIT_TEST_MAX_DURATION: 100, // ms
    INTEGRATION_TEST_MAX_DURATION: 5000, // ms
    E2E_TEST_MAX_DURATION: 30000, // ms
    API_RESPONSE_MAX_DURATION: 1000 // ms
  };

  static checkPerformance(testType: string, duration: number): void {
    let threshold: number;
    
    switch (testType) {
      case 'unit':
        threshold = this.PERFORMANCE_THRESHOLDS.UNIT_TEST_MAX_DURATION;
        break;
      case 'integration':
        threshold = this.PERFORMANCE_THRESHOLDS.INTEGRATION_TEST_MAX_DURATION;
        break;
      case 'e2e':
        threshold = this.PERFORMANCE_THRESHOLDS.E2E_TEST_MAX_DURATION;
        break;
      default:
        return;
    }

    if (duration > threshold) {
      console.warn(`⚠️  性能警告: ${testType}测试耗时${duration}ms，超过阈值${threshold}ms`);
      
      // 发送告警通知
      this.sendAlert({
        type: 'PERFORMANCE_WARNING',
        testType,
        duration,
        threshold,
        timestamp: new Date().toISOString()
      });
    }
  }

  static checkCoverage(coverage: CoverageReport): void {
    const { lines, functions, branches, statements } = coverage.total;
    const minCoverage = 80;

    const lowCoverageAreas = [];
    if (lines.pct < minCoverage) lowCoverageAreas.push(`行覆盖率: ${lines.pct}%`);
    if (functions.pct < minCoverage) lowCoverageAreas.push(`函数覆盖率: ${functions.pct}%`);
    if (branches.pct < minCoverage) lowCoverageAreas.push(`分支覆盖率: ${branches.pct}%`);
    if (statements.pct < minCoverage) lowCoverageAreas.push(`语句覆盖率: ${statements.pct}%`);

    if (lowCoverageAreas.length > 0) {
      console.warn(`⚠️  覆盖率警告: ${lowCoverageAreas.join(', ')} 低于${minCoverage}%`);
      
      this.sendAlert({
        type: 'COVERAGE_WARNING',
        areas: lowCoverageAreas,
        minCoverage,
        timestamp: new Date().toISOString()
      });
    }
  }

  private static sendAlert(alert: any): void {
    // 这里可以集成钉钉、企业微信等告警系统
    console.log('📢 发送告警:', JSON.stringify(alert, null, 2));
  }
}
```

## 测试最佳实践

### 1. 测试命名规范

```typescript
// ✅ 好的测试命名
describe('ProjectService', () => {
  describe('create', () => {
    it('应该成功创建项目当所有必填字段都提供时', async () => {
      // 测试实现
    });

    it('应该抛出ValidationException当项目名称为空时', async () => {
      // 测试实现
    });

    it('应该抛出BusinessException当项目代码已存在时', async () => {
      // 测试实现
    });
  });
});

// ❌ 不好的测试命名
describe('ProjectService', () => {
  it('test create', () => {
    // 测试实现
  });

  it('create project', () => {
    // 测试实现
  });
});
```

### 2. 测试数据准备

```typescript
// ✅ 使用工厂模式
const project = TestDataFactory.createProject({
  name: '特定测试项目',
  code: 'specific_test'
});

// ✅ 明确的测试数据
const createProjectDto: CreateProjectDto = {
  name: '测试项目',
  code: 'test_project',
  description: '用于测试的项目描述'
};

// ❌ 魔法数字和不明确的数据
const project = {
  name: 'test',
  code: 'test123',
  id: '1'
};
```

### 3. 断言最佳实践

```typescript
// ✅ 具体的断言
expect(response.body.data.name).toBe('测试项目');
expect(response.body.data.status).toBe('ACTIVE');
expect(response.body.data.createdAt).toBeDefined();

// ✅ 结构化断言
expect(response.body).toMatchObject({
  success: true,
  data: {
    name: '测试项目',
    code: 'test_project',
    status: 'ACTIVE'
  }
});

// ❌ 模糊的断言
expect(response.body).toBeTruthy();
expect(result).toBeDefined();
```

## 测试执行计划

### 阶段一：基础测试框架搭建 (1周)
- [ ] 配置Jest测试环境
- [ ] 设置测试数据库
- [ ] 创建测试工具类和工厂
- [ ] 编写基础单元测试示例

### 阶段二：核心模块测试 (2周)
- [ ] 项目管理模块测试
- [ ] 实体管理模块测试
- [ ] 字段管理模块测试
- [ ] 关系管理模块测试

### 阶段三：高级功能测试 (2周)
- [ ] 查询管理模块测试
- [ ] API配置模块测试
- [ ] 模板管理模块测试
- [ ] 代码生成器测试

### 阶段四：集成和端到端测试 (1周)
- [ ] 服务间集成测试
- [ ] 完整业务流程测试
- [ ] 性能测试
- [ ] 前端组件测试

### 阶段五：国际化和优化 (1周)
- [ ] 多语言资源测试
- [ ] 国际化组件测试
- [ ] 测试报告优化
- [ ] CI/CD集成完善

## 测试维护策略

### 1. 定期测试审查
- 每月审查测试覆盖率报告
- 识别和补充缺失的测试用例
- 清理过时或重复的测试
- 优化慢速测试

### 2. 测试数据管理
- 定期清理测试数据
- 更新测试数据以反映业务变化
- 维护测试数据的一致性
- 确保测试环境的稳定性

### 3. 持续改进
- 收集测试执行反馈
- 优化测试执行速度
- 改进测试报告质量
- 提升测试自动化程度

---

通过执行这个全面的测试计划，我们将确保低代码平台的质量、稳定性和可靠性，为用户提供优秀的产品体验。
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: