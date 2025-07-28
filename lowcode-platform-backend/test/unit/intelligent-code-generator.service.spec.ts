import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { IntelligentCodeGeneratorService } from '../../src/lib/bounded-contexts/code-generation/application/services/intelligent-code-generator.service';
import { MetadataAggregatorService } from '../../src/lib/bounded-contexts/metadata/application/services/metadata-aggregator.service';
import { TemplateEngineService } from '../../src/lib/bounded-contexts/code-generation/infrastructure/template-engine.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';

describe('IntelligentCodeGeneratorService', () => {
  let service: IntelligentCodeGeneratorService;
  let metadataService: MetadataAggregatorService;
  let templateEngine: TemplateEngineService;
  let prisma: PrismaService;

  const mockTemplate = {
    id: 'test-template-1',
    name: 'Test Template',
    code: 'test-template',
    content: `
export class {{pascalCase entityName}}Service {
  constructor() {}
  
  async findAll(): Promise<{{pascalCase entityName}}[]> {
    return [];
  }
}
    `.trim(),
    language: 'TYPESCRIPT',
    framework: 'NESTJS',
    type: 'ENTITY',
    variables: [],
  };

  const mockEntity = {
    id: 'test-entity-1',
    name: 'TestUser',
    code: 'TestUser',
    tableName: 'test_users',
    fields: [
      {
        id: 'field-1',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isUnique: true,
        tsType: 'string',
        prismaType: 'String',
        prismaAttributes: '@id @default(uuid())',
      },
      {
        id: 'field-2',
        name: 'Name',
        code: 'name',
        type: 'STRING',
        length: 100,
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        tsType: 'string',
        prismaType: 'String',
        prismaAttributes: '@db.VarChar(100)',
      },
    ],
    relationships: {
      outgoing: [],
      incoming: [],
    },
  };

  const mockProjectMetadata = {
    project: {
      id: 'test-project-1',
      name: 'Test Project',
    },
    entities: [mockEntity],
    relationships: [],
  };

  const mockMetadataService = {
    getProjectMetadata: jest.fn(),
    getEntityMetadata: jest.fn(),
  };

  const mockTemplateEngine = {
    compileTemplateFromString: jest.fn(),
  };

  const mockPrismaService = {
    codeTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligentCodeGeneratorService,
        {
          provide: MetadataAggregatorService,
          useValue: mockMetadataService,
        },
        {
          provide: TemplateEngineService,
          useValue: mockTemplateEngine,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IntelligentCodeGeneratorService>(IntelligentCodeGeneratorService);
    metadataService = module.get<MetadataAggregatorService>(MetadataAggregatorService);
    templateEngine = module.get<TemplateEngineService>(TemplateEngineService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('generateFiles', () => {
    it('should generate files successfully', async () => {
      // Arrange
      const generationRequest = {
        projectId: 'test-project-1',
        templateIds: ['test-template-1'],
        entityIds: ['test-entity-1'],
        variables: {
          entityName: 'TestUser',
        },
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs',
        },
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([mockTemplate]);
      mockMetadataService.getProjectMetadata.mockResolvedValue(mockProjectMetadata);
      mockTemplateEngine.compileTemplateFromString.mockResolvedValue(`
export class TestUserService {
  constructor() {}
  
  async findAll(): Promise<TestUser[]> {
    return [];
  }
}
      `.trim());

      // Act
      const result = await service.generateFiles(generationRequest);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const generatedFile = result[0];
      expect(generatedFile).toHaveProperty('filename');
      expect(generatedFile).toHaveProperty('path');
      expect(generatedFile).toHaveProperty('content');
      expect(generatedFile).toHaveProperty('language', 'TYPESCRIPT');
      expect(generatedFile).toHaveProperty('size');
      expect(generatedFile.content).toContain('TestUserService');
    });

    it('should throw BadRequestException for invalid template IDs', async () => {
      // Arrange
      const generationRequest = {
        projectId: 'test-project-1',
        templateIds: ['non-existent-template'],
        entityIds: ['test-entity-1'],
        variables: {},
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs',
        },
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([]);

      // Act & Assert
      await expect(service.generateFiles(generationRequest))
        .rejects.toThrow(BadRequestException);
    });

    it('should handle template rendering errors gracefully', async () => {
      // Arrange
      const generationRequest = {
        projectId: 'test-project-1',
        templateIds: ['test-template-1'],
        entityIds: ['test-entity-1'],
        variables: {},
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs',
        },
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([mockTemplate]);
      mockMetadataService.getProjectMetadata.mockResolvedValue(mockProjectMetadata);
      mockTemplateEngine.compileTemplateFromString.mockRejectedValue(new Error('Template compilation failed'));

      // Act & Assert
      await expect(service.generateFiles(generationRequest))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('validateTemplateVariables', () => {
    it('should validate template variables successfully', async () => {
      // Arrange
      const templateWithVariables = {
        ...mockTemplate,
        variables: [
          {
            name: 'entityName',
            type: 'string',
            required: true,
            description: 'Entity name',
          },
        ],
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([templateWithVariables]);

      const variables = {
        entityName: 'TestUser',
      };

      // Act
      const result = await service.validateTemplateVariables('test-template-1', variables);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required variables', async () => {
      // Arrange
      const templateWithVariables = {
        ...mockTemplate,
        variables: [
          {
            name: 'entityName',
            type: 'string',
            required: true,
            description: 'Entity name',
          },
          {
            name: 'tableName',
            type: 'string',
            required: true,
            description: 'Table name',
          },
        ],
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([templateWithVariables]);

      const variables = {
        entityName: 'TestUser',
        // tableName is missing
      };

      // Act
      const result = await service.validateTemplateVariables('test-template-1', variables);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('tableName');
    });

    it('should detect invalid variable types', async () => {
      // Arrange
      const templateWithVariables = {
        ...mockTemplate,
        variables: [
          {
            name: 'entityName',
            type: 'string',
            required: true,
            description: 'Entity name',
          },
          {
            name: 'maxLength',
            type: 'number',
            required: false,
            description: 'Maximum length',
          },
        ],
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([templateWithVariables]);

      const variables = {
        entityName: 'TestUser',
        maxLength: 'not-a-number', // Should be number
      };

      // Act
      const result = await service.validateTemplateVariables('test-template-1', variables);

      // Assert
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('maxLength');
    });
  });

  describe('field categorization', () => {
    it('should categorize fields correctly', async () => {
      // Arrange
      const generationRequest = {
        projectId: 'test-project-1',
        templateIds: ['test-template-1'],
        entityIds: ['test-entity-1'],
        variables: {},
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs',
        },
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([mockTemplate]);
      mockMetadataService.getProjectMetadata.mockResolvedValue(mockProjectMetadata);
      
      // Mock template engine to capture the context
      let capturedContext: any;
      mockTemplateEngine.compileTemplateFromString.mockImplementation((template, context) => {
        capturedContext = context;
        return Promise.resolve('generated content');
      });

      // Act
      await service.generateFiles(generationRequest);

      // Assert
      expect(capturedContext).toBeDefined();
      expect(capturedContext).toHaveProperty('primaryKeyField');
      expect(capturedContext).toHaveProperty('systemFields');
      expect(capturedContext).toHaveProperty('businessFields');
      expect(capturedContext).toHaveProperty('requiredFields');
      expect(capturedContext).toHaveProperty('optionalFields');
      expect(capturedContext).toHaveProperty('searchableFields');
      expect(capturedContext).toHaveProperty('filterableFields');
      expect(capturedContext).toHaveProperty('sortableFields');
      
      // Verify primary key field
      expect(capturedContext.primaryKeyField).toBeDefined();
      expect(capturedContext.primaryKeyField.code).toBe('id');
      
      // Verify field categorization
      expect(Array.isArray(capturedContext.searchableFields)).toBe(true);
      expect(Array.isArray(capturedContext.filterableFields)).toBe(true);
      expect(Array.isArray(capturedContext.sortableFields)).toBe(true);
    });
  });

  describe('template context building', () => {
    it('should build comprehensive template context', async () => {
      // Arrange
      const generationRequest = {
        projectId: 'test-project-1',
        templateIds: ['test-template-1'],
        entityIds: ['test-entity-1'],
        variables: {
          entityName: 'TestUser',
          customVariable: 'customValue',
        },
        options: {
          overwriteExisting: true,
          generateTests: false,
          generateDocs: false,
          architecture: 'base-biz',
          framework: 'nestjs',
        },
      };

      mockPrismaService.codeTemplate.findMany.mockResolvedValue([mockTemplate]);
      mockMetadataService.getProjectMetadata.mockResolvedValue(mockProjectMetadata);
      
      let capturedContext: any;
      mockTemplateEngine.compileTemplateFromString.mockImplementation((template, context) => {
        capturedContext = context;
        return Promise.resolve('generated content');
      });

      // Act
      await service.generateFiles(generationRequest);

      // Assert
      expect(capturedContext).toBeDefined();
      
      // Check entity information
      expect(capturedContext.entity).toBeDefined();
      expect(capturedContext.entityName).toBe('TestUser');
      expect(capturedContext.entityCode).toBe('TestUser');
      expect(capturedContext.tableName).toBe('test_users');
      
      // Check fields
      expect(capturedContext.fields).toBeDefined();
      expect(Array.isArray(capturedContext.fields)).toBe(true);
      
      // Check relationships
      expect(capturedContext.relationships).toBeDefined();
      expect(capturedContext.hasRelationships).toBe(false);
      
      // Check options
      expect(capturedContext.options).toBeDefined();
      expect(capturedContext.options.architecture).toBe('base-biz');
      
      // Check custom variables
      expect(capturedContext.customVariable).toBe('customValue');
      
      // Check metadata
      expect(capturedContext.timestamp).toBeDefined();
      expect(capturedContext.generatedBy).toBe('IntelligentCodeGeneratorService');
    });
  });
});
