import { Entity, EntityStatus } from '@entity/domain/entity.model';

describe('Entity Model', () => {
  describe('create', () => {
    it('should create an entity with valid data', () => {
      const entityData = {
        projectId: 'project-123',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        description: 'User information entity',
        createdBy: 'user123',
      };

      const entity = Entity.create(entityData);

      expect(entity.projectId).toBe(entityData.projectId);
      expect(entity.name).toBe(entityData.name);
      expect(entity.code).toBe(entityData.code);
      expect(entity.tableName).toBe(entityData.tableName);
      expect(entity.description).toBe(entityData.description);
      expect(entity.createdBy).toBe(entityData.createdBy);
      expect(entity.status).toBe(EntityStatus.DRAFT);
      expect(entity.version).toBe('1.0.0');
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when name is empty', () => {
      const entityData = {
        projectId: 'project-123',
        name: '',
        code: 'User',
        tableName: 'users',
        createdBy: 'user123',
      };

      expect(() => Entity.create(entityData)).toThrow('Entity name is required');
    });

    it('should throw error when code is empty', () => {
      const entityData = {
        projectId: 'project-123',
        name: 'User Entity',
        code: '',
        tableName: 'users',
        createdBy: 'user123',
      };

      expect(() => Entity.create(entityData)).toThrow('Entity code is required');
    });

    it('should throw error when code has invalid format', () => {
      const entityData = {
        projectId: 'project-123',
        name: 'User Entity',
        code: '123Invalid', // 不能以数字开头
        tableName: 'users',
        createdBy: 'user123',
      };

      expect(() => Entity.create(entityData)).toThrow(
        'Entity code must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should throw error when projectId is empty', () => {
      const entityData = {
        projectId: '',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        createdBy: 'user123',
      };

      expect(() => Entity.create(entityData)).toThrow('Project ID is required');
    });

    it('should throw error when createdBy is empty', () => {
      const entityData = {
        projectId: 'project-123',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        createdBy: '',
      };

      expect(() => Entity.create(entityData)).toThrow('Created by is required');
    });

    it('should accept valid code formats', () => {
      const validCodes = [
        'User',
        'user1',
        'User_Profile',
        'USER_ACCOUNT',
        'myEntity',
      ];

      validCodes.forEach(code => {
        const entityData = {
          projectId: 'project-123',
          name: 'Test Entity',
          code,
          tableName: 'test_table',
          createdBy: 'user123',
        };

        expect(() => Entity.create(entityData)).not.toThrow();
      });
    });
  });

  describe('update', () => {
    let entity: Entity;

    beforeEach(() => {
      entity = Entity.create({
        projectId: 'project-123',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        createdBy: 'user123',
      });
    });

    it('should update entity properties', () => {
      const updateData = {
        name: 'Updated User Entity',
        description: 'Updated description',
        category: 'business',
        updatedBy: 'user456',
      };

      entity.update(updateData);

      expect(entity.name).toBe(updateData.name);
      expect(entity.description).toBe(updateData.description);
      expect(entity.category).toBe(updateData.category);
      expect(entity.updatedBy).toBe(updateData.updatedBy);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate code when updating', () => {
      expect(() => {
        entity.update({ code: '123invalid', updatedBy: 'user456' });
      }).toThrow(
        'Entity code must start with a letter and contain only letters, numbers, and underscores'
      );
    });
  });

  describe('business methods', () => {
    let entity: Entity;

    beforeEach(() => {
      entity = Entity.create({
        projectId: 'project-123',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        createdBy: 'user123',
      });
    });

    describe('publish', () => {
      it('should publish draft entity', () => {
        entity.publish();

        expect(entity.status).toBe(EntityStatus.PUBLISHED);
        expect(entity.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when entity is already published', () => {
        entity.publish();
        
        expect(() => entity.publish()).toThrow('Entity is already published');
      });
    });

    describe('deprecate', () => {
      it('should deprecate entity', () => {
        entity.deprecate();

        expect(entity.status).toBe(EntityStatus.DEPRECATED);
        expect(entity.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when entity is already deprecated', () => {
        entity.deprecate();
        
        expect(() => entity.deprecate()).toThrow('Entity is already deprecated');
      });
    });

    describe('canDelete', () => {
      it('should return true for draft entity', () => {
        expect(entity.canDelete()).toBe(true);
      });

      it('should return false for published entity', () => {
        entity.publish();
        expect(entity.canDelete()).toBe(false);
      });

      it('should return false for deprecated entity', () => {
        entity.deprecate();
        expect(entity.canDelete()).toBe(false);
      });
    });

    describe('generateTableName', () => {
      it('should generate table name from code', () => {
        const testCases = [
          { code: 'User', expected: 'user' },
          { code: 'UserProfile', expected: 'user_profile' },
          { code: 'USER_ACCOUNT', expected: 'user_account' },
          { code: 'myEntity', expected: 'my_entity' },
        ];

        testCases.forEach(({ code, expected }) => {
          const testEntity = Entity.create({
            projectId: 'project-123',
            name: 'Test Entity',
            code,
            tableName: 'temp',
            createdBy: 'user123',
          });

          expect(testEntity.generateTableName()).toBe(expected);
        });
      });
    });
  });

  describe('fromPersistence', () => {
    it('should create entity from persistence data', () => {
      const persistenceData = {
        id: 'entity-id-123',
        projectId: 'project-123',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        description: 'User information entity',
        category: 'core',
        version: '1.0.0',
        status: EntityStatus.PUBLISHED,
        createdBy: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedBy: 'user456',
        updatedAt: new Date('2024-01-02'),
      };

      const entity = Entity.fromPersistence(persistenceData);

      expect(entity.id).toBe(persistenceData.id);
      expect(entity.projectId).toBe(persistenceData.projectId);
      expect(entity.name).toBe(persistenceData.name);
      expect(entity.code).toBe(persistenceData.code);
      expect(entity.tableName).toBe(persistenceData.tableName);
      expect(entity.description).toBe(persistenceData.description);
      expect(entity.category).toBe(persistenceData.category);
      expect(entity.version).toBe(persistenceData.version);
      expect(entity.status).toBe(persistenceData.status);
      expect(entity.createdBy).toBe(persistenceData.createdBy);
      expect(entity.createdAt).toBe(persistenceData.createdAt);
      expect(entity.updatedBy).toBe(persistenceData.updatedBy);
      expect(entity.updatedAt).toBe(persistenceData.updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return entity as JSON object', () => {
      const entity = Entity.create({
        projectId: 'project-123',
        name: 'User Entity',
        code: 'User',
        tableName: 'users',
        description: 'User information entity',
        createdBy: 'user123',
      });

      const json = entity.toJSON();

      expect(json).toHaveProperty('projectId', 'project-123');
      expect(json).toHaveProperty('name', 'User Entity');
      expect(json).toHaveProperty('code', 'User');
      expect(json).toHaveProperty('tableName', 'users');
      expect(json).toHaveProperty('description', 'User information entity');
      expect(json).toHaveProperty('createdBy', 'user123');
      expect(json).toHaveProperty('status', EntityStatus.DRAFT);
      expect(json).toHaveProperty('version', '1.0.0');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
