import { Test, TestingModule } from '@nestjs/testing';
import { CreateEntityHandler } from '@entity/application/handlers/create-entity.handler';
import { CreateEntityCommand } from '@entity/application/commands/create-entity.command';
import { EntityRepository } from '@entity/domain/entity.repository';
import { CommonFieldService } from '@entity/application/services/common-field.service';
import { FieldCreationService } from '@lib/bounded-contexts/field/application/services/field-creation.service';
import { DatabaseMigrationService } from '@entity/application/services/database-migration.service';
import { Entity, EntityStatus } from '@entity/domain/entity.model';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

describe('CreateEntityHandler', () => {
  let handler: CreateEntityHandler;
  let entityRepository: jest.Mocked<EntityRepository>;
  let commonFieldService: jest.Mocked<CommonFieldService>;
  let fieldCreationService: jest.Mocked<FieldCreationService>;
  let databaseMigrationService: jest.Mocked<DatabaseMigrationService>;

  const mockCommonFields = [
    {
      name: '主键',
      code: 'id',
      dataType: FieldDataType.STRING,
      required: true,
      unique: true,
      description: '实体唯一标识符',
      displayOrder: 1,
    },
    {
      name: '创建者',
      code: 'createdBy',
      dataType: FieldDataType.STRING,
      required: true,
      unique: false,
      description: '记录创建者用户ID',
      displayOrder: 2,
    },
    {
      name: '创建时间',
      code: 'createdAt',
      dataType: FieldDataType.DATETIME,
      required: true,
      unique: false,
      description: '记录创建时间戳',
      displayOrder: 3,
    },
    {
      name: '更新者',
      code: 'updatedBy',
      dataType: FieldDataType.STRING,
      required: false,
      unique: false,
      description: '记录最后更新者用户ID',
      displayOrder: 4,
    },
    {
      name: '更新时间',
      code: 'updatedAt',
      dataType: FieldDataType.DATETIME,
      required: false,
      unique: false,
      description: '记录最后更新时间戳',
      displayOrder: 5,
    },
  ];

  beforeEach(async () => {
    const mockEntityRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByProjectId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockCommonFieldService = {
      getCommonFieldDefinitions: jest.fn(),
      validateBusinessFieldConflict: jest.fn(),
      getMaxCommonFieldDisplayOrder: jest.fn(),
    };

    const mockFieldCreationService = {
      createFieldsForEntity: jest.fn(),
      validateBusinessFields: jest.fn(),
    };

    const mockDatabaseMigrationService = {
      createTableForEntity: jest.fn(),
      validateTableStructure: jest.fn(),
      repairTableStructure: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEntityHandler,
        {
          provide: EntityRepository,
          useValue: mockEntityRepository,
        },
        {
          provide: CommonFieldService,
          useValue: mockCommonFieldService,
        },
        {
          provide: FieldCreationService,
          useValue: mockFieldCreationService,
        },
        {
          provide: DatabaseMigrationService,
          useValue: mockDatabaseMigrationService,
        },
      ],
    }).compile();

    handler = module.get<CreateEntityHandler>(CreateEntityHandler);
    entityRepository = module.get(EntityRepository);
    commonFieldService = module.get(CommonFieldService);
    fieldCreationService = module.get(FieldCreationService);
    databaseMigrationService = module.get(DatabaseMigrationService);
  });

  describe('execute', () => {
    it('应该成功创建实体并自动添加通用字段', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        '用户信息管理实体',
        '基础数据',
        { x: 100, y: 200 },
        {},
        EntityStatus.DRAFT,
        'test-user'
      );

      const expectedEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        diagramPosition: command.diagramPosition,
        config: command.config,
        status: command.status,
        createdBy: command.createdBy,
      });

      commonFieldService.getCommonFieldDefinitions.mockReturnValue(mockCommonFields);
      commonFieldService.getMaxCommonFieldDisplayOrder.mockReturnValue(5);
      entityRepository.save.mockResolvedValue(expectedEntity);
      fieldCreationService.createFieldsForEntity.mockResolvedValue(undefined);
      databaseMigrationService.createTableForEntity.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(command.name);
      expect(result.code).toBe(command.code);
      expect(result.tableName).toBe(command.tableName);
      
      // 验证实体保存被调用
      expect(entityRepository.save).toHaveBeenCalledWith(expect.any(Entity));
      
      // 验证通用字段创建被调用
      expect(fieldCreationService.createFieldsForEntity).toHaveBeenCalledWith(
        expect.any(String),
        mockCommonFields,
        command.createdBy
      );
      
      // 验证数据库表创建被调用
      expect(databaseMigrationService.createTableForEntity).toHaveBeenCalledWith(expectedEntity);
    });

    it('应该在实体代码重复时抛出错误', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        '用户信息管理实体',
        '基础数据',
        { x: 100, y: 200 },
        {},
        EntityStatus.DRAFT,
        'test-user'
      );

      entityRepository.save.mockRejectedValue(new Error('实体代码已存在'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('实体代码已存在');
    });

    it('应该在通用字段创建失败时抛出错误', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        '用户信息管理实体',
        '基础数据',
        { x: 100, y: 200 },
        {},
        EntityStatus.DRAFT,
        'test-user'
      );

      const expectedEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        diagramPosition: command.diagramPosition,
        config: command.config,
        status: command.status,
        createdBy: command.createdBy,
      });

      commonFieldService.getCommonFieldDefinitions.mockReturnValue(mockCommonFields);
      commonFieldService.getMaxCommonFieldDisplayOrder.mockReturnValue(5);
      entityRepository.save.mockResolvedValue(expectedEntity);
      fieldCreationService.createFieldsForEntity.mockRejectedValue(new Error('字段创建失败'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('字段创建失败');
    });

    it('应该在数据库表创建失败时抛出错误', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        '用户信息管理实体',
        '基础数据',
        { x: 100, y: 200 },
        {},
        EntityStatus.DRAFT,
        'test-user'
      );

      const expectedEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        diagramPosition: command.diagramPosition,
        config: command.config,
        status: command.status,
        createdBy: command.createdBy,
      });

      commonFieldService.getCommonFieldDefinitions.mockReturnValue(mockCommonFields);
      commonFieldService.getMaxCommonFieldDisplayOrder.mockReturnValue(5);
      entityRepository.save.mockResolvedValue(expectedEntity);
      fieldCreationService.createFieldsForEntity.mockResolvedValue(undefined);
      databaseMigrationService.createTableForEntity.mockRejectedValue(new Error('数据库表创建失败'));

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow('数据库表创建失败');
    });

    it('应该正确处理空的配置参数', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        undefined, // description
        undefined, // category
        undefined, // diagramPosition
        undefined, // config
        EntityStatus.DRAFT,
        'test-user'
      );

      const expectedEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        diagramPosition: command.diagramPosition,
        config: command.config,
        status: command.status,
        createdBy: command.createdBy,
      });

      commonFieldService.getCommonFieldDefinitions.mockReturnValue(mockCommonFields);
      commonFieldService.getMaxCommonFieldDisplayOrder.mockReturnValue(5);
      entityRepository.save.mockResolvedValue(expectedEntity);
      fieldCreationService.createFieldsForEntity.mockResolvedValue(undefined);
      databaseMigrationService.createTableForEntity.mockResolvedValue(undefined);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBeDefined();
      expect(result.description).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(result.diagramPosition).toBeUndefined();
      expect(result.config).toBeUndefined();
    });
  });

  describe('通用字段自动添加逻辑', () => {
    it('应该按正确的顺序添加通用字段', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        '用户信息管理实体',
        '基础数据',
        { x: 100, y: 200 },
        {},
        EntityStatus.DRAFT,
        'test-user'
      );

      const expectedEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        diagramPosition: command.diagramPosition,
        config: command.config,
        status: command.status,
        createdBy: command.createdBy,
      });

      commonFieldService.getCommonFieldDefinitions.mockReturnValue(mockCommonFields);
      commonFieldService.getMaxCommonFieldDisplayOrder.mockReturnValue(5);
      entityRepository.save.mockResolvedValue(expectedEntity);
      fieldCreationService.createFieldsForEntity.mockResolvedValue(undefined);
      databaseMigrationService.createTableForEntity.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(fieldCreationService.createFieldsForEntity).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ code: 'id', displayOrder: 1 }),
          expect.objectContaining({ code: 'createdBy', displayOrder: 2 }),
          expect.objectContaining({ code: 'createdAt', displayOrder: 3 }),
          expect.objectContaining({ code: 'updatedBy', displayOrder: 4 }),
          expect.objectContaining({ code: 'updatedAt', displayOrder: 5 }),
        ]),
        command.createdBy
      );
    });

    it('应该正确设置通用字段的数据类型和约束', async () => {
      // Arrange
      const command = new CreateEntityCommand(
        'project-1',
        '用户实体',
        'user',
        'users',
        '用户信息管理实体',
        '基础数据',
        { x: 100, y: 200 },
        {},
        EntityStatus.DRAFT,
        'test-user'
      );

      const expectedEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        diagramPosition: command.diagramPosition,
        config: command.config,
        status: command.status,
        createdBy: command.createdBy,
      });

      commonFieldService.getCommonFieldDefinitions.mockReturnValue(mockCommonFields);
      commonFieldService.getMaxCommonFieldDisplayOrder.mockReturnValue(5);
      entityRepository.save.mockResolvedValue(expectedEntity);
      fieldCreationService.createFieldsForEntity.mockResolvedValue(undefined);
      databaseMigrationService.createTableForEntity.mockResolvedValue(undefined);

      // Act
      await handler.execute(command);

      // Assert
      expect(fieldCreationService.createFieldsForEntity).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            code: 'id',
            dataType: FieldDataType.STRING,
            required: true,
            unique: true,
          }),
          expect.objectContaining({
            code: 'createdBy',
            dataType: FieldDataType.STRING,
            required: true,
            unique: false,
          }),
          expect.objectContaining({
            code: 'createdAt',
            dataType: FieldDataType.DATETIME,
            required: true,
            unique: false,
          }),
          expect.objectContaining({
            code: 'updatedBy',
            dataType: FieldDataType.STRING,
            required: false,
            unique: false,
          }),
          expect.objectContaining({
            code: 'updatedAt',
            dataType: FieldDataType.DATETIME,
            required: false,
            unique: false,
          }),
        ]),
        command.createdBy
      );
    });
  });
});