import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseMigrationService } from '@entity/application/services/database-migration.service';
import { DatabaseGeneratorService } from '@entity/application/services/database-generator.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { Entity, EntityStatus } from '@entity/domain/entity.model';
import { Field, FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';
import { FieldRepository } from '@lib/bounded-contexts/field/domain/field.repository';

describe('DatabaseMigrationService', () => {
  let service: DatabaseMigrationService;
  let databaseGeneratorService: jest.Mocked<DatabaseGeneratorService>;
  let prismaService: jest.Mocked<PrismaService>;
  let fieldRepository: jest.Mocked<FieldRepository>;

  const mockEntity = Entity.create({
    projectId: 'project-1',
    name: '用户实体',
    code: 'user',
    tableName: 'users',
    description: '用户信息管理实体',
    category: '基础数据',
    diagramPosition: { x: 100, y: 200 },
    config: {},
    status: EntityStatus.DRAFT,
    createdBy: 'test-user',
  });

  const mockFields = [
    Field.create({
      entityId: mockEntity.id!,
      name: '主键',
      code: 'id',
      dataType: FieldDataType.STRING,
      required: true,
      unique: true,
      displayOrder: 1,
      createdBy: 'test-user',
    }),
    Field.create({
      entityId: mockEntity.id!,
      name: '用户名',
      code: 'username',
      dataType: FieldDataType.STRING,
      length: 50,
      required: true,
      unique: true,
      displayOrder: 2,
      createdBy: 'test-user',
    }),
    Field.create({
      entityId: mockEntity.id!,
      name: '邮箱',
      code: 'email',
      dataType: FieldDataType.STRING,
      length: 100,
      required: true,
      unique: false,
      displayOrder: 3,
      createdBy: 'test-user',
    }),
  ];

  beforeEach(async () => {
    const mockDatabaseGeneratorService = {
      generateMigrationSql: jest.fn(),
      generateTableDefinition: jest.fn(),
      generatePrismaSchemaForEntity: jest.fn(),
      generateCompletePrismaSchema: jest.fn(),
    };

    const mockPrismaService = {
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      $queryRawUnsafe: jest.fn(),
      $executeRawUnsafe: jest.fn(),
    };

    const mockFieldRepository = {
      findByEntityId: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseMigrationService,
        {
          provide: DatabaseGeneratorService,
          useValue: mockDatabaseGeneratorService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FieldRepository,
          useValue: mockFieldRepository,
        },
      ],
    }).compile();

    service = module.get<DatabaseMigrationService>(DatabaseMigrationService);
    databaseGeneratorService = module.get(DatabaseGeneratorService);
    prismaService = module.get(PrismaService);
    fieldRepository = module.get(FieldRepository);
  });

  describe('createTableForEntity', () => {
    it('应该成功为实体创建数据库表', async () => {
      // Arrange
      const expectedSql = `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL,
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_by VARCHAR(255),
          updated_at TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `;

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      databaseGeneratorService.generateMigrationSql.mockResolvedValue(expectedSql);
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      // Act
      await service.createTableForEntity(mockEntity);

      // Assert
      expect(fieldRepository.findByEntityId).toHaveBeenCalledWith(mockEntity.id);
      expect(databaseGeneratorService.generateMigrationSql).toHaveBeenCalledWith(mockEntity);
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalledWith(expectedSql);
    });

    it('应该在SQL执行失败时抛出错误', async () => {
      // Arrange
      const expectedSql = 'CREATE TABLE users (...);';
      const sqlError = new Error('SQL执行失败');

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      databaseGeneratorService.generateMigrationSql.mockResolvedValue(expectedSql);
      prismaService.$executeRawUnsafe.mockRejectedValue(sqlError);

      // Act & Assert
      await expect(service.createTableForEntity(mockEntity)).rejects.toThrow(
        `创建表 ${mockEntity.tableName} 失败: SQL执行失败`
      );
    });

    it('应该在字段获取失败时抛出错误', async () => {
      // Arrange
      const fieldError = new Error('字段获取失败');
      fieldRepository.findByEntityId.mockRejectedValue(fieldError);

      // Act & Assert
      await expect(service.createTableForEntity(mockEntity)).rejects.toThrow(
        `创建表 ${mockEntity.tableName} 失败: 字段获取失败`
      );
    });
  });

  describe('validateTableStructure', () => {
    it('应该验证表结构正确', async () => {
      // Arrange
      const mockTableInfo = [
        { column_name: 'id', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'email', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'created_by', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'created_at', data_type: 'timestamp without time zone', is_nullable: 'NO' },
        { column_name: 'updated_by', data_type: 'character varying', is_nullable: 'YES' },
        { column_name: 'updated_at', data_type: 'timestamp without time zone', is_nullable: 'YES' },
      ];

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe.mockResolvedValue(mockTableInfo);

      // Act
      const result = await service.validateTableStructure(mockEntity);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.missingColumns).toHaveLength(0);
      expect(result.extraColumns).toHaveLength(0);
    });

    it('应该检测到缺失的列', async () => {
      // Arrange
      const mockTableInfo = [
        { column_name: 'id', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
        // 缺少 email 列
      ];

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe.mockResolvedValue(mockTableInfo);

      // Act
      const result = await service.validateTableStructure(mockEntity);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.missingColumns).toContain('email');
      expect(result.issues).toContain('缺少列: email');
    });

    it('应该检测到多余的列', async () => {
      // Arrange
      const mockTableInfo = [
        { column_name: 'id', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'email', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'extra_column', data_type: 'character varying', is_nullable: 'YES' }, // 多余的列
      ];

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe.mockResolvedValue(mockTableInfo);

      // Act
      const result = await service.validateTableStructure(mockEntity);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.extraColumns).toContain('extra_column');
      expect(result.issues).toContain('多余的列: extra_column');
    });

    it('应该检测到表不存在', async () => {
      // Arrange
      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe.mockResolvedValue([]);

      // Act
      const result = await service.validateTableStructure(mockEntity);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(`表 ${mockEntity.tableName} 不存在`);
    });

    it('应该处理数据库查询错误', async () => {
      // Arrange
      const dbError = new Error('数据库连接失败');
      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.validateTableStructure(mockEntity)).rejects.toThrow(
        `验证表结构失败: 数据库连接失败`
      );
    });
  });

  describe('repairTableStructure', () => {
    it('应该成功修复表结构', async () => {
      // Arrange
      const mockTableInfo = [
        { column_name: 'id', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
        // 缺少 email 列
      ];

      const repairSql = `
        ALTER TABLE users ADD COLUMN email VARCHAR(100) NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `;

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe
        .mockResolvedValueOnce(mockTableInfo) // 第一次调用：获取表结构
        .mockResolvedValueOnce(undefined); // 第二次调用：执行修复SQL
      databaseGeneratorService.generateMigrationSql.mockResolvedValue(repairSql);

      // Act
      await service.repairTableStructure(mockEntity);

      // Assert
      expect(prismaService.$queryRawUnsafe).toHaveBeenCalledTimes(2);
      expect(databaseGeneratorService.generateMigrationSql).toHaveBeenCalledWith(mockEntity);
    });

    it('应该在表结构正确时跳过修复', async () => {
      // Arrange
      const mockTableInfo = [
        { column_name: 'id', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'username', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'email', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'created_by', data_type: 'character varying', is_nullable: 'NO' },
        { column_name: 'created_at', data_type: 'timestamp without time zone', is_nullable: 'NO' },
        { column_name: 'updated_by', data_type: 'character varying', is_nullable: 'YES' },
        { column_name: 'updated_at', data_type: 'timestamp without time zone', is_nullable: 'YES' },
      ];

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe.mockResolvedValue(mockTableInfo);

      // Act
      await service.repairTableStructure(mockEntity);

      // Assert
      expect(prismaService.$queryRawUnsafe).toHaveBeenCalledTimes(1); // 只调用一次查询，没有执行修复
      expect(databaseGeneratorService.generateMigrationSql).not.toHaveBeenCalled();
    });

    it('应该在修复SQL执行失败时抛出错误', async () => {
      // Arrange
      const mockTableInfo = [
        { column_name: 'id', data_type: 'character varying', is_nullable: 'NO' },
        // 缺少其他列
      ];

      const repairSql = 'ALTER TABLE users ADD COLUMN email VARCHAR(100);';
      const sqlError = new Error('SQL执行失败');

      fieldRepository.findByEntityId.mockResolvedValue(mockFields);
      prismaService.$queryRawUnsafe
        .mockResolvedValueOnce(mockTableInfo)
        .mockRejectedValueOnce(sqlError);
      databaseGeneratorService.generateMigrationSql.mockResolvedValue(repairSql);

      // Act & Assert
      await expect(service.repairTableStructure(mockEntity)).rejects.toThrow(
        `修复表结构失败: SQL执行失败`
      );
    });
  });

  describe('dropTableForEntity', () => {
    it('应该成功删除实体对应的表', async () => {
      // Arrange
      const dropSql = `DROP TABLE IF EXISTS ${mockEntity.tableName};`;
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      // Act
      await service.dropTableForEntity(mockEntity);

      // Assert
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalledWith(dropSql);
    });

    it('应该在删除表失败时抛出错误', async () => {
      // Arrange
      const sqlError = new Error('表删除失败');
      prismaService.$executeRawUnsafe.mockRejectedValue(sqlError);

      // Act & Assert
      await expect(service.dropTableForEntity(mockEntity)).rejects.toThrow(
        `删除表 ${mockEntity.tableName} 失败: 表删除失败`
      );
    });
  });

  describe('backupTableData', () => {
    it('应该成功备份表数据', async () => {
      // Arrange
      const mockData = [
        { id: '1', username: 'user1', email: 'user1@example.com' },
        { id: '2', username: 'user2', email: 'user2@example.com' },
      ];

      prismaService.$queryRawUnsafe.mockResolvedValue(mockData);

      // Act
      const result = await service.backupTableData(mockEntity.tableName);

      // Assert
      expect(result).toEqual(mockData);
      expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith(
        `SELECT * FROM ${mockEntity.tableName}`
      );
    });

    it('应该在表不存在时返回空数组', async () => {
      // Arrange
      const tableError = new Error('relation "non_existent_table" does not exist');
      prismaService.$queryRawUnsafe.mockRejectedValue(tableError);

      // Act
      const result = await service.backupTableData('non_existent_table');

      // Assert
      expect(result).toEqual([]);
    });

    it('应该在其他数据库错误时抛出错误', async () => {
      // Arrange
      const dbError = new Error('数据库连接失败');
      prismaService.$queryRawUnsafe.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.backupTableData(mockEntity.tableName)).rejects.toThrow(
        `备份表数据失败: 数据库连接失败`
      );
    });
  });

  describe('restoreTableData', () => {
    it('应该成功恢复表数据', async () => {
      // Arrange
      const backupData = [
        { id: '1', username: 'user1', email: 'user1@example.com' },
        { id: '2', username: 'user2', email: 'user2@example.com' },
      ];

      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      // Act
      await service.restoreTableData(mockEntity.tableName, backupData);

      // Assert
      expect(prismaService.$executeRawUnsafe).toHaveBeenCalledTimes(backupData.length);
    });

    it('应该在数据为空时跳过恢复', async () => {
      // Arrange
      const emptyData: any[] = [];

      // Act
      await service.restoreTableData(mockEntity.tableName, emptyData);

      // Assert
      expect(prismaService.$executeRawUnsafe).not.toHaveBeenCalled();
    });

    it('应该在恢复数据失败时抛出错误', async () => {
      // Arrange
      const backupData = [{ id: '1', username: 'user1' }];
      const sqlError = new Error('数据插入失败');
      prismaService.$executeRawUnsafe.mockRejectedValue(sqlError);

      // Act & Assert
      await expect(service.restoreTableData(mockEntity.tableName, backupData)).rejects.toThrow(
        `恢复表数据失败: 数据插入失败`
      );
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理空字段列表', async () => {
      // Arrange
      fieldRepository.findByEntityId.mockResolvedValue([]);
      databaseGeneratorService.generateMigrationSql.mockResolvedValue('-- 空表');
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      // Act
      await service.createTableForEntity(mockEntity);

      // Assert
      expect(databaseGeneratorService.generateMigrationSql).toHaveBeenCalledWith(mockEntity);
    });

    it('应该处理特殊字符的表名', async () => {
      // Arrange
      const specialEntity = Entity.create({
        projectId: 'project-1',
        name: '特殊-实体_测试',
        code: 'special_entity_test',
        tableName: 'special_entity_test',
        description: '包含特殊字符的实体',
        category: '测试',
        diagramPosition: { x: 0, y: 0 },
        config: {},
        status: EntityStatus.DRAFT,
        createdBy: 'test-user',
      });

      fieldRepository.findByEntityId.mockResolvedValue([]);
      databaseGeneratorService.generateMigrationSql.mockResolvedValue('CREATE TABLE special_entity_test ();');
      prismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      // Act
      await service.createTableForEntity(specialEntity);

      // Assert
      expect(databaseGeneratorService.generateMigrationSql).toHaveBeenCalledWith(specialEntity);
    });
  });
});