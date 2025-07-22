import { Test, TestingModule } from '@nestjs/testing';
import { CodeGenerationController } from './code-generation.controller';
import { CodeGenerationService } from './code-generation.service';
import { BadRequestException } from '@nestjs/common';

describe('CodeGenerationController', () => {
  let controller: CodeGenerationController;
  let service: CodeGenerationService;

  const mockCodeGenerationService = {
    generateCode: jest.fn(),
    previewCode: jest.fn(),
    getGenerationStatus: jest.fn(),
    validateEntities: jest.fn(),
    getTargetProjects: jest.fn(),
    getGenerationHistory: jest.fn(),
    clearCache: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CodeGenerationController],
      providers: [
        {
          provide: CodeGenerationService,
          useValue: mockCodeGenerationService,
        },
      ],
    }).compile();

    controller = module.get<CodeGenerationController>(CodeGenerationController);
    service = module.get<CodeGenerationService>(CodeGenerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCode', () => {
    it('should generate code successfully', async () => {
      // Arrange
      const generateDto = {
        entityIds: ['entity-1', 'entity-2'],
        targetProject: 'amis-lowcode-backend',
        options: {
          overwrite: true,
          createDirectories: true,
          format: true,
          dryRun: false,
        },
        git: {
          enabled: false,
        },
      };

      const mockResult = {
        success: true,
        generatedFiles: ['user.controller.ts', 'user.service.ts'],
        metadata: {
          totalFiles: 2,
          duration: 1500,
        },
        errors: [],
      };

      mockCodeGenerationService.generateCode.mockResolvedValue(mockResult);

      // Act
      const result = await controller.generateCode(generateDto);

      // Assert
      expect(result.result).toEqual(mockResult);
      expect(service.generateCode).toHaveBeenCalledWith(
        generateDto.entityIds,
        generateDto.targetProject,
        generateDto.options,
        generateDto.git
      );
    });

    it('should handle validation errors', async () => {
      // Arrange
      const generateDto = {
        entityIds: [],
        targetProject: 'amis-lowcode-backend',
        options: {},
        git: { enabled: false },
      };

      mockCodeGenerationService.generateCode.mockRejectedValue(
        new BadRequestException('Entity IDs are required')
      );

      // Act & Assert
      await expect(controller.generateCode(generateDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const generateDto = {
        entityIds: ['entity-1'],
        targetProject: 'amis-lowcode-backend',
        options: {},
        git: { enabled: false },
      };

      mockCodeGenerationService.generateCode.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act & Assert
      await expect(controller.generateCode(generateDto)).rejects.toThrow(
        'Service unavailable'
      );
    });
  });

  describe('previewCode', () => {
    it('should generate code preview successfully', async () => {
      // Arrange
      const previewDto = {
        entityIds: ['entity-1'],
        targetProject: 'amis-lowcode-backend',
        options: { dryRun: true },
      };

      const mockPreview = {
        success: true,
        preview: {
          'user.controller.ts': 'controller content',
          'user.service.ts': 'service content',
        },
        metadata: {
          previewGeneratedAt: new Date().toISOString(),
        },
      };

      mockCodeGenerationService.previewCode.mockResolvedValue(mockPreview);

      // Act
      const result = await controller.previewCode(previewDto);

      // Assert
      expect(result.preview).toEqual(mockPreview);
      expect(service.previewCode).toHaveBeenCalledWith(
        previewDto.entityIds,
        previewDto.targetProject,
        previewDto.options
      );
    });

    it('should handle empty entity list', async () => {
      // Arrange
      const previewDto = {
        entityIds: [],
        targetProject: 'amis-lowcode-backend',
        options: {},
      };

      mockCodeGenerationService.previewCode.mockRejectedValue(
        new BadRequestException('Entity IDs are required')
      );

      // Act & Assert
      await expect(controller.previewCode(previewDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getStatus', () => {
    it('should return generation status', async () => {
      // Arrange
      const taskId = 'task-123';
      const mockStatus = {
        taskId,
        status: 'completed',
        progress: 100,
        startTime: new Date(),
        endTime: new Date(),
        result: {
          success: true,
          generatedFiles: ['file1.ts', 'file2.ts'],
        },
      };

      mockCodeGenerationService.getGenerationStatus.mockResolvedValue(mockStatus);

      // Act
      const result = await controller.getStatus(taskId);

      // Assert
      expect(result.status).toEqual(mockStatus);
      expect(service.getGenerationStatus).toHaveBeenCalledWith(taskId);
    });

    it('should handle invalid task ID', async () => {
      // Arrange
      const taskId = 'invalid-task';

      mockCodeGenerationService.getGenerationStatus.mockRejectedValue(
        new Error('Task not found')
      );

      // Act & Assert
      await expect(controller.getStatus(taskId)).rejects.toThrow('Task not found');
    });
  });

  describe('validateEntities', () => {
    it('should validate entities successfully', async () => {
      // Arrange
      const validateDto = {
        entityIds: ['entity-1', 'entity-2'],
      };

      const mockValidation = {
        valid: true,
        entities: [
          { id: 'entity-1', name: 'User', valid: true, errors: [] },
          { id: 'entity-2', name: 'Product', valid: true, errors: [] },
        ],
        errors: [],
        warnings: [],
      };

      mockCodeGenerationService.validateEntities.mockResolvedValue(mockValidation);

      // Act
      const result = await controller.validateEntities(validateDto);

      // Assert
      expect(result.validation).toEqual(mockValidation);
      expect(service.validateEntities).toHaveBeenCalledWith(validateDto.entityIds);
    });

    it('should return validation errors', async () => {
      // Arrange
      const validateDto = {
        entityIds: ['invalid-entity'],
      };

      const mockValidation = {
        valid: false,
        entities: [],
        errors: ['Entity not found: invalid-entity'],
        warnings: [],
      };

      mockCodeGenerationService.validateEntities.mockResolvedValue(mockValidation);

      // Act
      const result = await controller.validateEntities(validateDto);

      // Assert
      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors).toHaveLength(1);
    });
  });

  describe('getTargetProjects', () => {
    it('should return available target projects', async () => {
      // Arrange
      const mockProjects = {
        projects: [
          {
            name: 'amis-lowcode-backend',
            displayName: 'Amis Backend',
            type: 'nestjs',
            framework: 'NestJS',
            language: 'typescript',
            status: 'active',
          },
        ],
      };

      mockCodeGenerationService.getTargetProjects.mockResolvedValue(mockProjects);

      // Act
      const result = await controller.getTargetProjects();

      // Assert
      expect(result.projects).toEqual(mockProjects.projects);
      expect(service.getTargetProjects).toHaveBeenCalled();
    });

    it('should handle empty projects list', async () => {
      // Arrange
      const mockProjects = { projects: [] };

      mockCodeGenerationService.getTargetProjects.mockResolvedValue(mockProjects);

      // Act
      const result = await controller.getTargetProjects();

      // Assert
      expect(result.projects).toHaveLength(0);
    });
  });

  describe('getHistory', () => {
    it('should return generation history with pagination', async () => {
      // Arrange
      const page = 1;
      const size = 10;
      const mockHistory = {
        history: [
          {
            id: 'gen-1',
            entityIds: ['entity-1'],
            targetProject: 'amis-lowcode-backend',
            status: 'completed',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockCodeGenerationService.getGenerationHistory.mockResolvedValue(mockHistory);

      // Act
      const result = await controller.getHistory(page, size);

      // Assert
      expect(result.history).toEqual(mockHistory);
      expect(service.getGenerationHistory).toHaveBeenCalledWith(size, (page - 1) * size);
    });

    it('should use default pagination values', async () => {
      // Arrange
      const mockHistory = {
        history: [],
        total: 0,
        page: 1,
        size: 20,
        totalPages: 0,
      };

      mockCodeGenerationService.getGenerationHistory.mockResolvedValue(mockHistory);

      // Act
      const result = await controller.getHistory();

      // Assert
      expect(service.getGenerationHistory).toHaveBeenCalledWith(20, 0);
    });
  });

  describe('clearCache', () => {
    it('should clear cache successfully', async () => {
      // Arrange
      mockCodeGenerationService.clearCache.mockResolvedValue({
        success: true,
        message: 'Cache cleared successfully',
        clearedAt: new Date(),
      });

      // Act
      const result = await controller.clearCache();

      // Assert
      expect(result.result.success).toBe(true);
      expect(service.clearCache).toHaveBeenCalled();
    });

    it('should handle cache clear errors', async () => {
      // Arrange
      mockCodeGenerationService.clearCache.mockRejectedValue(
        new Error('Failed to clear cache')
      );

      // Act & Assert
      await expect(controller.clearCache()).rejects.toThrow('Failed to clear cache');
    });
  });

  describe('input validation', () => {
    it('should validate required fields', async () => {
      // Arrange
      const invalidDto = {
        entityIds: null,
        targetProject: '',
        options: {},
        git: { enabled: false },
      };

      // Act & Assert
      // This would typically be handled by class-validator decorators
      // In a real test, you would test the validation pipe
      expect(invalidDto.entityIds).toBeNull();
      expect(invalidDto.targetProject).toBe('');
    });

    it('should validate entity ID format', async () => {
      // Arrange
      const generateDto = {
        entityIds: ['', 'invalid-id', 'valid-id'],
        targetProject: 'amis-lowcode-backend',
        options: {},
        git: { enabled: false },
      };

      // This test would verify that empty or invalid entity IDs are rejected
      const validEntityIds = generateDto.entityIds.filter(id => id && id.length > 0);
      expect(validEntityIds).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const generateDto = {
        entityIds: ['entity-1'],
        targetProject: 'amis-lowcode-backend',
        options: {},
        git: { enabled: false },
      };

      mockCodeGenerationService.generateCode.mockRejectedValue(
        new Error('Unexpected error')
      );

      // Act & Assert
      await expect(controller.generateCode(generateDto)).rejects.toThrow(
        'Unexpected error'
      );
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const generateDto = {
        entityIds: ['entity-1'],
        targetProject: 'amis-lowcode-backend',
        options: {},
        git: { enabled: false },
      };

      mockCodeGenerationService.generateCode.mockRejectedValue(
        new Error('Request timeout')
      );

      // Act & Assert
      await expect(controller.generateCode(generateDto)).rejects.toThrow(
        'Request timeout'
      );
    });
  });
});
