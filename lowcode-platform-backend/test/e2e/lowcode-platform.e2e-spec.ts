import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { MetadataAggregatorService } from '../../src/lib/bounded-contexts/metadata/application/services/metadata-aggregator.service';
import { IntelligentCodeGeneratorService } from '../../src/lib/bounded-contexts/code-generation/application/services/intelligent-code-generator.service';

describe('Lowcode Platform Comprehensive Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let metadataService: MetadataAggregatorService;
  let codeGeneratorService: IntelligentCodeGeneratorService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testEntityId: string;
  let testTemplateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    metadataService = moduleFixture.get<MetadataAggregatorService>(MetadataAggregatorService);
    codeGeneratorService = moduleFixture.get<IntelligentCodeGeneratorService>(IntelligentCodeGeneratorService);

    await app.init();

    // Create test user and generate auth token
    const testUser = {
      uid: 'test-user-id',
      username: 'testuser',
      domain: 'test-domain',
    };
    testUserId = testUser.uid;

    authToken = jwtService.sign(testUser);

    // Set up test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test project
    const project = await prisma.project.create({
      data: {
        id: 'test-project-e2e',
        name: 'E2E Test Project',
        code: 'e2e-test-project',
        description: 'Project for E2E testing',
        status: 'ACTIVE',
        config: {},
        createdBy: testUserId,
      },
    });
    testProjectId = project.id;

    // Create test entity
    const entity = await prisma.entity.create({
      data: {
        id: 'test-entity-e2e',
        projectId: testProjectId,
        name: 'TestUser',
        code: 'TestUser',
        tableName: 'test_users',
        description: 'Test user entity',
        category: 'business',
        status: 'DRAFT',
        createdBy: testUserId,
      },
    });
    testEntityId = entity.id;

    // Create test fields
    await prisma.field.createMany({
      data: [
        {
          id: 'test-field-name',
          entityId: testEntityId,
          name: 'Name',
          code: 'name',
          type: 'STRING',
          length: 100,
          nullable: false,
          primaryKey: false,
          uniqueConstraint: false,
          sortOrder: 1,
          createdBy: testUserId,
        },
        {
          id: 'test-field-email',
          entityId: testEntityId,
          name: 'Email',
          code: 'email',
          type: 'STRING',
          length: 255,
          nullable: false,
          primaryKey: false,
          uniqueConstraint: true,
          sortOrder: 2,
          createdBy: testUserId,
        },
      ],
    });

    // Create test template
    const template = await prisma.codeTemplate.create({
      data: {
        id: 'test-template-e2e',
        projectId: testProjectId,
        name: 'E2E Test Template',
        code: 'e2e-test-template',
        description: 'Template for E2E testing',
        type: 'ENTITY',
        language: 'TYPESCRIPT',
        framework: 'NESTJS',
        category: 'service',
        content: `
export class {{pascalCase entityName}}Service {
  constructor() {}

  async findAll(): Promise<{{pascalCase entityName}}[]> {
    // Implementation here
    return [];
  }

  async findById(id: string): Promise<{{pascalCase entityName}} | null> {
    // Implementation here
    return null;
  }
}
        `.trim(),
        variables: [],
        tags: ['test'],
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testTemplateId = template.id;
  }

  async function cleanupTestData() {
    try {
      await prisma.field.deleteMany({ where: { entityId: testEntityId } });
      await prisma.entity.delete({ where: { id: testEntityId } });
      await prisma.codeTemplate.delete({ where: { id: testTemplateId } });
      await prisma.project.delete({ where: { id: testProjectId } });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  describe('Authentication', () => {
    it('should reject requests without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/paginated?current=1&size=5')
        .expect(401);
    });

    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/paginated?current=1&size=5')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should accept requests with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/paginated?current=1&size=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Projects API', () => {
    it('/api/v1/projects (GET) - should return paginated projects with auth', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/paginated?current=1&size=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('current');
          expect(res.body).toHaveProperty('size');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/api/v1/projects/:id (GET) - should return project by id with auth', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/projects/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', testProjectId);
          expect(res.body.data).toHaveProperty('name', 'E2E Test Project');
          expect(res.body.data).toHaveProperty('description');
          expect(res.body.data).toHaveProperty('status', 'ACTIVE');
        });
    });

    it('/api/v1/projects (POST) - should create new project with auth', () => {
      const newProject = {
        name: 'New Test Project',
        code: 'new-test-project',
        description: 'A new test project',
        config: { framework: 'nestjs' },
      };

      return request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('name', newProject.name);
          expect(res.body.data).toHaveProperty('code', newProject.code);
          expect(res.body.data).toHaveProperty('status', 'ACTIVE');
        });
    });
  });

  describe('Entities API', () => {
    it('/api/v1/entities/project/:projectId/paginated (GET) - should return paginated entities for project', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/entities/project/${testProjectId}/paginated?current=1&size=5`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.total).toBeGreaterThanOrEqual(1);
        });
    });

    it('/api/v1/entities/:id (GET) - should return entity by id with fields', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/entities/${testEntityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', testEntityId);
          expect(res.body.data).toHaveProperty('name', 'TestUser');
          expect(res.body.data).toHaveProperty('code', 'TestUser');
          expect(res.body.data).toHaveProperty('tableName', 'test_users');
          expect(res.body.data).toHaveProperty('fields');
          expect(Array.isArray(res.body.data.fields)).toBe(true);
        });
    });

    it('/api/v1/entities (POST) - should create new entity', () => {
      const newEntity = {
        projectId: testProjectId,
        name: 'TestProduct',
        code: 'TestProduct',
        tableName: 'test_products',
        description: 'Test product entity',
        category: 'business',
      };

      return request(app.getHttpServer())
        .post('/api/v1/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEntity)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('name', newEntity.name);
          expect(res.body.data).toHaveProperty('code', newEntity.code);
          expect(res.body.data).toHaveProperty('status', 'DRAFT');
        });
    });
  });

  describe('Code Templates API', () => {
    it('/api/v1/templates/project/:projectId/paginated (GET) - should return paginated templates for project', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/templates/project/${testProjectId}/paginated?current=1&size=5`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.total).toBeGreaterThanOrEqual(1);
        });
    });

    it('/api/v1/templates/:id (GET) - should return template by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', testTemplateId);
          expect(res.body.data).toHaveProperty('name', 'E2E Test Template');
          expect(res.body.data).toHaveProperty('content');
          expect(res.body.data).toHaveProperty('language', 'TYPESCRIPT');
          expect(res.body.data).toHaveProperty('framework', 'NESTJS');
        });
    });

    it('/api/v1/templates (POST) - should create new template', () => {
      const newTemplate = {
        projectId: testProjectId,
        name: 'New Test Template',
        code: 'new-test-template',
        description: 'A new test template',
        type: 'ENTITY',
        language: 'TYPESCRIPT',
        framework: 'NESTJS',
        category: 'controller',
        content: `
export class {{pascalCase entityName}}Controller {
  constructor() {}

  @Get()
  findAll() {
    return [];
  }
}
        `.trim(),
        variables: [],
        tags: ['test', 'controller'],
        version: '1.0.0',
      };

      return request(app.getHttpServer())
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newTemplate)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('name', newTemplate.name);
          expect(res.body.data).toHaveProperty('code', newTemplate.code);
          expect(res.body.data).toHaveProperty('status', 'ACTIVE');
        });
    });
  });

  describe('Code Generation API', () => {
    it('/api/v1/code-generation/generate (POST) - should generate code successfully with enhanced features', () => {
      const generateRequest = {
        projectId: testProjectId,
        templateIds: [testTemplateId],
        entityIds: [testEntityId],
        variables: {
          entityName: 'TestUser',
          tableName: 'test_users',
        },
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs'
        }
      };

      return request(app.getHttpServer())
        .post('/api/v1/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('generatedFiles');
          expect(Array.isArray(res.body.generatedFiles)).toBe(true);
          expect(res.body.generatedFiles.length).toBeGreaterThan(0);

          // Verify generated file structure
          const generatedFile = res.body.generatedFiles[0];
          expect(generatedFile).toHaveProperty('filename');
          expect(generatedFile).toHaveProperty('path');
          expect(generatedFile).toHaveProperty('content');
          expect(generatedFile).toHaveProperty('language', 'TYPESCRIPT');
          expect(generatedFile).toHaveProperty('size');
          expect(generatedFile.size).toBeGreaterThan(0);
        });
    });

    it('/api/v1/code-generation/validate (POST) - should validate generation request with enhanced validation', () => {
      const validateRequest = {
        projectId: testProjectId,
        templateIds: [testTemplateId],
        entityIds: [testEntityId],
        variables: {
          entityName: 'TestUser',
        }
      };

      return request(app.getHttpServer())
        .post('/api/v1/code-generation/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validateRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('valid');
          expect(res.body).toHaveProperty('issues');
          expect(Array.isArray(res.body.issues)).toBe(true);

          if (res.body.valid) {
            expect(res.body.issues.length).toBe(0);
          }
        });
    });

    it('/api/v1/code-generation/validate (POST) - should detect validation errors', () => {
      const invalidRequest = {
        projectId: 'non-existent-project',
        templateIds: ['non-existent-template'],
        entityIds: ['non-existent-entity'],
        variables: {}
      };

      return request(app.getHttpServer())
        .post('/api/v1/code-generation/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('valid', false);
          expect(res.body).toHaveProperty('issues');
          expect(Array.isArray(res.body.issues)).toBe(true);
          expect(res.body.issues.length).toBeGreaterThan(0);
        });
    });

    it('/api/v1/code-generation/history/project/:projectId (GET) - should return generation history', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/code-generation/history/project/${testProjectId}?current=1&size=10`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Enhanced Metadata Service Integration', () => {
    it('should get project metadata with default fields', async () => {
      const metadata = await metadataService.getProjectMetadata(testProjectId);

      expect(metadata).toHaveProperty('project');
      expect(metadata).toHaveProperty('entities');
      expect(metadata).toHaveProperty('relationships');

      expect(metadata.project.id).toBe(testProjectId);
      expect(metadata.entities.length).toBeGreaterThan(0);

      // Check that entities have default fields
      const testEntity = metadata.entities.find(e => e.id === testEntityId);
      expect(testEntity).toBeDefined();
      expect(testEntity.fields).toBeDefined();

      // Verify default fields are present
      const defaultFieldCodes = ['id', 'createdAt', 'updatedAt', 'tenantId', 'createdBy', 'updatedBy'];
      defaultFieldCodes.forEach(fieldCode => {
        const field = testEntity.fields.find(f => f.code === fieldCode);
        expect(field).toBeDefined();
      });

      // Verify custom fields are also present
      const nameField = testEntity.fields.find(f => f.code === 'name');
      const emailField = testEntity.fields.find(f => f.code === 'email');
      expect(nameField).toBeDefined();
      expect(emailField).toBeDefined();
      expect(emailField.isUnique).toBe(true);
    });

    it('should validate entity structure', async () => {
      const validation = await metadataService.validateEntityStructure(testEntityId);

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);

      if (!validation.isValid) {
        expect(validation.errors.length).toBeGreaterThan(0);
      }
    });

    it('should cache metadata for performance', async () => {
      const startTime = Date.now();
      await metadataService.getProjectMetadata(testProjectId, true);
      const firstCallTime = Date.now() - startTime;

      const cachedStartTime = Date.now();
      await metadataService.getProjectMetadata(testProjectId, true);
      const cachedCallTime = Date.now() - cachedStartTime;

      // Cached call should be significantly faster
      expect(cachedCallTime).toBeLessThan(firstCallTime);
    });

    it('should invalidate cache when needed', async () => {
      // Get metadata to populate cache
      await metadataService.getProjectMetadata(testProjectId, true);

      // Invalidate cache
      metadataService.invalidateProjectCache(testProjectId);

      // Next call should not use cache
      const metadata = await metadataService.getProjectMetadata(testProjectId, false);
      expect(metadata).toBeDefined();
    });
  });

  describe('Enhanced Code Generation Service Integration', () => {
    it('should validate template variables', async () => {
      const validation = await codeGeneratorService.validateTemplateVariables(testTemplateId, {
        entityName: 'TestUser',
        tableName: 'test_users',
      });

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    it('should generate code with enhanced field categorization', async () => {
      const generationRequest = {
        projectId: testProjectId,
        templateIds: [testTemplateId],
        entityIds: [testEntityId],
        variables: {
          entityName: 'TestUser',
          tableName: 'test_users',
        },
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs'
        }
      };

      const generatedFiles = await codeGeneratorService.generateFiles(generationRequest);

      expect(Array.isArray(generatedFiles)).toBe(true);
      expect(generatedFiles.length).toBeGreaterThan(0);

      const generatedFile = generatedFiles[0];
      expect(generatedFile).toHaveProperty('filename');
      expect(generatedFile).toHaveProperty('path');
      expect(generatedFile).toHaveProperty('content');
      expect(generatedFile).toHaveProperty('language');
      expect(generatedFile).toHaveProperty('size');

      // Verify that the generated content includes the entity name
      expect(generatedFile.content).toContain('TestUser');
    });
  });

  describe('Fields API', () => {
    it('/api/v1/fields/entity/:entityId (GET) - should return fields for entity', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/fields/entity/${testEntityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);

          // Verify field structure
          const field = res.body.data[0];
          expect(field).toHaveProperty('id');
          expect(field).toHaveProperty('name');
          expect(field).toHaveProperty('code');
          expect(field).toHaveProperty('type');
          expect(field).toHaveProperty('nullable');
        });
    });

    it('/api/v1/fields (POST) - should create new field', () => {
      const newField = {
        entityId: testEntityId,
        name: 'Age',
        code: 'age',
        type: 'INTEGER',
        nullable: true,
        primaryKey: false,
        uniqueConstraint: false,
        sortOrder: 10,
      };

      return request(app.getHttpServer())
        .post('/api/v1/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newField)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('name', newField.name);
          expect(res.body.data).toHaveProperty('code', newField.code);
          expect(res.body.data).toHaveProperty('type', newField.type);
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent project gracefully', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/non-existent-project')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle non-existent entity gracefully', () => {
      return request(app.getHttpServer())
        .get('/api/v1/entities/non-existent-entity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle invalid code generation request', () => {
      const invalidRequest = {
        projectId: 'non-existent-project',
        templateIds: ['non-existent-template'],
        entityIds: ['non-existent-entity'],
        variables: {},
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs'
        }
      };

      return request(app.getHttpServer())
        .post('/api/v1/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRequest)
        .expect(400);
    });
  });
});
