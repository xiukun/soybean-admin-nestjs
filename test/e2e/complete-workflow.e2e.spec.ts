import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

describe('Complete Workflow End-to-End Tests', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let workflowData: any = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Create Fastify application for testing
    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Create test user and authenticate
    const testUser = await prisma.user.create({
      data: {
        username: 'e2e_workflow_user',
        email: 'e2e.workflow@example.com',
        password: 'hashed_password',
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
    // Clean up all test data
    try {
      if (workflowData.generationHistoryId) {
        await prisma.generationHistory.delete({ where: { id: workflowData.generationHistoryId } });
      }
      if (workflowData.templateId) {
        await prisma.codeTemplate.delete({ where: { id: workflowData.templateId } });
      }
      if (workflowData.apiConfigId) {
        await prisma.apiConfig.delete({ where: { id: workflowData.apiConfigId } });
      }
      if (workflowData.relationshipId) {
        await prisma.relationship.delete({ where: { id: workflowData.relationshipId } });
      }
      if (workflowData.fieldIds) {
        await prisma.field.deleteMany({ where: { id: { in: workflowData.fieldIds } } });
      }
      if (workflowData.entityId) {
        await prisma.entity.delete({ where: { id: workflowData.entityId } });
      }
      if (workflowData.projectId) {
        await prisma.project.delete({ where: { id: workflowData.projectId } });
      }
      await prisma.user.delete({ where: { id: testUserId } });
    } catch (error) {
      console.warn('Error cleaning up test data:', error.message);
    }

    await app.close();
  });

  describe('Complete Low-Code Platform Workflow', () => {
    it('should complete the entire workflow from project creation to code generation', async () => {
      // Step 1: Create a new project
      console.log('Step 1: Creating project...');
      const projectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Blog System',
          description: 'End-to-end test project for blog management system',
          version: '1.0.0',
          status: 'ACTIVE',
        })
        .expect(201);

      workflowData.projectId = projectResponse.body.id;
      expect(projectResponse.body.name).toBe('E2E Test Blog System');

      // Step 2: Create entities
      console.log('Step 2: Creating entities...');
      
      // Create User entity
      const userEntityResponse = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: workflowData.projectId,
          name: 'User',
          code: 'user',
          tableName: 'users',
          description: 'Blog user management',
          category: 'core',
          status: 'PUBLISHED',
        })
        .expect(201);

      workflowData.entityId = userEntityResponse.body.id;

      // Create Post entity
      const postEntityResponse = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: workflowData.projectId,
          name: 'Post',
          code: 'post',
          tableName: 'posts',
          description: 'Blog post management',
          category: 'content',
          status: 'PUBLISHED',
        })
        .expect(201);

      workflowData.postEntityId = postEntityResponse.body.id;

      // Step 3: Add fields to entities
      console.log('Step 3: Adding fields to entities...');
      
      const userFields = [
        { name: 'ID', code: 'id', type: 'UUID', nullable: false, primaryKey: true },
        { name: 'Username', code: 'username', type: 'VARCHAR', length: 50, nullable: false, unique: true },
        { name: 'Email', code: 'email', type: 'VARCHAR', length: 255, nullable: false, unique: true },
        { name: 'Password', code: 'password', type: 'VARCHAR', length: 255, nullable: false },
        { name: 'Status', code: 'status', type: 'VARCHAR', length: 20, nullable: false, defaultValue: 'ACTIVE' },
      ];

      const postFields = [
        { name: 'ID', code: 'id', type: 'UUID', nullable: false, primaryKey: true },
        { name: 'Title', code: 'title', type: 'VARCHAR', length: 200, nullable: false },
        { name: 'Content', code: 'content', type: 'TEXT', nullable: false },
        { name: 'Author ID', code: 'authorId', type: 'UUID', nullable: false },
        { name: 'Status', code: 'status', type: 'VARCHAR', length: 20, nullable: false, defaultValue: 'DRAFT' },
        { name: 'Published At', code: 'publishedAt', type: 'TIMESTAMP', nullable: true },
      ];

      workflowData.fieldIds = [];

      // Add fields to User entity
      for (const field of userFields) {
        const fieldResponse = await request(app.getHttpServer())
          .post('/fields')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...field,
            entityId: workflowData.entityId,
            order: userFields.indexOf(field) + 1,
          })
          .expect(201);
        
        workflowData.fieldIds.push(fieldResponse.body.id);
      }

      // Add fields to Post entity
      for (const field of postFields) {
        const fieldResponse = await request(app.getHttpServer())
          .post('/fields')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            ...field,
            entityId: workflowData.postEntityId,
            order: postFields.indexOf(field) + 1,
          })
          .expect(201);
        
        workflowData.fieldIds.push(fieldResponse.body.id);
      }

      // Step 4: Create relationships
      console.log('Step 4: Creating relationships...');
      
      const relationshipResponse = await request(app.getHttpServer())
        .post('/relationships')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sourceEntityId: workflowData.postEntityId,
          targetEntityId: workflowData.entityId,
          type: 'MANY_TO_ONE',
          sourceField: 'authorId',
          targetField: 'id',
          name: 'Post Author',
          description: 'Relationship between post and its author',
        })
        .expect(201);

      workflowData.relationshipId = relationshipResponse.body.id;

      // Step 5: Configure APIs
      console.log('Step 5: Configuring APIs...');
      
      const apiConfigResponse = await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: workflowData.entityId,
          method: 'GET',
          path: '/users',
          name: 'Get Users',
          description: 'Get all users with pagination',
          enabled: true,
          authentication: true,
          parameters: [
            { name: 'page', type: 'number', required: false, defaultValue: '1' },
            { name: 'limit', type: 'number', required: false, defaultValue: '10' },
          ],
          response: {
            type: 'object',
            properties: {
              data: { type: 'array' },
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
            },
          },
        })
        .expect(201);

      workflowData.apiConfigId = apiConfigResponse.body.id;

      // Step 6: Test multi-table query
      console.log('Step 6: Testing multi-table query...');
      
      const queryResponse = await request(app.getHttpServer())
        .post('/queries/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: workflowData.projectId,
          query: {
            select: ['users.username', 'posts.title', 'posts.publishedAt'],
            from: 'users',
            joins: [
              {
                type: 'LEFT',
                table: 'posts',
                on: 'users.id = posts.authorId',
              },
            ],
            where: {
              'users.status': 'ACTIVE',
            },
            orderBy: [{ field: 'posts.publishedAt', direction: 'DESC' }],
            limit: 10,
          },
        })
        .expect(200);

      expect(queryResponse.body).toHaveProperty('data');
      expect(queryResponse.body).toHaveProperty('columns');

      // Step 7: Create code template
      console.log('Step 7: Creating code template...');
      
      const templateResponse = await request(app.getHttpServer())
        .post('/code-templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: workflowData.projectId,
          name: 'NestJS Service Template',
          code: 'nestjs_service',
          category: 'service',
          language: 'typescript',
          framework: 'nestjs',
          description: 'Template for generating NestJS service classes',
          template: `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { {{pascalCase entity.code}} } from '@prisma/client';

@Injectable()
export class {{pascalCase entity.code}}Service {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<{{pascalCase entity.code}}[]> {
    return this.prisma.{{camelCase entity.code}}.findMany();
  }

  async findOne(id: string): Promise<{{pascalCase entity.code}} | null> {
    return this.prisma.{{camelCase entity.code}}.findUnique({
      where: { id },
    });
  }

  async create(data: Omit<{{pascalCase entity.code}}, 'id'>): Promise<{{pascalCase entity.code}}> {
    return this.prisma.{{camelCase entity.code}}.create({
      data,
    });
  }

  async update(id: string, data: Partial<{{pascalCase entity.code}}>): Promise<{{pascalCase entity.code}}> {
    return this.prisma.{{camelCase entity.code}}.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<{{pascalCase entity.code}}> {
    return this.prisma.{{camelCase entity.code}}.delete({
      where: { id },
    });
  }
}`,
          variables: [
            { name: 'entity', type: 'object', required: true, description: 'Entity information' },
          ],
          status: 'PUBLISHED',
        })
        .expect(201);

      workflowData.templateId = templateResponse.body.id;

      // Step 8: Generate code
      console.log('Step 8: Generating code...');
      
      const generationResponse = await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: workflowData.projectId,
          entityIds: [workflowData.entityId, workflowData.postEntityId],
          templateIds: [workflowData.templateId],
          outputPath: './generated/e2e-test',
          options: {
            overwrite: true,
            createDirectories: true,
            format: true,
          },
        })
        .expect(201);

      workflowData.generationHistoryId = generationResponse.body.id;
      expect(generationResponse.body.status).toBe('PENDING');

      // Step 9: Monitor generation progress
      console.log('Step 9: Monitoring generation progress...');
      
      let generationComplete = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!generationComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await request(app.getHttpServer())
          .get(`/code-generation/history/${workflowData.generationHistoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        if (statusResponse.body.status === 'COMPLETED') {
          generationComplete = true;
          expect(statusResponse.body.generatedFiles).toBeGreaterThan(0);
          expect(statusResponse.body.errors).toBe(0);
        } else if (statusResponse.body.status === 'FAILED') {
          fail(`Code generation failed: ${statusResponse.body.errorMessage}`);
        }
        
        attempts++;
      }

      expect(generationComplete).toBe(true);

      // Step 10: Verify generated files
      console.log('Step 10: Verifying generated files...');
      
      const generatedDir = './generated/e2e-test';
      expect(fs.existsSync(generatedDir)).toBe(true);

      // Check for generated service files
      const userServicePath = path.join(generatedDir, 'services/user.service.ts');
      const postServicePath = path.join(generatedDir, 'services/post.service.ts');

      if (fs.existsSync(userServicePath)) {
        const userServiceContent = fs.readFileSync(userServicePath, 'utf8');
        expect(userServiceContent).toContain('UserService');
        expect(userServiceContent).toContain('findAll()');
        expect(userServiceContent).toContain('create(');
      }

      if (fs.existsSync(postServicePath)) {
        const postServiceContent = fs.readFileSync(postServicePath, 'utf8');
        expect(postServiceContent).toContain('PostService');
        expect(postServiceContent).toContain('findAll()');
        expect(postServiceContent).toContain('create(');
      }

      // Step 11: Test API endpoints
      console.log('Step 11: Testing generated API endpoints...');
      
      const apiTestResponse = await request(app.getHttpServer())
        .post('/api-test/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          apiConfigId: workflowData.apiConfigId,
          parameters: {
            page: 1,
            limit: 5,
          },
        })
        .expect(200);

      expect(apiTestResponse.body).toHaveProperty('status');
      expect(apiTestResponse.body).toHaveProperty('response');

      // Step 12: Verify project statistics
      console.log('Step 12: Verifying project statistics...');
      
      const statsResponse = await request(app.getHttpServer())
        .get(`/projects/${workflowData.projectId}/statistics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body.entities).toBe(2);
      expect(statsResponse.body.fields).toBeGreaterThan(10);
      expect(statsResponse.body.relationships).toBe(1);
      expect(statsResponse.body.apiConfigs).toBe(1);
      expect(statsResponse.body.templates).toBe(1);

      console.log('✅ Complete workflow test passed successfully!');
    }, 120000); // 2 minute timeout for the complete workflow

    it('should handle workflow errors gracefully', async () => {
      // Test error handling in the workflow
      
      // Try to create entity without project
      await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Entity',
          code: 'invalid',
          tableName: 'invalid',
        })
        .expect(400);

      // Try to create field without entity
      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Field',
          code: 'invalid',
          type: 'VARCHAR',
        })
        .expect(400);

      // Try to generate code without templates
      await request(app.getHttpServer())
        .post('/code-generation/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: workflowData.projectId,
          entityIds: [],
          templateIds: [],
        })
        .expect(400);
    });

    it('should support workflow rollback and recovery', async () => {
      // Create a project for rollback testing
      const rollbackProjectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Rollback Test Project',
          description: 'Project for testing rollback functionality',
          version: '1.0.0',
          status: 'ACTIVE',
        })
        .expect(201);

      const rollbackProjectId = rollbackProjectResponse.body.id;

      try {
        // Create entity
        const entityResponse = await request(app.getHttpServer())
          .post('/entities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId: rollbackProjectId,
            name: 'Test Entity',
            code: 'test_entity',
            tableName: 'test_entities',
            status: 'PUBLISHED',
          })
          .expect(201);

        const entityId = entityResponse.body.id;

        // Verify entity was created
        await request(app.getHttpServer())
          .get(`/entities/${entityId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Delete entity (rollback)
        await request(app.getHttpServer())
          .delete(`/entities/${entityId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify entity was deleted
        await request(app.getHttpServer())
          .get(`/entities/${entityId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

      } finally {
        // Clean up rollback test project
        await request(app.getHttpServer())
          .delete(`/projects/${rollbackProjectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    });

    it('should support concurrent workflow operations', async () => {
      // Test concurrent operations on the same project
      const concurrentPromises = [];

      // Create multiple entities concurrently
      for (let i = 0; i < 3; i++) {
        const promise = request(app.getHttpServer())
          .post('/entities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId: workflowData.projectId,
            name: `Concurrent Entity ${i}`,
            code: `concurrent_entity_${i}`,
            tableName: `concurrent_entities_${i}`,
            status: 'PUBLISHED',
          })
          .expect(201);
        
        concurrentPromises.push(promise);
      }

      const results = await Promise.all(concurrentPromises);
      
      // Verify all entities were created successfully
      expect(results.length).toBe(3);
      results.forEach((result, index) => {
        expect(result.body.name).toBe(`Concurrent Entity ${index}`);
      });

      // Clean up concurrent entities
      for (const result of results) {
        await request(app.getHttpServer())
          .delete(`/entities/${result.body.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large projects efficiently', async () => {
      const startTime = Date.now();

      // Create a project with many entities and fields
      const largeProjectResponse = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Large Scale Test Project',
          description: 'Project for testing scalability',
          version: '1.0.0',
          status: 'ACTIVE',
        })
        .expect(201);

      const largeProjectId = largeProjectResponse.body.id;
      const createdEntities = [];

      try {
        // Create 10 entities with 5 fields each
        for (let i = 0; i < 10; i++) {
          const entityResponse = await request(app.getHttpServer())
            .post('/entities')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              projectId: largeProjectId,
              name: `Entity ${i}`,
              code: `entity_${i}`,
              tableName: `entities_${i}`,
              status: 'PUBLISHED',
            })
            .expect(201);

          createdEntities.push(entityResponse.body.id);

          // Add fields to each entity
          for (let j = 0; j < 5; j++) {
            await request(app.getHttpServer())
              .post('/fields')
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                entityId: entityResponse.body.id,
                name: `Field ${j}`,
                code: `field_${j}`,
                type: 'VARCHAR',
                length: 100,
                nullable: true,
                order: j + 1,
              })
              .expect(201);
          }
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete within reasonable time (30 seconds)
        expect(duration).toBeLessThan(30000);

        // Verify project statistics
        const statsResponse = await request(app.getHttpServer())
          .get(`/projects/${largeProjectId}/statistics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(statsResponse.body.entities).toBe(10);
        expect(statsResponse.body.fields).toBe(50);

      } finally {
        // Clean up large project
        await request(app.getHttpServer())
          .delete(`/projects/${largeProjectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
      }
    });

    it('should maintain performance under load', async () => {
      const concurrentRequests = 20;
      const promises = [];

      const startTime = Date.now();

      // Make concurrent requests to different endpoints
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(app.getHttpServer())
          .get(`/projects/${workflowData.projectId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      expect(results.length).toBe(concurrentRequests);
      results.forEach(result => {
        expect(result.body.id).toBe(workflowData.projectId);
      });

      // Average response time should be reasonable (less than 500ms per request)
      const avgResponseTime = duration / concurrentRequests;
      expect(avgResponseTime).toBeLessThan(500);
    });
  });
});
