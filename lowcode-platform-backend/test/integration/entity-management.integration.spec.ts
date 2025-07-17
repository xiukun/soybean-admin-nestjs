import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Entity Management Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let createdEntityId: string;

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
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Test Project for Entities',
        description: 'Test project for entity management',
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
    if (createdEntityId) {
      await prisma.entity.delete({
        where: { id: createdEntityId },
      });
    }

    await prisma.project.delete({
      where: { id: testProjectId },
    });

    await prisma.user.delete({
      where: { id: testUserId },
    });

    await app.close();
  });

  describe('Entity CRUD Operations', () => {
    it('should create a new entity', async () => {
      const entityData = {
        projectId: testProjectId,
        name: 'User',
        code: 'user',
        description: 'User entity for testing',
        tableName: 'users',
        category: 'core',
        status: 'DRAFT',
        config: {
          softDelete: true,
          timestamps: true,
        },
      };

      const response = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      expect(response.body).toMatchObject({
        projectId: testProjectId,
        name: entityData.name,
        code: entityData.code,
        description: entityData.description,
        tableName: entityData.tableName,
        category: entityData.category,
        status: entityData.status,
        createdBy: testUserId,
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.version).toBe(1);
      createdEntityId = response.body.id;
    });

    it('should get entity by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/${createdEntityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdEntityId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        category: 'core',
        status: 'DRAFT',
      });
    });

    it('should get entities by project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const entity = response.body.find((e: any) => e.id === createdEntityId);
      expect(entity).toBeDefined();
    });

    it('should get paginated entities', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('total');
      expect(response.body.records.length).toBeGreaterThan(0);
    });

    it('should update entity', async () => {
      const updateData = {
        name: 'Updated User',
        description: 'Updated user entity',
        status: 'PUBLISHED',
        category: 'business',
      };

      const response = await request(app.getHttpServer())
        .put(`/entities/${createdEntityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdEntityId,
        name: updateData.name,
        description: updateData.description,
        status: updateData.status,
        category: updateData.category,
        updatedBy: testUserId,
      });

      expect(response.body.version).toBe(2);
    });

    it('should search entities by name', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          search: 'Updated User',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      expect(response.body.records[0].name).toContain('Updated User');
    });

    it('should filter entities by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          status: 'PUBLISHED',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((entity: any) => {
        expect(entity.status).toBe('PUBLISHED');
      });
    });

    it('should filter entities by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/paginated`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          category: 'business',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((entity: any) => {
        expect(entity.category).toBe('business');
      });
    });
  });

  describe('Entity Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        projectId: testProjectId,
        description: 'Missing required fields',
      };

      await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate entity code uniqueness within project', async () => {
      const duplicateData = {
        projectId: testProjectId,
        name: 'Another User',
        code: 'user', // Same code as existing entity
        tableName: 'another_users',
        category: 'core',
        status: 'DRAFT',
      };

      await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);
    });

    it('should validate table name uniqueness within project', async () => {
      const duplicateTableData = {
        projectId: testProjectId,
        name: 'Another Entity',
        code: 'another_entity',
        tableName: 'users', // Same table name as existing entity
        category: 'core',
        status: 'DRAFT',
      };

      await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateTableData)
        .expect(409);
    });

    it('should validate entity code format', async () => {
      const invalidCodeData = {
        projectId: testProjectId,
        name: 'Invalid Code Entity',
        code: 'Invalid Code!', // Invalid characters
        tableName: 'invalid_code_entity',
        category: 'core',
        status: 'DRAFT',
      };

      await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCodeData)
        .expect(400);
    });

    it('should validate table name format', async () => {
      const invalidTableData = {
        projectId: testProjectId,
        name: 'Invalid Table Entity',
        code: 'invalid_table_entity',
        tableName: 'Invalid Table!', // Invalid characters
        category: 'core',
        status: 'DRAFT',
      };

      await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTableData)
        .expect(400);
    });
  });

  describe('Entity Statistics', () => {
    it('should get entity statistics for project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/project/${testProjectId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('draft');
      expect(response.body).toHaveProperty('published');
      expect(response.body).toHaveProperty('deprecated');

      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBeGreaterThan(0);
    });
  });

  describe('Entity Operations', () => {
    it('should publish entity', async () => {
      // First create a draft entity
      const draftEntity = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Draft Entity',
          code: 'draft_entity',
          tableName: 'draft_entities',
          category: 'core',
          status: 'DRAFT',
        })
        .expect(201);

      // Then publish it
      const response = await request(app.getHttpServer())
        .post(`/entities/${draftEntity.body.id}/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('PUBLISHED');

      // Clean up
      await prisma.entity.delete({
        where: { id: draftEntity.body.id },
      });
    });

    it('should deprecate entity', async () => {
      // First create a published entity
      const publishedEntity = await request(app.getHttpServer())
        .post('/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProjectId,
          name: 'Published Entity',
          code: 'published_entity',
          tableName: 'published_entities',
          category: 'core',
          status: 'PUBLISHED',
        })
        .expect(201);

      // Then deprecate it
      const response = await request(app.getHttpServer())
        .post(`/entities/${publishedEntity.body.id}/deprecate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('DEPRECATED');

      // Clean up
      await prisma.entity.delete({
        where: { id: publishedEntity.body.id },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent entity', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/entities/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle non-existent project', async () => {
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/entities/project/${nonExistentProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/entities')
        .expect(401);
    });
  });
});
