import { Test, TestingModule } from '@nestjs/testing';
import { CreateRelationshipHandler } from '../application/handlers/create-relationship.handler';
import { GetRelationshipHandler, GetRelationshipsByProjectHandler, GetRelationshipsPaginatedHandler } from '../application/handlers/get-relationship.handler';
import { CreateRelationshipCommand } from '../application/commands/create-relationship.command';
import { GetRelationshipQuery, GetRelationshipsByProjectQuery, GetRelationshipsPaginatedQuery } from '../application/queries/get-relationship.query';
import { Relationship, RelationshipType, RelationshipStatus } from '../domain/relationship.model';

describe('Relationship Handlers', () => {
  let createHandler: CreateRelationshipHandler;
  let getHandler: GetRelationshipHandler;
  let getRelationshipsHandler: GetRelationshipsByProjectHandler;
  let getPaginatedHandler: GetRelationshipsPaginatedHandler;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByProjectId: jest.fn(),
      findPaginated: jest.fn(),
      existsByCode: jest.fn(),
      existsBetweenEntities: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateRelationshipHandler,
        GetRelationshipHandler,
        GetRelationshipsByProjectHandler,
        GetRelationshipsPaginatedHandler,
        {
          provide: 'RelationshipRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    createHandler = module.get<CreateRelationshipHandler>(CreateRelationshipHandler);
    getHandler = module.get<GetRelationshipHandler>(GetRelationshipHandler);
    getRelationshipsHandler = module.get<GetRelationshipsByProjectHandler>(GetRelationshipsByProjectHandler);
    getPaginatedHandler = module.get<GetRelationshipsPaginatedHandler>(GetRelationshipsPaginatedHandler);
  });

  describe('CreateRelationshipHandler', () => {
    it('should create a relationship successfully', async () => {
      const command = new CreateRelationshipCommand(
        'project-123',
        'User-Order Relationship',
        'userOrder',
        RelationshipType.ONE_TO_MANY,
        'user-entity-id',
        'order-entity-id',
        'User has many orders',
        undefined, // sourceFieldId
        undefined, // targetFieldId
        undefined, // foreignKeyName
        'CASCADE',  // onDelete
        'CASCADE',  // onUpdate
        undefined, // config
        'user123'  // createdBy
      );

      const mockRelationship = Relationship.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        type: command.type,
        sourceEntityId: command.sourceEntityId,
        targetEntityId: command.targetEntityId,
        description: command.description,
        onDelete: command.onDelete,
        onUpdate: command.onUpdate,
        createdBy: command.createdBy,
      });

      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.existsBetweenEntities.mockResolvedValue(false);
      mockRepository.save.mockResolvedValue(mockRelationship);

      const result = await createHandler.execute(command);

      expect(mockRepository.existsByCode).toHaveBeenCalledWith(command.projectId, command.code);
      expect(mockRepository.existsBetweenEntities).toHaveBeenCalledWith(
        command.sourceEntityId,
        command.targetEntityId
      );
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Relationship));
      expect(result).toBe(mockRelationship);
    });

    it('should throw error when relationship code already exists', async () => {
      const command = new CreateRelationshipCommand(
        'project-123',
        'User-Order Relationship',
        'existing_code',
        RelationshipType.ONE_TO_MANY,
        'user-entity-id',
        'order-entity-id',
        'User has many orders',
        undefined, // sourceFieldId
        undefined, // targetFieldId
        undefined, // foreignKeyName
        'CASCADE',  // onDelete
        'CASCADE',  // onUpdate
        undefined, // config
        'user123'  // createdBy
      );

      mockRepository.existsByCode.mockResolvedValue(true);

      await expect(createHandler.execute(command)).rejects.toThrow(
        'Relationship with code \'existing_code\' already exists in this project'
      );

      expect(mockRepository.existsByCode).toHaveBeenCalledWith(command.projectId, command.code);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create relationship even when relationship between entities exists (with warning)', async () => {
      const command = new CreateRelationshipCommand(
        'project-123',
        'User-Order Relationship',
        'userOrder',
        RelationshipType.ONE_TO_MANY,
        'user-entity-id',
        'order-entity-id',
        'User has many orders',
        undefined, // sourceFieldId
        undefined, // targetFieldId
        undefined, // foreignKeyName
        'CASCADE',  // onDelete
        'CASCADE',  // onUpdate
        undefined, // config
        'user123'  // createdBy
      );

      const mockRelationship = Relationship.create({
        projectId: command.projectId,
        name: command.name,
        code: command.code,
        type: command.type,
        sourceEntityId: command.sourceEntityId,
        targetEntityId: command.targetEntityId,
        description: command.description,
        onDelete: command.onDelete,
        onUpdate: command.onUpdate,
        createdBy: command.createdBy,
      });

      mockRepository.existsByCode.mockResolvedValue(false);
      mockRepository.existsBetweenEntities.mockResolvedValue(true);
      mockRepository.save.mockResolvedValue(mockRelationship);

      // Should still create the relationship, just with a warning
      const result = await createHandler.execute(command);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toBe(mockRelationship);
    });
  });

  describe('GetRelationshipHandler', () => {
    it('should get relationship by id successfully', async () => {
      const query = new GetRelationshipQuery('relationship-123');
      const mockRelationship = Relationship.create({
        projectId: 'project-123',
        name: 'User-Order Relationship',
        code: 'userOrder',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'user-entity-id',
        targetEntityId: 'order-entity-id',
        createdBy: 'user123',
      });

      mockRepository.findById.mockResolvedValue(mockRelationship);

      const result = await getHandler.execute(query);

      expect(mockRepository.findById).toHaveBeenCalledWith(query.id);
      expect(result).toBe(mockRelationship);
    });

    it('should throw error when relationship not found', async () => {
      const query = new GetRelationshipQuery('non-existent');

      mockRepository.findById.mockResolvedValue(null);

      await expect(getHandler.execute(query)).rejects.toThrow(
        'Relationship with id \'non-existent\' not found'
      );
    });
  });

  describe('GetRelationshipsByProjectHandler', () => {
    it('should get relationships by project id successfully', async () => {
      const query = new GetRelationshipsByProjectQuery('project-123');
      const mockRelationships = [
        Relationship.create({
          projectId: 'project-123',
          name: 'User-Order',
          code: 'userOrder',
          type: RelationshipType.ONE_TO_MANY,
          sourceEntityId: 'user-id',
          targetEntityId: 'order-id',
          createdBy: 'user123',
        }),
        Relationship.create({
          projectId: 'project-123',
          name: 'Order-Product',
          code: 'orderProduct',
          type: RelationshipType.MANY_TO_MANY,
          sourceEntityId: 'order-id',
          targetEntityId: 'product-id',
          createdBy: 'user123',
        }),
      ];

      mockRepository.findByProjectId.mockResolvedValue(mockRelationships);

      const result = await getRelationshipsHandler.execute(query);

      expect(mockRepository.findByProjectId).toHaveBeenCalledWith(query.projectId);
      expect(result).toBe(mockRelationships);
    });
  });

  describe('GetRelationshipsPaginatedHandler', () => {
    it('should get paginated relationships successfully', async () => {
      const query = new GetRelationshipsPaginatedQuery('project-123', 1, 10, { search: 'user' });
      const mockResult = {
        relationships: [
          Relationship.create({
            projectId: 'project-123',
            name: 'User-Order',
            code: 'userOrder',
            type: RelationshipType.ONE_TO_MANY,
            sourceEntityId: 'user-id',
            targetEntityId: 'order-id',
            createdBy: 'user123',
          }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRepository.findPaginated.mockResolvedValue(mockResult);

      const result = await getPaginatedHandler.execute(query);

      expect(mockRepository.findPaginated).toHaveBeenCalledWith(
        query.projectId,
        query.page,
        query.limit,
        query.filters
      );
      expect(result).toBe(mockResult);
    });
  });
});
