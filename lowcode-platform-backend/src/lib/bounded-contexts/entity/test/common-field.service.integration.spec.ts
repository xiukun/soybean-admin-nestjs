import { Test, TestingModule } from '@nestjs/testing';
import { CommonFieldService } from '@entity/application/services/common-field.service';
import { FieldDataType } from '@lib/bounded-contexts/field/domain/field.model';

describe('CommonFieldService (Integration)', () => {
  let service: CommonFieldService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonFieldService],
    }).compile();

    service = module.get<CommonFieldService>(CommonFieldService);
  });

  describe('getCommonFieldDefinitions', () => {
    it('应该返回正确的通用字段定义', () => {
      // Act
      const commonFields = service.getCommonFieldDefinitions();

      // Assert
      expect(commonFields).toHaveLength(5);
      
      // 验证主键字段
      const idField = commonFields.find(f => f.code === 'id');
      expect(idField).toBeDefined();
      expect(idField!.name).toBe('主键');
      expect(idField!.dataType).toBe(FieldDataType.STRING);
      expect(idField!.required).toBe(true);
      expect(idField!.unique).toBe(true);
      expect(idField!.displayOrder).toBe(1);

      // 验证创建者字段
      const createdByField = commonFields.find(f => f.code === 'createdBy');
      expect(createdByField).toBeDefined();
      expect(createdByField!.name).toBe('创建者');
      expect(createdByField!.dataType).toBe(FieldDataType.STRING);
      expect(createdByField!.required).toBe(true);
      expect(createdByField!.unique).toBe(false);
      expect(createdByField!.displayOrder).toBe(2);

      // 验证创建时间字段
      const createdAtField = commonFields.find(f => f.code === 'createdAt');
      expect(createdAtField).toBeDefined();
      expect(createdAtField!.name).toBe('创建时间');
      expect(createdAtField!.dataType).toBe(FieldDataType.DATETIME);
      expect(createdAtField!.required).toBe(true);
      expect(createdAtField!.unique).toBe(false);
      expect(createdAtField!.displayOrder).toBe(3);

      // 验证更新者字段
      const updatedByField = commonFields.find(f => f.code === 'updatedBy');
      expect(updatedByField).toBeDefined();
      expect(updatedByField!.name).toBe('更新者');
      expect(updatedByField!.dataType).toBe(FieldDataType.STRING);
      expect(updatedByField!.required).toBe(false);
      expect(updatedByField!.unique).toBe(false);
      expect(updatedByField!.displayOrder).toBe(4);

      // 验证更新时间字段
      const updatedAtField = commonFields.find(f => f.code === 'updatedAt');
      expect(updatedAtField).toBeDefined();
      expect(updatedAtField!.name).toBe('更新时间');
      expect(updatedAtField!.dataType).toBe(FieldDataType.DATETIME);
      expect(updatedAtField!.required).toBe(false);
      expect(updatedAtField!.unique).toBe(false);
      expect(updatedAtField!.displayOrder).toBe(5);
    });

    it('应该返回按显示顺序排序的字段', () => {
      // Act
      const commonFields = service.getCommonFieldDefinitions();

      // Assert
      for (let i = 1; i < commonFields.length; i++) {
        expect(commonFields[i].displayOrder).toBeGreaterThan(commonFields[i - 1].displayOrder);
      }
    });
  });

  describe('validateBusinessFieldConflict', () => {
    it('应该在业务字段与通用字段冲突时抛出错误', () => {
      // Arrange
      const conflictingCodes = ['id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];

      // Act & Assert
      conflictingCodes.forEach(code => {
        expect(() => service.validateBusinessFieldConflict(code))
          .toThrow(`业务字段代码 ${code} 与通用字段冲突`);
      });
    });

    it('应该允许非冲突的业务字段代码', () => {
      // Arrange
      const validCodes = ['name', 'email', 'phone', 'address', 'status'];

      // Act & Assert
      validCodes.forEach(code => {
        expect(() => service.validateBusinessFieldConflict(code)).not.toThrow();
      });
    });

    it('应该对字段代码进行大小写敏感的比较', () => {
      // Arrange
      const caseVariations = ['ID', 'Id', 'CREATEDBY', 'CreatedBy', 'CREATEDAT', 'CreatedAt'];

      // Act & Assert
      caseVariations.forEach(code => {
        expect(() => service.validateBusinessFieldConflict(code)).not.toThrow();
      });
    });
  });

  describe('getMaxCommonFieldDisplayOrder', () => {
    it('应该返回通用字段的最大显示顺序', () => {
      // Act
      const maxOrder = service.getMaxCommonFieldDisplayOrder();

      // Assert
      expect(maxOrder).toBe(5);
    });
  });

  describe('isCommonField', () => {
    it('应该正确识别通用字段', () => {
      // Arrange
      const commonFieldCodes = ['id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'];
      const businessFieldCodes = ['name', 'email', 'phone', 'address', 'status'];

      // Act & Assert
      commonFieldCodes.forEach(code => {
        expect(service.isCommonField(code)).toBe(true);
      });

      businessFieldCodes.forEach(code => {
        expect(service.isCommonField(code)).toBe(false);
      });
    });
  });

  describe('getCommonFieldByCode', () => {
    it('应该返回指定代码的通用字段定义', () => {
      // Act
      const idField = service.getCommonFieldByCode('id');
      const createdByField = service.getCommonFieldByCode('createdBy');

      // Assert
      expect(idField).toBeDefined();
      expect(idField!.code).toBe('id');
      expect(idField!.name).toBe('主键');

      expect(createdByField).toBeDefined();
      expect(createdByField!.code).toBe('createdBy');
      expect(createdByField!.name).toBe('创建者');
    });

    it('应该在字段不存在时返回undefined', () => {
      // Act
      const nonExistentField = service.getCommonFieldByCode('nonExistent');

      // Assert
      expect(nonExistentField).toBeUndefined();
    });
  });

  describe('通用字段完整性验证', () => {
    it('所有通用字段都应该有完整的定义', () => {
      // Act
      const commonFields = service.getCommonFieldDefinitions();

      // Assert
      commonFields.forEach(field => {
        expect(field.name).toBeDefined();
        expect(field.name.trim()).not.toBe('');
        expect(field.code).toBeDefined();
        expect(field.code.trim()).not.toBe('');
        expect(field.dataType).toBeDefined();
        expect(Object.values(FieldDataType)).toContain(field.dataType);
        expect(field.required).toBeDefined();
        expect(typeof field.required).toBe('boolean');
        expect(field.unique).toBeDefined();
        expect(typeof field.unique).toBe('boolean');
        expect(field.description).toBeDefined();
        expect(field.description!.trim()).not.toBe('');
        expect(field.displayOrder).toBeDefined();
        expect(field.displayOrder).toBeGreaterThan(0);
      });
    });

    it('通用字段代码应该符合命名规范', () => {
      // Act
      const commonFields = service.getCommonFieldDefinitions();

      // Assert
      commonFields.forEach(field => {
        // 字段代码应该以字母开头，只包含字母、数字和下划线
        expect(field.code).toMatch(/^[a-zA-Z][a-zA-Z0-9_]*$/);
        // 字段代码长度应该合理
        expect(field.code.length).toBeGreaterThan(0);
        expect(field.code.length).toBeLessThanOrEqual(50);
      });
    });

    it('通用字段显示顺序应该唯一且连续', () => {
      // Act
      const commonFields = service.getCommonFieldDefinitions();
      const displayOrders = commonFields.map(f => f.displayOrder).sort((a, b) => a - b);

      // Assert
      // 检查唯一性
      const uniqueOrders = [...new Set(displayOrders)];
      expect(uniqueOrders).toHaveLength(displayOrders.length);

      // 检查连续性（从1开始）
      for (let i = 0; i < displayOrders.length; i++) {
        expect(displayOrders[i]).toBe(i + 1);
      }
    });
  });

  describe('性能测试', () => {
    it('获取通用字段定义应该在合理时间内完成', () => {
      // Arrange
      const startTime = Date.now();

      // Act
      for (let i = 0; i < 1000; i++) {
        service.getCommonFieldDefinitions();
      }

      // Assert
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // 应该在100ms内完成1000次调用
    });

    it('验证业务字段冲突应该在合理时间内完成', () => {
      // Arrange
      const testCodes = ['name', 'email', 'phone', 'address', 'status'];
      const startTime = Date.now();

      // Act
      for (let i = 0; i < 1000; i++) {
        testCodes.forEach(code => {
          try {
            service.validateBusinessFieldConflict(code);
          } catch (error) {
            // 忽略预期的错误
          }
        });
      }

      // Assert
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(100); // 应该在100ms内完成5000次验证
    });
  });
});