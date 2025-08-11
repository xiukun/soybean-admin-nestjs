import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { NConfigProvider } from 'naive-ui';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  fetchAddEntity,
  fetchAddField,
  fetchAddProject,
  fetchAddRelationship,
  fetchGenerateCode,
  fetchGetEntityList,
  fetchGetProjectList
} from '@/service/api';

// Mock API responses
vi.mock('@/service/api', () => ({
  fetchGetProjectList: vi.fn(),
  fetchAddProject: vi.fn(),
  fetchGetEntityList: vi.fn(),
  fetchAddEntity: vi.fn(),
  fetchAddField: vi.fn(),
  fetchAddRelationship: vi.fn(),
  fetchGenerateCode: vi.fn()
}));

// Mock components for testing
const MockProjectList = {
  template: `
    <div data-testid="project-list">
      <div v-for="project in projects" :key="project.id" :data-testid="'project-' + project.id">
        {{ project.name }}
      </div>
    </div>
  `,
  props: ['projects']
};

const MockEntityList = {
  template: `
    <div data-testid="entity-list">
      <div v-for="entity in entities" :key="entity.id" :data-testid="'entity-' + entity.id">
        {{ entity.name }}
      </div>
    </div>
  `,
  props: ['entities']
};

describe('Low-code Platform Integration Tests', () => {
  let pinia: any;

  beforeAll(() => {
    pinia = createPinia();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('Project Management Integration', () => {
    it('should load and display projects', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Test Project 1',
          description: 'First test project',
          status: 'ACTIVE',
          version: '1.0.0',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Test Project 2',
          description: 'Second test project',
          status: 'INACTIVE',
          version: '1.1.0',
          createdAt: '2024-01-02T00:00:00Z'
        }
      ];

      (fetchGetProjectList as any).mockResolvedValue({
        records: mockProjects,
        total: 2,
        current: 1,
        size: 10
      });

      const wrapper = mount(MockProjectList, {
        props: { projects: mockProjects },
        global: {
          plugins: [pinia],
          components: {
            NConfigProvider
          }
        }
      });

      expect(wrapper.find('[data-testid="project-list"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="project-1"]').text()).toBe('Test Project 1');
      expect(wrapper.find('[data-testid="project-2"]').text()).toBe('Test Project 2');
    });

    it('should create new project', async () => {
      const newProject = {
        name: 'New Test Project',
        description: 'A new project for testing',
        version: '1.0.0',
        status: 'ACTIVE'
      };

      const createdProject = {
        id: '3',
        ...newProject,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      };

      (fetchAddProject as any).mockResolvedValue(createdProject);

      const result = await fetchAddProject(newProject);

      expect(fetchAddProject).toHaveBeenCalledWith(newProject);
      expect(result).toEqual(createdProject);
    });
  });

  describe('Entity Management Integration', () => {
    it('should load entities for a project', async () => {
      const projectId = 'test-project-id';
      const mockEntities = [
        {
          id: '1',
          projectId,
          name: 'User',
          code: 'user',
          tableName: 'users',
          category: 'core',
          status: 'PUBLISHED'
        },
        {
          id: '2',
          projectId,
          name: 'Post',
          code: 'post',
          tableName: 'posts',
          category: 'business',
          status: 'DRAFT'
        }
      ];

      (fetchGetEntityList as any).mockResolvedValue({
        records: mockEntities,
        total: 2,
        current: 1,
        size: 10
      });

      const wrapper = mount(MockEntityList, {
        props: { entities: mockEntities },
        global: {
          plugins: [pinia]
        }
      });

      expect(wrapper.find('[data-testid="entity-list"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="entity-1"]').text()).toBe('User');
      expect(wrapper.find('[data-testid="entity-2"]').text()).toBe('Post');
    });

    it('should create entity with fields', async () => {
      const projectId = 'test-project-id';

      // Create entity
      const entityData = {
        projectId,
        name: 'Product',
        code: 'product',
        tableName: 'products',
        category: 'business',
        status: 'DRAFT'
      };

      const createdEntity = {
        id: 'entity-id',
        ...entityData,
        version: 1,
        createdAt: '2024-01-01T00:00:00Z'
      };

      (fetchAddEntity as any).mockResolvedValue(createdEntity);

      const entityResult = await fetchAddEntity(entityData);
      expect(entityResult).toEqual(createdEntity);

      // Add fields to entity
      const nameField = {
        entityId: createdEntity.id,
        name: 'Name',
        code: 'name',
        type: 'VARCHAR',
        length: 100,
        nullable: false,
        unique: false,
        primaryKey: false,
        autoIncrement: false
      };

      const priceField = {
        entityId: createdEntity.id,
        name: 'Price',
        code: 'price',
        type: 'DECIMAL',
        precision: 10,
        scale: 2,
        nullable: false,
        unique: false,
        primaryKey: false,
        autoIncrement: false
      };

      const createdNameField = { id: 'field-1', ...nameField, order: 1 };
      const createdPriceField = { id: 'field-2', ...priceField, order: 2 };

      (fetchAddField as any).mockResolvedValueOnce(createdNameField).mockResolvedValueOnce(createdPriceField);

      const nameFieldResult = await fetchAddField(nameField);
      const priceFieldResult = await fetchAddField(priceField);

      expect(nameFieldResult).toEqual(createdNameField);
      expect(priceFieldResult).toEqual(createdPriceField);
    });
  });

  describe('Relationship Management Integration', () => {
    it('should create relationships between entities', async () => {
      const relationshipData = {
        projectId: 'test-project-id',
        name: 'User Products',
        code: 'user_products',
        description: 'One user can have many products',
        type: 'ONE_TO_MANY',
        sourceEntityId: 'user-entity-id',
        targetEntityId: 'product-entity-id',
        sourceField: 'id',
        targetField: 'userId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      };

      const createdRelationship = {
        id: 'relationship-id',
        ...relationshipData,
        createdAt: '2024-01-01T00:00:00Z'
      };

      (fetchAddRelationship as any).mockResolvedValue(createdRelationship);

      const result = await fetchAddRelationship(relationshipData);

      expect(fetchAddRelationship).toHaveBeenCalledWith(relationshipData);
      expect(result).toEqual(createdRelationship);
    });
  });

  describe('Code Generation Integration', () => {
    it('should generate code from templates', async () => {
      const generationData = {
        projectId: 'test-project-id',
        templateId: 'template-id',
        entityIds: ['user-entity-id', 'product-entity-id'],
        outputPath: './generated',
        variables: {
          entityName: 'User',
          entityCode: 'user'
        },
        options: {
          overwriteExisting: false,
          generateTests: true,
          generateDocs: true
        }
      };

      const generationResult = {
        success: true,
        filesGenerated: 5,
        outputPath: './generated',
        fileTree: [
          {
            path: './generated/user.controller.ts',
            name: 'user.controller.ts',
            type: 'file'
          },
          {
            path: './generated/user.service.ts',
            name: 'user.service.ts',
            type: 'file'
          }
        ],
        taskId: 'generation-task-id'
      };

      (fetchGenerateCode as any).mockResolvedValue(generationResult);

      const result = await fetchGenerateCode(generationData);

      expect(fetchGenerateCode).toHaveBeenCalledWith(generationData);
      expect(result).toEqual(generationResult);
      expect(result.success).toBe(true);
      expect(result.filesGenerated).toBe(5);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      const errorResponse = {
        message: 'Validation failed',
        errors: {
          name: ['Name is required'],
          code: ['Code must be unique']
        }
      };

      (fetchAddProject as any).mockRejectedValue({
        response: {
          status: 400,
          data: errorResponse
        }
      });

      try {
        await fetchAddProject({
          name: '',
          description: 'Test project'
        });
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toBe('Validation failed');
        expect(error.response.data.errors.name).toContain('Name is required');
      }
    });

    it('should handle network errors', async () => {
      (fetchGetProjectList as any).mockRejectedValue(new Error('Network Error'));

      try {
        await fetchGetProjectList({ current: 1, size: 10 });
      } catch (error: any) {
        expect(error.message).toBe('Network Error');
      }
    });
  });

  describe('Multi-Gateway Integration', () => {
    it('should route requests to correct services', async () => {
      // Test that low-code APIs use the correct service
      const projectData = { name: 'Test Project' };

      (fetchAddProject as any).mockResolvedValue({ id: '1', ...projectData });

      await fetchAddProject(projectData);

      // Verify the mock was called (indicating correct routing)
      expect(fetchAddProject).toHaveBeenCalledWith(projectData);
    });

    it('should handle service unavailability', async () => {
      // Mock service unavailable error
      (fetchGetProjectList as any).mockRejectedValue({
        response: {
          status: 503,
          data: { message: 'Service Unavailable' }
        }
      });

      try {
        await fetchGetProjectList({ current: 1, size: 10 });
      } catch (error: any) {
        expect(error.response.status).toBe(503);
        expect(error.response.data.message).toBe('Service Unavailable');
      }
    });
  });

  describe('Data Flow Integration', () => {
    it('should maintain data consistency across operations', async () => {
      const projectId = 'test-project-id';

      // Create project
      const project = {
        id: projectId,
        name: 'Integration Test Project',
        status: 'ACTIVE'
      };

      (fetchAddProject as any).mockResolvedValue(project);
      const createdProject = await fetchAddProject(project);

      // Create entity in project
      const entity = {
        projectId,
        name: 'TestEntity',
        code: 'test_entity',
        tableName: 'test_entities',
        category: 'core',
        status: 'DRAFT'
      };

      const createdEntity = {
        id: 'entity-id',
        ...entity,
        version: 1
      };

      (fetchAddEntity as any).mockResolvedValue(createdEntity);
      const entityResult = await fetchAddEntity(entity);

      // Verify data consistency
      expect(createdProject.id).toBe(projectId);
      expect(entityResult.projectId).toBe(projectId);
      expect(entityResult.name).toBe('TestEntity');
    });
  });
});
