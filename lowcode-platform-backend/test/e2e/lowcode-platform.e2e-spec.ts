import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Lowcode Platform Integration Tests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Projects API', () => {
    it('/api/v1/projects (GET) - should return paginated projects', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/paginated?current=1&size=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('current');
          expect(res.body).toHaveProperty('size');
        });
    });

    it('/api/v1/projects/:id (GET) - should return project by id', () => {
      return request(app.getHttpServer())
        .get('/api/v1/projects/demo-project-1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', 'demo-project-1');
          expect(res.body.data).toHaveProperty('name');
          expect(res.body.data).toHaveProperty('description');
        });
    });
  });

  describe('Entities API', () => {
    it('/api/v1/entities (GET) - should return paginated entities', () => {
      return request(app.getHttpServer())
        .get('/api/v1/entities/paginated?current=1&size=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('/api/v1/entities/:id (GET) - should return entity by id', () => {
      return request(app.getHttpServer())
        .get('/api/v1/entities/demo-entity-user')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', 'demo-entity-user');
          expect(res.body.data).toHaveProperty('name');
          expect(res.body.data).toHaveProperty('fields');
        });
    });
  });

  describe('Code Templates API', () => {
    it('/api/v1/code-templates (GET) - should return paginated templates', () => {
      return request(app.getHttpServer())
        .get('/api/v1/code-templates/paginated?current=1&size=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('/api/v1/code-templates/:id (GET) - should return template by id', () => {
      return request(app.getHttpServer())
        .get('/api/v1/code-templates/tpl-nestjs-entity-model')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id', 'tpl-nestjs-entity-model');
          expect(res.body.data).toHaveProperty('name');
          expect(res.body.data).toHaveProperty('content');
        });
    });
  });

  describe('Code Generation API', () => {
    it('/api/v1/code-generation/generate (POST) - should generate code successfully', () => {
      const generateRequest = {
        projectId: 'demo-project-1',
        templateIds: ['tpl-nestjs-entity-model'],
        entityIds: ['demo-entity-user'],
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
        .send(generateRequest)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('generatedFiles');
          expect(Array.isArray(res.body.generatedFiles)).toBe(true);
        });
    });

    it('/api/v1/code-generation/validate (POST) - should validate generation request', () => {
      const validateRequest = {
        projectId: 'demo-project-1',
        templateIds: ['tpl-nestjs-entity-model'],
        entityIds: ['demo-entity-user'],
        variables: {}
      };

      return request(app.getHttpServer())
        .post('/api/v1/code-generation/validate')
        .send(validateRequest)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('valid');
          expect(res.body).toHaveProperty('issues');
        });
    });
  });

  describe('Health Check', () => {
    it('/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('details');
        });
    });
  });

  describe('Service Communication', () => {
    it('should communicate with amis-lowcode-backend successfully', async () => {
      // Test that the lowcode platform can communicate with amis backend
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/demo-project-1');
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
    });
  });
});
