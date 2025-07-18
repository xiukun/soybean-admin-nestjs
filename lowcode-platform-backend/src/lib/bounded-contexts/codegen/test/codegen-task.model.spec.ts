import { CodegenTask, CodegenTaskStatus, CodegenTaskType } from '@codegen/domain/codegen-task.model';

describe('CodegenTask Model', () => {
  describe('create', () => {
    it('should create a codegen task with valid data', () => {
      const taskData = {
        projectId: 'project-123',
        name: 'Generate User API',
        type: CodegenTaskType.API,
        config: {
          entities: ['User', 'Order'],
          outputPath: '/src/api',
          framework: 'nestjs'
        },
        createdBy: 'user123',
      };

      const task = CodegenTask.create(taskData);

      expect(task.projectId).toBe(taskData.projectId);
      expect(task.name).toBe(taskData.name);
      expect(task.type).toBe(taskData.type);
      expect(task.config).toEqual(taskData.config);
      expect(task.status).toBe(CodegenTaskStatus.PENDING);
      expect(task.createdBy).toBe(taskData.createdBy);
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when projectId is empty', () => {
      const taskData = {
        projectId: '',
        name: 'Generate User API',
        type: CodegenTaskType.API,
        config: {},
        createdBy: 'user123',
      };

      expect(() => CodegenTask.create(taskData)).toThrow('Project ID is required');
    });

    it('should throw error when name is empty', () => {
      const taskData = {
        projectId: 'project-123',
        name: '',
        type: CodegenTaskType.API,
        config: {},
        createdBy: 'user123',
      };

      expect(() => CodegenTask.create(taskData)).toThrow('Task name is required');
    });

    it('should throw error when createdBy is empty', () => {
      const taskData = {
        projectId: 'project-123',
        name: 'Generate User API',
        type: CodegenTaskType.API,
        config: {},
        createdBy: '',
      };

      expect(() => CodegenTask.create(taskData)).toThrow('Created by is required');
    });
  });

  describe('business methods', () => {
    let task: CodegenTask;

    beforeEach(() => {
      task = CodegenTask.create({
        projectId: 'project-123',
        name: 'Generate User API',
        type: CodegenTaskType.API,
        config: {
          entities: ['User'],
          outputPath: '/src/api'
        },
        createdBy: 'user123',
      });
    });

    describe('status management', () => {
      it('should start task', () => {
        task.start();

        expect(task.status).toBe(CodegenTaskStatus.RUNNING);
        expect(task.progress).toBe(0);
        expect(task.updatedAt).toBeInstanceOf(Date);
      });

      it('should complete task', () => {
        task.start();
        const result = { files: ['user.ts'] };
        task.complete(result, '/output/path');

        expect(task.status).toBe(CodegenTaskStatus.COMPLETED);
        expect(task.progress).toBe(100);
        expect(task.result).toEqual(result);
        expect(task.outputPath).toBe('/output/path');
        expect(task.updatedAt).toBeInstanceOf(Date);
      });

      it('should fail task with error message', () => {
        task.start();
        task.fail('Template compilation failed');

        expect(task.status).toBe(CodegenTaskStatus.FAILED);
        expect(task.errorMsg).toBe('Template compilation failed');
        expect(task.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when trying to start non-pending task', () => {
        task.start();

        expect(() => task.start()).toThrow('Task can only be started from pending status');
      });

      it('should throw error when trying to complete non-running task', () => {
        expect(() => task.complete({})).toThrow('Task can only be completed from running status');
      });

      it('should throw error when trying to fail non-running task', () => {
        expect(() => task.fail('error')).toThrow('Task can only be failed from running status');
      });
    });

    describe('progress tracking', () => {
      it('should update progress', () => {
        task.start();
        task.updateProgress(50);

        expect(task.progress).toBe(50);
        expect(task.updatedAt).toBeInstanceOf(Date);
      });

      it('should validate progress range', () => {
        task.start();

        expect(() => task.updateProgress(-10)).toThrow('Progress must be between 0 and 100');
        expect(() => task.updateProgress(150)).toThrow('Progress must be between 0 and 100');
      });

      it('should not allow progress update on non-running task', () => {
        expect(() => task.updateProgress(50)).toThrow('Can only update progress for running tasks');
      });
    });

    describe('restart functionality', () => {
      it('should restart failed task', () => {
        task.start();
        task.fail('Some error');

        expect(task.canRestart()).toBe(true);

        task.restart();

        expect(task.status).toBe(CodegenTaskStatus.PENDING);
        expect(task.progress).toBe(0);
        expect(task.result).toBeUndefined();
        expect(task.errorMsg).toBeUndefined();
        expect(task.outputPath).toBeUndefined();
        expect(task.updatedAt).toBeInstanceOf(Date);
      });

      it('should restart completed task', () => {
        task.start();
        task.complete({ files: ['test.ts'] }, '/output');

        expect(task.canRestart()).toBe(true);

        task.restart();

        expect(task.status).toBe(CodegenTaskStatus.PENDING);
        expect(task.progress).toBe(0);
        expect(task.result).toBeUndefined();
        expect(task.outputPath).toBeUndefined();
      });

      it('should not allow restart of pending task', () => {
        expect(task.canRestart()).toBe(false);
        expect(() => task.restart()).toThrow('Task cannot be restarted in current status');
      });

      it('should not allow restart of running task', () => {
        task.start();

        expect(task.canRestart()).toBe(false);
        expect(() => task.restart()).toThrow('Task cannot be restarted in current status');
      });
    });

    describe('type checking', () => {
      it('should check task types', () => {
        expect(task.type).toBe(CodegenTaskType.API);

        const entityTask = CodegenTask.create({
          projectId: 'project-123',
          name: 'Generate Entity',
          type: CodegenTaskType.ENTITY,
          config: {},
          createdBy: 'user123',
        });

        expect(entityTask.type).toBe(CodegenTaskType.ENTITY);

        const fullProjectTask = CodegenTask.create({
          projectId: 'project-123',
          name: 'Generate Full Project',
          type: CodegenTaskType.FULL_PROJECT,
          config: {},
          createdBy: 'user123',
        });

        expect(fullProjectTask.type).toBe(CodegenTaskType.FULL_PROJECT);
      });
    });

    describe('status checking', () => {
      it('should check if task is running', () => {
        expect(task.isRunning()).toBe(false);

        task.start();
        expect(task.isRunning()).toBe(true);
      });

      it('should check if task is completed', () => {
        expect(task.isCompleted()).toBe(false);

        task.start();
        task.complete({});
        expect(task.isCompleted()).toBe(true);
      });

      it('should check if task is failed', () => {
        expect(task.isFailed()).toBe(false);

        task.start();
        task.fail('Error occurred');
        expect(task.isFailed()).toBe(true);
      });
    });


  });

  describe('fromPersistence', () => {
    it('should create task from persistence data', () => {
      const persistenceData = {
        id: 'task-id-123',
        projectId: 'project-123',
        name: 'Generate User API',
        type: CodegenTaskType.API,
        status: CodegenTaskStatus.COMPLETED,
        config: { entities: ['User'] },
        progress: 100,
        result: { files: ['user.ts'] },
        errorMsg: undefined,
        outputPath: '/output',
        createdBy: 'user123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01T10:05:00'),
      };

      const task = CodegenTask.fromPersistence(persistenceData);

      expect(task.id).toBe(persistenceData.id);
      expect(task.projectId).toBe(persistenceData.projectId);
      expect(task.name).toBe(persistenceData.name);
      expect(task.type).toBe(persistenceData.type);
      expect(task.status).toBe(persistenceData.status);
      expect(task.config).toEqual(persistenceData.config);
      expect(task.progress).toBe(persistenceData.progress);
      expect(task.result).toEqual(persistenceData.result);
      expect(task.outputPath).toBe(persistenceData.outputPath);
      expect(task.createdBy).toBe(persistenceData.createdBy);
      expect(task.createdAt).toBe(persistenceData.createdAt);
      expect(task.updatedAt).toBe(persistenceData.updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should return task as JSON object', () => {
      const task = CodegenTask.create({
        projectId: 'project-123',
        name: 'Generate User API',
        type: CodegenTaskType.API,
        config: { entities: ['User'] },
        createdBy: 'user123',
      });

      const json = task.toJSON();

      expect(json).toHaveProperty('projectId', 'project-123');
      expect(json).toHaveProperty('name', 'Generate User API');
      expect(json).toHaveProperty('type', CodegenTaskType.API);
      expect(json).toHaveProperty('status', CodegenTaskStatus.PENDING);
      expect(json).toHaveProperty('config', { entities: ['User'] });
      expect(json).toHaveProperty('createdBy', 'user123');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
