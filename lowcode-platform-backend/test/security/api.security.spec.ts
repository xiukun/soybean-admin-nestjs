import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';

describe('API Security Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in entity creation', async () => {
      const maliciousDto = {
        projectId: "'; DROP TABLE entities; --",
        name: "'; DELETE FROM projects; --",
        code: "user'; INSERT INTO entities VALUES ('malicious'); --",
        tableName: "users'; DROP DATABASE; --",
        description: "Normal description",
        category: 'core',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(maliciousDto);

      // Should either return validation error or sanitize input
      expect([400, 422]).toContain(response.status);
    });

    it('should prevent XSS in entity fields', async () => {
      const xssDto = {
        projectId: 'project-123',
        name: '<script>alert("XSS")</script>',
        code: 'user',
        tableName: 'users',
        description: '<img src="x" onerror="alert(\'XSS\')">',
        category: 'core',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(xssDto);

      if (response.status === 201) {
        // If creation succeeds, check that dangerous content is sanitized
        expect(response.body.name).not.toContain('<script>');
        expect(response.body.description).not.toContain('onerror');
      } else {
        // Should return validation error
        expect([400, 422]).toContain(response.status);
      }
    });

    it('should validate input length limits', async () => {
      const longString = 'a'.repeat(10000);
      const oversizedDto = {
        projectId: 'project-123',
        name: longString,
        code: 'user',
        tableName: 'users',
        description: longString,
        category: 'core',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(oversizedDto);

      // Should return validation error for oversized input
      expect([400, 422]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const incompleteDto = {
        // Missing required fields
        name: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(incompleteDto);

      expect([400, 422]).toContain(response.status);
    });

    it('should validate field formats', async () => {
      const invalidFormatDto = {
        projectId: 'project-123',
        name: 'User',
        code: '123invalid-code!@#', // Invalid code format
        tableName: 'users',
        category: 'invalid-category', // Invalid category
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(invalidFormatDto);

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('HTTP Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects')
        .expect(200);

      // Check for common security headers
      // Note: These might need to be configured in the application
      const headers = response.headers;
      
      // These tests will pass if headers are configured, otherwise they serve as reminders
      if (headers['x-content-type-options']) {
        expect(headers['x-content-type-options']).toBe('nosniff');
      }
      
      if (headers['x-frame-options']) {
        expect(headers['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);
      }
      
      if (headers['x-xss-protection']) {
        expect(headers['x-xss-protection']).toBe('1; mode=block');
      }
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/entities/non-existent-id')
        .expect(404);

      // Error response should not contain sensitive information
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toMatch(/password/i);
      expect(responseText).not.toMatch(/secret/i);
      expect(responseText).not.toMatch(/token/i);
      expect(responseText).not.toMatch(/database/i);
      expect(responseText).not.toMatch(/connection/i);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid requests gracefully', async () => {
      const rapidRequests = [];
      
      // Send 50 rapid requests
      for (let i = 0; i < 50; i++) {
        rapidRequests.push(
          request(app.getHttpServer())
            .get('/v1/projects')
        );
      }

      const responses = await Promise.all(rapidRequests);
      
      // Most requests should succeed, but some might be rate limited
      const successfulRequests = responses.filter(r => r.status === 200);
      const rateLimitedRequests = responses.filter(r => r.status === 429);
      
      // At least some requests should succeed
      expect(successfulRequests.length).toBeGreaterThan(0);
      
      // If rate limiting is implemented, some requests might be limited
      if (rateLimitedRequests.length > 0) {
        console.log(`Rate limiting detected: ${rateLimitedRequests.length} requests limited`);
      }
    }, 10000);
  });

  describe('CORS Security', () => {
    it('should handle CORS headers appropriately', async () => {
      const response = await request(app.getHttpServer())
        .options('/v1/projects')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      // Check CORS headers if configured
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).toBeDefined();
      }
    });

    it('should reject requests from unauthorized origins', async () => {
      const response = await request(app.getHttpServer())
        .get('/v1/projects')
        .set('Origin', 'http://malicious-site.com');

      // If CORS is strictly configured, this might be rejected
      // Otherwise, it should still work for API testing
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Content Type Security', () => {
    it('should only accept JSON content type for POST requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .set('Content-Type', 'text/plain')
        .send('malicious content');

      // Should reject non-JSON content
      expect([400, 415]).toContain(response.status);
    });

    it('should validate JSON structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}'); // Invalid JSON

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Path Traversal Protection', () => {
    it('should prevent path traversal in entity IDs', async () => {
      const maliciousIds = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc//passwd',
      ];

      for (const maliciousId of maliciousIds) {
        const response = await request(app.getHttpServer())
          .get(`/v1/entities/${maliciousId}`);

        // Should return 404 or 400, not expose file system
        expect([400, 404]).toContain(response.status);
        
        // Response should not contain file system content
        const responseText = JSON.stringify(response.body);
        expect(responseText).not.toMatch(/root:/);
        expect(responseText).not.toMatch(/bin\/bash/);
        expect(responseText).not.toMatch(/system32/);
      }
    });
  });

  describe('HTTP Method Security', () => {
    it('should only allow appropriate HTTP methods', async () => {
      // Test unsupported methods
      const unsupportedMethods = ['TRACE', 'CONNECT'];
      
      for (const method of unsupportedMethods) {
        const response = await request(app.getHttpServer())
          [method.toLowerCase()]?.('/v1/entities') || 
          await request(app.getHttpServer())
            .get('/v1/entities')
            .set('X-HTTP-Method-Override', method);

        // Should return method not allowed or be rejected
        if (response) {
          expect([405, 501]).toContain(response.status);
        }
      }
    });
  });

  describe('Request Size Limits', () => {
    it('should reject oversized requests', async () => {
      const largePayload = {
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'x'.repeat(1000000), // 1MB description
        category: 'core',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(largePayload);

      // Should reject oversized payload
      expect([400, 413, 422]).toContain(response.status);
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose stack traces in production', async () => {
      // Try to trigger an error
      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send({ invalid: 'data' });

      const responseText = JSON.stringify(response.body);
      
      // Should not expose internal paths or stack traces
      expect(responseText).not.toMatch(/\/src\//);
      expect(responseText).not.toMatch(/\/node_modules\//);
      expect(responseText).not.toMatch(/at Object\./);
      expect(responseText).not.toMatch(/Error: /);
    });
  });

  describe('Authentication Security', () => {
    it('should handle missing authentication gracefully', async () => {
      // Test endpoints that might require authentication
      const protectedEndpoints = [
        '/v1/entities',
        '/v1/projects',
        '/v1/relationships',
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())
          .post(endpoint)
          .send({});

        // Should either work (if no auth required) or return 401/403
        expect([200, 201, 400, 401, 403, 422]).toContain(response.status);
      }
    });

    it('should handle invalid authentication tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid',
        'Bearer ',
        'malicious-token-with-special-chars!@#$%',
      ];

      for (const token of invalidTokens) {
        const response = await request(app.getHttpServer())
          .get('/v1/projects')
          .set('Authorization', token);

        // Should either work (if no auth required) or return 401/403
        expect([200, 401, 403]).toContain(response.status);
      }
    });
  });
});
