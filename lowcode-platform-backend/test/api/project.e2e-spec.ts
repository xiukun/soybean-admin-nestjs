import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/lib/shared/prisma/prisma.service';

describe('ProjectController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdProjectId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    
    await app.init();
  });

  afterAll(async () => {
    // 清理测试数据
    if (createdProjectId) {
      await prisma.project.deleteMany({
        where: {
          OR: [
            { id: createdProjectId },
            { code: { startsWith: 'test_' } },
          ],
        },
      });
    }
    
    await app.close();
  });

  describe('/api/v1/projects (POST)', () => {
    it('should create a new project', async () => {
      const createProjectDto = {
        name: 'Test Project',
        code: 'test_project',
        description: 'A test project for e2e testing',
        version: '1.0.0',
        config: { theme: 'default' },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send(createProjectDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createProjectDto.name,
        code: createProjectDto.code,
        description: createProjectDto.description,
        version: createProjectDto.version,
        status: 'ACTIVE',
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      
      createdProjectId = response.body.id;
    });

    it('should return 409 when creating project with duplicate code', async () => {
      const createProjectDto = {
        name: 'Duplicate Project',
        code: 'test_project', // 使用已存在的代码
        description: 'This should fail',
      };

      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send(createProjectDto)
        .expect(409);
    });

    it('should return 400 when creating project with invalid data', async () => {
      const createProjectDto = {
        name: '', // 空名称应该失败
        code: 'invalid_project',
      };

      await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send(createProjectDto)
        .expect(400);
    });
  });

  describe('/api/v1/projects (GET)', () => {
    it('should get all projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const project = response.body.find(p => p.id === createdProjectId);
      expect(project).toBeDefined();
    });
  });

  describe('/api/v1/projects/paginated (GET)', () => {
    it('should get paginated projects', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/paginated?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('projects');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('totalPages');
      
      expect(Array.isArray(response.body.projects)).toBe(true);
    });

    it('should filter projects by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/paginated?status=ACTIVE')
        .expect(200);

      expect(response.body.projects.every(p => p.status === 'ACTIVE')).toBe(true);
    });

    it('should search projects by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/paginated?search=Test')
        .expect(200);

      expect(response.body.projects.some(p => p.name.includes('Test'))).toBe(true);
    });
  });

  describe('/api/v1/projects/:id (GET)', () => {
    it('should get project by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/projects/${createdProjectId}`)
        .expect(200);

      expect(response.body.id).toBe(createdProjectId);
      expect(response.body.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${nonExistentId}`)
        .expect(404);
    });
  });

  describe('/api/v1/projects/code/:code (GET)', () => {
    it('should get project by code', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/code/test_project')
        .expect(200);

      expect(response.body.code).toBe('test_project');
      expect(response.body.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project code', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/projects/code/non_existent_code')
        .expect(404);
    });
  });

  describe('/api/v1/projects/:id (PUT)', () => {
    it('should update project', async () => {
      const updateProjectDto = {
        name: 'Updated Test Project',
        description: 'Updated description',
        version: '1.1.0',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/projects/${createdProjectId}`)
        .send(updateProjectDto)
        .expect(200);

      expect(response.body.name).toBe(updateProjectDto.name);
      expect(response.body.description).toBe(updateProjectDto.description);
      expect(response.body.version).toBe(updateProjectDto.version);
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should return 404 when updating non-existent project', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .put(`/api/v1/projects/${nonExistentId}`)
        .send({ name: 'Updated Name' })
        .expect(404);
    });

    it('should return 409 when updating to duplicate code', async () => {
      // 先创建另一个项目
      const anotherProject = await request(app.getHttpServer())
        .post('/api/v1/projects')
        .send({
          name: 'Another Project',
          code: 'another_project',
        })
        .expect(201);

      // 尝试更新为已存在的代码
      await request(app.getHttpServer())
        .put(`/api/v1/projects/${createdProjectId}`)
        .send({ code: 'another_project' })
        .expect(409);

      // 清理
      await prisma.project.delete({ where: { id: anotherProject.body.id } });
    });
  });

  describe('/api/v1/projects/stats (GET)', () => {
    it('should get project statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/projects/stats')
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

  describe('/api/v1/projects/:id (DELETE)', () => {
    it('should delete project', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${createdProjectId}`)
        .expect(204);

      // 验证项目已被删除
      await request(app.getHttpServer())
        .get(`/api/v1/projects/${createdProjectId}`)
        .expect(404);
        
      createdProjectId = null; // 防止afterAll中重复删除
    });

    it('should return 404 when deleting non-existent project', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      
      await request(app.getHttpServer())
        .delete(`/api/v1/projects/${nonExistentId}`)
        .expect(404);
    });
  });
});
