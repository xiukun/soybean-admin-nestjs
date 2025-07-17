import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Low-code Platform E2E Workflow Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;

  // Test data IDs
  let projectId: string;
  let userEntityId: string;
  let postEntityId: string;
  let userNameFieldId: string;
  let userEmailFieldId: string;
  let postTitleFieldId: string;
  let relationshipId: string;
  let apiConfigId: string;
  let templateId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user and auth token
    const testUser = await prisma.user.create({
      data: {
        username: 'e2euser',
        email: 'e2e@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up all test data in reverse order
    const cleanupTasks = [
      () => templateId && prisma.codeTemplate.delete({ where: { id: templateId } }),
      () => apiConfigId && prisma.apiConfig.delete({ where: { id: apiConfigId } }),
      () => relationshipId && prisma.relationship.delete({ where: { id: relationshipId } }),
      () => userNameFieldId && prisma.field.delete({ where: { id: userNameFieldId } }),
      () => userEmailFieldId && prisma.field.delete({ where: { id: userEmailFieldId } }),
      () => postTitleFieldId && prisma.field.delete({ where: { id: postTitleFieldId } }),
      () => userEntityId && prisma.entity.delete({ where: { id: userEntityId } }),
      () => postEntityId && prisma.entity.delete({ where: { id: postEntityId } }),
      () => projectId && prisma.project.delete({ where: { id: projectId } }),
      () => prisma.user.delete({ where: { id: testUserId } }),
    ];

    for (const cleanup of cleanupTasks) {
      try {
        await cleanup();
      } catch (error) {
        console.warn('Cleanup error:', error.message);
      }
    }

    await app.close();
  });

  describe('Complete Low-code Development Workflow', () => {
    it('Step 1: Create a new project', async () => {
      const projectData = {
        name: 'Blog Platform',
        description: 'A complete blog platform built with low-code',
        version: '1.0.0',
        status: 'ACTIVE',
        config: {
          database: {
            type: 'postgresql',
            host: 'localhost',
            port: 5432,
          },
          features: {
            authentication: true,
            authorization: true,
            audit: true,
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.name).toBe(projectData.name);
      projectId = response.body.id;
    });

    it('Step 2: Create User entity', async () => {
      const userEntityData = {
        projectId,
        name: 'User',
        code: 'user',
        description: 'User entity for blog platform',
        tableName: 'users',
        category: 'core',
        status: 'DRAFT',
        config: {
          softDelete: true,
          timestamps: true,
          audit: true,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(userEntityData)
        .expect(201);

      expect(response.body.name).toBe('User');
      userEntityId = response.body.id;
    });

    it('Step 3: Create Post entity', async () => {
      const postEntityData = {
        projectId,
        name: 'Post',
        code: 'post',
        description: 'Blog post entity',
        tableName: 'posts',
        category: 'business',
        status: 'DRAFT',
        config: {
          softDelete: true,
          timestamps: true,
          audit: true,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(postEntityData)
        .expect(201);

      expect(response.body.name).toBe('Post');
      postEntityId = response.body.id;
    });

    it('Step 4: Add fields to User entity', async () => {
      // Add name field
      const nameFieldResponse = await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: userEntityId,
          name: 'Name',
          code: 'name',
          type: 'VARCHAR',
          length: 100,
          nullable: false,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'User full name',
        })
        .expect(201);

      userNameFieldId = nameFieldResponse.body.id;

      // Add email field
      const emailFieldResponse = await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: userEntityId,
          name: 'Email',
          code: 'email',
          type: 'VARCHAR',
          length: 255,
          nullable: false,
          unique: true,
          primaryKey: false,
          autoIncrement: false,
          comment: 'User email address',
        })
        .expect(201);

      userEmailFieldId = emailFieldResponse.body.id;
    });

    it('Step 5: Add fields to Post entity', async () => {
      const titleFieldResponse = await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: postEntityId,
          name: 'Title',
          code: 'title',
          type: 'VARCHAR',
          length: 200,
          nullable: false,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'Post title',
        })
        .expect(201);

      postTitleFieldId = titleFieldResponse.body.id;

      // Add content field
      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: postEntityId,
          name: 'Content',
          code: 'content',
          type: 'TEXT',
          nullable: true,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'Post content',
        })
        .expect(201);
    });

    it('Step 6: Create relationship between User and Post', async () => {
      const relationshipData = {
        projectId,
        name: 'User Posts',
        code: 'user_posts',
        description: 'One user can have many posts',
        type: 'ONE_TO_MANY',
        sourceEntityId: userEntityId,
        targetEntityId: postEntityId,
        sourceField: 'id',
        targetField: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      };

      const response = await request(app.getHttpServer())
        .post('/relationships')
        .set('Authorization', `Bearer ${authToken}`)
        .send(relationshipData)
        .expect(201);

      expect(response.body.type).toBe('ONE_TO_MANY');
      relationshipId = response.body.id;
    });

    it('Step 7: Publish entities', async () => {
      // Publish User entity
      await request(app.getHttpServer())
        .post(`/entities/${userEntityId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Publish Post entity
      await request(app.getHttpServer())
        .post(`/entities/${postEntityId}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('Step 8: Create API configuration', async () => {
      const apiConfigData = {
        projectId,
        name: 'Get Users API',
        path: '/users',
        method: 'GET',
        description: 'Get all users with pagination',
        entityId: userEntityId,
        queryConfig: {
          pagination: {
            enabled: true,
            defaultPageSize: 20,
            maxPageSize: 100,
          },
          filters: ['name', 'email'],
          sorting: ['name', 'createdAt'],
        },
        responseConfig: {
          format: 'json',
          wrapper: 'data',
        },
        authRequired: true,
        rateLimit: {
          enabled: true,
          requests: 100,
          window: 60,
        },
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(apiConfigData)
        .expect(201);

      expect(response.body.name).toBe('Get Users API');
      apiConfigId = response.body.id;
    });

    it('Step 9: Create code template', async () => {
      const templateData = {
        projectId,
        name: 'NestJS Controller Template',
        description: 'Template for generating NestJS controllers',
        category: 'controller',
        language: 'typescript',
        framework: 'nestjs',
        content: `
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { {{entityName}}Service } from './{{entityCode}}.service';
import { Create{{entityName}}Dto, Update{{entityName}}Dto } from './dto';

@Controller('{{entityCode}}s')
export class {{entityName}}Controller {
  constructor(private readonly {{entityCode}}Service: {{entityName}}Service) {}

  @Get()
  findAll(@Query() query: any) {
    return this.{{entityCode}}Service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.{{entityCode}}Service.findOne(id);
  }

  @Post()
  create(@Body() create{{entityName}}Dto: Create{{entityName}}Dto) {
    return this.{{entityCode}}Service.create(create{{entityName}}Dto);
  }
}
        `,
        variables: [
          {
            name: 'entityName',
            type: 'string',
            description: 'Entity name in PascalCase',
            required: true,
          },
          {
            name: 'entityCode',
            type: 'string',
            description: 'Entity code in camelCase',
            required: true,
          },
        ],
        tags: ['nestjs', 'controller', 'crud'],
        isPublic: false,
      };

      const response = await request(app.getHttpServer())
        .post('/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.name).toBe('NestJS Controller Template');
      templateId = response.body.id;
    });

    it('Step 10: Generate code using template', async () => {
      const generationData = {
        projectId,
        templateId,
        entityIds: [userEntityId, postEntityId],
        outputPath: './generated',
        variables: {
          entityName: 'User',
          entityCode: 'user',
        },
        options: {
          overwriteExisting: false,
          generateTests: true,
          generateDocs: true,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.filesGenerated).toBeGreaterThan(0);
    });

    it('Step 11: Verify project statistics', async () => {
      const statsResponse = await request(app.getHttpServer())
        .get('/projects/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.total).toBeGreaterThan(0);
      expect(statsResponse.body.active).toBeGreaterThan(0);

      const entityStatsResponse = await request(app.getHttpServer())
        .get(`/entities/project/${projectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(entityStatsResponse.body.total).toBe(2);
      expect(entityStatsResponse.body.published).toBe(2);
    });

    it('Step 12: Test API configuration', async () => {
      const testResponse = await request(app.getHttpServer())
        .post(`/api-configs/${apiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(testResponse.body).toBeDefined();
    });
  });

  describe('Workflow Validation', () => {
    it('should maintain data consistency throughout workflow', async () => {
      // Verify project exists and has correct entities
      const projectResponse = await request(app.getHttpServer())
        .get(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(projectResponse.body.name).toBe('Blog Platform');

      // Verify entities exist and are published
      const entitiesResponse = await request(app.getHttpServer())
        .get(`/entities/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(entitiesResponse.body.length).toBe(2);
      entitiesResponse.body.forEach((entity: any) => {
        expect(entity.status).toBe('PUBLISHED');
      });

      // Verify fields exist
      const userFieldsResponse = await request(app.getHttpServer())
        .get(`/entities/${userEntityId}/fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(userFieldsResponse.body.length).toBeGreaterThanOrEqual(2);

      // Verify relationship exists
      const relationshipsResponse = await request(app.getHttpServer())
        .get(`/relationships/project/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(relationshipsResponse.body.length).toBe(1);
      expect(relationshipsResponse.body[0].type).toBe('ONE_TO_MANY');
    });

    it('should handle workflow rollback scenarios', async () => {
      // Test what happens when we try to delete an entity with relationships
      await request(app.getHttpServer())
        .delete(`/entities/${userEntityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409); // Should fail due to existing relationship

      // Test what happens when we try to delete a project with entities
      await request(app.getHttpServer())
        .delete(`/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409); // Should fail due to existing entities
    });
  });
});
