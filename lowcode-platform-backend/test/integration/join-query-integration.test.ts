/*
 * @Description: 关联查询集成测试
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 01:30:00
 * @LastEditors: henry.xiukun
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PrismaService } from '../../src/lib/shared/prisma/prisma.service';
import { JoinQueryGeneratorService } from '../../src/lib/bounded-contexts/code-generation/application/services/join-query-generator.service';
import {
  GenerateJoinQueryHandler,
  ValidateJoinQueryConfigHandler,
  SaveJoinQueryConfigHandler,
} from '../../src/lib/bounded-contexts/code-generation/application/handlers/join-query.handlers';
import {
  GetJoinQueryConfigsHandler,
  PreviewJoinQueryHandler,
} from '../../src/lib/bounded-contexts/code-generation/application/handlers/join-query-query.handlers';

describe('关联查询集成测试', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;
  let joinQueryGenerator: JoinQueryGeneratorService;

  const mockPrismaService = {
    entity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    relation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    field: {
      findUnique: jest.fn(),
    },
    codegenTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        CommandBus,
        QueryBus,
        JoinQueryGeneratorService,
        GenerateJoinQueryHandler,
        ValidateJoinQueryConfigHandler,
        SaveJoinQueryConfigHandler,
        GetJoinQueryConfigsHandler,
        PreviewJoinQueryHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    commandBus = moduleFixture.get<CommandBus>(CommandBus);
    queryBus = moduleFixture.get<QueryBus>(QueryBus);
    joinQueryGenerator = moduleFixture.get<JoinQueryGeneratorService>(JoinQueryGeneratorService);

    // 注册处理器
    commandBus.register([
      GenerateJoinQueryHandler,
      ValidateJoinQueryConfigHandler,
      SaveJoinQueryConfigHandler,
    ]);

    queryBus.register([
      GetJoinQueryConfigsHandler,
      PreviewJoinQueryHandler,
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('关联查询生成功能', () => {
    it('应该能够生成基本的关联查询', async () => {
      // 模拟数据
      const mockMainEntity = {
        id: 'entity1',
        code: 'user',
        name: '用户',
        tableName: 'users',
        fields: [
          { id: 'field1', code: 'id', name: 'ID', type: 'string', columnName: 'id' },
          { id: 'field2', code: 'name', name: '姓名', type: 'string', columnName: 'name' },
        ],
      };

      const mockTargetEntity = {
        id: 'entity2',
        code: 'order',
        name: '订单',
        tableName: 'orders',
        fields: [
          { id: 'field3', code: 'id', name: 'ID', type: 'string', columnName: 'id' },
          { id: 'field4', code: 'total', name: '总金额', type: 'decimal', columnName: 'total' },
        ],
      };

      const mockRelationship = {
        id: 'rel1',
        name: '用户订单',
        type: 'one-to-many',
        sourceEntityId: 'entity1',
        targetEntityId: 'entity2',
        sourceEntity: mockMainEntity,
        targetEntity: mockTargetEntity,
        sourceField: { code: 'id', columnName: 'id' },
        targetField: { code: 'user_id', columnName: 'user_id' },
      };

      // 配置模拟返回值
      mockPrismaService.entity.findUnique
        .mockResolvedValueOnce(mockMainEntity)
        .mockResolvedValueOnce(mockMainEntity)
        .mockResolvedValueOnce(mockTargetEntity);

      mockPrismaService.relation.findUnique.mockResolvedValue(mockRelationship);
      mockPrismaService.entity.findMany.mockResolvedValue([mockMainEntity, mockTargetEntity]);
      mockPrismaService.relation.findMany.mockResolvedValue([mockRelationship]);
      mockPrismaService.field.findUnique
        .mockResolvedValueOnce({ id: 'field1', code: 'id', name: 'ID', type: 'string' })
        .mockResolvedValueOnce({ id: 'field2', code: 'name', name: '姓名', type: 'string' })
        .mockResolvedValueOnce({ id: 'field4', code: 'total', name: '总金额', type: 'decimal' });

      // 测试配置
      const config = {
        mainEntityId: 'entity1',
        joinConfigs: [
          {
            relationshipId: 'rel1',
            joinType: 'LEFT' as const,
          },
        ],
        selectFields: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
            alias: 'user_id',
          },
          {
            entityId: 'entity1',
            fieldId: 'field2',
            alias: 'user_name',
          },
          {
            entityId: 'entity2',
            fieldId: 'field4',
            alias: 'order_total',
          },
        ],
      };

      // 执行测试
      const result = await joinQueryGenerator.generateJoinQuery(config);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('LEFT JOIN');
      expect(result.sql).toContain('users');
      expect(result.sql).toContain('orders');

      expect(result.prismaQuery).toBeDefined();
      expect(result.typeDefinition).toContain('interface');
      expect(result.apiInterface).toContain('Controller');
      expect(result.documentation).toContain('用户关联查询接口');
    });

    it('应该能够验证关联查询配置', async () => {
      // 模拟主实体存在
      mockPrismaService.entity.findUnique.mockResolvedValue({
        id: 'entity1',
        code: 'user',
        name: '用户',
      });

      // 模拟关系存在
      mockPrismaService.relation.findUnique.mockResolvedValue({
        id: 'rel1',
        sourceEntityId: 'entity1',
        targetEntityId: 'entity2',
      });

      // 模拟字段存在
      mockPrismaService.field.findUnique.mockResolvedValue({
        id: 'field1',
        code: 'id',
        name: 'ID',
      });

      const config = {
        mainEntityId: 'entity1',
        joinConfigs: [
          {
            relationshipId: 'rel1',
            joinType: 'LEFT' as const,
          },
        ],
        selectFields: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
          },
        ],
      };

      // 这个测试主要验证不会抛出异常
      await expect(joinQueryGenerator.generateJoinQuery(config)).resolves.toBeDefined();
    });

    it('应该在配置无效时抛出异常', async () => {
      mockPrismaService.entity.findUnique.mockResolvedValue(null);

      const config = {
        mainEntityId: 'nonexistent',
        joinConfigs: [],
        selectFields: [],
      };

      await expect(joinQueryGenerator.generateJoinQuery(config)).rejects.toThrow('主实体不存在');
    });
  });

  describe('SQL生成测试', () => {
    it('应该生成正确的SQL查询', async () => {
      // 模拟完整的实体和关系数据
      const mockMainEntity = {
        id: 'entity1',
        code: 'user',
        name: '用户',
        tableName: 'users',
        fields: [
          { id: 'field1', code: 'id', name: 'ID', type: 'string', columnName: 'id' },
          { id: 'field2', code: 'name', name: '姓名', type: 'string', columnName: 'name' },
        ],
      };

      const mockTargetEntity = {
        id: 'entity2',
        code: 'order',
        name: '订单',
        tableName: 'orders',
        fields: [
          { id: 'field3', code: 'id', name: 'ID', type: 'string', columnName: 'id' },
          { id: 'field4', code: 'total', name: '总金额', type: 'decimal', columnName: 'total' },
        ],
      };

      const mockRelationship = {
        id: 'rel1',
        name: '用户订单',
        type: 'one-to-many',
        sourceEntityId: 'entity1',
        targetEntityId: 'entity2',
        sourceEntity: mockMainEntity,
        targetEntity: mockTargetEntity,
        sourceField: { code: 'id', columnName: 'id' },
        targetField: { code: 'user_id', columnName: 'user_id' },
      };

      // 配置所有必要的模拟
      mockPrismaService.entity.findUnique
        .mockResolvedValueOnce(mockMainEntity)
        .mockResolvedValueOnce(mockMainEntity)
        .mockResolvedValueOnce(mockTargetEntity);

      mockPrismaService.relation.findUnique.mockResolvedValue(mockRelationship);
      mockPrismaService.entity.findMany.mockResolvedValue([mockMainEntity, mockTargetEntity]);
      mockPrismaService.relation.findMany.mockResolvedValue([mockRelationship]);
      mockPrismaService.field.findUnique
        .mockResolvedValueOnce({ id: 'field1', code: 'id', name: 'ID', type: 'string' })
        .mockResolvedValueOnce({ id: 'field4', code: 'total', name: '总金额', type: 'decimal' });

      const config = {
        mainEntityId: 'entity1',
        joinConfigs: [
          {
            relationshipId: 'rel1',
            joinType: 'INNER' as const,
          },
        ],
        selectFields: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
            alias: 'user_id',
          },
          {
            entityId: 'entity2',
            fieldId: 'field4',
            alias: 'order_total',
          },
        ],
        filterConditions: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
            operator: 'eq' as const,
            value: '123',
          },
        ],
        sortConfig: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
            direction: 'DESC' as const,
          },
        ],
        pagination: {
          page: 2,
          size: 20,
        },
      };

      const result = await joinQueryGenerator.generateJoinQuery(config);

      // 验证SQL包含预期的元素
      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('users.id AS user_id');
      expect(result.sql).toContain('orders.total AS order_total');
      expect(result.sql).toContain('FROM users');
      expect(result.sql).toContain('INNER JOIN orders');
      expect(result.sql).toContain('WHERE');
      expect(result.sql).toContain('ORDER BY');
      expect(result.sql).toContain('LIMIT 20 OFFSET 20');
    });
  });

  describe('类型定义生成测试', () => {
    it('应该生成正确的TypeScript类型定义', async () => {
      // 设置模拟数据
      const mockMainEntity = {
        id: 'entity1',
        code: 'user',
        name: '用户',
        tableName: 'users',
        fields: [
          { id: 'field1', code: 'id', name: 'ID', type: 'string', columnName: 'id' },
        ],
      };

      mockPrismaService.entity.findUnique.mockResolvedValue(mockMainEntity);
      mockPrismaService.relation.findUnique.mockResolvedValue({
        id: 'rel1',
        sourceEntityId: 'entity1',
        targetEntityId: 'entity2',
      });
      mockPrismaService.field.findUnique.mockResolvedValue({
        id: 'field1',
        code: 'id',
        name: 'ID',
        type: 'string',
      });
      mockPrismaService.entity.findMany.mockResolvedValue([mockMainEntity]);
      mockPrismaService.relation.findMany.mockResolvedValue([]);

      const config = {
        mainEntityId: 'entity1',
        joinConfigs: [],
        selectFields: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
            alias: 'user_id',
          },
        ],
      };

      const result = await joinQueryGenerator.generateJoinQuery(config);

      // 验证类型定义
      expect(result.typeDefinition).toContain('export interface UserJoinResult');
      expect(result.typeDefinition).toContain('user_id: string');
      expect(result.typeDefinition).toContain('UserJoinResultListResponse');
    });
  });
});

describe('关联查询功能验证', () => {
  it('关联查询生成引擎应该正确初始化', () => {
    expect(JoinQueryGeneratorService).toBeDefined();
  });

  it('关联查询处理器应该正确初始化', () => {
    expect(GenerateJoinQueryHandler).toBeDefined();
    expect(ValidateJoinQueryConfigHandler).toBeDefined();
    expect(SaveJoinQueryConfigHandler).toBeDefined();
    expect(GetJoinQueryConfigsHandler).toBeDefined();
    expect(PreviewJoinQueryHandler).toBeDefined();
  });
});
