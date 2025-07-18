import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Field Management Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let testEntityId: string;
  let createdFieldIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'fieldtestuser',
        email: 'fieldtest@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Field Test Project',
        description: 'Test project for field management',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testProjectId = testProject.id;

    // Create test entity
    const testEntity = await prisma.entity.create({
      data: {
        projectId: testProjectId,
        name: 'TestEntity',
        code: 'test_entity',
        tableName: 'test_entities',
        category: 'core',
        status: 'DRAFT',
        createdBy: testUserId,
      },
    });
    testEntityId = testEntity.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });
  });

  afterAll(async () => {
    // Clean up test data in reverse order
    for (const fieldId of createdFieldIds) {
      try {
        await prisma.field.delete({ where: { id: fieldId } });
      } catch (error) {
        console.warn(`Failed to delete field ${fieldId}:`, error.message);
      }
    }

    await prisma.entity.delete({ where: { id: testEntityId } });
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('Field CRUD Operations', () => {
    it('should create different types of fields', async () => {
      const fieldTypes = [
        {
          name: 'ID Field',
          code: 'id',
          type: 'UUID',
          nullable: false,
          unique: true,
          primaryKey: true,
          autoIncrement: false,
          comment: 'Primary key field'
        },
        {
          name: 'Name Field',
          code: 'name',
          type: 'VARCHAR',
          length: 100,
          nullable: false,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'Name field'
        },
        {
          name: 'Age Field',
          code: 'age',
          type: 'INTEGER',
          nullable: true,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'Age field'
        },
        {
          name: 'Price Field',
          code: 'price',
          type: 'DECIMAL',
          precision: 10,
          scale: 2,
          nullable: true,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'Price field'
        },
        {
          name: 'Description Field',
          code: 'description',
          type: 'TEXT',
          nullable: true,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          comment: 'Description field'
        },
        {
          name: 'Created At Field',
          code: 'created_at',
          type: 'TIMESTAMP',
          nullable: false,
          unique: false,
          primaryKey: false,
          autoIncrement: false,
          defaultValue: 'CURRENT_TIMESTAMP',
          comment: 'Creation timestamp'
        }
      ];

      for (const fieldData of fieldTypes) {
        const response = await request(app.getHttpServer())
          .post('/fields')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            entityId: testEntityId,
            ...fieldData
          })
          .expect(201);

        expect(response.body).toMatchObject({
          entityId: testEntityId,
          name: fieldData.name,
          code: fieldData.code,
          type: fieldData.type,
          nullable: fieldData.nullable,
          unique: fieldData.unique,
          primaryKey: fieldData.primaryKey,
          autoIncrement: fieldData.autoIncrement,
          comment: fieldData.comment
        });

        expect(response.body.id).toBeDefined();
        expect(response.body.order).toBeGreaterThan(0);
        createdFieldIds.push(response.body.id);
      }
    });

    it('should get fields by entity', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/${testEntityId}/fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(6); // All created fields

      // Verify fields are ordered correctly
      const fields = response.body;
      for (let i = 1; i < fields.length; i++) {
        expect(fields[i].order).toBeGreaterThan(fields[i - 1].order);
      }
    });

    it('should get field by id', async () => {
      const fieldId = createdFieldIds[0];
      const response = await request(app.getHttpServer())
        .get(`/fields/${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: fieldId,
        entityId: testEntityId,
        name: 'ID Field',
        code: 'id',
        type: 'UUID',
        primaryKey: true
      });
    });

    it('should update field properties', async () => {
      const fieldId = createdFieldIds[1]; // Name field
      const updateData = {
        name: 'Updated Name Field',
        length: 150,
        comment: 'Updated name field comment',
        nullable: true
      };

      const response = await request(app.getHttpServer())
        .put(`/fields/${fieldId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: fieldId,
        name: updateData.name,
        length: updateData.length,
        comment: updateData.comment,
        nullable: updateData.nullable,
        updatedBy: testUserId
      });

      expect(response.body.version).toBe(2);
    });

    it('should reorder fields', async () => {
      // Get current fields
      const fieldsResponse = await request(app.getHttpServer())
        .get(`/entities/${testEntityId}/fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const fields = fieldsResponse.body;
      const reorderData = fields.map((field: any, index: number) => ({
        id: field.id,
        order: fields.length - index // Reverse order
      }));

      const response = await request(app.getHttpServer())
        .put(`/entities/${testEntityId}/fields/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ fields: reorderData })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify new order
      const reorderedResponse = await request(app.getHttpServer())
        .get(`/entities/${testEntityId}/fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const reorderedFields = reorderedResponse.body;
      expect(reorderedFields[0].id).toBe(fields[fields.length - 1].id);
      expect(reorderedFields[reorderedFields.length - 1].id).toBe(fields[0].id);
    });
  });

  describe('Field Validation', () => {
    it('should validate required fields', async () => {
      const invalidData = {
        entityId: testEntityId,
        // Missing name and code
        type: 'VARCHAR'
      };

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should validate field code uniqueness within entity', async () => {
      const duplicateData = {
        entityId: testEntityId,
        name: 'Duplicate Code Field',
        code: 'id', // Same code as existing field
        type: 'VARCHAR',
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false
      };

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(409);
    });

    it('should validate field type constraints', async () => {
      const invalidTypeData = {
        entityId: testEntityId,
        name: 'Invalid Type Field',
        code: 'invalid_type',
        type: 'INVALID_TYPE',
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false
      };

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTypeData)
        .expect(400);
    });

    it('should validate VARCHAR length requirement', async () => {
      const noLengthData = {
        entityId: testEntityId,
        name: 'No Length Field',
        code: 'no_length',
        type: 'VARCHAR',
        // Missing length for VARCHAR
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false
      };

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noLengthData)
        .expect(400);
    });

    it('should validate DECIMAL precision and scale', async () => {
      const invalidDecimalData = {
        entityId: testEntityId,
        name: 'Invalid Decimal Field',
        code: 'invalid_decimal',
        type: 'DECIMAL',
        precision: 5,
        scale: 10, // Scale cannot be greater than precision
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false
      };

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDecimalData)
        .expect(400);
    });

    it('should validate primary key constraints', async () => {
      const multiplePrimaryKeyData = {
        entityId: testEntityId,
        name: 'Another Primary Key',
        code: 'another_pk',
        type: 'UUID',
        nullable: false,
        unique: true,
        primaryKey: true, // Already have a primary key
        autoIncrement: false
      };

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(multiplePrimaryKeyData)
        .expect(409);
    });
  });

  describe('Field Constraints and Relationships', () => {
    it('should handle foreign key fields', async () => {
      // Create another entity first
      const relatedEntity = await prisma.entity.create({
        data: {
          projectId: testProjectId,
          name: 'RelatedEntity',
          code: 'related_entity',
          tableName: 'related_entities',
          category: 'core',
          status: 'DRAFT',
          createdBy: testUserId,
        },
      });

      const foreignKeyData = {
        entityId: testEntityId,
        name: 'Related Entity ID',
        code: 'related_entity_id',
        type: 'UUID',
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false,
        foreignKey: {
          referencedEntityId: relatedEntity.id,
          referencedField: 'id',
          onDelete: 'SET_NULL',
          onUpdate: 'CASCADE'
        },
        comment: 'Foreign key to related entity'
      };

      const response = await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(foreignKeyData)
        .expect(201);

      expect(response.body.foreignKey).toBeDefined();
      expect(response.body.foreignKey.referencedEntityId).toBe(relatedEntity.id);
      createdFieldIds.push(response.body.id);

      // Clean up
      await prisma.entity.delete({ where: { id: relatedEntity.id } });
    });

    it('should handle field with default values', async () => {
      const defaultValueData = {
        entityId: testEntityId,
        name: 'Status Field',
        code: 'status',
        type: 'VARCHAR',
        length: 20,
        nullable: false,
        unique: false,
        primaryKey: false,
        autoIncrement: false,
        defaultValue: 'ACTIVE',
        comment: 'Status field with default value'
      };

      const response = await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(defaultValueData)
        .expect(201);

      expect(response.body.defaultValue).toBe('ACTIVE');
      createdFieldIds.push(response.body.id);
    });

    it('should handle field with check constraints', async () => {
      const constraintData = {
        entityId: testEntityId,
        name: 'Rating Field',
        code: 'rating',
        type: 'INTEGER',
        nullable: true,
        unique: false,
        primaryKey: false,
        autoIncrement: false,
        checkConstraint: 'rating >= 1 AND rating <= 5',
        comment: 'Rating field with check constraint'
      };

      const response = await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send(constraintData)
        .expect(201);

      expect(response.body.checkConstraint).toBe('rating >= 1 AND rating <= 5');
      createdFieldIds.push(response.body.id);
    });
  });

  describe('Field Statistics and Analysis', () => {
    it('should get field statistics for entity', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/${testEntityId}/fields/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('constraints');

      expect(typeof response.body.total).toBe('number');
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.byType).toHaveProperty('VARCHAR');
      expect(response.body.byType).toHaveProperty('UUID');
    });

    it('should analyze field dependencies', async () => {
      const response = await request(app.getHttpServer())
        .get(`/entities/${testEntityId}/fields/dependencies`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Should include foreign key dependencies
    });
  });

  describe('Field Operations', () => {
    it('should duplicate field', async () => {
      const originalFieldId = createdFieldIds[1]; // Name field
      
      const response = await request(app.getHttpServer())
        .post(`/fields/${originalFieldId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Duplicated Name Field',
          code: 'duplicated_name'
        })
        .expect(201);

      expect(response.body.name).toBe('Duplicated Name Field');
      expect(response.body.code).toBe('duplicated_name');
      expect(response.body.type).toBe('VARCHAR'); // Same as original
      expect(response.body.entityId).toBe(testEntityId);
      
      createdFieldIds.push(response.body.id);
    });

    it('should validate field before entity publication', async () => {
      const response = await request(app.getHttpServer())
        .post(`/entities/${testEntityId}/validate-fields`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('errors');
      
      if (!response.body.valid) {
        expect(Array.isArray(response.body.errors)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent field', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/fields/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle non-existent entity for field creation', async () => {
      const nonExistentEntityId = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .post('/fields')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          entityId: nonExistentEntityId,
          name: 'Test Field',
          code: 'test_field',
          type: 'VARCHAR',
          length: 100,
          nullable: true,
          unique: false,
          primaryKey: false,
          autoIncrement: false
        })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/fields')
        .expect(401);
    });
  });
});
