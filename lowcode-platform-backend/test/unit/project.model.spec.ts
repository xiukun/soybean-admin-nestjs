import { Project, ProjectStatus, ProjectDeploymentStatus, ProjectProperties } from '@project/domain/project.model';

describe('Project Domain Model', () => {
  describe('Project Creation', () => {
    it('should create project with default deployment status', () => {
      const props: ProjectProperties = {
        name: 'Test Project',
        code: 'test-project',
        description: 'Test Description',
        createdBy: 'user-1'
      };

      const project = Project.create(props);

      expect(project.name).toBe('Test Project');
      expect(project.code).toBe('test-project');
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.INACTIVE);
      expect(project.version).toBe('1.0.0');
      expect(project.config).toEqual({});
      expect(project.deploymentConfig).toEqual({});
    });

    it('should create project with custom deployment status', () => {
      const props: ProjectProperties = {
        name: 'Test Project',
        code: 'test-project',
        createdBy: 'user-1',
        deploymentStatus: ProjectDeploymentStatus.DEPLOYED,
        deploymentPort: 9522
      };

      const project = Project.create(props);

      expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.DEPLOYED);
      expect(project.deploymentPort).toBe(9522);
    });
  });

  describe('Deployment Business Logic', () => {
    let project: Project;

    beforeEach(() => {
      const props: ProjectProperties = {
        name: 'Test Project',
        code: 'test-project',
        createdBy: 'user-1',
        status: ProjectStatus.ACTIVE,
        deploymentStatus: ProjectDeploymentStatus.INACTIVE
      };
      project = Project.create(props);
    });

    describe('startDeployment', () => {
      it('should start deployment successfully', () => {
        const port = 9522;
        const config = { environment: 'development' };

        project.startDeployment(port, config);

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.DEPLOYING);
        expect(project.deploymentPort).toBe(port);
        expect(project.deploymentConfig).toEqual(expect.objectContaining(config));
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should start deployment without port and config', () => {
        project.startDeployment();

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.DEPLOYING);
        expect(project.deploymentPort).toBeUndefined();
      });

      it('should throw error if already deploying', () => {
        // Set project to deploying state
        project.startDeployment();

        expect(() => project.startDeployment()).toThrow('Project is already being deployed');
      });

      it('should merge deployment config', () => {
        const initialConfig = { autoRestart: true };
        const newConfig = { environment: 'production' };

        // Set initial config
        project.startDeployment(9522, initialConfig);
        
        // Reset to inactive to test config merging
        project['props'].deploymentStatus = ProjectDeploymentStatus.INACTIVE;
        
        project.startDeployment(9523, newConfig);

        expect(project.deploymentConfig).toEqual({
          autoRestart: true,
          environment: 'production'
        });
      });
    });

    describe('completeDeployment', () => {
      beforeEach(() => {
        project.startDeployment(9522);
      });

      it('should complete deployment successfully', () => {
        const logs = 'Deployment completed successfully';

        project.completeDeployment(logs);

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.DEPLOYED);
        expect(project.lastDeployedAt).toBeInstanceOf(Date);
        expect(project.deploymentLogs).toBe(logs);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should complete deployment without logs', () => {
        project.completeDeployment();

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.DEPLOYED);
        expect(project.lastDeployedAt).toBeInstanceOf(Date);
        expect(project.deploymentLogs).toBeUndefined();
      });

      it('should throw error if not deploying', () => {
        // Reset to inactive
        project['props'].deploymentStatus = ProjectDeploymentStatus.INACTIVE;

        expect(() => project.completeDeployment()).toThrow('Project is not being deployed');
      });
    });

    describe('failDeployment', () => {
      beforeEach(() => {
        project.startDeployment(9522);
      });

      it('should fail deployment with error message', () => {
        const errorMsg = 'Port already in use';

        project.failDeployment(errorMsg);

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.FAILED);
        expect(project.deploymentLogs).toBe(errorMsg);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should fail deployment without error message', () => {
        project.failDeployment();

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.FAILED);
        expect(project.deploymentLogs).toBeUndefined();
      });

      it('should throw error if not deploying', () => {
        // Reset to inactive
        project['props'].deploymentStatus = ProjectDeploymentStatus.INACTIVE;

        expect(() => project.failDeployment()).toThrow('Project is not being deployed');
      });
    });

    describe('stopDeployment', () => {
      beforeEach(() => {
        project.startDeployment(9522);
        project.completeDeployment();
      });

      it('should stop deployment successfully', () => {
        project.stopDeployment();

        expect(project.deploymentStatus).toBe(ProjectDeploymentStatus.INACTIVE);
        expect(project.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error if not deployed', () => {
        // Reset to inactive
        project['props'].deploymentStatus = ProjectDeploymentStatus.INACTIVE;

        expect(() => project.stopDeployment()).toThrow('Project is not deployed');
      });
    });

    describe('isDeployed', () => {
      it('should return true when deployed', () => {
        project.startDeployment(9522);
        project.completeDeployment();

        expect(project.isDeployed()).toBe(true);
      });

      it('should return false when not deployed', () => {
        expect(project.isDeployed()).toBe(false);
      });

      it('should return false when deploying', () => {
        project.startDeployment(9522);

        expect(project.isDeployed()).toBe(false);
      });

      it('should return false when failed', () => {
        project.startDeployment(9522);
        project.failDeployment();

        expect(project.isDeployed()).toBe(false);
      });
    });

    describe('canDeploy', () => {
      it('should return true for active project with inactive deployment', () => {
        expect(project.canDeploy()).toBe(true);
      });

      it('should return true for active project with failed deployment', () => {
        project.startDeployment(9522);
        project.failDeployment();

        expect(project.canDeploy()).toBe(true);
      });

      it('should return false for inactive project', () => {
        project['props'].status = ProjectStatus.INACTIVE;

        expect(project.canDeploy()).toBe(false);
      });

      it('should return false for archived project', () => {
        project['props'].status = ProjectStatus.ARCHIVED;

        expect(project.canDeploy()).toBe(false);
      });

      it('should return false for already deployed project', () => {
        project.startDeployment(9522);
        project.completeDeployment();

        expect(project.canDeploy()).toBe(false);
      });

      it('should return false for deploying project', () => {
        project.startDeployment(9522);

        expect(project.canDeploy()).toBe(false);
      });
    });
  });

  describe('Business Rules Validation', () => {
    it('should validate required fields', () => {
      expect(() => {
        Project.create({
          name: '',
          code: 'test',
          createdBy: 'user-1'
        });
      }).toThrow('Project name is required');

      expect(() => {
        Project.create({
          name: 'Test',
          code: '',
          createdBy: 'user-1'
        });
      }).toThrow('Project code is required');

      expect(() => {
        Project.create({
          name: 'Test',
          code: 'test',
          createdBy: ''
        });
      }).toThrow('Created by is required');
    });

    it('should validate project code format', () => {
      expect(() => {
        Project.create({
          name: 'Test Project',
          code: 'invalid code!',
          createdBy: 'user-1'
        });
      }).toThrow('Project code must contain only lowercase letters, numbers, and hyphens');
    });

    it('should validate project name length', () => {
      expect(() => {
        Project.create({
          name: 'A'.repeat(101),
          code: 'test',
          createdBy: 'user-1'
        });
      }).toThrow('Project name must be between 1 and 100 characters');
    });
  });

  describe('Existing Business Logic', () => {
    let project: Project;

    beforeEach(() => {
      const props: ProjectProperties = {
        name: 'Test Project',
        code: 'test-project',
        createdBy: 'user-1',
        status: ProjectStatus.ACTIVE
      };
      project = Project.create(props);
    });

    describe('canDelete', () => {
      it('should return false for active project', () => {
        expect(project.canDelete()).toBe(false);
      });

      it('should return true for inactive project', () => {
        project['props'].status = ProjectStatus.INACTIVE;
        expect(project.canDelete()).toBe(true);
      });

      it('should return true for archived project', () => {
        project['props'].status = ProjectStatus.ARCHIVED;
        expect(project.canDelete()).toBe(true);
      });
    });

    describe('isActive', () => {
      it('should return true for active project', () => {
        expect(project.isActive()).toBe(true);
      });

      it('should return false for inactive project', () => {
        project['props'].status = ProjectStatus.INACTIVE;
        expect(project.isActive()).toBe(false);
      });
    });
  });
});
