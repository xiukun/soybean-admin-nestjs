import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MetadataAggregatorService } from '../../src/lib/bounded-contexts/metadata/application/services/metadata-aggregator.service';
import { PrismaService } from '@prisma/prisma.service';

describe('MetadataAggregatorService', () => {
  let service: MetadataAggregatorService;
  let prisma: PrismaService;

  const mockProject = {
    id: 'test-project-1',
    name: 'Test Project',
    code: 'test-project',
    description: 'Test project description',
  };

  const mockEntity = {
    id: 'test-entity-1',
    name: 'TestUser',
    code: 'TestUser',
    tableName: 'test_users',
    description: 'Test user entity',
    projectId: 'test-project-1',
  };

  const mockFields = [
    {
      id: 'field-1',
      name: 'Name',
      code: 'name',
      type: 'STRING',
      length: 100,
      nullable: false,
      primaryKey: false,
      uniqueConstraint: false,
      sortOrder: 1,
    },
    {
      id: 'field-2',
      name: 'Email',
      code: 'email',
      type: 'STRING',
      length: 255,
      nullable: false,
      primaryKey: false,
      uniqueConstraint: true,
      sortOrder: 2,
    },
  ];

  const mockPrismaService = {
    project: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataAggregatorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetadataAggregatorService>(MetadataAggregatorService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getProjectMetadata', () => {
    it('should return project metadata with default fields', async () => {
      // Arrange
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            ...mockEntity,
            fields: mockFields,
          },
        ])
        .mockResolvedValueOnce([]); // relationships

      // Act
      const result = await service.getProjectMetadata('test-project-1', false);

      // Assert
      expect(result).toBeDefined();
      expect(result.project).toEqual(mockProject);
      expect(result.entities).toHaveLength(1);
      
      const entity = result.entities[0];
      expect(entity.fields).toBeDefined();
      expect(entity.fields.length).toBeGreaterThan(mockFields.length); // Should include default fields
      
      // Check for default fields
      const defaultFieldCodes = ['id', 'createdAt', 'updatedAt', 'tenantId', 'createdBy', 'updatedBy'];
      defaultFieldCodes.forEach(fieldCode => {
        const field = entity.fields.find(f => f.code === fieldCode);
        expect(field).toBeDefined();
      });
      
      // Check custom fields are preserved
      const nameField = entity.fields.find(f => f.code === 'name');
      const emailField = entity.fields.find(f => f.code === 'email');
      expect(nameField).toBeDefined();
      expect(emailField).toBeDefined();
      expect(emailField.isUnique).toBe(true);
    });

    it('should throw NotFoundException for non-existent project', async () => {
      // Arrange
      mockPrismaService.project.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProjectMetadata('non-existent-project', false))
        .rejects.toThrow(NotFoundException);
    });

    it('should use cache when enabled', async () => {
      // Arrange
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValueOnce([]);

      // Act
      const result1 = await service.getProjectMetadata('test-project-1', true);
      const result2 = await service.getProjectMetadata('test-project-1', true);

      // Assert
      expect(result1).toEqual(result2);
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should skip cache when disabled', async () => {
      // Arrange
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.$queryRaw
        .mockResolvedValue([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValue([]);

      // Act
      await service.getProjectMetadata('test-project-1', false);
      await service.getProjectMetadata('test-project-1', false);

      // Assert
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('getEntityMetadata', () => {
    it('should return entity metadata with default fields', async () => {
      // Arrange
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValueOnce([]); // relationships

      // Act
      const result = await service.getEntityMetadata('test-entity-1', false);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('test-entity-1');
      expect(result.name).toBe('TestUser');
      expect(result.fields).toBeDefined();
      expect(result.fields.length).toBeGreaterThan(mockFields.length);
      
      // Verify primary key field exists
      const primaryKeyField = result.fields.find(f => f.isPrimaryKey);
      expect(primaryKeyField).toBeDefined();
      expect(primaryKeyField.code).toBe('id');
    });

    it('should throw NotFoundException for non-existent entity', async () => {
      // Arrange
      mockPrismaService.$queryRaw.mockResolvedValue([]);

      // Act & Assert
      await expect(service.getEntityMetadata('non-existent-entity', false))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('validateEntityStructure', () => {
    it('should validate entity structure successfully', async () => {
      // Arrange
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.validateEntityStructure('test-entity-1');

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      // Arrange - entity without required fields
      const invalidEntity = {
        ...mockEntity,
        fields: [], // No fields at all
      };
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([invalidEntity])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.validateEntityStructure('test-entity-1');

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('cache management', () => {
    it('should invalidate project cache', async () => {
      // Arrange
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.$queryRaw
        .mockResolvedValue([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValue([]);

      // Act
      await service.getProjectMetadata('test-project-1', true);
      service.invalidateProjectCache('test-project-1');
      await service.getProjectMetadata('test-project-1', true);

      // Assert
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should invalidate entity cache', async () => {
      // Arrange
      mockPrismaService.$queryRaw
        .mockResolvedValue([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValue([]);

      // Act
      await service.getEntityMetadata('test-entity-1', true);
      service.invalidateEntityCache('test-entity-1');
      await service.getEntityMetadata('test-entity-1', true);

      // Assert
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(4); // 2 calls per getEntityMetadata
    });

    it('should invalidate all cache', async () => {
      // Arrange
      mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
      mockPrismaService.$queryRaw
        .mockResolvedValue([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValue([]);

      // Act
      await service.getProjectMetadata('test-project-1', true);
      service.invalidateAllCache();
      await service.getProjectMetadata('test-project-1', true);

      // Assert
      expect(mockPrismaService.project.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('getFieldMetadata', () => {
    it('should return field metadata by entity and field code', async () => {
      // Arrange
      mockPrismaService.$queryRaw
        .mockResolvedValue([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValue([]);

      // Act
      const result = await service.getFieldMetadata('test-entity-1', 'name');

      // Assert
      expect(result).toBeDefined();
      expect(result.code).toBe('name');
      expect(result.name).toBe('Name');
    });

    it('should return null for non-existent field', async () => {
      // Arrange
      mockPrismaService.$queryRaw
        .mockResolvedValue([{ ...mockEntity, fields: mockFields }])
        .mockResolvedValue([]);

      // Act
      const result = await service.getFieldMetadata('test-entity-1', 'non-existent-field');

      // Assert
      expect(result).toBeNull();
    });
  });
});
