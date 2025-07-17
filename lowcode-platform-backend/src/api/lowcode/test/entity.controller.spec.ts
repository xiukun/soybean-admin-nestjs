import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EntityController } from '../entity.controller';
import { Entity } from '../../../lib/bounded-contexts/entity/domain/entity.model';

describe('EntityController', () => {
  let controller: EntityController;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;

  beforeEach(async () => {
    mockCommandBus = {
      execute: jest.fn(),
    } as any;

    mockQueryBus = {
      execute: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntityController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
      ],
    }).compile();

    controller = module.get<EntityController>(EntityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createEntity', () => {
    it('should create entity successfully', async () => {
      const createDto = {
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        description: 'User entity',
        category: 'core',
      };

      const mockEntity = Entity.create({
        ...createDto,
        createdBy: 'system',
      });

      mockCommandBus.execute.mockResolvedValue(mockEntity);

      const result = await controller.createEntity(createDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createDto.name);
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });
  });

  describe('getEntity', () => {
    it('should get entity by id successfully', async () => {
      const entityId = 'entity-123';
      const mockEntity = Entity.create({
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        createdBy: 'system',
      });

      mockQueryBus.execute.mockResolvedValue(mockEntity);

      const result = await controller.getEntity(entityId);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('User');
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });
  });

  describe('getEntitiesByProject', () => {
    it('should get entities by project id', async () => {
      const projectId = 'project-123';
      const mockEntities = [
        Entity.create({
          projectId: 'project-123',
          name: 'User',
          code: 'user',
          tableName: 'users',
          createdBy: 'system',
        }),
        Entity.create({
          projectId: 'project-123',
          name: 'Order',
          code: 'order',
          tableName: 'orders',
          createdBy: 'system',
        }),
      ];

      mockQueryBus.execute.mockResolvedValue(mockEntities);

      const result = await controller.getEntitiesByProject(projectId);

      expect(result).toHaveLength(2);
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });

  });

  describe('getEntitiesPaginated', () => {
    it('should get paginated entities', async () => {
      const projectId = 'project-123';
      const query = {
        page: 1,
        limit: 10,
      };

      const mockResult = {
        entities: [
          Entity.create({
            projectId: 'project-123',
            name: 'User',
            code: 'user',
            tableName: 'users',
            createdBy: 'system',
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockQueryBus.execute.mockResolvedValue(mockResult);

      const result = await controller.getEntitiesPaginated(projectId, query);

      expect(result.entities).toHaveLength(1);
      expect(mockQueryBus.execute).toHaveBeenCalled();
    });
  });

  describe('updateEntity', () => {
    it('should update entity successfully', async () => {
      const entityId = 'entity-123';
      const updateDto = {
        name: 'Updated User',
        description: 'Updated description',
      };

      const mockUpdatedEntity = Entity.create({
        projectId: 'project-123',
        name: updateDto.name,
        code: 'user',
        tableName: 'users',
        description: updateDto.description,
        createdBy: 'system',
      });

      mockCommandBus.execute.mockResolvedValue(mockUpdatedEntity);

      const result = await controller.updateEntity(entityId, updateDto);

      expect(result).toHaveProperty('name', updateDto.name);
      expect(mockCommandBus.execute).toHaveBeenCalled();
    });
  });

  describe('deleteEntity', () => {
    it('should delete entity successfully', async () => {
      const entityId = 'entity-123';

      mockCommandBus.execute.mockResolvedValue(undefined);

      await controller.deleteEntity(entityId);

      expect(mockCommandBus.execute).toHaveBeenCalled();
    });
  });


});
