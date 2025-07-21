import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Amis Lowcode Backend Integration Tests (e2e)', () => {
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

  describe('Health Check', () => {
    it('/api/v1 (GET) - should return API info', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('/api/v1/health (GET) - should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('Users API', () => {
    it('/api/v1/users (GET) - should return paginated users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body).toHaveProperty('msg', 'success');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('items');
          expect(res.body.data).toHaveProperty('total');
          expect(res.body.data).toHaveProperty('page');
          expect(res.body.data).toHaveProperty('pageSize');
          expect(Array.isArray(res.body.data.items)).toBe(true);
        });
    });

    it('/api/v1/users (POST) - should create a new user', () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        nickname: 'Test User',
        status: 'active'
      };

      return request(app.getHttpServer())
        .post('/api/v1/users')
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body).toHaveProperty('msg', 'success');
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('username', newUser.username);
          expect(res.body.data).toHaveProperty('email', newUser.email);
        });
    });

    it('/api/v1/users/:id (GET) - should return user by id', async () => {
      // First create a user
      const newUser = {
        username: 'getuser',
        email: 'getuser@example.com',
        password: 'password123',
        status: 'active'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(newUser);

      const userId = createResponse.body.data.id;

      return request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', userId);
          expect(res.body.data).toHaveProperty('username', newUser.username);
        });
    });

    it('/api/v1/users/:id (PUT) - should update user', async () => {
      // First create a user
      const newUser = {
        username: 'updateuser',
        email: 'updateuser@example.com',
        password: 'password123',
        status: 'active'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(newUser);

      const userId = createResponse.body.data.id;
      const updateData = {
        nickname: 'Updated User',
        status: 'inactive'
      };

      return request(app.getHttpServer())
        .put(`/api/v1/users/${userId}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body.data).toHaveProperty('nickname', updateData.nickname);
          expect(res.body.data).toHaveProperty('status', updateData.status);
        });
    });

    it('/api/v1/users/:id (DELETE) - should delete user', async () => {
      // First create a user
      const newUser = {
        username: 'deleteuser',
        email: 'deleteuser@example.com',
        password: 'password123',
        status: 'active'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send(newUser);

      const userId = createResponse.body.data.id;

      return request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body).toHaveProperty('msg', 'success');
        });
    });
  });

  describe('Roles API', () => {
    it('/api/v1/roles (GET) - should return paginated roles', () => {
      return request(app.getHttpServer())
        .get('/api/v1/roles?page=1&pageSize=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('items');
          expect(Array.isArray(res.body.data.items)).toBe(true);
        });
    });

    it('/api/v1/roles (POST) - should create a new role', () => {
      const newRole = {
        name: 'Test Role',
        code: 'test_role',
        description: 'A test role',
        status: 'active'
      };

      return request(app.getHttpServer())
        .post('/api/v1/roles')
        .send(newRole)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 0);
          expect(res.body.data).toHaveProperty('name', newRole.name);
          expect(res.body.data).toHaveProperty('code', newRole.code);
        });
    });
  });

  describe('Database Connection', () => {
    it('should have working database connection', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.database).toHaveProperty('status', 'connected');
        });
    });
  });
});
