import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Low-code Platform Performance Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user and project
    const testUser = await prisma.user.create({
      data: {
        username: 'perfuser',
        email: 'perf@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    const testProject = await prisma.project.create({
      data: {
        name: 'Performance Test Project',
        description: 'Project for performance testing',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testProjectId = testProject.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.entity.deleteMany({
      where: { projectId: testProjectId },
    });
    
    await prisma.project.delete({
      where: { id: testProjectId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await app.close();
  });

  describe('Concurrent Entity Creation', () => {
    it('should handle concurrent entity creation requests', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentRequests }, (_, index) =>
        request(app.getHttpServer())
          .post('/entities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId: testProjectId,
            name: `Concurrent Entity ${index}`,
            code: `concurrent_entity_${index}`,
            tableName: `concurrent_entities_${index}`,
            category: 'core',
            status: 'DRAFT',
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(`Concurrent Entity ${index}`);
      });

      // Performance assertion - should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 10 concurrent requests

      console.log(`Concurrent entity creation: ${concurrentRequests} requests in ${duration}ms`);
      console.log(`Average response time: ${duration / concurrentRequests}ms per request`);
    });
  });

  describe('Bulk Data Operations', () => {
    it('should handle bulk entity creation efficiently', async () => {
      const bulkSize = 50;
      const startTime = Date.now();

      const entityPromises = Array.from({ length: bulkSize }, (_, index) =>
        request(app.getHttpServer())
          .post('/entities')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            projectId: testProjectId,
            name: `Bulk Entity ${index}`,
            code: `bulk_entity_${index}`,
            tableName: `bulk_entities_${index}`,
            category: 'business',
            status: 'DRAFT',
          })
      );

      const responses = await Promise.all(entityPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all entities were created
      expect(responses.length).toBe(bulkSize);
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body.name).toBe(`Bulk Entity ${index}`);
      });

      // Performance metrics
      const avgResponseTime = duration / bulkSize;
      console.log(`Bulk entity creation: ${bulkSize} entities in ${duration}ms`);
      console.log(`Average time per entity: ${avgResponseTime}ms`);

      // Performance assertion
      expect(avgResponseTime).toBeLessThan(200); // Each entity should be created in less than 200ms on average
    });

    it('should handle large paginated queries efficiently', async () => {
      const pageSize = 20;
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: pageSize,
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.records).toBeDefined();
      expect(response.body.records.length).toBeLessThanOrEqual(pageSize);
      expect(response.body.total).toBeGreaterThan(0);

      console.log(`Paginated query: ${response.body.total} total records, page size ${pageSize} in ${duration}ms`);

      // Performance assertion - pagination should be fast
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Search Performance', () => {
    it('should handle search queries efficiently', async () => {
      const searchTerms = ['Bulk', 'Entity', 'Concurrent', 'Test'];
      
      for (const term of searchTerms) {
        const startTime = Date.now();

        const response = await request(app.getHttpServer())
          .get(`/entities/project/${testProjectId}/paginated`)
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            current: 1,
            size: 10,
            search: term,
          })
          .expect(200);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.body.records).toBeDefined();
        console.log(`Search for "${term}": ${response.body.records.length} results in ${duration}ms`);

        // Search should be fast
        expect(duration).toBeLessThan(500);
      }
    });

    it('should handle complex filter combinations efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          search: 'Entity',
          status: 'DRAFT',
          category: 'business',
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.records).toBeDefined();
      console.log(`Complex filter query: ${response.body.records.length} results in ${duration}ms`);

      // Complex queries should still be reasonably fast
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during repeated operations', async () => {
      const iterations = 100;
      const initialMemory = process.memoryUsage();

      for (let i = 0; i < iterations; i++) {
        await request(app.getHttpServer())
          .get(`/entities/project/${testProjectId}/paginated`)
          .set('Authorization', `Bearer ${authToken}`)
          .query({
            current: 1,
            size: 5,
          })
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreasePerOp = memoryIncrease / iterations;

      console.log(`Memory usage after ${iterations} operations:`);
      console.log(`Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Per operation: ${(memoryIncreasePerOp / 1024).toFixed(2)} KB`);

      // Memory increase should be reasonable (less than 1KB per operation)
      expect(memoryIncreasePerOp).toBeLessThan(1024);
    });
  });

  describe('Database Connection Pool', () => {
    it('should handle high concurrent database operations', async () => {
      const concurrentQueries = 20;
      const startTime = Date.now();

      const promises = Array.from({ length: concurrentQueries }, () =>
        request(app.getHttpServer())
          .get(`/entities/project/${testProjectId}/stats`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All queries should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('total');
      });

      console.log(`${concurrentQueries} concurrent DB queries completed in ${duration}ms`);
      console.log(`Average query time: ${duration / concurrentQueries}ms`);

      // Should handle concurrent queries efficiently
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Response Time Benchmarks', () => {
    const benchmarks = [
      { endpoint: '/projects', method: 'GET', maxTime: 500 },
      { endpoint: `/projects/${testProjectId}`, method: 'GET', maxTime: 200 },
      { endpoint: `/entities/project/${testProjectId}`, method: 'GET', maxTime: 500 },
      { endpoint: `/entities/project/${testProjectId}/stats`, method: 'GET', maxTime: 300 },
    ];

    benchmarks.forEach(({ endpoint, method, maxTime }) => {
      it(`${method} ${endpoint} should respond within ${maxTime}ms`, async () => {
        const startTime = Date.now();

        const response = await request(app.getHttpServer())
          [method.toLowerCase()](`${endpoint}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`${method} ${endpoint}: ${duration}ms`);
        expect(duration).toBeLessThan(maxTime);
      });
    });
  });

  describe('Stress Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const duration = 10000; // 10 seconds
      const requestInterval = 100; // Request every 100ms
      const startTime = Date.now();
      let requestCount = 0;
      let successCount = 0;
      let errorCount = 0;

      const makeRequest = async () => {
        try {
          requestCount++;
          const response = await request(app.getHttpServer())
            .get(`/entities/project/${testProjectId}/paginated`)
            .set('Authorization', `Bearer ${authToken}`)
            .query({ current: 1, size: 5 })
            .timeout(5000);

          if (response.status === 200) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      };

      // Start sustained load
      const interval = setInterval(makeRequest, requestInterval);

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, duration));

      // Stop making requests
      clearInterval(interval);

      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      const successRate = (successCount / requestCount) * 100;

      console.log(`Stress test results (${actualDuration}ms):`);
      console.log(`Total requests: ${requestCount}`);
      console.log(`Successful: ${successCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log(`Success rate: ${successRate.toFixed(2)}%`);
      console.log(`Requests per second: ${(requestCount / (actualDuration / 1000)).toFixed(2)}`);

      // Should maintain high success rate under load
      expect(successRate).toBeGreaterThan(95);
      expect(requestCount).toBeGreaterThan(50); // Should have made reasonable number of requests
    });
  });
});
