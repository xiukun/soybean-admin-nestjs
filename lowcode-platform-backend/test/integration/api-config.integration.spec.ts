import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('API Configuration Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testEntityId: string;
  let createdApiConfigIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'apitestuser',
        email: 'apitest@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'API Test Project',
        description: 'Test project for API configuration',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testProjectId = testProject.id;

    // Create test entity
    const testEntity = await prisma.entity.create({
      data: {
        projectId: testProjectId,
        name: 'TestEntity',
        code: 'test_entity',
        tableName: 'test_entities',
        category: 'core',
        status: 'PUBLISHED',
        createdBy: testUserId,
      },
    });
    testEntityId = testEntity.id;

    // Add some fields to the entity
    await prisma.field.createMany({
      data: [
        {
          entityId: testEntityId,
          name: 'ID',
          code: 'id',
          type: 'UUID',
          nullable: false,
          unique: true,
          primaryKey: true,
          order: 1,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Name',
          code: 'name',
          type: 'VARCHAR',
          length: 100,
          nullable: false,
          unique: false,
          primaryKey: false,
          order: 2,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Email',
          code: 'email',
          type: 'VARCHAR',
          length: 255,
          nullable: true,
          unique: true,
          primaryKey: false,
          order: 3,
          createdBy: testUserId,
        },
      ],
    });

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order
    for (const apiConfigId of createdApiConfigIds) {
      try {
        await prisma.apiConfig.delete({ where: { id: apiConfigId } });
      } catch (error) {
        console.warn(`Failed to delete API config ${apiConfigId}:`, error.message);
      }
    }

    await prisma.field.deleteMany({ where: { entityId: testEntityId } });
    await prisma.entity.delete({ where: { id: testEntityId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('API Configuration CRUD Operations', () => {
    it('should create different types of API configurations', async () => {
      const apiConfigs = [
        {
          projectId: testProjectId,
          name: 'Get All Entities',
          path: '/api/test-entities',
          method: 'GET',
          description: 'Get all test entities with pagination',
          entityId: testEntityId,
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
        },
        {
          projectId: testProjectId,
          name: 'Get Entity by ID',
          path: '/api/test-entities/{id}',
          method: 'GET',
          description: 'Get a single test entity by ID',
          entityId: testEntityId,
          queryConfig: {
            pagination: {
              enabled: false,
            },
            filters: [],
            sorting: [],
          },
          responseConfig: {
            format: 'json',
            wrapper: 'data',
          },
          authRequired: true,
          status: 'ACTIVE',
        },
        {
          projectId: testProjectId,
          name: 'Create Entity',
          path: '/api/test-entities',
          method: 'POST',
          description: 'Create a new test entity',
          entityId: testEntityId,
          requestConfig: {
            bodyType: 'json',
            validation: {
              required: ['name'],
              rules: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
              },
            },
          },
          responseConfig: {
            format: 'json',
            wrapper: 'data',
          },
          authRequired: true,
          status: 'ACTIVE',
        },
        {
          projectId: testProjectId,
          name: 'Update Entity',
          path: '/api/test-entities/{id}',
          method: 'PUT',
          description: 'Update an existing test entity',
          entityId: testEntityId,
          requestConfig: {
            bodyType: 'json',
            validation: {
              rules: {
                name: {
                  type: 'string',
                  minLength: 1,
                  maxLength: 100,
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
              },
            },
          },
          responseConfig: {
            format: 'json',
            wrapper: 'data',
          },
          authRequired: true,
          status: 'ACTIVE',
        },
        {
          projectId: testProjectId,
          name: 'Delete Entity',
          path: '/api/test-entities/{id}',
          method: 'DELETE',
          description: 'Delete a test entity',
          entityId: testEntityId,
          responseConfig: {
            format: 'json',
            wrapper: 'message',
          },
          authRequired: true,
          status: 'ACTIVE',
        },
      ];

      for (const apiConfigData of apiConfigs) {
        const response = await request(app.getHttpServer())
          .post('/api-configs')
          .set('Authorization', `Bearer ${authToken}`)
          .send(apiConfigData)
          .expect(201);

        expect(response.body).toMatchObject({
          projectId: testProjectId,
          name: apiConfigData.name,
          path: apiConfigData.path,
          method: apiConfigData.method,
          description: apiConfigData.description,
          entityId: testEntityId,
          authRequired: apiConfigData.authRequired,
          status: apiConfigData.status,
          createdBy: testUserId,
        });

        expect(response.body.id).toBeDefined();
        expect(response.body.version).toBe(1);
        createdApiConfigIds.push(response.body.id);
      }
    });

    it('should get API configurations by project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/project/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(5); // All created API configs

      // Verify each API config has required properties
      response.body.forEach((apiConfig: any) => {
        expect(apiConfig).toHaveProperty('id');
        expect(apiConfig).toHaveProperty('name');
        expect(apiConfig).toHaveProperty('path');
        expect(apiConfig).toHaveProperty('method');
        expect(apiConfig.projectId).toBe(testProjectId);
      });
    });

    it('should get paginated API configurations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 3,
        })
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('size');

      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records.length).toBeLessThanOrEqual(3);
      expect(response.body.total).toBe(5);
      expect(response.body.current).toBe(1);
      expect(response.body.size).toBe(3);
    });

    it('should update API configuration', async () => {
      const apiConfigId = createdApiConfigIds[0];
      const updateData = {
        name: 'Updated Get All Entities',
        description: 'Updated description for get all entities API',
        queryConfig: {
          pagination: {
            enabled: true,
            defaultPageSize: 50,
            maxPageSize: 200,
          },
          filters: ['name', 'email', 'status'],
          sorting: ['name', 'email', 'createdAt'],
        },
        rateLimit: {
          enabled: true,
          requests: 200,
          window: 60,
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/api-configs/${apiConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: apiConfigId,
        name: updateData.name,
        description: updateData.description,
        updatedBy: testUserId,
      });

      expect(response.body.version).toBe(2);
      expect(response.body.queryConfig.pagination.defaultPageSize).toBe(50);
      expect(response.body.rateLimit.requests).toBe(200);
    });

    it('should search API configurations by name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          search: 'Updated',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      expect(response.body.records[0].name).toContain('Updated');
    });

    it('should filter API configurations by method', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          method: 'GET',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((apiConfig: any) => {
        expect(apiConfig.method).toBe('GET');
      });
    });

    it('should filter API configurations by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          status: 'ACTIVE',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((apiConfig: any) => {
        expect(apiConfig.status).toBe('ACTIVE');
      });
    });
  });

  describe('API Configuration Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        projectId: testProjectId,
        // Missing name, path, method
        description: 'Invalid API config',
      };

      await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate path uniqueness within project and method', async () => {
      const duplicateData = {
        projectId: testProjectId,
        name: 'Duplicate API',
        path: '/api/test-entities', // Same path as existing GET API
        method: 'GET', // Same method
        description: 'Duplicate API config',
        entityId: testEntityId,
        authRequired: true,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);
    });

    it('should allow same path with different methods', async () => {
      const samePathDifferentMethod = {
        projectId: testProjectId,
        name: 'PATCH Entity',
        path: '/api/test-entities/{id}', // Same path as existing PUT and DELETE
        method: 'PATCH', // Different method
        description: 'Patch update for test entity',
        entityId: testEntityId,
        authRequired: true,
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(samePathDifferentMethod)
        .expect(201);

      expect(response.body.path).toBe('/api/test-entities/{id}');
      expect(response.body.method).toBe('PATCH');
      createdApiConfigIds.push(response.body.id);
    });

    it('should validate HTTP method', async () => {
      const invalidMethodData = {
        projectId: testProjectId,
        name: 'Invalid Method API',
        path: '/api/invalid-method',
        method: 'INVALID', // Invalid HTTP method
        description: 'API with invalid method',
        entityId: testEntityId,
        authRequired: true,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidMethodData)
        .expect(400);
    });

    it('should validate path format', async () => {
      const invalidPathData = {
        projectId: testProjectId,
        name: 'Invalid Path API',
        path: 'invalid-path', // Missing leading slash
        method: 'GET',
        description: 'API with invalid path',
        entityId: testEntityId,
        authRequired: true,
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPathData)
        .expect(400);
    });
  });

  describe('API Configuration Testing', () => {
    it('should test API configuration', async () => {
      const apiConfigId = createdApiConfigIds[0]; // GET all entities API

      const testData = {
        parameters: {
          page: 1,
          size: 10,
          name: 'test',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${apiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('executionTime');
    });

    it('should validate API configuration before testing', async () => {
      const apiConfigId = createdApiConfigIds[0];

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${apiConfigId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');

      if (!response.body.valid) {
        expect(Array.isArray(response.body.errors)).toBe(true);
      }
    });
  });

  describe('API Configuration Statistics', () => {
    it('should get API configuration statistics for project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/project/${testProjectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byMethod');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('authRequired');

      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.byMethod).toHaveProperty('GET');
      expect(response.body.byMethod).toHaveProperty('POST');
      expect(response.body.byStatus).toHaveProperty('ACTIVE');
    });
  });

  describe('API Configuration Operations', () => {
    it('should publish API configuration', async () => {
      // First create a draft API config
      const draftApiConfig = await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Draft API',
          path: '/api/draft',
          method: 'GET',
          description: 'Draft API configuration',
          entityId: testEntityId,
          authRequired: true,
          status: 'DRAFT',
        })
        .expect(201);

      // Then publish it
      const response = await request(app.getHttpServer())
        .post(`/api-configs/${draftApiConfig.body.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');
      createdApiConfigIds.push(draftApiConfig.body.id);
    });

    it('should deprecate API configuration', async () => {
      // First create a published API config
      const publishedApiConfig = await request(app.getHttpServer())
        .post('/api-configs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Published API',
          path: '/api/published',
          method: 'GET',
          description: 'Published API configuration',
          entityId: testEntityId,
          authRequired: true,
          status: 'PUBLISHED',
        })
        .expect(201);

      // Then deprecate it
      const response = await request(app.getHttpServer())
        .post(`/api-configs/${publishedApiConfig.body.id}/deprecate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('DEPRECATED');
      createdApiConfigIds.push(publishedApiConfig.body.id);
    });

    it('should duplicate API configuration', async () => {
      const originalApiConfigId = createdApiConfigIds[0];

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${originalApiConfigId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicated API Config',
          path: '/api/duplicated-entities',
        })
        .expect(201);

      expect(response.body.name).toBe('Duplicated API Config');
      expect(response.body.path).toBe('/api/duplicated-entities');
      expect(response.body.method).toBe('GET'); // Same as original
      expect(response.body.projectId).toBe(testProjectId);

      createdApiConfigIds.push(response.body.id);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent API configuration', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api-configs/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle non-existent project for API configuration', async () => {
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/api-configs/project/${nonExistentProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api-configs')
        .expect(401);
    });
  });
});
