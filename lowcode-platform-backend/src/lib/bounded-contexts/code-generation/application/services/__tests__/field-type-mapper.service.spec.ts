import { Test, TestingModule } from '@nestjs/testing';
import { FieldTypeMapperService } from '../field-type-mapper.service';
import { FieldMetadata } from '../../../../shared/types/metadata.types';

describe('FieldTypeMapperService', () => {
  let service: FieldTypeMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FieldTypeMapperService],
    }).compile();

    service = module.get<FieldTypeMapperService>(FieldTypeMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapToPrismaType', () => {
    it('should map string types correctly', () => {
      const stringField: FieldMetadata = {
        id: '1',
        entityId: 'entity1',
        name: 'Name',
        code: 'name',
        type: 'STRING',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        length: 255,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToPrismaType(stringField)).toBe('String');
    });

    it('should map integer types correctly', () => {
      const intField: FieldMetadata = {
        id: '2',
        entityId: 'entity1',
        name: 'Age',
        code: 'age',
        type: 'INTEGER',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToPrismaType(intField)).toBe('Int');
    });

    it('should map boolean types correctly', () => {
      const boolField: FieldMetadata = {
        id: '3',
        entityId: 'entity1',
        name: 'Active',
        code: 'active',
        type: 'BOOLEAN',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToPrismaType(boolField)).toBe('Boolean');
    });

    it('should map datetime types correctly', () => {
      const dateField: FieldMetadata = {
        id: '4',
        entityId: 'entity1',
        name: 'Created At',
        code: 'createdAt',
        type: 'DATETIME',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToPrismaType(dateField)).toBe('DateTime');
    });

    it('should handle case insensitive types', () => {
      const lowerCaseField: FieldMetadata = {
        id: '5',
        entityId: 'entity1',
        name: 'Description',
        code: 'description',
        type: 'text',
        nullable: true,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToPrismaType(lowerCaseField)).toBe('String');
    });

    it('should default to String for unknown types', () => {
      const unknownField: FieldMetadata = {
        id: '6',
        entityId: 'entity1',
        name: 'Unknown',
        code: 'unknown',
        type: 'UNKNOWN_TYPE',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToPrismaType(unknownField)).toBe('String');
    });
  });

  describe('mapToTsType', () => {
    it('should map to TypeScript types correctly', () => {
      const stringField: FieldMetadata = {
        id: '1',
        entityId: 'entity1',
        name: 'Name',
        code: 'name',
        type: 'STRING',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToTsType(stringField)).toBe('string');
    });

    it('should handle nullable types', () => {
      const nullableField: FieldMetadata = {
        id: '2',
        entityId: 'entity1',
        name: 'Description',
        code: 'description',
        type: 'STRING',
        nullable: true,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(service.mapToTsType(nullableField)).toBe('string | null');
    });
  });

  describe('generatePrismaAttributes', () => {
    it('should generate primary key attributes', () => {
      const primaryKeyField: FieldMetadata = {
        id: '1',
        entityId: 'entity1',
        name: 'ID',
        code: 'id',
        type: 'UUID',
        nullable: false,
        isPrimaryKey: true,
        isUnique: false,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const attributes = service.generatePrismaAttributes(primaryKeyField);
      expect(attributes).toContain('@id');
      expect(attributes).toContain('@default(cuid())');
    });

    it('should generate unique attributes', () => {
      const uniqueField: FieldMetadata = {
        id: '2',
        entityId: 'entity1',
        name: 'Email',
        code: 'email',
        type: 'STRING',
        nullable: false,
        isPrimaryKey: false,
        isUnique: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const attributes = service.generatePrismaAttributes(uniqueField);
      expect(attributes).toContain('@unique');
    });

    it('should generate default value attributes', () => {
      const defaultField: FieldMetadata = {
        id: '3',
        entityId: 'entity1',
        name: 'Active',
        code: 'active',
        type: 'BOOLEAN',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        defaultValue: 'true',
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const attributes = service.generatePrismaAttributes(defaultField);
      expect(attributes).toContain('@default(true)');
    });

    it('should generate database-specific attributes', () => {
      const varcharField: FieldMetadata = {
        id: '4',
        entityId: 'entity1',
        name: 'Name',
        code: 'name',
        type: 'STRING',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        length: 100,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const attributes = service.generatePrismaAttributes(varcharField);
      expect(attributes).toContain('@db.VarChar(100)');
    });

    it('should handle createdAt field specially', () => {
      const createdAtField: FieldMetadata = {
        id: '5',
        entityId: 'entity1',
        name: 'Created At',
        code: 'createdAt',
        type: 'DATETIME',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const attributes = service.generatePrismaAttributes(createdAtField);
      expect(attributes).toContain('@default(now())');
    });

    it('should handle updatedAt field specially', () => {
      const updatedAtField: FieldMetadata = {
        id: '6',
        entityId: 'entity1',
        name: 'Updated At',
        code: 'updatedAt',
        type: 'DATETIME',
        nullable: false,
        isPrimaryKey: false,
        isUnique: false,
        sortOrder: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const attributes = service.generatePrismaAttributes(updatedAtField);
      expect(attributes).toContain('@updatedAt');
    });
  });

  describe('getTypeMappingResult', () => {
    it('should return complete type mapping result', () => {
      const field: FieldMetadata = {
        id: '1',
        entityId: 'entity1',
        name: 'Name',
        code: 'name',
        type: 'STRING',
        nullable: false,
        isPrimaryKey: false,
        isUnique: true,
        length: 255,
        defaultValue: 'Default Name',
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.getTypeMappingResult(field);

      expect(result.prismaType).toBe('String');
      expect(result.tsType).toBe('string');
      expect(result.sqlType).toBe('VARCHAR(255)');
      expect(result.defaultValue).toBe('"Default Name"');
      expect(result.attributes).toContain('@unique');
      expect(result.attributes).toContain('@default("Default Name")');
      expect(result.attributes).toContain('@db.VarChar(255)');
    });
  });

  describe('isSupportedFieldType', () => {
    it('should return true for supported types', () => {
      expect(service.isSupportedFieldType('STRING')).toBe(true);
      expect(service.isSupportedFieldType('INTEGER')).toBe(true);
      expect(service.isSupportedFieldType('BOOLEAN')).toBe(true);
      expect(service.isSupportedFieldType('DATETIME')).toBe(true);
      expect(service.isSupportedFieldType('JSON')).toBe(true);
    });

    it('should return false for unsupported types', () => {
      expect(service.isSupportedFieldType('UNKNOWN')).toBe(false);
      expect(service.isSupportedFieldType('CUSTOM_TYPE')).toBe(false);
    });

    it('should handle case insensitive types', () => {
      expect(service.isSupportedFieldType('string')).toBe(true);
      expect(service.isSupportedFieldType('integer')).toBe(true);
      expect(service.isSupportedFieldType('boolean')).toBe(true);
    });
  });

  describe('getSupportedFieldTypes', () => {
    it('should return list of supported field types', () => {
      const supportedTypes = service.getSupportedFieldTypes();
      
      expect(supportedTypes).toBeInstanceOf(Array);
      expect(supportedTypes.length).toBeGreaterThan(0);
      
      const stringType = supportedTypes.find(t => t.type === 'STRING');
      expect(stringType).toBeDefined();
      expect(stringType?.category).toBe('String');
      expect(stringType?.description).toBeDefined();
      
      const integerType = supportedTypes.find(t => t.type === 'INTEGER');
      expect(integerType).toBeDefined();
      expect(integerType?.category).toBe('Number');
      
      const booleanType = supportedTypes.find(t => t.type === 'BOOLEAN');
      expect(booleanType).toBeDefined();
      expect(booleanType?.category).toBe('Boolean');
      
      const dateType = supportedTypes.find(t => t.type === 'DATE');
      expect(dateType).toBeDefined();
      expect(dateType?.category).toBe('DateTime');
    });
  });
});
