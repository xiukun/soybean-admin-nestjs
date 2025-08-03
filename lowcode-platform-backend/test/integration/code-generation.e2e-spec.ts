import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

describe('Code Generation (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let projectId: string;
  let entityId: string;
  let templateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(async () => {
    // Clean up database
    await prisma.field.deleteMany();
    await prisma.relationship.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.template.deleteMany();
    await prisma.project.deleteMany();

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        code: 'test-project',
        description: 'Test project for e2e testing',
        framework: 'nestjs',
        architecture: 'ddd',
        language: 'typescript',
        database: 'postgresql',
      },
    });
    projectId = project.id;

    // Create test entity
    const entity = await prisma.entity.create({
      data: {
        projectId,
        name: 'User',
        code: 'User',
        tableName: 'users',
        description: 'User entity for testing',
      },
    });
    entityId = entity.id;

    // Create test fields
    await prisma.field.createMany({
      data: [
        {
          entityId,
          name: 'Email',
          code: 'email',
          type: 'STRING',
          nullable: false,
          isUnique: true,
          length: 255,
          sortOrder: 1,
        },
        {
          entityId,
          name: 'First Name',
          code: 'firstName',
          type: 'STRING',
          nullable: false,
          length: 100,
          sortOrder: 2,
        },
        {
          entityId,
          name: 'Age',
          code: 'age',
          type: 'INTEGER',
          nullable: true,
          sortOrder: 3,
        },
      ],
    });

    // Create test template
    const template = await prisma.template.create({
      data: {
        projectId,
        name: 'NestJS Entity',
        content: `// Prisma model for {{entityName}}
model {{entityName}} {
  id String @id @default(cuid())

{{#each fields}}
{{#unless isPrimaryKey}}
  {{code}} {{mapTypeToPrisma type}}{{#if nullable}}?{{/if}}{{#if isUnique}} @unique{{/if}} @map("{{snakeCase code}}"){{#if description}} // {{description}}{{/if}}
{{/unless}}
{{/each}}
}`,
        variables: JSON.stringify([
          { name: 'entityName', type: 'string', required: true },
          { name: 'tableName', type: 'string', required: true },
          { name: 'fields', type: 'array', required: true },
        ]),
        language: 'typescript',
        framework: 'nestjs',
        category: 'entity',
        status: 'published',
      },
    });
    templateId = template.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('/api/v1/code-generation (POST)', () => {
    it('should generate code successfully', async () => {
      const generateRequest = {
        projectId,
        templateIds: [templateId],
        entityIds: [entityId],
        outputPath: './generated',
        variables: {},
        options: {
          architecture: 'ddd',
          framework: 'nestjs',
          overwriteExisting: false,
          generateTests: false,
          generateDocs: false,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(201);

      expect(response.body.status).toBe(0);
      expect(response.body.msg).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.taskId).toBeDefined();
      expect(response.body.data.files).toBeDefined();
      expect(response.body.data.files.length).toBeGreaterThan(0);
      
      // Check generated file content
      const generatedFile = response.body.data.files[0];
      expect(generatedFile.path).toContain('user.entity.ts');
      expect(generatedFile.content).toContain('export class User');
      expect(generatedFile.content).toContain('@Entity(\'users\')');
      expect(generatedFile.content).toContain('email: string');
      expect(generatedFile.content).toContain('firstName: string');
      expect(generatedFile.content).toContain('age: number | null');
    });

    it('should return 400 for invalid request', async () => {
      const invalidRequest = {
        // Missing required fields
        projectId,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.status).toBe(1);
      expect(response.body.msg).toContain('error');
    });

    it('should return 404 for non-existent project', async () => {
      const generateRequest = {
        projectId: 'non-existent-project',
        templateIds: [templateId],
        entityIds: [entityId],
        outputPath: './generated',
        variables: {},
        options: {},
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(404);

      expect(response.body.status).toBe(1);
      expect(response.body.msg).toContain('not found');
    });

    it('should return 404 for non-existent template', async () => {
      const generateRequest = {
        projectId,
        templateIds: ['non-existent-template'],
        entityIds: [entityId],
        outputPath: './generated',
        variables: {},
        options: {},
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(404);

      expect(response.body.status).toBe(1);
      expect(response.body.msg).toContain('not found');
    });

    it('should return 404 for non-existent entity', async () => {
      const generateRequest = {
        projectId,
        templateIds: [templateId],
        entityIds: ['non-existent-entity'],
        outputPath: './generated',
        variables: {},
        options: {},
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(404);

      expect(response.body.status).toBe(1);
      expect(response.body.msg).toContain('not found');
    });
  });

  describe('/api/v1/code-generation/preview (POST)', () => {
    it('should generate code preview successfully', async () => {
      const previewRequest = {
        projectId,
        templateIds: [templateId],
        entityIds: [entityId],
        variables: {},
        architecture: 'ddd',
        framework: 'nestjs',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation/preview')
        .send(previewRequest)
        .expect(200);

      expect(response.body.status).toBe(0);
      expect(response.body.msg).toBe('success');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.files).toBeDefined();
      expect(response.body.data.structure).toBeDefined();
      expect(response.body.data.validation).toBeDefined();
      expect(response.body.data.stats).toBeDefined();

      // Check preview content
      const previewFile = response.body.data.files[0];
      expect(previewFile.name).toBe('user.entity.ts');
      expect(previewFile.content).toContain('export class User');
      expect(previewFile.language).toBe('typescript');
    });
  });

  describe('/api/v1/code-generation/validate (POST)', () => {
    it('should validate template variables successfully', async () => {
      const validateRequest = {
        templateId,
        variables: {
          entityName: 'User',
          tableName: 'users',
          fields: [
            { name: 'email', code: 'email', type: 'STRING' },
            { name: 'firstName', code: 'firstName', type: 'STRING' },
          ],
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation/validate')
        .send(validateRequest)
        .expect(200);

      expect(response.body.status).toBe(0);
      expect(response.body.msg).toBe('success');
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const validateRequest = {
        templateId,
        variables: {
          // Missing required variables
          entityName: 'User',
          // tableName is missing
          // fields is missing
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation/validate')
        .send(validateRequest)
        .expect(200);

      expect(response.body.status).toBe(0);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple entities and templates', async () => {
      // Create additional entity
      const entity2 = await prisma.entity.create({
        data: {
          projectId,
          name: 'Product',
          code: 'Product',
          tableName: 'products',
          description: 'Product entity for testing',
        },
      });

      await prisma.field.createMany({
        data: [
          {
            entityId: entity2.id,
            name: 'Name',
            code: 'name',
            type: 'STRING',
            nullable: false,
            length: 255,
            sortOrder: 1,
          },
          {
            entityId: entity2.id,
            name: 'Price',
            code: 'price',
            type: 'DECIMAL',
            nullable: false,
            precision: 10,
            scale: 2,
            sortOrder: 2,
          },
        ],
      });

      // Create service template
      const serviceTemplate = await prisma.template.create({
        data: {
          projectId,
          name: 'NestJS Service',
          content: `import { Injectable } from '@nestjs/common';
import { {{entityName}} } from './{{kebabCase entityName}}.entity';

@Injectable()
export class {{entityName}}Service {
  async findAll(): Promise<{{entityName}}[]> {
    // Implementation here
    return [];
  }

  async findOne(id: string): Promise<{{entityName}} | null> {
    // Implementation here
    return null;
  }
}`,
          variables: JSON.stringify([
            { name: 'entityName', type: 'string', required: true },
          ]),
          language: 'typescript',
          framework: 'nestjs',
          category: 'service',
          status: 'published',
        },
      });

      const generateRequest = {
        projectId,
        templateIds: [templateId, serviceTemplate.id],
        entityIds: [entityId, entity2.id],
        outputPath: './generated',
        variables: {},
        options: {
          architecture: 'ddd',
          framework: 'nestjs',
          overwriteExisting: false,
          generateTests: false,
          generateDocs: false,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(201);

      expect(response.body.status).toBe(0);
      expect(response.body.data.files).toHaveLength(4); // 2 entities × 2 templates

      // Check that all files are generated
      const filePaths = response.body.data.files.map(f => f.path);
      expect(filePaths).toContain(expect.stringContaining('user.entity.ts'));
      expect(filePaths).toContain(expect.stringContaining('user.service.ts'));
      expect(filePaths).toContain(expect.stringContaining('product.entity.ts'));
      expect(filePaths).toContain(expect.stringContaining('product.service.ts'));
    });

    it('should handle custom variables', async () => {
      const generateRequest = {
        projectId,
        templateIds: [templateId],
        entityIds: [entityId],
        outputPath: './generated',
        variables: {
          customNamespace: 'MyApp',
          enableAudit: true,
        },
        options: {
          architecture: 'ddd',
          framework: 'nestjs',
          overwriteExisting: false,
          generateTests: false,
          generateDocs: false,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(201);

      expect(response.body.status).toBe(0);
      expect(response.body.data.files).toHaveLength(1);
    });
  });

  describe('Error handling', () => {
    it('should handle template compilation errors gracefully', async () => {
      // Create template with invalid syntax
      const invalidTemplate = await prisma.template.create({
        data: {
          projectId,
          name: 'Invalid Template',
          content: '{{#invalid syntax}}{{/invalid}}',
          variables: JSON.stringify([]),
          language: 'typescript',
          framework: 'nestjs',
          category: 'entity',
          status: 'published',
        },
      });

      const generateRequest = {
        projectId,
        templateIds: [invalidTemplate.id],
        entityIds: [entityId],
        outputPath: './generated',
        variables: {},
        options: {},
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(500);

      expect(response.body.status).toBe(1);
      expect(response.body.msg).toContain('error');
    });

    it('should handle large payloads', async () => {
      // Create many entities
      const entities = [];
      for (let i = 0; i < 20; i++) {
        const entity = await prisma.entity.create({
          data: {
            projectId,
            name: `Entity${i}`,
            code: `Entity${i}`,
            tableName: `entity_${i}`,
            description: `Test entity ${i}`,
          },
        });
        entities.push(entity.id);
      }

      const generateRequest = {
        projectId,
        templateIds: [templateId],
        entityIds: entities,
        outputPath: './generated',
        variables: {},
        options: {},
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/code-generation')
        .send(generateRequest)
        .expect(201);

      expect(response.body.status).toBe(0);
      expect(response.body.data.files).toHaveLength(20);
    });
  });
});
