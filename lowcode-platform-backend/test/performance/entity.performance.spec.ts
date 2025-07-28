import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

describe('Entity Performance Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let projectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();

    // Create a test project
    const projectResponse = await request(app.getHttpServer())
      .post('/v1/projects')
      .send({
        name: 'Performance Test Project',
        description: 'Project for performance testing',
        type: 'web',
      });

    projectId = projectResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.entity.deleteMany();
    await prisma.project.deleteMany();
    
    await prisma.$disconnect();
    await app.close();
  });

  describe('Entity Creation Performance', () => {
    it('should create 100 entities within acceptable time', async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        const entityDto = {
          projectId,
          name: `Entity ${i}`,
          code: `entity${i}`,
          tableName: `entity_${i}`,
          description: `Test entity ${i}`,
          category: 'test',
        };

        promises.push(
          request(app.getHttpServer())
            .post('/v1/entities')
            .send(entityDto)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      
      console.log(`Created 100 entities in ${duration}ms (${duration/100}ms per entity)`);
    }, 15000);

    it('should handle concurrent entity creation', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const entityDto = {
          projectId,
          name: `Concurrent Entity ${i}`,
          code: `concurrent_entity_${i}`,
          tableName: `concurrent_entity_${i}`,
          description: `Concurrent test entity ${i}`,
          category: 'concurrent',
        };

        promises.push(
          request(app.getHttpServer())
            .post('/v1/entities')
            .send(entityDto)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Should handle concurrent requests efficiently
      expect(duration).toBeLessThan(5000);
      
      console.log(`Handled ${concurrentRequests} concurrent requests in ${duration}ms`);
    }, 10000);
  });

  describe('Entity Query Performance', () => {
    beforeAll(async () => {
      // Create test entities for query performance testing
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const entityDto = {
          projectId,
          name: `Query Test Entity ${i}`,
          code: `query_entity_${i}`,
          tableName: `query_entity_${i}`,
          description: `Query test entity ${i}`,
          category: i % 2 === 0 ? 'even' : 'odd',
        };

        promises.push(
          request(app.getHttpServer())
            .post('/v1/entities')
            .send(entityDto)
        );
      }

      await Promise.all(promises);
    });

    it('should query entities by project efficiently', async () => {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app.getHttpServer())
          .get(`/v1/entities/project/${projectId}`)
          .expect(200);

        const endTime = Date.now();
        times.push(endTime - startTime);

        expect(response.body.length).toBeGreaterThan(0);
      }

      const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // Average response time should be under 500ms
      expect(averageTime).toBeLessThan(500);
      // Max response time should be under 1000ms
      expect(maxTime).toBeLessThan(1000);

      console.log(`Query performance - Average: ${averageTime}ms, Max: ${maxTime}ms`);
    });

    it('should handle paginated queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}/paginated`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.entities).toBeDefined();
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.entities.length).toBeLessThanOrEqual(20);

      // Paginated query should be fast
      expect(duration).toBeLessThan(300);

      console.log(`Paginated query completed in ${duration}ms`);
    });

    it('should handle filtered queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}/paginated`)
        .query({ 
          page: 1, 
          limit: 10,
          search: 'Query Test',
          category: 'even'
        })
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.entities).toBeDefined();
      
      // Filtered query should still be fast
      expect(duration).toBeLessThan(500);

      console.log(`Filtered query completed in ${duration}ms`);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks during bulk operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform bulk operations
      for (let batch = 0; batch < 5; batch++) {
        const promises = [];
        
        for (let i = 0; i < 20; i++) {
          const entityDto = {
            projectId,
            name: `Memory Test Entity ${batch}-${i}`,
            code: `memory_entity_${batch}_${i}`,
            tableName: `memory_entity_${batch}_${i}`,
            description: `Memory test entity ${batch}-${i}`,
            category: 'memory_test',
          };

          promises.push(
            request(app.getHttpServer())
              .post('/v1/entities')
              .send(entityDto)
          );
        }

        await Promise.all(promises);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`Memory usage - Initial: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB, Final: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB, Increase: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    }, 30000);
  });

  describe('Database Connection Performance', () => {
    it('should handle database connections efficiently', async () => {
      const connectionTimes = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        
        // Simple database query to test connection
        await prisma.entity.count({
          where: { projectId }
        });

        const endTime = Date.now();
        connectionTimes.push(endTime - startTime);
      }

      const averageConnectionTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
      const maxConnectionTime = Math.max(...connectionTimes);

      // Database queries should be fast
      expect(averageConnectionTime).toBeLessThan(100);
      expect(maxConnectionTime).toBeLessThan(200);

      console.log(`Database connection performance - Average: ${averageConnectionTime}ms, Max: ${maxConnectionTime}ms`);
    });
  });

  describe('Response Size Tests', () => {
    it('should handle large response payloads efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const responseSize = JSON.stringify(response.body).length;

      // Should handle large responses within reasonable time
      expect(duration).toBeLessThan(1000);

      console.log(`Response size: ${Math.round(responseSize / 1024)}KB, Time: ${duration}ms`);
    });
  });
});
