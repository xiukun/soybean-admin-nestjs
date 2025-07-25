/*
 * @Description: 关联查询生成器测试
 * @Autor: henry.xiukun
 * @Date: 2025-07-26 01:00:00
 * @LastEditors: henry.xiukun
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JoinQueryGeneratorService, JoinQueryConfig } from '../src/lib/bounded-contexts/code-generation/application/services/join-query-generator.service';
import { PrismaService } from '../src/lib/shared/prisma/prisma.service';

describe('JoinQueryGeneratorService', () => {
  let service: JoinQueryGeneratorService;
  let prismaService: PrismaService;

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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JoinQueryGeneratorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JoinQueryGeneratorService>(JoinQueryGeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateJoinQuery', () => {
    it('应该生成一对多关联查询', async () => {
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
      const config: JoinQueryConfig = {
        mainEntityId: 'entity1',
        joinConfigs: [
          {
            relationshipId: 'rel1',
            joinType: 'LEFT',
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
        filterConditions: [
          {
            entityId: 'entity1',
            fieldId: 'field2',
            operator: 'like',
            value: 'test',
          },
        ],
        sortConfig: [
          {
            entityId: 'entity1',
            fieldId: 'field1',
            direction: 'ASC',
          },
        ],
        pagination: {
          page: 1,
          size: 10,
        },
      };

      // 执行测试
      const result = await service.generateJoinQuery(config);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('LEFT JOIN');
      expect(result.sql).toContain('users');
      expect(result.sql).toContain('orders');
      expect(result.sql).toContain('WHERE');
      expect(result.sql).toContain('ORDER BY');
      expect(result.sql).toContain('LIMIT');

      expect(result.prismaQuery).toBeDefined();
      expect(result.prismaQuery.include).toBeDefined();
      expect(result.prismaQuery.where).toBeDefined();
      expect(result.prismaQuery.orderBy).toBeDefined();

      expect(result.typeDefinition).toContain('interface');
      expect(result.typeDefinition).toContain('UserJoinResult');

      expect(result.apiInterface).toContain('Controller');
      expect(result.apiInterface).toContain('UserJoinController');

      expect(result.documentation).toContain('用户关联查询接口');
    });

    it('应该验证关联查询配置', async () => {
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

      const config: JoinQueryConfig = {
        mainEntityId: 'entity1',
        joinConfigs: [
          {
            relationshipId: 'rel1',
            joinType: 'LEFT',
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
      await expect(service.generateJoinQuery(config)).resolves.toBeDefined();
    });

    it('应该在主实体不存在时抛出异常', async () => {
      mockPrismaService.entity.findUnique.mockResolvedValue(null);

      const config: JoinQueryConfig = {
        mainEntityId: 'nonexistent',
        joinConfigs: [],
        selectFields: [],
      };

      await expect(service.generateJoinQuery(config)).rejects.toThrow('主实体不存在');
    });

    it('应该在关系不存在时抛出异常', async () => {
      mockPrismaService.entity.findUnique.mockResolvedValue({
        id: 'entity1',
        code: 'user',
        name: '用户',
      });

      mockPrismaService.relation.findUnique.mockResolvedValue(null);

      const config: JoinQueryConfig = {
        mainEntityId: 'entity1',
        joinConfigs: [
          {
            relationshipId: 'nonexistent',
            joinType: 'LEFT',
          },
        ],
        selectFields: [],
      };

      await expect(service.generateJoinQuery(config)).rejects.toThrow('关系 nonexistent 不存在');
    });

    it('应该在字段不存在时抛出异常', async () => {
      mockPrismaService.entity.findUnique.mockResolvedValue({
        id: 'entity1',
        code: 'user',
        name: '用户',
      });

      mockPrismaService.field.findUnique.mockResolvedValue(null);

      const config: JoinQueryConfig = {
        mainEntityId: 'entity1',
        joinConfigs: [],
        selectFields: [
          {
            entityId: 'entity1',
            fieldId: 'nonexistent',
          },
        ],
      };

      await expect(service.generateJoinQuery(config)).rejects.toThrow('字段 nonexistent 不存在');
    });
  });

  describe('工具方法测试', () => {
    it('应该正确转换为PascalCase', () => {
      // 由于这是私有方法，我们通过公共方法间接测试
      // 这里可以添加更多的工具方法测试
    });
  });
});
