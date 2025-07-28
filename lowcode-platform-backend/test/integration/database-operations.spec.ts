import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@prisma/prisma.module';

describe('Database Operations Integration Tests', () => {
  let prismaService: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        PrismaModule,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await prismaService.relationship.deleteMany({});
    await prismaService.field.deleteMany({});
    await prismaService.entity.deleteMany({});
    await prismaService.project.deleteMany({});
    await prismaService.codeTemplate.deleteMany({});
    await prismaService.query.deleteMany({});
  });

  describe('Project Operations', () => {
    it('should create a project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        code: 'test-project',
        description: 'A test project for integration testing',
        status: 'ACTIVE' as const,
        createdBy: 'test-user',
      };

      const project = await prismaService.project.create({
        data: projectData,
      });

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.code).toBe(projectData.code);
      expect(project.status).toBe(projectData.status);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should find projects with pagination', async () => {
      // 创建多个测试项目
      const projects = [];
      for (let i = 0; i < 5; i++) {
        const project = await prismaService.project.create({
          data: {
            name: `Test Project ${i}`,
            code: `test-project-${i}`,
            status: 'ACTIVE',
            createdBy: 'test-user',
          },
        });
        projects.push(project);
      }

      // 测试分页查询
      const result = await prismaService.project.findMany({
        take: 3,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Test Project 4');
    });

    it('should update project status', async () => {
      const project = await prismaService.project.create({
        data: {
          name: 'Update Test Project',
          code: 'update-test-project',
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      const updatedProject = await prismaService.project.update({
        where: { id: project.id },
        data: { status: 'INACTIVE' },
      });

      expect(updatedProject.status).toBe('INACTIVE');
      expect(updatedProject.updatedAt.getTime()).toBeGreaterThan(project.updatedAt.getTime());
    });

    it('should delete project and cascade to related entities', async () => {
      const project = await prismaService.project.create({
        data: {
          name: 'Delete Test Project',
          code: 'delete-test-project',
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      // 创建关联的实体
      const entity = await prismaService.entity.create({
        data: {
          name: 'Test Entity',
          code: 'testEntity',
          projectId: project.id,
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      // 创建关联的字段
      await prismaService.field.create({
        data: {
          name: 'Test Field',
          code: 'testField',
          type: 'string',
          required: true,
          entityId: entity.id,
          createdBy: 'test-user',
        },
      });

      // 删除项目
      await prismaService.project.delete({
        where: { id: project.id },
      });

      // 验证关联数据也被删除
      const remainingEntities = await prismaService.entity.findMany({
        where: { projectId: project.id },
      });
      expect(remainingEntities).toHaveLength(0);
    });
  });

  describe('Entity Operations', () => {
    let testProject: any;

    beforeEach(async () => {
      testProject = await prismaService.project.create({
        data: {
          name: 'Entity Test Project',
          code: 'entity-test-project',
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });
    });

    it('should create entity with fields', async () => {
      const entity = await prismaService.entity.create({
        data: {
          name: 'User',
          code: 'user',
          description: 'User entity for testing',
          projectId: testProject.id,
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      // 创建字段
      const fields = await Promise.all([
        prismaService.field.create({
          data: {
            name: 'Name',
            code: 'name',
            type: 'string',
            required: true,
            entityId: entity.id,
            createdBy: 'test-user',
          },
        }),
        prismaService.field.create({
          data: {
            name: 'Email',
            code: 'email',
            type: 'string',
            required: true,
            entityId: entity.id,
            createdBy: 'test-user',
          },
        }),
        prismaService.field.create({
          data: {
            name: 'Age',
            code: 'age',
            type: 'number',
            required: false,
            entityId: entity.id,
            createdBy: 'test-user',
          },
        }),
      ]);

      // 查询实体及其字段
      const entityWithFields = await prismaService.entity.findUnique({
        where: { id: entity.id },
        include: { fields: true },
      });

      expect(entityWithFields).toBeDefined();
      expect(entityWithFields!.fields).toHaveLength(3);
      expect(entityWithFields!.fields.map(f => f.code)).toEqual(['name', 'email', 'age']);
    });

    it('should handle entity relationships', async () => {
      // 创建两个实体
      const userEntity = await prismaService.entity.create({
        data: {
          name: 'User',
          code: 'user',
          projectId: testProject.id,
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      const postEntity = await prismaService.entity.create({
        data: {
          name: 'Post',
          code: 'post',
          projectId: testProject.id,
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      // 创建关系
      const relationship = await prismaService.relationship.create({
        data: {
          type: 'one-to-many',
          sourceEntityId: userEntity.id,
          targetEntityId: postEntity.id,
          createdBy: 'test-user',
        },
      });

      // 查询关系
      const userWithRelationships = await prismaService.entity.findUnique({
        where: { id: userEntity.id },
        include: {
          sourceRelationships: true,
          targetRelationships: true,
        },
      });

      expect(userWithRelationships!.sourceRelationships).toHaveLength(1);
      expect(userWithRelationships!.sourceRelationships[0].type).toBe('one-to-many');
      expect(userWithRelationships!.sourceRelationships[0].targetEntityId).toBe(postEntity.id);
    });

    it('should validate unique entity codes within project', async () => {
      // 创建第一个实体
      await prismaService.entity.create({
        data: {
          name: 'First Entity',
          code: 'uniqueEntity',
          projectId: testProject.id,
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      // 尝试创建具有相同代码的实体应该失败
      await expect(
        prismaService.entity.create({
          data: {
            name: 'Second Entity',
            code: 'uniqueEntity',
            projectId: testProject.id,
            status: 'ACTIVE',
            createdBy: 'test-user',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Field Operations', () => {
    let testEntity: any;

    beforeEach(async () => {
      const project = await prismaService.project.create({
        data: {
          name: 'Field Test Project',
          code: 'field-test-project',
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });

      testEntity = await prismaService.entity.create({
        data: {
          name: 'Field Test Entity',
          code: 'fieldTestEntity',
          projectId: project.id,
          status: 'ACTIVE',
          createdBy: 'test-user',
        },
      });
    });

    it('should create fields with different types', async () => {
      const fieldTypes = [
        { name: 'String Field', code: 'stringField', type: 'string' },
        { name: 'Number Field', code: 'numberField', type: 'number' },
        { name: 'Boolean Field', code: 'booleanField', type: 'boolean' },
        { name: 'Date Field', code: 'dateField', type: 'date' },
        { name: 'JSON Field', code: 'jsonField', type: 'json' },
      ];

      const fields = await Promise.all(
        fieldTypes.map(fieldType =>
          prismaService.field.create({
            data: {
              ...fieldType,
              required: false,
              entityId: testEntity.id,
              createdBy: 'test-user',
            },
          })
        )
      );

      expect(fields).toHaveLength(5);
      fields.forEach((field, index) => {
        expect(field.type).toBe(fieldTypes[index].type);
      });
    });

    it('should handle field validation rules', async () => {
      const field = await prismaService.field.create({
        data: {
          name: 'Email Field',
          code: 'emailField',
          type: 'string',
          required: true,
          validation: {
            pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
            minLength: 5,
            maxLength: 100,
          },
          entityId: testEntity.id,
          createdBy: 'test-user',
        },
      });

      expect(field.validation).toBeDefined();
      expect(field.validation.pattern).toBeDefined();
      expect(field.validation.minLength).toBe(5);
      expect(field.validation.maxLength).toBe(100);
    });

    it('should handle field default values', async () => {
      const fields = await Promise.all([
        prismaService.field.create({
          data: {
            name: 'Status Field',
            code: 'statusField',
            type: 'string',
            required: false,
            defaultValue: 'active',
            entityId: testEntity.id,
            createdBy: 'test-user',
          },
        }),
        prismaService.field.create({
          data: {
            name: 'Count Field',
            code: 'countField',
            type: 'number',
            required: false,
            defaultValue: 0,
            entityId: testEntity.id,
            createdBy: 'test-user',
          },
        }),
        prismaService.field.create({
          data: {
            name: 'Active Field',
            code: 'activeField',
            type: 'boolean',
            required: false,
            defaultValue: true,
            entityId: testEntity.id,
            createdBy: 'test-user',
          },
        }),
      ]);

      expect(fields[0].defaultValue).toBe('active');
      expect(fields[1].defaultValue).toBe(0);
      expect(fields[2].defaultValue).toBe(true);
    });
  });

  describe('Template Operations', () => {
    it('should create and manage code templates', async () => {
      const template = await prismaService.codeTemplate.create({
        data: {
          name: 'Test Controller Template',
          code: 'test-controller',
          type: 'controller',
          language: 'typescript',
          content: `
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('{{entityCode}}')
export class {{pascalCase entityCode}}Controller {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create(@Body() createDto: any) {
    return createDto;
  }
}
          `.trim(),
          createdBy: 'test-user',
        },
      });

      expect(template).toBeDefined();
      expect(template.type).toBe('controller');
      expect(template.language).toBe('typescript');
      expect(template.content).toContain('{{entityCode}}');
    });

    it('should find templates by type and language', async () => {
      // 创建多个模板
      await Promise.all([
        prismaService.codeTemplate.create({
          data: {
            name: 'TypeScript Controller',
            code: 'ts-controller',
            type: 'controller',
            language: 'typescript',
            content: 'controller content',
            createdBy: 'test-user',
          },
        }),
        prismaService.codeTemplate.create({
          data: {
            name: 'TypeScript Service',
            code: 'ts-service',
            type: 'service',
            language: 'typescript',
            content: 'service content',
            createdBy: 'test-user',
          },
        }),
        prismaService.codeTemplate.create({
          data: {
            name: 'JavaScript Controller',
            code: 'js-controller',
            type: 'controller',
            language: 'javascript',
            content: 'js controller content',
            createdBy: 'test-user',
          },
        }),
      ]);

      // 查询TypeScript控制器模板
      const tsControllers = await prismaService.codeTemplate.findMany({
        where: {
          type: 'controller',
          language: 'typescript',
        },
      });

      expect(tsControllers).toHaveLength(1);
      expect(tsControllers[0].name).toBe('TypeScript Controller');

      // 查询所有控制器模板
      const allControllers = await prismaService.codeTemplate.findMany({
        where: { type: 'controller' },
      });

      expect(allControllers).toHaveLength(2);
    });
  });

  describe('Transaction Operations', () => {
    it('should handle complex transactions', async () => {
      await prismaService.$transaction(async (tx) => {
        // 创建项目
        const project = await tx.project.create({
          data: {
            name: 'Transaction Test Project',
            code: 'transaction-test-project',
            status: 'ACTIVE',
            createdBy: 'test-user',
          },
        });

        // 创建实体
        const entity = await tx.entity.create({
          data: {
            name: 'Transaction Entity',
            code: 'transactionEntity',
            projectId: project.id,
            status: 'ACTIVE',
            createdBy: 'test-user',
          },
        });

        // 创建字段
        await tx.field.createMany({
          data: [
            {
              name: 'Name',
              code: 'name',
              type: 'string',
              required: true,
              entityId: entity.id,
              createdBy: 'test-user',
            },
            {
              name: 'Email',
              code: 'email',
              type: 'string',
              required: true,
              entityId: entity.id,
              createdBy: 'test-user',
            },
          ],
        });
      });

      // 验证所有数据都已创建
      const projects = await prismaService.project.findMany({
        where: { code: 'transaction-test-project' },
        include: {
          entities: {
            include: {
              fields: true,
            },
          },
        },
      });

      expect(projects).toHaveLength(1);
      expect(projects[0].entities).toHaveLength(1);
      expect(projects[0].entities[0].fields).toHaveLength(2);
    });

    it('should rollback on transaction failure', async () => {
      const initialProjectCount = await prismaService.project.count();

      try {
        await prismaService.$transaction(async (tx) => {
          // 创建项目
          await tx.project.create({
            data: {
              name: 'Rollback Test Project',
              code: 'rollback-test-project',
              status: 'ACTIVE',
              createdBy: 'test-user',
            },
          });

          // 故意抛出错误
          throw new Error('Transaction should rollback');
        });
      } catch (error) {
        // 预期的错误
      }

      // 验证项目没有被创建
      const finalProjectCount = await prismaService.project.count();
      expect(finalProjectCount).toBe(initialProjectCount);

      const rollbackProject = await prismaService.project.findFirst({
        where: { code: 'rollback-test-project' },
      });
      expect(rollbackProject).toBeNull();
    });
  });
});
