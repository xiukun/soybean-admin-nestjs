import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('API Testing Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testEntityId: string;
  let testApiConfigId: string;

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
        username: 'apitestinguser',
        email: 'apitesting@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'API Testing Project',
        description: 'Test project for API testing functionality',
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
        name: 'TestUser',
        code: 'test_user',
        tableName: 'test_users',
        category: 'core',
        status: 'PUBLISHED',
        createdBy: testUserId,
      },
    });
    testEntityId = testEntity.id;

    // Add fields to the entity
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
          name: 'Username',
          code: 'username',
          type: 'VARCHAR',
          length: 50,
          nullable: false,
          unique: true,
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
          nullable: false,
          unique: true,
          primaryKey: false,
          order: 3,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Age',
          code: 'age',
          type: 'INTEGER',
          nullable: true,
          unique: false,
          primaryKey: false,
          order: 4,
          createdBy: testUserId,
        },
        {
          entityId: testEntityId,
          name: 'Active',
          code: 'active',
          type: 'BOOLEAN',
          nullable: false,
          unique: false,
          primaryKey: false,
          defaultValue: 'true',
          order: 5,
          createdBy: testUserId,
        },
      ],
    });

    // Create test API configuration
    const testApiConfig = await prisma.apiConfig.create({
      data: {
        projectId: testProjectId,
        name: 'Get Users API',
        path: '/api/test-users',
        method: 'GET',
        description: 'Get all test users with filtering and pagination',
        entityId: testEntityId,
        queryConfig: {
          pagination: {
            enabled: true,
            defaultPageSize: 20,
            maxPageSize: 100,
          },
          filters: ['username', 'email', 'active'],
          sorting: ['username', 'email', 'createdAt'],
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
        status: 'PUBLISHED',
        createdBy: testUserId,
      },
    });
    testApiConfigId = testApiConfig.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.apiConfig.delete({ where: { id: testApiConfigId } });
    await prisma.field.deleteMany({ where: { entityId: testEntityId } });
    await prisma.entity.delete({ where: { id: testEntityId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('API Testing Execution', () => {
    it('should execute API test with basic parameters', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 10,
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('executionTime');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('headers');

      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.executionTime).toBe('number');
      expect(typeof response.body.statusCode).toBe('number');
    });

    it('should execute API test with filtering parameters', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 5,
          username: 'test',
          active: true,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.executionTime).toBeGreaterThan(0);
    });

    it('should execute API test with sorting parameters', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 10,
          sortBy: 'username',
          sortOrder: 'asc',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
    });

    it('should handle API test with invalid parameters', async () => {
      const testRequest = {
        parameters: {
          page: -1, // Invalid page number
          size: 1000, // Exceeds max page size
        },
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      // Should still return a response but with validation errors
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('validationErrors');
    });

    it('should execute API test with custom headers', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 10,
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test-value',
          'User-Agent': 'API-Tester/1.0',
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.requestHeaders).toMatchObject({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
        'User-Agent': 'API-Tester/1.0',
      });
    });
  });

  describe('API Testing Validation', () => {
    it('should validate API configuration before testing', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/validate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');
      expect(response.body).toHaveProperty('warnings');

      expect(typeof response.body.valid).toBe('boolean');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(Array.isArray(response.body.warnings)).toBe(true);
    });

    it('should validate request parameters against API configuration', async () => {
      const testRequest = {
        parameters: {
          invalidParam: 'should not be allowed',
          page: 'not a number', // Invalid type
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/validate-request`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');

      if (!response.body.valid) {
        expect(response.body.errors.length).toBeGreaterThan(0);
        expect(response.body.errors.some((error: any) => 
          error.field === 'page' && error.message.includes('number')
        )).toBe(true);
      }
    });

    it('should validate required authentication', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 10,
        },
        skipAuth: true, // Request to skip authentication
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      // Should return authentication error since API requires auth
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('authentication');
    });
  });

  describe('API Testing Response Analysis', () => {
    it('should analyze API response structure', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 5,
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body).toHaveProperty('responseAnalysis');
      
      const analysis = response.body.responseAnalysis;
      expect(analysis).toHaveProperty('structure');
      expect(analysis).toHaveProperty('dataTypes');
      expect(analysis).toHaveProperty('recordCount');
      expect(analysis).toHaveProperty('responseSize');
    });

    it('should measure API performance metrics', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 10,
        },
        measurePerformance: true,
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body).toHaveProperty('performanceMetrics');
      
      const metrics = response.body.performanceMetrics;
      expect(metrics).toHaveProperty('responseTime');
      expect(metrics).toHaveProperty('databaseQueryTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');

      expect(typeof metrics.responseTime).toBe('number');
      expect(metrics.responseTime).toBeGreaterThan(0);
    });

    it('should compare API response with expected schema', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 5,
        },
        expectedSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  username: { type: 'string' },
                  email: { type: 'string' },
                  age: { type: 'number' },
                  active: { type: 'boolean' },
                },
                required: ['id', 'username', 'email'],
              },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            size: { type: 'number' },
          },
          required: ['data', 'total', 'page', 'size'],
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body).toHaveProperty('schemaValidation');
      
      const validation = response.body.schemaValidation;
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('errors');

      if (!validation.valid) {
        expect(Array.isArray(validation.errors)).toBe(true);
      }
    });
  });

  describe('API Testing History', () => {
    it('should save API test execution history', async () => {
      const testRequest = {
        parameters: {
          page: 1,
          size: 10,
        },
        saveToHistory: true,
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(testRequest)
        .expect(200);

      expect(response.body).toHaveProperty('historyId');
      expect(typeof response.body.historyId).toBe('string');
    });

    it('should get API test execution history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api-configs/${testApiConfigId}/test-history`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          page: 1,
          size: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.records)).toBe(true);

      if (response.body.records.length > 0) {
        const historyRecord = response.body.records[0];
        expect(historyRecord).toHaveProperty('id');
        expect(historyRecord).toHaveProperty('executedAt');
        expect(historyRecord).toHaveProperty('success');
        expect(historyRecord).toHaveProperty('executionTime');
        expect(historyRecord).toHaveProperty('statusCode');
      }
    });

    it('should get specific test execution details', async () => {
      // First execute a test to get history ID
      const testResponse = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parameters: { page: 1, size: 5 },
          saveToHistory: true,
        })
        .expect(200);

      const historyId = testResponse.body.historyId;

      // Then get the execution details
      const response = await request(app.getHttpServer())
        .get(`/api-configs/${testApiConfigId}/test-history/${historyId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('request');
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('executionTime');
      expect(response.body).toHaveProperty('executedAt');
    });
  });

  describe('API Testing Batch Operations', () => {
    it('should execute batch API tests', async () => {
      const batchTestRequest = {
        tests: [
          {
            name: 'Test 1 - First page',
            parameters: { page: 1, size: 5 },
          },
          {
            name: 'Test 2 - Second page',
            parameters: { page: 2, size: 5 },
          },
          {
            name: 'Test 3 - With filter',
            parameters: { page: 1, size: 10, active: true },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/batch-test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(batchTestRequest)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results).toHaveLength(3);

      response.body.results.forEach((result: any, index: number) => {
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('executionTime');
        expect(result.name).toBe(batchTestRequest.tests[index].name);
      });
    });

    it('should generate API test report', async () => {
      const reportRequest = {
        testSuite: 'User API Tests',
        tests: [
          {
            name: 'Get all users',
            parameters: { page: 1, size: 10 },
          },
          {
            name: 'Get active users only',
            parameters: { page: 1, size: 10, active: true },
          },
        ],
        generateReport: true,
      };

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/batch-test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportRequest)
        .expect(200);

      expect(response.body).toHaveProperty('report');
      
      const report = response.body.report;
      expect(report).toHaveProperty('testSuite');
      expect(report).toHaveProperty('totalTests');
      expect(report).toHaveProperty('passedTests');
      expect(report).toHaveProperty('failedTests');
      expect(report).toHaveProperty('averageResponseTime');
      expect(report).toHaveProperty('executedAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent API configuration', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post(`/api-configs/${nonExistentId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ parameters: {} })
        .expect(404);
    });

    it('should handle malformed test request', async () => {
      const malformedRequest = {
        // Missing parameters
        headers: 'not an object',
      };

      await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(malformedRequest)
        .expect(400);
    });

    it('should require authentication for API testing', async () => {
      await request(app.getHttpServer())
        .post(`/api-configs/${testApiConfigId}/test`)
        .send({ parameters: {} })
        .expect(401);
    });

    it('should handle API configuration in draft status', async () => {
      // Create a draft API configuration
      const draftApiConfig = await prisma.apiConfig.create({
        data: {
          projectId: testProjectId,
          name: 'Draft API',
          path: '/api/draft',
          method: 'GET',
          description: 'Draft API configuration',
          entityId: testEntityId,
          authRequired: true,
          status: 'DRAFT',
          createdBy: testUserId,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api-configs/${draftApiConfig.id}/test`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ parameters: {} })
        .expect(400);

      expect(response.body.message).toContain('draft');

      // Clean up
      await prisma.apiConfig.delete({ where: { id: draftApiConfig.id } });
    });
  });
});
