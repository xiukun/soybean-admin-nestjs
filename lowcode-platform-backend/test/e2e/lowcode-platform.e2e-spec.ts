import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/shared/infrastructure/database/prisma.service';

describe('Lowcode Platform (e2e)', () => {
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
    await prisma.entity.deleteMany();
    await prisma.project.deleteMany();
    
    await prisma.$disconnect();
    await app.close();
  });

  describe('Project Management Flow', () => {
    let projectId: string;

    it('should create a new project', async () => {
      const createProjectDto = {
        name: 'E2E Test Project',
        description: 'Project for end-to-end testing',
        type: 'web',
        config: {
          framework: 'react',
          database: 'postgresql',
        },
      };

      const response = await request(app.getHttpServer())
        .post('/v1/projects')
        .send(createProjectDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createProjectDto.name);
      expect(response.body.description).toBe(createProjectDto.description);
      expect(response.body.type).toBe(createProjectDto.type);
      expect(response.body.status).toBe('ACTIVE');

      projectId = response.body.id;
    });

    it('should get project by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/projects/${projectId}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('E2E Test Project');
    });

    it('should update project', async () => {
      const updateDto = {
        name: 'Updated E2E Test Project',
        description: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/projects/${projectId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.description).toBe(updateDto.description);
    });
  });

  describe('Entity Management Flow', () => {
    let projectId: string;
    let entityId: string;

    beforeAll(async () => {
      // Create a project for entity tests
      const createProjectDto = {
        name: 'Entity Test Project',
        description: 'Project for entity testing',
        type: 'web',
      };

      const projectResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .send(createProjectDto);

      projectId = projectResponse.body.id;
    });

    it('should create a new entity', async () => {
      const createEntityDto = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity for testing',
        category: 'core',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(createEntityDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createEntityDto.name);
      expect(response.body.code).toBe(createEntityDto.code);
      expect(response.body.tableName).toBe(createEntityDto.tableName);
      expect(response.body.status).toBe('DRAFT');

      entityId = response.body.id;
    });

    it('should get entity by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/entities/${entityId}`)
        .expect(200);

      expect(response.body.id).toBe(entityId);
      expect(response.body.name).toBe('User');
      expect(response.body.code).toBe('user');
    });

    it('should get entities by project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(entityId);
      expect(response.body[0].name).toBe('User');
    });

    it('should get paginated entities', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}/paginated`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('entities');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.entities).toHaveLength(1);
      expect(response.body.total).toBe(1);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('should update entity', async () => {
      const updateDto = {
        name: 'Updated User',
        description: 'Updated user entity',
      };

      const response = await request(app.getHttpServer())
        .put(`/v1/entities/${entityId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
      expect(response.body.description).toBe(updateDto.description);
    });

    it('should get entity by code', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}/code/user`)
        .expect(200);

      expect(response.body.id).toBe(entityId);
      expect(response.body.code).toBe('user');
      expect(response.body.name).toBe('Updated User');
    });

    it('should get entity statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/entities/project/${projectId}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('draft');
      expect(response.body).toHaveProperty('published');
      expect(response.body).toHaveProperty('deprecated');
      expect(response.body.total).toBe(1);
      expect(response.body.draft).toBe(1);
    });

    it('should delete entity', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/entities/${entityId}`)
        .expect(200);

      // Verify entity is deleted
      await request(app.getHttpServer())
        .get(`/v1/entities/${entityId}`)
        .expect(404);
    });
  });

  describe('Relationship Management Flow', () => {
    let projectId: string;
    let userEntityId: string;
    let orderEntityId: string;
    let relationshipId: string;

    beforeAll(async () => {
      // Create a project for relationship tests
      const createProjectDto = {
        name: 'Relationship Test Project',
        description: 'Project for relationship testing',
        type: 'web',
      };

      const projectResponse = await request(app.getHttpServer())
        .post('/v1/projects')
        .send(createProjectDto);

      projectId = projectResponse.body.id;

      // Create User entity
      const userEntityDto = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        category: 'core',
      };

      const userResponse = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(userEntityDto);

      userEntityId = userResponse.body.id;

      // Create Order entity
      const orderEntityDto = {
        projectId,
        name: 'Order',
        code: 'order',
        tableName: 'orders',
        category: 'business',
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/v1/entities')
        .send(orderEntityDto);

      orderEntityId = orderResponse.body.id;
    });

    it('should create a new relationship', async () => {
      const createRelationshipDto = {
        projectId,
        name: 'User Orders',
        code: 'userOrders',
        type: 'ONE_TO_MANY',
        sourceEntityId: userEntityId,
        targetEntityId: orderEntityId,
        description: 'User has many orders',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      };

      const response = await request(app.getHttpServer())
        .post('/v1/relationships')
        .send(createRelationshipDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(createRelationshipDto.name);
      expect(response.body.code).toBe(createRelationshipDto.code);
      expect(response.body.type).toBe(createRelationshipDto.type);
      expect(response.body.sourceEntityId).toBe(userEntityId);
      expect(response.body.targetEntityId).toBe(orderEntityId);

      relationshipId = response.body.id;
    });

    it('should get relationship by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/relationships/${relationshipId}`)
        .expect(200);

      expect(response.body.id).toBe(relationshipId);
      expect(response.body.name).toBe('User Orders');
      expect(response.body.type).toBe('ONE_TO_MANY');
    });

    it('should get relationships by project', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/relationships/project/${projectId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(relationshipId);
      expect(response.body[0].name).toBe('User Orders');
    });

    it('should get paginated relationships', async () => {
      const response = await request(app.getHttpServer())
        .get(`/v1/relationships/project/${projectId}/paginated`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('relationships');
      expect(response.body).toHaveProperty('total');
      expect(response.body.relationships).toHaveLength(1);
      expect(response.body.total).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent project', async () => {
      await request(app.getHttpServer())
        .get('/v1/projects/non-existent-id')
        .expect(404);
    });

    it('should return 404 for non-existent entity', async () => {
      await request(app.getHttpServer())
        .get('/v1/entities/non-existent-id')
        .expect(404);
    });

    it('should return 400 for invalid project data', async () => {
      const invalidDto = {
        name: '', // Empty name should be invalid
        type: 'invalid-type',
      };

      await request(app.getHttpServer())
        .post('/v1/projects')
        .send(invalidDto)
        .expect(400);
    });

    it('should return 400 for invalid entity data', async () => {
      const invalidDto = {
        projectId: '',
        name: '',
        code: 'invalid-code!', // Invalid characters
      };

      await request(app.getHttpServer())
        .post('/v1/entities')
        .send(invalidDto)
        .expect(400);
    });
  });
});
