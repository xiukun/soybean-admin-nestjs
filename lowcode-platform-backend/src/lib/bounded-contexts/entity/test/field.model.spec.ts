import { Field, FieldType } from '../domain/field.model';

describe('Field Model', () => {
  describe('create', () => {
    it('should create a field with valid data', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        length: 100,
        nullable: false,
        createdBy: 'user123',
      };

      const field = Field.create(fieldData);

      expect(field.entityId).toBe(fieldData.entityId);
      expect(field.name).toBe(fieldData.name);
      expect(field.code).toBe(fieldData.code);
      expect(field.type).toBe(fieldData.type);
      expect(field.length).toBe(fieldData.length);
      expect(field.nullable).toBe(fieldData.nullable);
      expect(field.createdBy).toBe(fieldData.createdBy);
      expect(field.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when entityId is empty', () => {
      const fieldData = {
        entityId: '',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow('Entity ID is required');
    });

    it('should throw error when name is empty', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: '',
        code: 'userName',
        type: FieldType.STRING,
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow('Field name is required');
    });

    it('should throw error when code is empty', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'User Name',
        code: '',
        type: FieldType.STRING,
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow('Field code is required');
    });

    it('should throw error when code has invalid format', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'User Name',
        code: '123invalid',
        type: FieldType.STRING,
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow(
        'Field code must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should throw error when createdBy is empty', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        createdBy: '',
      };

      expect(() => Field.create(fieldData)).toThrow('Created by is required');
    });

    it('should validate string field length', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        length: 70000, // 超过最大值65535
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow(
        'String field length must be between 1 and 65535'
      );
    });

    it('should validate decimal field precision and scale', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'Price',
        code: 'price',
        type: FieldType.DECIMAL,
        precision: 70, // 超过最大值65
        scale: 2,
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow(
        'Decimal field precision must be between 1 and 65'
      );
    });

    it('should validate decimal scale not greater than maximum', () => {
      const fieldData = {
        entityId: 'entity-123',
        name: 'Price',
        code: 'price',
        type: FieldType.DECIMAL,
        precision: 10,
        scale: 35, // 超过最大值30
        createdBy: 'user123',
      };

      expect(() => Field.create(fieldData)).toThrow(
        'Decimal field scale must be between 0 and 30'
      );
    });
  });

  describe('update', () => {
    let field: Field;

    beforeEach(() => {
      field = Field.create({
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        length: 100,
        createdBy: 'user123',
      });
    });

    it('should update field properties', () => {
      const updateData = {
        name: 'Updated User Name',
        length: 200,
        nullable: true,
        comment: 'Updated comment',
        updatedBy: 'user456',
      };

      field.update(updateData);

      expect(field.name).toBe(updateData.name);
      expect(field.length).toBe(updateData.length);
      expect(field.nullable).toBe(updateData.nullable);
      expect(field.comment).toBe(updateData.comment);
      expect(field.updatedBy).toBe(updateData.updatedBy);
      expect(field.updatedAt).toBeInstanceOf(Date);
    });

    it('should update field name', () => {
      field.update({ name: 'New Name', updatedBy: 'user456' });
      expect(field.name).toBe('New Name');
    });

    it('should validate code when updating', () => {
      expect(() => {
        field.update({ code: '123invalid', updatedBy: 'user456' });
      }).toThrow('Field code must start with a letter and contain only letters, numbers, and underscores');
    });
  });

  describe('business methods', () => {
    let field: Field;

    beforeEach(() => {
      field = Field.create({
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        length: 100,
        nullable: false,
        createdBy: 'user123',
      });
    });

    describe('type checking', () => {
      it('should check field type', () => {
        expect(field.type).toBe(FieldType.STRING);

        const numericField = Field.create({
          entityId: 'entity-123',
          name: 'Age',
          code: 'age',
          type: FieldType.INTEGER,
          createdBy: 'user123',
        });
        expect(numericField.type).toBe(FieldType.INTEGER);

        const dateField = Field.create({
          entityId: 'entity-123',
          name: 'Created At',
          code: 'createdAt',
          type: FieldType.DATETIME,
          createdBy: 'user123',
        });
        expect(dateField.type).toBe(FieldType.DATETIME);
      });
    });

    describe('constraint checking', () => {
      it('should check if field is required', () => {
        expect(field.isRequired()).toBe(true); // nullable is false

        field.update({ nullable: true, updatedBy: 'user123' });
        expect(field.isRequired()).toBe(false);
      });

      it('should check if field is primary key', () => {
        expect(field.isPrimaryKey()).toBe(false);

        field.update({ primaryKey: true, updatedBy: 'user123' });
        expect(field.isPrimaryKey()).toBe(true);
      });

      it('should check field properties', () => {
        expect(field.uniqueConstraint).toBe(false);
        expect(field.indexed).toBe(false);
        expect(field.nullable).toBe(false); // explicitly set in test

        field.update({
          uniqueConstraint: true,
          indexed: true,
          nullable: true,
          updatedBy: 'user123'
        });

        expect(field.uniqueConstraint).toBe(true);
        expect(field.indexed).toBe(true);
        expect(field.nullable).toBe(true);
      });
    });

    describe('validation', () => {
      it('should check if field has default value', () => {
        expect(field.defaultValue).toBeUndefined();

        field.update({ defaultValue: 'default', updatedBy: 'user123' });
        expect(field.defaultValue).toBe('default');
      });

      it('should check if field has validation rules', () => {
        expect(field.hasValidation()).toBe(false);

        field.update({
          validationRules: { minLength: 5, maxLength: 100 },
          updatedBy: 'user123'
        });
        expect(field.hasValidation()).toBe(true);
      });

      it('should get SQL column definition', () => {
        const columnDef = field.generateColumnDefinition();

        expect(columnDef).toContain('userName');
        expect(columnDef).toContain('VARCHAR(100)');
        expect(columnDef).toContain('NOT NULL');
      });
    });

    describe('reference handling', () => {
      it('should handle reference config', () => {
        expect(field.referenceConfig).toBeUndefined();

        field.update({
          referenceConfig: {
            targetEntity: 'User',
            targetField: 'id'
          },
          updatedBy: 'user123'
        });

        expect(field.referenceConfig).toEqual({
          targetEntity: 'User',
          targetField: 'id'
        });
      });
    });
  });

  describe('fromPersistence', () => {
    it('should create field from persistence data', () => {
      const persistenceData = {
        id: 'field-id-123',
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        length: 100,
        nullable: false,
        createdBy: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedBy: 'user456',
        updatedAt: new Date('2024-01-02'),
      };

      const field = Field.fromPersistence(persistenceData);

      expect(field.id).toBe(persistenceData.id);
      expect(field.entityId).toBe(persistenceData.entityId);
      expect(field.name).toBe(persistenceData.name);
      expect(field.code).toBe(persistenceData.code);
      expect(field.type).toBe(persistenceData.type);
      expect(field.length).toBe(persistenceData.length);
      expect(field.nullable).toBe(persistenceData.nullable);
      expect(field.createdBy).toBe(persistenceData.createdBy);
      expect(field.createdAt).toBe(persistenceData.createdAt);
      expect(field.updatedBy).toBe(persistenceData.updatedBy);
      expect(field.updatedAt).toBe(persistenceData.updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return field as JSON object', () => {
      const field = Field.create({
        entityId: 'entity-123',
        name: 'User Name',
        code: 'userName',
        type: FieldType.STRING,
        length: 100,
        nullable: false,
        createdBy: 'user123',
      });

      const json = field.toJSON();

      expect(json).toHaveProperty('entityId', 'entity-123');
      expect(json).toHaveProperty('name', 'User Name');
      expect(json).toHaveProperty('code', 'userName');
      expect(json).toHaveProperty('type', FieldType.STRING);
      expect(json).toHaveProperty('length', 100);
      expect(json).toHaveProperty('nullable', false);
      expect(json).toHaveProperty('createdBy', 'user123');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
