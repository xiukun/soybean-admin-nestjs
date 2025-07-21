import { Test, TestingModule } from '@nestjs/testing';
import { MetadataAggregatorService } from '../metadata-aggregator.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ProjectMetadata, EntityMetadata, FieldMetadata, RelationshipMetadata } from '../../../domain/metadata.types';

describe('MetadataAggregatorService', () => {
  let service: MetadataAggregatorService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockProject: ProjectMetadata = {
    id: 'project-1',
    name: 'Test Project',
    code: 'test-project',
    description: 'Test project description',
    framework: 'nestjs',
    architecture: 'ddd',
    language: 'typescript',
    database: 'postgresql',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockEntity: EntityMetadata = {
    id: 'entity-1',
    projectId: 'project-1',
    name: 'User',
    code: 'User',
    tableName: 'users',
    description: 'User entity',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockField: FieldMetadata = {
    id: 'field-1',
    entityId: 'entity-1',
    name: 'Email',
    code: 'email',
    type: 'STRING',
    nullable: false,
    isPrimaryKey: false,
    isUnique: true,
    length: 255,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRelationship: RelationshipMetadata = {
    id: 'relationship-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    relationshipName: 'profile',
    relationType: 'oneToOne',
    isRequired: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      entity: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      field: {
        findMany: jest.fn(),
      },
      relationship: {
        findMany: jest.fn(),
      },
    };

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
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProjectMetadata', () => {
    it('should return project metadata with entities', async () => {
      prismaService.project.findUnique.mockResolvedValue(mockProject);
      prismaService.entity.findMany.mockResolvedValue([mockEntity]);
      prismaService.field.findMany.mockResolvedValue([mockField]);
      prismaService.relationship.findMany.mockResolvedValue([mockRelationship]);

      const result = await service.getProjectMetadata('project-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('project-1');
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].fields).toHaveLength(4); // 1 custom field + 3 default fields
    });

    it('should throw error when project not found', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectMetadata('non-existent')).rejects.toThrow('Project not found');
    });
  });

  describe('getEntityMetadata', () => {
    it('should return entity metadata with fields and relationships', async () => {
      prismaService.entity.findUnique.mockResolvedValue(mockEntity);
      prismaService.field.findMany.mockResolvedValue([mockField]);
      prismaService.relationship.findMany.mockResolvedValue([mockRelationship]);

      const result = await service.getEntityMetadata('entity-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('entity-1');
      expect(result.fields).toHaveLength(4); // 1 custom field + 3 default fields
      expect(result.relationships).toHaveLength(1);
    });

    it('should throw error when entity not found', async () => {
      prismaService.entity.findUnique.mockResolvedValue(null);

      await expect(service.getEntityMetadata('non-existent')).rejects.toThrow('Entity not found');
    });
  });

  describe('getDefaultFieldsForEntity', () => {
    it('should return default fields with all options enabled', () => {
      const config = {
        enableSoftDelete: true,
        enableAudit: true,
        enableVersioning: true,
        enableTenancy: true,
        enableStatus: true,
      };

      const defaultFields = service.getDefaultFieldsForEntity(config);

      expect(defaultFields).toHaveLength(8); // id, tenantId, createdBy, updatedBy, createdAt, updatedAt, status, deletedAt, version
      expect(defaultFields.find(f => f.code === 'id')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'tenantId')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'createdBy')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'updatedBy')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'status')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'deletedAt')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'version')).toBeDefined();
    });

    it('should return minimal default fields when all options disabled', () => {
      const config = {
        enableSoftDelete: false,
        enableAudit: false,
        enableVersioning: false,
        enableTenancy: false,
        enableStatus: false,
      };

      const defaultFields = service.getDefaultFieldsForEntity(config);

      expect(defaultFields).toHaveLength(3); // id, createdAt, updatedAt
      expect(defaultFields.find(f => f.code === 'id')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'createdAt')).toBeDefined();
      expect(defaultFields.find(f => f.code === 'updatedAt')).toBeDefined();
    });
  });

  describe('validateRelationships', () => {
    it('should validate relationships without errors', () => {
      const validRelationships = [mockRelationship];

      expect(() => service['validateRelationships'](validRelationships)).not.toThrow();
    });

    it('should throw error for invalid relationship type', () => {
      const invalidRelationship = {
        ...mockRelationship,
        relationType: 'invalidType' as any,
      };

      expect(() => service['validateRelationships']([invalidRelationship])).toThrow('Invalid relationship type');
    });

    it('should throw error for duplicate relationship names', () => {
      const duplicateRelationships = [
        mockRelationship,
        { ...mockRelationship, id: 'relationship-2' },
      ];

      expect(() => service['validateRelationships'](duplicateRelationships)).toThrow('Duplicate relationship name');
    });

    it('should throw error for circular reference', () => {
      const circularRelationship = {
        ...mockRelationship,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-1',
        relationType: 'oneToMany' as any,
      };

      expect(() => service['validateRelationships']([circularRelationship])).toThrow('Circular reference detected');
    });
  });

  describe('aggregateMetadata', () => {
    it('should aggregate metadata for multiple entities', async () => {
      const entities = [mockEntity];
      prismaService.field.findMany.mockResolvedValue([mockField]);
      prismaService.relationship.findMany.mockResolvedValue([mockRelationship]);

      const result = await service.aggregateMetadata(entities);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('entity-1');
      expect(result[0].fields).toHaveLength(4); // 1 custom field + 3 default fields
      expect(result[0].relationships).toHaveLength(1);
    });

    it('should handle empty entities array', async () => {
      const result = await service.aggregateMetadata([]);

      expect(result).toHaveLength(0);
    });
  });

  describe('isSystemField', () => {
    it('should identify system fields correctly', () => {
      expect(service['isSystemField']('id')).toBe(true);
      expect(service['isSystemField']('createdAt')).toBe(true);
      expect(service['isSystemField']('updatedAt')).toBe(true);
      expect(service['isSystemField']('createdBy')).toBe(true);
      expect(service['isSystemField']('updatedBy')).toBe(true);
      expect(service['isSystemField']('status')).toBe(true);
      expect(service['isSystemField']('deletedAt')).toBe(true);
      expect(service['isSystemField']('version')).toBe(true);
      expect(service['isSystemField']('tenantId')).toBe(true);
    });

    it('should identify non-system fields correctly', () => {
      expect(service['isSystemField']('email')).toBe(false);
      expect(service['isSystemField']('firstName')).toBe(false);
      expect(service['isSystemField']('lastName')).toBe(false);
      expect(service['isSystemField']('customField')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      prismaService.project.findUnique.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getProjectMetadata('project-1')).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid entity IDs', async () => {
      prismaService.entity.findUnique.mockResolvedValue(null);

      await expect(service.getEntityMetadata('')).rejects.toThrow();
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeEntitySet = Array.from({ length: 100 }, (_, i) => ({
        ...mockEntity,
        id: `entity-${i}`,
        name: `Entity${i}`,
      }));

      const largeFieldSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockField,
        id: `field-${i}`,
        entityId: `entity-${i % 100}`,
        name: `Field${i}`,
      }));

      prismaService.field.findMany.mockResolvedValue(largeFieldSet);
      prismaService.relationship.findMany.mockResolvedValue([]);

      const startTime = Date.now();
      const result = await service.aggregateMetadata(largeEntitySet);
      const endTime = Date.now();

      expect(result).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
