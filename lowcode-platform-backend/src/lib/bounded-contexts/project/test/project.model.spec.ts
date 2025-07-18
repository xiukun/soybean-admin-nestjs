import { Project, ProjectStatus } from '@project/domain/project.model';

describe('Project Model', () => {
  describe('create', () => {
    it('should create a project with valid data', () => {
      const projectData = {
        name: 'Test Project',
        code: 'test_project',
        description: 'A test project',
        createdBy: 'user123',
      };

      const project = Project.create(projectData);

      expect(project.name).toBe(projectData.name);
      expect(project.code).toBe(projectData.code);
      expect(project.description).toBe(projectData.description);
      expect(project.createdBy).toBe(projectData.createdBy);
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.version).toBe('1.0.0');
      expect(project.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when name is empty', () => {
      const projectData = {
        name: '',
        code: 'test_project',
        createdBy: 'user123',
      };

      expect(() => Project.create(projectData)).toThrow('Project name is required');
    });

    it('should throw error when code is empty', () => {
      const projectData = {
        name: 'Test Project',
        code: '',
        createdBy: 'user123',
      };

      expect(() => Project.create(projectData)).toThrow('Project code is required');
    });

    it('should throw error when code has invalid format', () => {
      const projectData = {
        name: 'Test Project',
        code: '123invalid', // 不能以数字开头
        createdBy: 'user123',
      };

      expect(() => Project.create(projectData)).toThrow(
        'Project code must start with a letter and contain only letters, numbers, underscores, and hyphens'
      );
    });

    it('should throw error when createdBy is empty', () => {
      const projectData = {
        name: 'Test Project',
        code: 'test_project',
        createdBy: '',
      };

      expect(() => Project.create(projectData)).toThrow('Created by is required');
    });

    it('should accept valid code formats', () => {
      const validCodes = [
        'project1',
        'project_1',
        'project-1',
        'Project1',
        'PROJECT_1',
        'my-awesome-project',
      ];

      validCodes.forEach(code => {
        const projectData = {
          name: 'Test Project',
          code,
          createdBy: 'user123',
        };

        expect(() => Project.create(projectData)).not.toThrow();
      });
    });
  });

  describe('update', () => {
    let project: Project;

    beforeEach(() => {
      project = Project.create({
        name: 'Test Project',
        code: 'test_project',
        createdBy: 'user123',
      });
    });

    it('should update project properties', () => {
      const updateData = {
        name: 'Updated Project',
        description: 'Updated description',
        version: '2.0.0',
        updatedBy: 'user456',
      };

      project.update(updateData);

      expect(project.name).toBe(updateData.name);
      expect(project.description).toBe(updateData.description);
      expect(project.version).toBe(updateData.version);
      expect(project.updatedBy).toBe(updateData.updatedBy);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate code when updating', () => {
      expect(() => {
        project.update({ code: '123invalid', updatedBy: 'user456' });
      }).toThrow(
        'Project code must start with a letter and contain only letters, numbers, underscores, and hyphens'
      );
    });
  });

  describe('business methods', () => {
    let project: Project;

    beforeEach(() => {
      project = Project.create({
        name: 'Test Project',
        code: 'test_project',
        createdBy: 'user123',
      });
    });

    describe('activate', () => {
      it('should activate inactive project', () => {
        // 先设置为非活跃状态
        project.update({ status: ProjectStatus.INACTIVE, updatedBy: 'user123' });
        
        project.activate();

        expect(project.status).toBe(ProjectStatus.ACTIVE);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when project is already active', () => {
        expect(() => project.activate()).toThrow('Project is already active');
      });
    });

    describe('deactivate', () => {
      it('should deactivate active project', () => {
        project.deactivate();

        expect(project.status).toBe(ProjectStatus.INACTIVE);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when project is already inactive', () => {
        project.deactivate();
        
        expect(() => project.deactivate()).toThrow('Project is already inactive');
      });
    });

    describe('archive', () => {
      it('should archive project', () => {
        project.archive();

        expect(project.status).toBe(ProjectStatus.ARCHIVED);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when project is already archived', () => {
        project.archive();
        
        expect(() => project.archive()).toThrow('Project is already archived');
      });
    });

    describe('canDelete', () => {
      it('should return false for active project', () => {
        expect(project.canDelete()).toBe(false);
      });

      it('should return true for inactive project', () => {
        project.deactivate();
        expect(project.canDelete()).toBe(true);
      });

      it('should return true for archived project', () => {
        project.archive();
        expect(project.canDelete()).toBe(true);
      });
    });

    describe('isActive', () => {
      it('should return true for active project', () => {
        expect(project.isActive()).toBe(true);
      });

      it('should return false for inactive project', () => {
        project.deactivate();
        expect(project.isActive()).toBe(false);
      });

      it('should return false for archived project', () => {
        project.archive();
        expect(project.isActive()).toBe(false);
      });
    });
  });

  describe('fromPersistence', () => {
    it('should create project from persistence data', () => {
      const persistenceData = {
        id: 'project-id-123',
        name: 'Test Project',
        code: 'test_project',
        description: 'A test project',
        version: '1.0.0',
        config: { theme: 'dark' },
        status: ProjectStatus.ACTIVE,
        createdBy: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedBy: 'user456',
        updatedAt: new Date('2024-01-02'),
      };

      const project = Project.fromPersistence(persistenceData);

      expect(project.id).toBe(persistenceData.id);
      expect(project.name).toBe(persistenceData.name);
      expect(project.code).toBe(persistenceData.code);
      expect(project.description).toBe(persistenceData.description);
      expect(project.version).toBe(persistenceData.version);
      expect(project.config).toEqual(persistenceData.config);
      expect(project.status).toBe(persistenceData.status);
      expect(project.createdBy).toBe(persistenceData.createdBy);
      expect(project.createdAt).toBe(persistenceData.createdAt);
      expect(project.updatedBy).toBe(persistenceData.updatedBy);
      expect(project.updatedAt).toBe(persistenceData.updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return project as JSON object', () => {
      const project = Project.create({
        name: 'Test Project',
        code: 'test_project',
        description: 'A test project',
        createdBy: 'user123',
      });

      const json = project.toJSON();

      expect(json).toHaveProperty('name', 'Test Project');
      expect(json).toHaveProperty('code', 'test_project');
      expect(json).toHaveProperty('description', 'A test project');
      expect(json).toHaveProperty('createdBy', 'user123');
      expect(json).toHaveProperty('status', ProjectStatus.ACTIVE);
      expect(json).toHaveProperty('version', '1.0.0');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
