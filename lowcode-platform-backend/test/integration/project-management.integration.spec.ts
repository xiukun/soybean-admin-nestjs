import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AmisDeploymentService } from '@project/application/services/amis-deployment.service';

describe('Project Management Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let createdProjectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user and generate auth token
    const testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
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
    // Clean up test data
    if (createdProjectId) {
      await prisma.project.delete({
        where: { id: createdProjectId },
      });
    }
    
    await prisma.user.delete({
      where: { id: testUserId },
    });

    await app.close();
  });

  describe('Project CRUD Operations', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project for integration testing',
        version: '1.0.0',
        status: 'ACTIVE',
        config: {
          database: {
            type: 'postgresql',
            host: 'localhost',
            port: 5432,
          },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: projectData.name,
        description: projectData.description,
        version: projectData.version,
        status: projectData.status,
        createdBy: testUserId,
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      createdProjectId = response.body.id;
    });

    it('should get project by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdProjectId,
        name: 'Test Project',
        description: 'A test project for integration testing',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      });
    });

    it('should get paginated project list', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects/paginated')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('size');

      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body.records.length).toBeGreaterThan(0);

      const project = response.body.records.find(
        (p: any) => p.id === createdProjectId
      );
      expect(project).toBeDefined();
    });

    it('should update project', async () => {
      const updateData = {
        name: 'Updated Test Project',
        description: 'Updated description',
        version: '1.1.0',
        status: 'INACTIVE',
      };

      const response = await request(app.getHttpServer())
        .put(`/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: createdProjectId,
        name: updateData.name,
        description: updateData.description,
        version: updateData.version,
        status: updateData.status,
        updatedBy: testUserId,
      });

      expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
    });

    it('should search projects by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects/paginated')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          search: 'Updated Test',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      expect(response.body.records[0].name).toContain('Updated Test');
    });

    it('should filter projects by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects/paginated')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          current: 1,
          size: 10,
          status: 'INACTIVE',
        })
        .expect(200);

      expect(response.body.records.length).toBeGreaterThan(0);
      response.body.records.forEach((project: any) => {
        expect(project.status).toBe('INACTIVE');
      });
    });
  });

  describe('Project Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Missing name field',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate project name uniqueness', async () => {
      const duplicateData = {
        name: 'Updated Test Project', // Same name as updated project
        description: 'Duplicate name test',
        version: '1.0.0',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409); // Conflict
    });

    it('should validate version format', async () => {
      const invalidVersionData = {
        name: 'Invalid Version Project',
        description: 'Testing invalid version',
        version: 'invalid-version',
        status: 'ACTIVE',
      };

      await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidVersionData)
        .expect(400);
    });
  });

  describe('Project Authorization', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .expect(401);
    });

    it('should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Project Statistics', () => {
    it('should get project statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/projects/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('inactive');
      expect(response.body).toHaveProperty('archived');

      expect(typeof response.body.total).toBe('number');
      expect(typeof response.body.active).toBe('number');
      expect(typeof response.body.inactive).toBe('number');
      expect(typeof response.body.archived).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent project', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle invalid project id format', async () => {
      await request(app.getHttpServer())
        .get('/projects/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll skip it but it's important for production
    });
  });

  describe('Project Deployment', () => {
    let deploymentService: AmisDeploymentService;
    let testProjectId: string;

    beforeAll(async () => {
      deploymentService = app.get<AmisDeploymentService>(AmisDeploymentService);

      // Create a test project for deployment
      const projectData = {
        name: 'Deployment Test Project',
        code: 'deployment-test',
        description: 'Project for testing deployment functionality',
        version: '1.0.0',
        status: 'ACTIVE',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      testProjectId = response.body.data.id;
    });

    describe('POST /api/v1/projects/:id/deploy', () => {
      it('should deploy project successfully', async () => {
        const deployConfig = {
          port: 9525,
          config: {
            environment: 'test',
            autoRestart: true
          }
        };

        const response = await request(app.getHttpServer())
          .post(`/api/v1/projects/${testProjectId}/deploy`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(deployConfig)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.deploymentStatus).toBe('DEPLOYING');
        expect(response.body.data.deploymentPort).toBe(9525);
      });

      it('should reject deployment with invalid port', async () => {
        const invalidConfig = {
          port: 80, // Privileged port
          config: {}
        };

        await request(app.getHttpServer())
          .post(`/api/v1/projects/${testProjectId}/deploy`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidConfig)
          .expect(400);
      });
    });

    afterAll(async () => {
      // Clean up test project
      if (testProjectId) {
        await prisma.project.delete({
          where: { id: testProjectId }
        });
      }
    });
  });
});
