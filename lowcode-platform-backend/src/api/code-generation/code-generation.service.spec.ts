import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CodeGenerationService } from './code-generation.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { ServiceRegistry } from '@lib/shared/microservices/service-registry';

describe('CodeGenerationService', () => {
  let service: CodeGenerationService;
  let prismaService: PrismaService;
  let serviceRegistry: ServiceRegistry;
  let configService: ConfigService;

  const mockPrismaService = {
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

  const mockServiceRegistry = {
    makeRequest: jest.fn(),
    getService: jest.fn(),
    updateServiceStatus: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeGenerationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ServiceRegistry,
          useValue: mockServiceRegistry,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CodeGenerationService>(CodeGenerationService);
    prismaService = module.get<PrismaService>(PrismaService);
    serviceRegistry = module.get<ServiceRegistry>(ServiceRegistry);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCode', () => {
    it('should generate code successfully', async () => {
      // Arrange
      const entityIds = ['entity-1', 'entity-2'];
      const targetProject = 'amis-lowcode-backend';
      const options = {
        overwrite: true,
        createDirectories: true,
        format: true,
        dryRun: false,
      };

      const mockEntities = [
        {
          id: 'entity-1',
          name: 'User',
          code: 'user',
          description: 'User entity',
          fields: [
            {
              id: 'field-1',
              name: 'Name',
              code: 'name',
              type: 'string',
              required: true,
            },
          ],
        },
      ];

      mockPrismaService.entity.findMany.mockResolvedValue(mockEntities);
      mockServiceRegistry.makeRequest.mockResolvedValue({
        success: true,
        data: {
          success: true,
          generatedFiles: ['user.controller.ts', 'user.service.ts'],
          metadata: { totalFiles: 2 },
        },
      });

      // Act
      const result = await service.generateCode(entityIds, targetProject, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.generatedFiles).toHaveLength(2);
      expect(mockPrismaService.entity.findMany).toHaveBeenCalledWith({
        where: { id: { in: entityIds } },
        include: {
          fields: true,
          sourceRelationships: true,
          targetRelationships: true,
        },
      });
      expect(mockServiceRegistry.makeRequest).toHaveBeenCalled();
    });

    it('should handle generation failure', async () => {
      // Arrange
      const entityIds = ['entity-1'];
      const targetProject = 'amis-lowcode-backend';
      const options = { overwrite: true };

      mockPrismaService.entity.findMany.mockResolvedValue([]);
      mockServiceRegistry.makeRequest.mockResolvedValue({
        success: false,
        message: 'Generation failed',
      });

      // Act & Assert
      await expect(
        service.generateCode(entityIds, targetProject, options)
      ).rejects.toThrow('Code generation failed');
    });

    it('should validate entity IDs', async () => {
      // Arrange
      const entityIds: string[] = [];
      const targetProject = 'amis-lowcode-backend';
      const options = {};

      // Act & Assert
      await expect(
        service.generateCode(entityIds, targetProject, options)
      ).rejects.toThrow('Entity IDs are required');
    });
  });

  describe('previewCode', () => {
    it('should generate code preview successfully', async () => {
      // Arrange
      const entityIds = ['entity-1'];
      const targetProject = 'amis-lowcode-backend';
      const options = { dryRun: true };

      const mockEntities = [
        {
          id: 'entity-1',
          name: 'User',
          code: 'user',
          fields: [],
        },
      ];

      mockPrismaService.entity.findMany.mockResolvedValue(mockEntities);
      mockServiceRegistry.makeRequest.mockResolvedValue({
        success: true,
        data: {
          preview: {
            'user.controller.ts': 'controller content',
            'user.service.ts': 'service content',
          },
        },
      });

      // Act
      const result = await service.previewCode(entityIds, targetProject, options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();
      expect(result.preview['user.controller.ts']).toBe('controller content');
    });
  });

  describe('getGenerationStatus', () => {
    it('should return generation status', async () => {
      // Arrange
      const taskId = 'task-123';
      mockServiceRegistry.makeRequest.mockResolvedValue({
        success: true,
        data: {
          status: 'completed',
          progress: 100,
        },
      });

      // Act
      const result = await service.getGenerationStatus(taskId);

      // Assert
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);
    });
  });

  describe('validateEntities', () => {
    it('should validate entities successfully', async () => {
      // Arrange
      const entityIds = ['entity-1'];
      const mockEntities = [
        {
          id: 'entity-1',
          name: 'User',
          code: 'user',
          fields: [
            {
              id: 'field-1',
              name: 'Name',
              code: 'name',
              type: 'string',
              required: true,
            },
          ],
        },
      ];

      mockPrismaService.entity.findMany.mockResolvedValue(mockEntities);

      // Act
      const result = await service.validateEntities(entityIds);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.entities).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      // Arrange
      const entityIds = ['entity-1'];
      const mockEntities = [
        {
          id: 'entity-1',
          name: '',
          code: '',
          fields: [],
        },
      ];

      mockPrismaService.entity.findMany.mockResolvedValue(mockEntities);

      // Act
      const result = await service.validateEntities(entityIds);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getTargetProjects', () => {
    it('should return available target projects', async () => {
      // Arrange
      mockServiceRegistry.makeRequest.mockResolvedValue({
        success: true,
        data: {
          projects: [
            {
              name: 'amis-lowcode-backend',
              displayName: 'Amis Backend',
              type: 'nestjs',
            },
          ],
        },
      });

      // Act
      const result = await service.getTargetProjects();

      // Assert
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('amis-lowcode-backend');
    });
  });

  describe('getGenerationHistory', () => {
    it('should return generation history', async () => {
      // Arrange
      const limit = 10;
      const offset = 0;

      // Mock implementation would depend on how history is stored
      // For now, return empty array
      const result = await service.getGenerationHistory(limit, offset);

      // Assert
      expect(Array.isArray(result.history)).toBe(true);
      expect(typeof result.total).toBe('number');
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors', async () => {
      // Arrange
      mockPrismaService.entity.findMany.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        service.generateCode(['entity-1'], 'target', {})
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle service communication errors', async () => {
      // Arrange
      mockPrismaService.entity.findMany.mockResolvedValue([
        { id: 'entity-1', name: 'Test', code: 'test', fields: [] },
      ]);
      mockServiceRegistry.makeRequest.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act & Assert
      await expect(
        service.generateCode(['entity-1'], 'target', {})
      ).rejects.toThrow('Service unavailable');
    });
  });

  describe('performance tests', () => {
    it('should handle large number of entities efficiently', async () => {
      // Arrange
      const entityIds = Array.from({ length: 100 }, (_, i) => `entity-${i}`);
      const mockEntities = entityIds.map(id => ({
        id,
        name: `Entity${id}`,
        code: `entity${id}`,
        fields: [],
      }));

      mockPrismaService.entity.findMany.mockResolvedValue(mockEntities);
      mockServiceRegistry.makeRequest.mockResolvedValue({
        success: true,
        data: { success: true, generatedFiles: [], metadata: {} },
      });

      // Act
      const startTime = Date.now();
      await service.generateCode(entityIds, 'target', {});
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
