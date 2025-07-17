import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/shared/infrastructure/database/prisma.service';

describe('Complete Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.codegenTask.deleteMany();
    await prisma.codeTemplate.deleteMany();
    await prisma.apiConfig.deleteMany();
    await prisma.relationship.deleteMany();
    await prisma.field.deleteMany();
    await prisma.entity.deleteMany();
    await prisma.project.deleteMany();
    
    await prisma.$disconnect();
    await app.close();
  });

  describe('Complete Low-Code Platform Workflow', () => {
    let projectId: string;
    let userEntityId: string;
    let orderEntityId: string;
    let relationshipId: string;
    let templateId: string;
    let apiConfigId: string;
    let codegenTaskId: string;

    it('1. Should create a new project', async () => {
      const createProjectDto = {
        name: 'E-Commerce Platform',
        description: 'A complete e-commerce platform built with low-code',
        type: 'web',
        config: {
          framework: 'react',
          database: 'postgresql',
          authentication: 'jwt',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/v1/projects')
        .send(createProjectDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createProjectDto.name);
      expect(response.body.status).toBe('ACTIVE');

      projectId = response.body.id;
    });

    it('2. Should create User entity', async () => {
      const createUserEntityDto = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity for authentication and profile management',
        category: 'core',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(createUserEntityDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('User');
      expect(response.body.status).toBe('DRAFT');

      userEntityId = response.body.id;
    });

    it('3. Should add fields to User entity', async () => {
      const userFields = [
        {
          entityId: userEntityId,
          name: 'ID',
          code: 'id',
          type: 'UUID',
          nullable: false,
          primaryKey: true,
          comment: 'Primary key',
        },
        {
          entityId: userEntityId,
          name: 'Username',
          code: 'username',
          type: 'VARCHAR',
          length: 50,
          nullable: false,
          unique: true,
          comment: 'Unique username',
        },
        {
          entityId: userEntityId,
          name: 'Email',
          code: 'email',
          type: 'VARCHAR',
          length: 100,
          nullable: false,
          unique: true,
          comment: 'User email address',
        },
        {
          entityId: userEntityId,
          name: 'Password',
          code: 'password',
          type: 'VARCHAR',
          length: 255,
          nullable: false,
          comment: 'Encrypted password',
        },
        {
          entityId: userEntityId,
          name: 'Created At',
          code: 'createdAt',
          type: 'TIMESTAMP',
          nullable: false,
          comment: 'Creation timestamp',
        },
      ];

      for (const field of userFields) {
        const response = await request(app.getHttpServer())
          .post('/v1/fields')
          .send(field)
          .expect(201);

        expect(response.body.name).toBe(field.name);
        expect(response.body.code).toBe(field.code);
      }
    });

    it('4. Should create Order entity', async () => {
      const createOrderEntityDto = {
        projectId,
        name: 'Order',
        code: 'order',
        tableName: 'orders',
        description: 'Order entity for e-commerce transactions',
        category: 'business',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(createOrderEntityDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Order');

      orderEntityId = response.body.id;
    });

    it('5. Should add fields to Order entity', async () => {
      const orderFields = [
        {
          entityId: orderEntityId,
          name: 'ID',
          code: 'id',
          type: 'UUID',
          nullable: false,
          primaryKey: true,
          comment: 'Primary key',
        },
        {
          entityId: orderEntityId,
          name: 'User ID',
          code: 'userId',
          type: 'UUID',
          nullable: false,
          comment: 'Foreign key to users table',
        },
        {
          entityId: orderEntityId,
          name: 'Order Number',
          code: 'orderNumber',
          type: 'VARCHAR',
          length: 50,
          nullable: false,
          unique: true,
          comment: 'Unique order number',
        },
        {
          entityId: orderEntityId,
          name: 'Total Amount',
          code: 'totalAmount',
          type: 'DECIMAL',
          precision: 10,
          scale: 2,
          nullable: false,
          comment: 'Total order amount',
        },
        {
          entityId: orderEntityId,
          name: 'Status',
          code: 'status',
          type: 'VARCHAR',
          length: 20,
          nullable: false,
          defaultValue: 'pending',
          comment: 'Order status',
        },
      ];

      for (const field of orderFields) {
        await request(app.getHttpServer())
          .post('/v1/fields')
          .send(field)
          .expect(201);
      }
    });

    it('6. Should create relationship between User and Order', async () => {
      const createRelationshipDto = {
        projectId,
        name: 'User Orders',
        code: 'userOrders',
        type: 'ONE_TO_MANY',
        sourceEntityId: userEntityId,
        targetEntityId: orderEntityId,
        description: 'A user can have many orders',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/relationships')
        .send(createRelationshipDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('User Orders');
      expect(response.body.type).toBe('ONE_TO_MANY');

      relationshipId = response.body.id;
    });

    it('7. Should create API configurations', async () => {
      const apiConfigs = [
        {
          projectId,
          name: 'Get Users',
          path: '/api/users',
          method: 'GET',
          description: 'Get list of users',
          entityId: userEntityId,
          queryConfig: {
            pagination: {
              enabled: true,
              defaultPageSize: 20,
              maxPageSize: 100,
            },
          },
          responseConfig: {
            format: 'json',
          },
          authRequired: true,
        },
        {
          projectId,
          name: 'Create User',
          path: '/api/users',
          method: 'POST',
          description: 'Create a new user',
          entityId: userEntityId,
          queryConfig: {},
          responseConfig: {
            format: 'json',
          },
          authRequired: false,
        },
        {
          projectId,
          name: 'Get User Orders',
          path: '/api/users/{id}/orders',
          method: 'GET',
          description: 'Get orders for a specific user',
          entityId: orderEntityId,
          queryConfig: {
            pagination: {
              enabled: true,
              defaultPageSize: 10,
              maxPageSize: 50,
            },
          },
          responseConfig: {
            format: 'json',
          },
          authRequired: true,
        },
      ];

      for (const apiConfig of apiConfigs) {
        const response = await request(app.getHttpServer())
          .post('/v1/api-configs')
          .send(apiConfig)
          .expect(201);

        expect(response.body.name).toBe(apiConfig.name);
        expect(response.body.path).toBe(apiConfig.path);
        expect(response.body.method).toBe(apiConfig.method);

        if (apiConfig.name === 'Get Users') {
          apiConfigId = response.body.id;
        }
      }
    });

    it('8. Should create code templates', async () => {
      const createTemplateDto = {
        projectId,
        name: 'NestJS Controller',
        description: 'NestJS REST API controller template',
        category: 'controller',
        language: 'typescript',
        framework: 'nestjs',
        content: `import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { {{entityName}}Service } from './{{entityCode}}.service';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from './dto';

@Controller('{{apiPath}}')
export class {{entityName}}Controller {
  constructor(private readonly {{entityCode}}Service: {{entityName}}Service) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.{{entityCode}}Service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.{{entityCode}}Service.findOne(id);
  }

  @Post()
  async create(@Body() createDto: Create{{entityName}}Dto) {
    return this.{{entityCode}}Service.create(createDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Update{{entityName}}Dto) {
    return this.{{entityCode}}Service.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.{{entityCode}}Service.remove(id);
  }
}`,
        variables: [
          {
            name: 'entityName',
            type: 'string',
            description: 'Entity name in PascalCase',
            required: true,
            defaultValue: 'User',
          },
          {
            name: 'entityCode',
            type: 'string',
            description: 'Entity code in camelCase',
            required: true,
            defaultValue: 'user',
          },
          {
            name: 'apiPath',
            type: 'string',
            description: 'API path',
            required: true,
            defaultValue: 'users',
          },
        ],
        tags: ['nestjs', 'controller', 'rest-api'],
        isPublic: false,
      };

      const response = await request(app.getHttpServer())
        .post('/v1/templates')
        .send(createTemplateDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('NestJS Controller');
      expect(response.body.status).toBe('DRAFT');

      templateId = response.body.id;
    });

    it('9. Should publish the template', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/templates/${templateId}/publish`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
    });

    it('10. Should create code generation task', async () => {
      const createTaskDto = {
        projectId,
        name: 'Generate User Management Module',
        type: 'MODULE',
        config: {
          entities: [userEntityId, orderEntityId],
          templates: [templateId],
          outputPath: '/src/modules',
          variables: {
            entityName: 'User',
            entityCode: 'user',
            apiPath: 'users',
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/v1/codegen/tasks')
        .send(createTaskDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Generate User Management Module');
      expect(response.body.status).toBe('PENDING');

      codegenTaskId = response.body.id;
    });

    it('11. Should execute code generation task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/v1/codegen/tasks/${codegenTaskId}/execute`)
        .expect(200);

      expect(response.body.status).toBe('RUNNING');

      // Wait for task completion (in real scenario, this would be async)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check task status
      const statusResponse = await request(app.getHttpServer())
        .get(`/v1/codegen/tasks/${codegenTaskId}`)
        .expect(200);

      expect(['COMPLETED', 'RUNNING']).toContain(statusResponse.body.status);
    });

    it('12. Should get project statistics', async () => {
      // Get entity statistics
      const entityStatsResponse = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}/stats`)
        .expect(200);

      expect(entityStatsResponse.body.total).toBe(2);
      expect(entityStatsResponse.body.draft).toBeGreaterThan(0);

      // Get project details with all related data
      const projectResponse = await request(app.getHttpServer())
        .get(`/v1/projects/${projectId}`)
        .expect(200);

      expect(projectResponse.body.name).toBe('E-Commerce Platform');
      expect(projectResponse.body.status).toBe('ACTIVE');
    });

    it('13. Should verify complete data integrity', async () => {
      // Verify all entities exist
      const entitiesResponse = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}`)
        .expect(200);

      expect(entitiesResponse.body).toHaveLength(2);
      expect(entitiesResponse.body.map((e: any) => e.name)).toContain('User');
      expect(entitiesResponse.body.map((e: any) => e.name)).toContain('Order');

      // Verify relationships exist
      const relationshipsResponse = await request(app.getHttpServer())
        .get(`/v1/relationships/project/${projectId}`)
        .expect(200);

      expect(relationshipsResponse.body).toHaveLength(1);
      expect(relationshipsResponse.body[0].name).toBe('User Orders');

      // Verify API configurations exist
      const apiConfigsResponse = await request(app.getHttpServer())
        .get(`/v1/api-configs/project/${projectId}`)
        .expect(200);

      expect(apiConfigsResponse.body).toHaveLength(3);

      // Verify templates exist
      const templatesResponse = await request(app.getHttpServer())
        .get(`/v1/templates/project/${projectId}`)
        .expect(200);

      expect(templatesResponse.body).toHaveLength(1);
      expect(templatesResponse.body[0].status).toBe('PUBLISHED');

      // Verify code generation task exists
      const tasksResponse = await request(app.getHttpServer())
        .get(`/v1/codegen/tasks/project/${projectId}`)
        .expect(200);

      expect(tasksResponse.body).toHaveLength(1);
    });

    it('14. Should handle project cleanup', async () => {
      // This test demonstrates the complete cleanup process
      // In a real scenario, this would be a separate admin function

      // Delete in reverse dependency order
      await request(app.getHttpServer())
        .delete(`/v1/codegen/tasks/${codegenTaskId}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/v1/templates/${templateId}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/v1/relationships/${relationshipId}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/v1/entities/${orderEntityId}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/v1/entities/${userEntityId}`)
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/v1/projects/${projectId}`)
        .expect(200);

      // Verify cleanup
      await request(app.getHttpServer())
        .get(`/v1/projects/${projectId}`)
        .expect(404);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid project creation', async () => {
      const invalidDto = {
        name: '', // Empty name
        type: 'invalid-type',
      };

      await request(app.getHttpServer())
        .post('/v1/projects')
        .send(invalidDto)
        .expect(400);
    });

    it('should handle duplicate entity codes', async () => {
      // Create a project first
      const projectResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .send({
          name: 'Test Project',
          type: 'web',
        });

      const projectId = projectResponse.body.id;

      // Create first entity
      await request(app.getHttpServer())
        .post('/v1/entities')
        .send({
          projectId,
          name: 'User',
          code: 'user',
          tableName: 'users',
          category: 'core',
        })
        .expect(201);

      // Try to create duplicate entity
      await request(app.getHttpServer())
        .post('/v1/entities')
        .send({
          projectId,
          name: 'Another User',
          code: 'user', // Duplicate code
          tableName: 'another_users',
          category: 'core',
        })
        .expect(400);

      // Cleanup
      await request(app.getHttpServer())
        .delete(`/v1/projects/${projectId}`);
    });
  });
});
