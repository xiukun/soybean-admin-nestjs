import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/prisma.service';
import { AppModule } from '@src/app.module';

describe('Database Integration Tests', () => {
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.entity.deleteMany();
    await prisma.project.deleteMany();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    });

    it('should handle database queries', async () => {
      const count = await prisma.project.count();
      expect(typeof count).toBe('number');
    });
  });

  describe('Project CRUD Operations', () => {
    it('should create project in database', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        type: 'web',
        status: 'ACTIVE',
        config: { framework: 'react' },
        createdBy: 'test-user',
      };

      const project = await prisma.project.create({
        data: projectData,
      });

      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.type).toBe(projectData.type);
      expect(project.status).toBe(projectData.status);
      expect(project.createdBy).toBe(projectData.createdBy);
      expect(project.createdAt).toBeInstanceOf(Date);
    });

    it('should read project from database', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        type: 'web',
        status: 'ACTIVE',
        config: { framework: 'react' },
        createdBy: 'test-user',
      };

      const createdProject = await prisma.project.create({
        data: projectData,
      });

      const foundProject = await prisma.project.findUnique({
        where: { id: createdProject.id },
      });

      expect(foundProject).toBeDefined();
      expect(foundProject!.name).toBe(projectData.name);
    });

    it('should update project in database', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        type: 'web',
        status: 'ACTIVE',
        config: { framework: 'react' },
        createdBy: 'test-user',
      };

      const createdProject = await prisma.project.create({
        data: projectData,
      });

      const updatedProject = await prisma.project.update({
        where: { id: createdProject.id },
        data: {
          name: 'Updated Project',
          description: 'Updated Description',
          updatedBy: 'update-user',
        },
      });

      expect(updatedProject.name).toBe('Updated Project');
      expect(updatedProject.description).toBe('Updated Description');
      expect(updatedProject.updatedBy).toBe('update-user');
      expect(updatedProject.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete project from database', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        type: 'web',
        status: 'ACTIVE',
        config: { framework: 'react' },
        createdBy: 'test-user',
      };

      const createdProject = await prisma.project.create({
        data: projectData,
      });

      await prisma.project.delete({
        where: { id: createdProject.id },
      });

      const foundProject = await prisma.project.findUnique({
        where: { id: createdProject.id },
      });

      expect(foundProject).toBeNull();
    });
  });

  describe('Entity CRUD Operations', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          description: 'Test Description',
          type: 'web',
          status: 'ACTIVE',
          config: {},
          createdBy: 'test-user',
        },
      });
      projectId = project.id;
    });

    it('should create entity in database', async () => {
      const entityData = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity',
        category: 'core',
        status: 'DRAFT',
        createdBy: 'test-user',
      };

      const entity = await prisma.entity.create({
        data: entityData,
      });

      expect(entity.id).toBeDefined();
      expect(entity.projectId).toBe(projectId);
      expect(entity.name).toBe(entityData.name);
      expect(entity.code).toBe(entityData.code);
      expect(entity.tableName).toBe(entityData.tableName);
      expect(entity.status).toBe(entityData.status);
    });

    it('should enforce unique constraints', async () => {
      const entityData = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity',
        category: 'core',
        status: 'DRAFT',
        createdBy: 'test-user',
      };

      await prisma.entity.create({ data: entityData });

      // Try to create another entity with the same code in the same project
      await expect(
        prisma.entity.create({
          data: {
            ...entityData,
            name: 'Another User',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle foreign key relationships', async () => {
      const entityData = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity',
        category: 'core',
        status: 'DRAFT',
        createdBy: 'test-user',
      };

      const entity = await prisma.entity.create({
        data: entityData,
        include: {
          project: true,
        },
      });

      expect(entity.project).toBeDefined();
      expect(entity.project.id).toBe(projectId);
    });

    it('should cascade delete when project is deleted', async () => {
      const entityData = {
        projectId,
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity',
        category: 'core',
        status: 'DRAFT',
        createdBy: 'test-user',
      };

      const entity = await prisma.entity.create({
        data: entityData,
      });

      // Delete the project
      await prisma.project.delete({
        where: { id: projectId },
      });

      // Entity should be deleted as well (if cascade is configured)
      const foundEntity = await prisma.entity.findUnique({
        where: { id: entity.id },
      });

      expect(foundEntity).toBeNull();
    });
  });

  describe('Query Performance', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Performance Test Project',
          description: 'Test Description',
          type: 'web',
          status: 'ACTIVE',
          config: {},
          createdBy: 'test-user',
        },
      });
      projectId = project.id;

      // Create test entities
      const entities = [];
      for (let i = 0; i < 100; i++) {
        entities.push({
          projectId,
          name: `Entity ${i}`,
          code: `entity_${i}`,
          tableName: `entity_${i}`,
          description: `Test entity ${i}`,
          category: i % 2 === 0 ? 'core' : 'business',
          status: 'DRAFT',
          createdBy: 'test-user',
        });
      }

      await prisma.entity.createMany({
        data: entities,
      });
    });

    it('should perform efficient queries with filters', async () => {
      const startTime = Date.now();

      const entities = await prisma.entity.findMany({
        where: {
          projectId,
          category: 'core',
          status: 'DRAFT',
        },
        take: 10,
        skip: 0,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(entities.length).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(100); // Should be fast

      entities.forEach(entity => {
        expect(entity.category).toBe('core');
        expect(entity.status).toBe('DRAFT');
      });
    });

    it('should perform efficient count queries', async () => {
      const startTime = Date.now();

      const count = await prisma.entity.count({
        where: {
          projectId,
          category: 'core',
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThan(0);
      expect(duration).toBeLessThan(50); // Count should be very fast
    });

    it('should handle complex queries with joins', async () => {
      const startTime = Date.now();

      const entitiesWithProject = await prisma.entity.findMany({
        where: {
          projectId,
        },
        include: {
          project: {
            select: {
              name: true,
              type: true,
            },
          },
        },
        take: 5,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(entitiesWithProject.length).toBeLessThanOrEqual(5);
      expect(duration).toBeLessThan(200); // Join queries might be slower but should still be reasonable

      entitiesWithProject.forEach(entity => {
        expect(entity.project).toBeDefined();
        expect(entity.project.name).toBeDefined();
        expect(entity.project.type).toBeDefined();
      });
    });
  });

  describe('Transaction Support', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Transaction Test Project',
          description: 'Test Description',
          type: 'web',
          status: 'ACTIVE',
          config: {},
          createdBy: 'test-user',
        },
      });
      projectId = project.id;
    });

    it('should support database transactions', async () => {
      const result = await prisma.$transaction(async (tx) => {
        const entity1 = await tx.entity.create({
          data: {
            projectId,
            name: 'Entity 1',
            code: 'entity1',
            tableName: 'entity1',
            description: 'First entity',
            category: 'core',
            status: 'DRAFT',
            createdBy: 'test-user',
          },
        });

        const entity2 = await tx.entity.create({
          data: {
            projectId,
            name: 'Entity 2',
            code: 'entity2',
            tableName: 'entity2',
            description: 'Second entity',
            category: 'core',
            status: 'DRAFT',
            createdBy: 'test-user',
          },
        });

        return { entity1, entity2 };
      });

      expect(result.entity1.id).toBeDefined();
      expect(result.entity2.id).toBeDefined();

      // Verify both entities were created
      const count = await prisma.entity.count({
        where: { projectId },
      });
      expect(count).toBe(2);
    });

    it('should rollback transaction on error', async () => {
      await expect(
        prisma.$transaction(async (tx) => {
          await tx.entity.create({
            data: {
              projectId,
              name: 'Entity 1',
              code: 'entity1',
              tableName: 'entity1',
              description: 'First entity',
              category: 'core',
              status: 'DRAFT',
              createdBy: 'test-user',
            },
          });

          // This should cause a unique constraint violation
          await tx.entity.create({
            data: {
              projectId,
              name: 'Entity 2',
              code: 'entity1', // Same code as above
              tableName: 'entity2',
              description: 'Second entity',
              category: 'core',
              status: 'DRAFT',
              createdBy: 'test-user',
            },
          });
        })
      ).rejects.toThrow();

      // Verify no entities were created due to rollback
      const count = await prisma.entity.count({
        where: { projectId },
      });
      expect(count).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain data consistency', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Consistency Test Project',
          description: 'Test Description',
          type: 'web',
          status: 'ACTIVE',
          config: {},
          createdBy: 'test-user',
        },
      });

      const entity = await prisma.entity.create({
        data: {
          projectId: project.id,
          name: 'User',
          code: 'user',
          tableName: 'users',
          description: 'User entity',
          category: 'core',
          status: 'DRAFT',
          createdBy: 'test-user',
        },
      });

      // Verify the relationship is maintained
      const entityWithProject = await prisma.entity.findUnique({
        where: { id: entity.id },
        include: { project: true },
      });

      expect(entityWithProject!.project.id).toBe(project.id);
      expect(entityWithProject!.projectId).toBe(project.id);
    });
  });
});
