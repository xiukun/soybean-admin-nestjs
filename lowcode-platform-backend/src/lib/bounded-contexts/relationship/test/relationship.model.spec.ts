import { Relationship, RelationshipType, RelationshipStatus } from '@lib/bounded-contexts/relationship/domain/relationship.model';

describe('Relationship Model', () => {
  describe('create', () => {
    it('should create a relationship with valid data', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        description: 'User to orders relationship',
        createdBy: 'user123',
      };

      const relationship = Relationship.create(relationshipData);

      expect(relationship.projectId).toBe(relationshipData.projectId);
      expect(relationship.name).toBe(relationshipData.name);
      expect(relationship.code).toBe(relationshipData.code);
      expect(relationship.type).toBe(relationshipData.type);
      expect(relationship.sourceEntityId).toBe(relationshipData.sourceEntityId);
      expect(relationship.targetEntityId).toBe(relationshipData.targetEntityId);
      expect(relationship.description).toBe(relationshipData.description);
      expect(relationship.createdBy).toBe(relationshipData.createdBy);
      expect(relationship.status).toBe(RelationshipStatus.ACTIVE);
      expect(relationship.onDelete).toBe('RESTRICT');
      expect(relationship.onUpdate).toBe('RESTRICT');
      expect(relationship.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when projectId is empty', () => {
      const relationshipData = {
        projectId: '',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Project ID is required');
    });

    it('should throw error when name is empty', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: '',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Relationship name is required');
    });

    it('should throw error when code is empty', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: '',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Relationship code is required');
    });

    it('should throw error when code has invalid format', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: '123Invalid', // 不能以数字开头
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow(
        'Relationship code must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should throw error when sourceEntityId is empty', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: '',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Source entity ID is required');
    });

    it('should throw error when targetEntityId is empty', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: '',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Target entity ID is required');
    });

    it('should throw error when createdBy is empty', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: '',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Created by is required');
    });

    it('should accept valid code formats', () => {
      const validCodes = [
        'UserOrders',
        'user_orders',
        'USER_ORDERS',
        'myRelation1',
        'Relation_123',
      ];

      validCodes.forEach(code => {
        const relationshipData = {
          projectId: 'project-123',
          name: 'Test Relationship',
          code,
          type: RelationshipType.ONE_TO_MANY,
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-2',
          createdBy: 'user123',
        };

        expect(() => Relationship.create(relationshipData)).not.toThrow();
      });
    });

    it('should validate relationship type', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: 'INVALID_TYPE' as any,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Invalid relationship type');
    });

    it('should validate onDelete and onUpdate actions', () => {
      const relationshipData = {
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        onDelete: 'INVALID_ACTION',
        createdBy: 'user123',
      };

      expect(() => Relationship.create(relationshipData)).toThrow('Invalid onDelete action');
    });
  });

  describe('update', () => {
    let relationship: Relationship;

    beforeEach(() => {
      relationship = Relationship.create({
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      });
    });

    it('should update relationship properties', () => {
      const updateData = {
        name: 'Updated User Orders',
        description: 'Updated description',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        updatedBy: 'user456',
      };

      relationship.update(updateData);

      expect(relationship.name).toBe(updateData.name);
      expect(relationship.description).toBe(updateData.description);
      expect(relationship.onDelete).toBe(updateData.onDelete);
      expect(relationship.onUpdate).toBe(updateData.onUpdate);
      expect(relationship.updatedBy).toBe(updateData.updatedBy);
      expect(relationship.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate onDelete action when updating', () => {
      expect(() => {
        relationship.update({ onDelete: 'INVALID_ACTION', updatedBy: 'user456' });
      }).toThrow('Invalid onDelete action');
    });

    it('should validate onUpdate action when updating', () => {
      expect(() => {
        relationship.update({ onUpdate: 'INVALID_ACTION', updatedBy: 'user456' });
      }).toThrow('Invalid onUpdate action');
    });
  });

  describe('business methods', () => {
    let relationship: Relationship;

    beforeEach(() => {
      relationship = Relationship.create({
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        createdBy: 'user123',
      });
    });

    describe('type checking methods', () => {
      it('should correctly identify relationship types', () => {
        const oneToOne = Relationship.create({
          projectId: 'project-123',
          name: 'User Profile',
          code: 'UserProfile',
          type: RelationshipType.ONE_TO_ONE,
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-2',
          createdBy: 'user123',
        });

        const manyToMany = Relationship.create({
          projectId: 'project-123',
          name: 'User Roles',
          code: 'UserRoles',
          type: RelationshipType.MANY_TO_MANY,
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-2',
          createdBy: 'user123',
        });

        expect(relationship.isOneToMany()).toBe(true);
        expect(relationship.isOneToOne()).toBe(false);
        expect(relationship.isManyToMany()).toBe(false);

        expect(oneToOne.isOneToOne()).toBe(true);
        expect(oneToOne.isOneToMany()).toBe(false);

        expect(manyToMany.isManyToMany()).toBe(true);
        expect(manyToMany.isOneToMany()).toBe(false);
      });
    });

    describe('status management', () => {
      it('should activate relationship', () => {
        relationship.deactivate();
        expect(relationship.status).toBe(RelationshipStatus.INACTIVE);

        relationship.activate();
        expect(relationship.status).toBe(RelationshipStatus.ACTIVE);
        expect(relationship.updatedAt).toBeInstanceOf(Date);
      });

      it('should deactivate relationship', () => {
        expect(relationship.status).toBe(RelationshipStatus.ACTIVE);

        relationship.deactivate();
        expect(relationship.status).toBe(RelationshipStatus.INACTIVE);
        expect(relationship.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when activating already active relationship', () => {
        expect(() => relationship.activate()).toThrow('Relationship is already active');
      });

      it('should throw error when deactivating already inactive relationship', () => {
        relationship.deactivate();
        expect(() => relationship.deactivate()).toThrow('Relationship is already inactive');
      });
    });

    describe('utility methods', () => {
      it('should detect self-referencing relationship', () => {
        const selfRef = Relationship.create({
          projectId: 'project-123',
          name: 'Self Reference',
          code: 'SelfRef',
          type: RelationshipType.ONE_TO_MANY,
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-1', // 同一个实体
          createdBy: 'user123',
        });

        expect(selfRef.isSelfReferencing()).toBe(true);
        expect(relationship.isSelfReferencing()).toBe(false);
      });

      it('should generate foreign key name', () => {
        expect(relationship.generateForeignKeyName()).toBe('fk_userorders');

        relationship.update({ foreignKeyName: 'custom_fk_name' });
        expect(relationship.generateForeignKeyName()).toBe('custom_fk_name');
      });

      it('should generate join table name for many-to-many', () => {
        const manyToMany = Relationship.create({
          projectId: 'project-123',
          name: 'User Roles',
          code: 'UserRoles',
          type: RelationshipType.MANY_TO_MANY,
          sourceEntityId: 'users',
          targetEntityId: 'roles',
          createdBy: 'user123',
        });

        expect(manyToMany.generateJoinTableName()).toBe('users_roles');
      });

      it('should throw error when generating join table name for non-many-to-many', () => {
        expect(() => relationship.generateJoinTableName()).toThrow(
          'Join table is only for many-to-many relationships'
        );
      });

      it('should check if relationship can be deleted', () => {
        expect(relationship.canDelete()).toBe(true);
      });
    });
  });

  describe('fromPersistence', () => {
    it('should create relationship from persistence data', () => {
      const persistenceData = {
        id: 'relationship-id-123',
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        description: 'User to orders relationship',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        sourceFieldId: 'field-1',
        targetFieldId: 'field-2',
        foreignKeyName: 'fk_user_orders',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        config: { indexed: true },
        status: RelationshipStatus.ACTIVE,
        createdBy: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedBy: 'user456',
        updatedAt: new Date('2024-01-02'),
      };

      const relationship = Relationship.fromPersistence(persistenceData);

      expect(relationship.id).toBe(persistenceData.id);
      expect(relationship.projectId).toBe(persistenceData.projectId);
      expect(relationship.name).toBe(persistenceData.name);
      expect(relationship.code).toBe(persistenceData.code);
      expect(relationship.description).toBe(persistenceData.description);
      expect(relationship.type).toBe(persistenceData.type);
      expect(relationship.sourceEntityId).toBe(persistenceData.sourceEntityId);
      expect(relationship.targetEntityId).toBe(persistenceData.targetEntityId);
      expect(relationship.sourceFieldId).toBe(persistenceData.sourceFieldId);
      expect(relationship.targetFieldId).toBe(persistenceData.targetFieldId);
      expect(relationship.foreignKeyName).toBe(persistenceData.foreignKeyName);
      expect(relationship.onDelete).toBe(persistenceData.onDelete);
      expect(relationship.onUpdate).toBe(persistenceData.onUpdate);
      expect(relationship.config).toBe(persistenceData.config);
      expect(relationship.status).toBe(persistenceData.status);
      expect(relationship.createdBy).toBe(persistenceData.createdBy);
      expect(relationship.createdAt).toBe(persistenceData.createdAt);
      expect(relationship.updatedBy).toBe(persistenceData.updatedBy);
      expect(relationship.updatedAt).toBe(persistenceData.updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return relationship as JSON object', () => {
      const relationship = Relationship.create({
        projectId: 'project-123',
        name: 'User Orders',
        code: 'UserOrders',
        type: RelationshipType.ONE_TO_MANY,
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        description: 'User to orders relationship',
        createdBy: 'user123',
      });

      const json = relationship.toJSON();

      expect(json).toHaveProperty('projectId', 'project-123');
      expect(json).toHaveProperty('name', 'User Orders');
      expect(json).toHaveProperty('code', 'UserOrders');
      expect(json).toHaveProperty('type', RelationshipType.ONE_TO_MANY);
      expect(json).toHaveProperty('sourceEntityId', 'entity-1');
      expect(json).toHaveProperty('targetEntityId', 'entity-2');
      expect(json).toHaveProperty('description', 'User to orders relationship');
      expect(json).toHaveProperty('createdBy', 'user123');
      expect(json).toHaveProperty('status', RelationshipStatus.ACTIVE);
      expect(json).toHaveProperty('createdAt');
    });
  });
});
