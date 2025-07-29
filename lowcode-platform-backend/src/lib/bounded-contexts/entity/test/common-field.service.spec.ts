import { Test, TestingModule } from '@nestjs/testing';
import { CommonFieldService } from '../application/services/common-field.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

describe('CommonFieldService', () => {
  let service: CommonFieldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonFieldService],
    }).compile();

    service = module.get<CommonFieldService>(CommonFieldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCommonFieldDefinitions', () => {
    it('should return 5 common field definitions', () => {
      const commonFields = service.getCommonFieldDefinitions();
      expect(commonFields).toHaveLength(5);
    });

    it('should include id field as first field', () => {
      const commonFields = service.getCommonFieldDefinitions();
      const idField = commonFields[0];
      
      expect(idField.code).toBe('id');
      expect(idField.name).toBe('主键');
      expect(idField.dataType).toBe(FieldDataType.STRING);
      expect(idField.required).toBe(true);
      expect(idField.unique).toBe(true);
      expect(idField.isCommon).toBe(true);
    });

    it('should include createdBy field', () => {
      const commonFields = service.getCommonFieldDefinitions();
      const createdByField = commonFields.find(f => f.code === 'createdBy');
      
      expect(createdByField).toBeDefined();
      expect(createdByField!.name).toBe('创建者');
      expect(createdByField!.dataType).toBe(FieldDataType.STRING);
      expect(createdByField!.required).toBe(true);
      expect(createdByField!.unique).toBe(false);
    });

    it('should include createdAt field', () => {
      const commonFields = service.getCommonFieldDefinitions();
      const createdAtField = commonFields.find(f => f.code === 'createdAt');
      
      expect(createdAtField).toBeDefined();
      expect(createdAtField!.name).toBe('创建时间');
      expect(createdAtField!.dataType).toBe(FieldDataType.DATETIME);
      expect(createdAtField!.required).toBe(true);
    });

    it('should include updatedBy field as optional', () => {
      const commonFields = service.getCommonFieldDefinitions();
      const updatedByField = commonFields.find(f => f.code === 'updatedBy');
      
      expect(updatedByField).toBeDefined();
      expect(updatedByField!.name).toBe('更新者');
      expect(updatedByField!.required).toBe(false);
    });

    it('should include updatedAt field as optional', () => {
      const commonFields = service.getCommonFieldDefinitions();
      const updatedAtField = commonFields.find(f => f.code === 'updatedAt');
      
      expect(updatedAtField).toBeDefined();
      expect(updatedAtField!.name).toBe('更新时间');
      expect(updatedAtField!.required).toBe(false);
    });
  });

  describe('isCommonFieldCode', () => {
    it('should return true for common field codes', () => {
      expect(service.isCommonFieldCode('id')).toBe(true);
      expect(service.isCommonFieldCode('createdBy')).toBe(true);
      expect(service.isCommonFieldCode('createdAt')).toBe(true);
      expect(service.isCommonFieldCode('updatedBy')).toBe(true);
      expect(service.isCommonFieldCode('updatedAt')).toBe(true);
    });

    it('should return false for non-common field codes', () => {
      expect(service.isCommonFieldCode('name')).toBe(false);
      expect(service.isCommonFieldCode('email')).toBe(false);
      expect(service.isCommonFieldCode('customField')).toBe(false);
    });
  });

  describe('validateBusinessFieldConflict', () => {
    it('should throw error for conflicting field codes', () => {
      expect(() => service.validateBusinessFieldConflict('id')).toThrow(
        "字段代码 'id' 与系统通用字段冲突，请使用其他名称"
      );
      expect(() => service.validateBusinessFieldConflict('createdBy')).toThrow(
        "字段代码 'createdBy' 与系统通用字段冲突，请使用其他名称"
      );
    });

    it('should not throw error for non-conflicting field codes', () => {
      expect(() => service.validateBusinessFieldConflict('name')).not.toThrow();
      expect(() => service.validateBusinessFieldConflict('email')).not.toThrow();
      expect(() => service.validateBusinessFieldConflict('customField')).not.toThrow();
    });
  });

  describe('getCommonFieldMaxSortOrder', () => {
    it('should return the maximum display order of common fields', () => {
      const maxOrder = service.getCommonFieldMaxSortOrder();
      expect(maxOrder).toBe(5); // updatedAt has displayOrder 5
    });
  });

  describe('validateCommonFieldConstraints', () => {
    it('should validate correct common field definition', () => {
      const validField = {
        name: '测试字段',
        code: 'testField',
        dataType: FieldDataType.STRING,
        required: true,
        unique: false,
        comment: '测试字段描述',
        displayOrder: 1,
        isCommon: true,
      };

      expect(() => service.validateCommonFieldConstraints(validField)).not.toThrow();
      expect(service.validateCommonFieldConstraints(validField)).toBe(true);
    });

    it('should throw error for invalid field code format', () => {
      const invalidField = {
        name: '测试字段',
        code: '123invalid',
        dataType: FieldDataType.STRING,
        required: true,
        unique: false,
        comment: '测试字段描述',
        displayOrder: 1,
        isCommon: true,
      };

      expect(() => service.validateCommonFieldConstraints(invalidField)).toThrow(
        '通用字段代码格式不正确: 123invalid'
      );
    });

    it('should throw error for empty field name', () => {
      const invalidField = {
        name: '',
        code: 'testField',
        dataType: FieldDataType.STRING,
        required: true,
        unique: false,
        comment: '测试字段描述',
        displayOrder: 1,
        isCommon: true,
      };

      expect(() => service.validateCommonFieldConstraints(invalidField)).toThrow(
        '通用字段名称不能为空'
      );
    });
  });
});