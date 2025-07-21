import { Test, TestingModule } from '@nestjs/testing';
import { IntelligentCodeGeneratorService } from '../intelligent-code-generator.service';
import { TemplateEngineService } from '../../../infrastructure/template-engine.service';
import { FieldTypeMapperService } from '../field-type-mapper.service';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { EnhancedLoggerService } from '@lib/shared/logging/enhanced-logger.service';
import { ConfigService } from '@nestjs/config';

describe('IntelligentCodeGeneratorService', () => {
  let service: IntelligentCodeGeneratorService;
  let templateEngine: jest.Mocked<TemplateEngineService>;
  let fieldTypeMapper: jest.Mocked<FieldTypeMapperService>;
  let prismaService: jest.Mocked<PrismaService>;
  let logger: jest.Mocked<EnhancedLoggerService>;

  const mockTemplate = {
    id: 'template-1',
    name: 'NestJS Entity',
    content: 'export class {{entityName}} {\n  {{#each fields}}\n  {{name}}: {{type}};\n  {{/each}}\n}',
    variables: [
      { name: 'entityName', type: 'string', required: true },
      { name: 'fields', type: 'array', required: true },
    ],
    language: 'typescript',
    framework: 'nestjs',
    category: 'entity',
  };

  const mockEntity = {
    id: 'entity-1',
    name: 'User',
    code: 'User',
    tableName: 'users',
    fields: [
      {
        id: 'field-1',
        name: 'Email',
        code: 'email',
        type: 'STRING',
        nullable: false,
        length: 255,
      },
      {
        id: 'field-2',
        name: 'Age',
        code: 'age',
        type: 'INTEGER',
        nullable: true,
      },
    ],
  };

  beforeEach(async () => {
    const mockTemplateEngine = {
      compileTemplate: jest.fn(),
      compileTemplateFromString: jest.fn(),
      registerHelper: jest.fn(),
    };

    const mockFieldTypeMapper = {
      mapToTypeScript: jest.fn(),
      mapToPrisma: jest.fn(),
      mapToJava: jest.fn(),
      mapToPython: jest.fn(),
      getPrismaAttributes: jest.fn(),
    };

    const mockPrismaService = {
      template: {
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
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      logCodeGeneration: jest.fn(),
      startTimer: jest.fn(() => jest.fn()),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config = {
          'CODE_GENERATION_OUTPUT_PATH': './generated',
          'CODE_GENERATION_MAX_FILES': '1000',
          'CODE_GENERATION_TIMEOUT': '30000',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntelligentCodeGeneratorService,
        {
          provide: TemplateEngineService,
          useValue: mockTemplateEngine,
        },
        {
          provide: FieldTypeMapperService,
          useValue: mockFieldTypeMapper,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EnhancedLoggerService,
          useValue: mockLogger,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<IntelligentCodeGeneratorService>(IntelligentCodeGeneratorService);
    templateEngine = module.get(TemplateEngineService);
    fieldTypeMapper = module.get(FieldTypeMapperService);
    prismaService = module.get(PrismaService);
    logger = module.get(EnhancedLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCode', () => {
    it('should generate code successfully', async () => {
      // Setup mocks
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);
      prismaService.entity.findMany.mockResolvedValue([mockEntity]);
      prismaService.field.findMany.mockResolvedValue(mockEntity.fields);
      
      fieldTypeMapper.mapToTypeScript.mockImplementation((type) => {
        const typeMap = { STRING: 'string', INTEGER: 'number' };
        return typeMap[type] || 'any';
      });

      templateEngine.compileTemplateFromString.mockReturnValue(
        'export class User {\n  email: string;\n  age: number;\n}'
      );

      const result = await service.generateCode(
        'project-1',
        ['template-1'],
        ['entity-1'],
        './output',
        {},
        {
          architecture: 'base-biz',
          framework: 'nestjs',
          overwriteExisting: false,
          generateTests: false,
          generateDocs: false,
        }
      );

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toContain('User');
      expect(result.files[0].content).toContain('export class User');
    });

    it('should handle template not found error', async () => {
      prismaService.template.findMany.mockResolvedValue([]);

      await expect(
        service.generateCode(
          'project-1',
          ['non-existent-template'],
          ['entity-1'],
          './output',
          {},
          {}
        )
      ).rejects.toThrow('Template not found');
    });

    it('should handle entity not found error', async () => {
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);
      prismaService.entity.findMany.mockResolvedValue([]);

      await expect(
        service.generateCode(
          'project-1',
          ['template-1'],
          ['non-existent-entity'],
          './output',
          {},
          {}
        )
      ).rejects.toThrow('Entity not found');
    });
  });

  describe('validateTemplateVariablesEnhanced', () => {
    it('should validate template variables successfully', async () => {
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);

      const variables = {
        entityName: 'User',
        fields: [{ name: 'email', type: 'string' }],
      };

      const result = await service.validateTemplateVariablesEnhanced(
        'template-1',
        variables
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required variables', async () => {
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);

      const variables = {
        // Missing required 'entityName' and 'fields'
      };

      const result = await service.validateTemplateVariablesEnhanced(
        'template-1',
        variables
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe('required');
      expect(result.errors[1].type).toBe('required');
    });

    it('should detect type mismatches', async () => {
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);

      const variables = {
        entityName: 123, // Should be string
        fields: 'not-an-array', // Should be array
      };

      const result = await service.validateTemplateVariablesEnhanced(
        'template-1',
        variables
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.type === 'type_mismatch')).toBe(true);
    });

    it('should validate custom rules', async () => {
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);

      const variables = {
        entityName: 'User',
        fields: [],
      };

      const customRules = {
        entityName: (value: any) => {
          if (typeof value === 'string' && value.length < 2) {
            return 'Entity name must be at least 2 characters long';
          }
          return null;
        },
      };

      const result = await service.validateTemplateVariablesEnhanced(
        'template-1',
        variables,
        customRules
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('prepareTemplateVariables', () => {
    it('should prepare template variables correctly', () => {
      fieldTypeMapper.mapToTypeScript.mockImplementation((type) => {
        const typeMap = { STRING: 'string', INTEGER: 'number' };
        return typeMap[type] || 'any';
      });

      const result = service['prepareTemplateVariables'](
        mockEntity,
        'typescript',
        'nestjs',
        'base-biz'
      );

      expect(result.entityName).toBe('User');
      expect(result.tableName).toBe('users');
      expect(result.fields).toHaveLength(2);
      expect(result.fields[0].tsType).toBe('string');
      expect(result.fields[1].tsType).toBe('number');
    });

    it('should handle different architectures', () => {
      const dddResult = service['prepareTemplateVariables'](
        mockEntity,
        'typescript',
        'nestjs',
        'ddd'
      );

      const cleanResult = service['prepareTemplateVariables'](
        mockEntity,
        'typescript',
        'nestjs',
        'clean'
      );

      expect(dddResult.architecture).toBe('ddd');
      expect(cleanResult.architecture).toBe('clean');
    });
  });

  describe('generateFileName', () => {
    it('should generate correct file names for different templates', () => {
      const entityTemplate = { ...mockTemplate, category: 'entity' };
      const serviceTemplate = { ...mockTemplate, category: 'service' };
      const controllerTemplate = { ...mockTemplate, category: 'controller' };

      expect(service['generateFileName'](mockEntity, entityTemplate, 'typescript'))
        .toBe('user.entity.ts');
      
      expect(service['generateFileName'](mockEntity, serviceTemplate, 'typescript'))
        .toBe('user.service.ts');
      
      expect(service['generateFileName'](mockEntity, controllerTemplate, 'typescript'))
        .toBe('user.controller.ts');
    });

    it('should handle different languages', () => {
      const javaTemplate = { ...mockTemplate, language: 'java' };
      
      expect(service['generateFileName'](mockEntity, javaTemplate, 'java'))
        .toBe('User.java');
    });
  });

  describe('error handling', () => {
    it('should handle template compilation errors', async () => {
      prismaService.template.findMany.mockResolvedValue([mockTemplate]);
      prismaService.entity.findMany.mockResolvedValue([mockEntity]);
      prismaService.field.findMany.mockResolvedValue(mockEntity.fields);
      
      templateEngine.compileTemplateFromString.mockImplementation(() => {
        throw new Error('Template compilation failed');
      });

      const result = await service.generateCode(
        'project-1',
        ['template-1'],
        ['entity-1'],
        './output',
        {},
        {}
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Template compilation failed');
    });

    it('should handle database errors', async () => {
      prismaService.template.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        service.generateCode(
          'project-1',
          ['template-1'],
          ['entity-1'],
          './output',
          {},
          {}
        )
      ).rejects.toThrow('Database error');
    });
  });

  describe('performance', () => {
    it('should handle large number of entities efficiently', async () => {
      const largeEntitySet = Array.from({ length: 50 }, (_, i) => ({
        ...mockEntity,
        id: `entity-${i}`,
        name: `Entity${i}`,
      }));

      prismaService.template.findMany.mockResolvedValue([mockTemplate]);
      prismaService.entity.findMany.mockResolvedValue(largeEntitySet);
      prismaService.field.findMany.mockResolvedValue([]);
      
      templateEngine.compileTemplateFromString.mockReturnValue('generated code');

      const startTime = Date.now();
      const result = await service.generateCode(
        'project-1',
        ['template-1'],
        largeEntitySet.map(e => e.id),
        './output',
        {},
        {}
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('validateVariableType', () => {
    it('should validate string types correctly', () => {
      expect(service['validateVariableType']('test', 'string')).toBe(true);
      expect(service['validateVariableType'](123, 'string')).toBe(false);
    });

    it('should validate number types correctly', () => {
      expect(service['validateVariableType'](123, 'number')).toBe(true);
      expect(service['validateVariableType']('123', 'number')).toBe(false);
      expect(service['validateVariableType'](NaN, 'number')).toBe(false);
    });

    it('should validate integer types correctly', () => {
      expect(service['validateVariableType'](123, 'integer')).toBe(true);
      expect(service['validateVariableType'](123.5, 'integer')).toBe(false);
    });

    it('should validate boolean types correctly', () => {
      expect(service['validateVariableType'](true, 'boolean')).toBe(true);
      expect(service['validateVariableType'](false, 'boolean')).toBe(true);
      expect(service['validateVariableType']('true', 'boolean')).toBe(false);
    });

    it('should validate array types correctly', () => {
      expect(service['validateVariableType']([], 'array')).toBe(true);
      expect(service['validateVariableType']([1, 2, 3], 'array')).toBe(true);
      expect(service['validateVariableType']({}, 'array')).toBe(false);
    });

    it('should validate object types correctly', () => {
      expect(service['validateVariableType']({}, 'object')).toBe(true);
      expect(service['validateVariableType']({ key: 'value' }, 'object')).toBe(true);
      expect(service['validateVariableType']([], 'object')).toBe(false);
      expect(service['validateVariableType'](null, 'object')).toBe(false);
    });

    it('should validate email types correctly', () => {
      expect(service['validateVariableType']('test@example.com', 'email')).toBe(true);
      expect(service['validateVariableType']('invalid-email', 'email')).toBe(false);
    });

    it('should validate URL types correctly', () => {
      expect(service['validateVariableType']('https://example.com', 'url')).toBe(true);
      expect(service['validateVariableType']('invalid-url', 'url')).toBe(false);
    });

    it('should validate UUID types correctly', () => {
      expect(service['validateVariableType']('123e4567-e89b-12d3-a456-426614174000', 'uuid')).toBe(true);
      expect(service['validateVariableType']('invalid-uuid', 'uuid')).toBe(false);
    });
  });
});
