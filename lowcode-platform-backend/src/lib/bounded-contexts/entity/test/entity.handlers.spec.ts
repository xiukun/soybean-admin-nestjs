import { Test, TestingModule } from '@nestjs/testing';
import { CreateEntityHandler } from '../application/handlers/create-entity.handler';
import { GetEntityHandler, GetEntitiesByProjectHandler, GetEntitiesPaginatedHandler } from '../application/handlers/get-entity.handler';
import { UpdateEntityHandler } from '../application/handlers/update-entity.handler';
import { DeleteEntityHandler } from '../application/handlers/delete-entity.handler';
import { CreateEntityCommand } from '../application/commands/create-entity.command';
import { GetEntityQuery, GetEntitiesByProjectQuery, GetEntitiesPaginatedQuery } from '../application/queries/get-entity.query';
import { UpdateEntityCommand } from '../application/commands/update-entity.command';
import { DeleteEntityCommand } from '../application/commands/delete-entity.command';
import { Entity, EntityStatus } from '../domain/entity.model';

describe('Entity Handlers', () => {
  let createHandler: CreateEntityHandler;
  let getHandler: GetEntityHandler;
  let getEntitiesHandler: GetEntitiesByProjectHandler;
  let getPaginatedHandler: GetEntitiesPaginatedHandler;
  let updateHandler: UpdateEntityHandler;
  let deleteHandler: DeleteEntityHandler;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn(),
      findEntitiesPaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCode: jest.fn(),
      existsByTableName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateEntityHandler,
        GetEntityHandler,
        GetEntitiesByProjectHandler,
        GetEntitiesPaginatedHandler,
        UpdateEntityHandler,
        DeleteEntityHandler,
        {
          provide: 'EntityRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    createHandler = module.get<CreateEntityHandler>(CreateEntityHandler);
    getHandler = module.get<GetEntityHandler>(GetEntityHandler);
    getEntitiesHandler = module.get<GetEntitiesByProjectHandler>(GetEntitiesByProjectHandler);
    getPaginatedHandler = module.get<GetEntitiesPaginatedHandler>(GetEntitiesPaginatedHandler);
    updateHandler = module.get<UpdateEntityHandler>(UpdateEntityHandler);
    deleteHandler = module.get<DeleteEntityHandler>(DeleteEntityHandler);
  });

  describe('CreateEntityHandler', () => {
    it('should create an entity successfully', async () => {
      const command = new CreateEntityCommand(
        'project-123',
        'User',
        'user',
        'users',
        'User entity',
        'core',
        undefined, // diagramPosition
        undefined, // config
        'user123'  // createdBy
      );

      const mockEntity = Entity.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        tableName: command.tableName,
        description: command.description,
        category: command.category,
        createdBy: command.createdBy,
      });

      mockRepository.findByCode.mockResolvedValue(null);
      mockRepository.existsByTableName.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(mockEntity);

      const result = await createHandler.execute(command);

      expect(mockRepository.findByCode).toHaveBeenCalledWith(command.projectId, command.code);
      expect(mockRepository.existsByTableName).toHaveBeenCalledWith(command.projectId, command.tableName);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Entity));
      expect(result).toBe(mockEntity);
    });

    it('should throw error when entity code already exists', async () => {
      const command = new CreateEntityCommand(
        'project-123',
        'User',
        'existing_code',
        'users',
        'User entity',
        'core',
        undefined, // diagramPosition
        undefined, // config
        'user123'  // createdBy
      );

      const existingEntity = Entity.create({
        projectId: command.projectId,
        name: 'Existing Entity',
        code: 'existing_code',
        tableName: 'existing_table',
        createdBy: 'user123',
      });

      mockRepository.findByCode.mockResolvedValue(existingEntity);
      mockRepository.existsByTableName.mockResolvedValue(false);

      await expect(createHandler.execute(command)).rejects.toThrow(
        'Entity with code \'existing_code\' already exists in this project'
      );

      expect(mockRepository.findByCode).toHaveBeenCalledWith(command.projectId, command.code);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('GetEntityHandler', () => {
    it('should get entity by id successfully', async () => {
      const query = new GetEntityQuery('entity-123');
      const mockEntity = Entity.create({
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        createdBy: 'user123',
      });

      mockRepository.findById.mockResolvedValue(mockEntity);

      const result = await getHandler.execute(query);

      expect(mockRepository.findById).toHaveBeenCalledWith(query.id);
      expect(result).toBe(mockEntity);
    });

    it('should throw error when entity not found', async () => {
      const query = new GetEntityQuery('non-existent');

      mockRepository.findById.mockResolvedValue(null);

      await expect(getHandler.execute(query)).rejects.toThrow(
        'Entity with id \'non-existent\' not found'
      );
    });
  });

  describe('GetEntitiesByProjectHandler', () => {
    it('should get entities by project id successfully', async () => {
      const query = new GetEntitiesByProjectQuery('project-123');
      const mockEntities = [
        Entity.create({ projectId: 'project-123', name: 'User', code: 'user', tableName: 'users', createdBy: 'user123' }),
        Entity.create({ projectId: 'project-123', name: 'Product', code: 'product', tableName: 'products', createdBy: 'user123' }),
      ];

      mockRepository.findByProjectId.mockResolvedValue(mockEntities);

      const result = await getEntitiesHandler.execute(query);

      expect(mockRepository.findByProjectId).toHaveBeenCalledWith(query.projectId);
      expect(result).toBe(mockEntities);
    });
  });

  describe('GetEntitiesPaginatedHandler', () => {
    it('should get paginated entities successfully', async () => {
      const query = new GetEntitiesPaginatedQuery('project-123', 1, 10, { search: 'user' });
      const mockResult = {
        entities: [
          Entity.create({ projectId: 'project-123', name: 'User', code: 'user', tableName: 'users', createdBy: 'user123' }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRepository.findEntitiesPaginated.mockResolvedValue(mockResult);

      const result = await getPaginatedHandler.execute(query);

      expect(mockRepository.findEntitiesPaginated).toHaveBeenCalledWith(
        query.projectId,
        query.page,
        query.limit,
        query.filters
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('UpdateEntityHandler', () => {
    it('should update entity successfully', async () => {
      const command = new UpdateEntityCommand(
        'entity-123',
        'Updated User',
        'user',
        'users',
        'updated_description',
        'business',
        undefined,
        undefined,
        'user456'
      );

      const existingEntity = Entity.create({
        projectId: 'project-123',
        name: 'Original User',
        code: 'user',
        tableName: 'users',
        createdBy: 'user123',
      });

      const updatedEntity = Entity.fromPersistence({
        ...existingEntity.toJSON(),
        name: command.name,
        description: command.description,
        category: command.category,
        updatedBy: command.updatedBy,
        updatedAt: new Date(),
      });

      mockRepository.findById.mockResolvedValue(existingEntity);
      mockRepository.update.mockResolvedValue(updatedEntity);

      const result = await updateHandler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(command.id);
      expect(mockRepository.update).toHaveBeenCalledWith(expect.any(Entity));
      expect(result).toBe(updatedEntity);
    });

    it('should throw error when entity not found', async () => {
      const command = new UpdateEntityCommand(
        'non-existent',
        'Updated User',
        'user',
        'users',
        'updated_description',
        'business',
        undefined,
        undefined,
        'user456'
      );

      mockRepository.findById.mockResolvedValue(null);

      await expect(updateHandler.execute(command)).rejects.toThrow(
        'Entity with id \'non-existent\' not found'
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('DeleteEntityHandler', () => {
    it('should delete entity successfully', async () => {
      const command = new DeleteEntityCommand('entity-123');
      const mockEntity = Entity.create({
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        createdBy: 'user123',
      });
      // Entity is in DRAFT status by default, so it can be deleted

      mockRepository.findById.mockResolvedValue(mockEntity);
      mockRepository.delete.mockResolvedValue(undefined);

      await deleteHandler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(command.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(command.id);
    });

    it('should throw error when entity not found', async () => {
      const command = new DeleteEntityCommand('non-existent');

      mockRepository.findById.mockResolvedValue(null);

      await expect(deleteHandler.execute(command)).rejects.toThrow(
        'Entity with id \'non-existent\' not found'
      );

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when entity cannot be deleted', async () => {
      const command = new DeleteEntityCommand('entity-123');
      const mockEntity = Entity.create({
        projectId: 'project-123',
        name: 'User',
        code: 'user',
        tableName: 'users',
        createdBy: 'user123',
      });
      // Make entity published so it cannot be deleted
      mockEntity.publish();

      mockRepository.findById.mockResolvedValue(mockEntity);

      await expect(deleteHandler.execute(command)).rejects.toThrow(
        'Cannot delete published entity. Only draft entities can be deleted.'
      );

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
