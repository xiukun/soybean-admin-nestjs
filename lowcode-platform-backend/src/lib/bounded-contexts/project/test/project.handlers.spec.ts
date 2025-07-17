import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectHandler } from '../application/handlers/create-project.handler';
import { GetProjectHandler, GetProjectsHandler, GetProjectsPaginatedHandler } from '../application/handlers/get-project.handler';
import { UpdateProjectHandler } from '../application/handlers/update-project.handler';
import { DeleteProjectHandler } from '../application/handlers/delete-project.handler';
import { CreateProjectCommand } from '../application/commands/create-project.command';
import { GetProjectQuery, GetProjectsQuery, GetProjectsPaginatedQuery } from '../application/queries/get-project.query';
import { UpdateProjectCommand } from '../application/commands/update-project.command';
import { DeleteProjectCommand } from '../application/commands/delete-project.command';
import { Project, ProjectStatus } from '../domain/project.model';

describe('Project Handlers', () => {
  let createHandler: CreateProjectHandler;
  let getHandler: GetProjectHandler;
  let getProjectsHandler: GetProjectsHandler;
  let getPaginatedHandler: GetProjectsPaginatedHandler;
  let updateHandler: UpdateProjectHandler;
  let deleteHandler: DeleteProjectHandler;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findPaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProjectHandler,
        GetProjectHandler,
        GetProjectsHandler,
        GetProjectsPaginatedHandler,
        UpdateProjectHandler,
        DeleteProjectHandler,
        {
          provide: 'ProjectRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    createHandler = module.get<CreateProjectHandler>(CreateProjectHandler);
    getHandler = module.get<GetProjectHandler>(GetProjectHandler);
    getProjectsHandler = module.get<GetProjectsHandler>(GetProjectsHandler);
    getPaginatedHandler = module.get<GetProjectsPaginatedHandler>(GetProjectsPaginatedHandler);
    updateHandler = module.get<UpdateProjectHandler>(UpdateProjectHandler);
    deleteHandler = module.get<DeleteProjectHandler>(DeleteProjectHandler);
  });

  describe('CreateProjectHandler', () => {
    it('should create a project successfully', async () => {
      const command = new CreateProjectCommand(
        'Test Project',
        'test_project',
        'A test project',
        '1.0.0',
        { theme: 'dark' },
        'user123'
      );

      const mockProject = Project.create({
        name: command.name,
        code: command.code,
        description: command.description,
        version: command.version,
        config: command.config,
        createdBy: command.createdBy,
      });

      mockRepository.findByCode.mockResolvedValue(null);
      mockRepository.save.mockResolvedValue(mockProject);

      const result = await createHandler.execute(command);

      expect(mockRepository.findByCode).toHaveBeenCalledWith(command.code);
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Project));
      expect(result).toBe(mockProject);
    });

    it('should throw error when project code already exists', async () => {
      const command = new CreateProjectCommand(
        'Test Project',
        'existing_code',
        'A test project',
        '1.0.0',
        {},
        'user123'
      );

      const existingProject = Project.create({
        name: 'Existing Project',
        code: 'existing_code',
        createdBy: 'user123',
      });
      mockRepository.findByCode.mockResolvedValue(existingProject);

      await expect(createHandler.execute(command)).rejects.toThrow(
        'Project with code \'existing_code\' already exists'
      );

      expect(mockRepository.findByCode).toHaveBeenCalledWith(command.code);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('GetProjectHandler', () => {
    it('should get project by id successfully', async () => {
      const query = new GetProjectQuery('project-123');
      const mockProject = Project.create({
        name: 'Test Project',
        code: 'test_project',
        createdBy: 'user123',
      });

      mockRepository.findById.mockResolvedValue(mockProject);

      const result = await getHandler.execute(query);

      expect(mockRepository.findById).toHaveBeenCalledWith(query.id);
      expect(result).toBe(mockProject);
    });

    it('should throw error when project not found', async () => {
      const query = new GetProjectQuery('non-existent');

      mockRepository.findById.mockResolvedValue(null);

      await expect(getHandler.execute(query)).rejects.toThrow(
        'Project with id \'non-existent\' not found'
      );
    });
  });

  describe('GetProjectsHandler', () => {
    it('should get all projects successfully', async () => {
      const query = new GetProjectsQuery();
      const mockProjects = [
        Project.create({ name: 'Project 1', code: 'project1', createdBy: 'user123' }),
        Project.create({ name: 'Project 2', code: 'project2', createdBy: 'user123' }),
      ];

      mockRepository.findAll.mockResolvedValue(mockProjects);

      const result = await getProjectsHandler.execute(query);

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toBe(mockProjects);
    });
  });

  describe('GetProjectsPaginatedHandler', () => {
    it('should get paginated projects successfully', async () => {
      const query = new GetProjectsPaginatedQuery(1, 10, { search: 'test' });
      const mockResult = {
        projects: [
          Project.create({ name: 'Test Project', code: 'test_project', createdBy: 'user123' }),
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRepository.findPaginated.mockResolvedValue(mockResult);

      const result = await getPaginatedHandler.execute(query);

      expect(mockRepository.findPaginated).toHaveBeenCalledWith(
        query.page,
        query.limit,
        query.filters
      );
      expect(result).toBe(mockResult);
    });
  });

  describe('UpdateProjectHandler', () => {
    it('should update project successfully', async () => {
      const command = new UpdateProjectCommand(
        'project-123',
        'Updated Project',
        'test_project',
        'updated_description',
        '2.0.0',
        { theme: 'light' },
        'user456'
      );

      const existingProject = Project.create({
        name: 'Original Project',
        code: 'test_project',
        createdBy: 'user123',
      });

      const updatedProject = Project.fromPersistence({
        ...existingProject.toJSON(),
        name: command.name,
        description: command.description,
        version: command.version,
        config: command.config,
        updatedBy: command.updatedBy,
        updatedAt: new Date(),
      });

      mockRepository.findById.mockResolvedValue(existingProject);
      mockRepository.update.mockResolvedValue(updatedProject);

      const result = await updateHandler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(command.id);
      expect(mockRepository.update).toHaveBeenCalledWith(expect.any(Project));
      expect(result).toBe(updatedProject);
    });

    it('should throw error when project not found', async () => {
      const command = new UpdateProjectCommand(
        'non-existent',
        'Updated Project',
        'test_project',
        'updated_description',
        '2.0.0',
        { theme: 'light' },
        'user456'
      );

      mockRepository.findById.mockResolvedValue(null);

      await expect(updateHandler.execute(command)).rejects.toThrow(
        'Project with id \'non-existent\' not found'
      );

      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('DeleteProjectHandler', () => {
    it('should delete project successfully', async () => {
      const command = new DeleteProjectCommand('project-123');
      const mockProject = Project.create({
        name: 'Test Project',
        code: 'test_project',
        createdBy: 'user123',
      });
      mockProject.deactivate(); // Make it deletable

      mockRepository.findById.mockResolvedValue(mockProject);
      mockRepository.delete.mockResolvedValue(undefined);

      await deleteHandler.execute(command);

      expect(mockRepository.findById).toHaveBeenCalledWith(command.id);
      expect(mockRepository.delete).toHaveBeenCalledWith(command.id);
    });

    it('should throw error when project not found', async () => {
      const command = new DeleteProjectCommand('non-existent');

      mockRepository.findById.mockResolvedValue(null);

      await expect(deleteHandler.execute(command)).rejects.toThrow(
        'Project with id \'non-existent\' not found'
      );

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when project cannot be deleted', async () => {
      const command = new DeleteProjectCommand('project-123');
      const mockProject = Project.create({
        name: 'Test Project',
        code: 'test_project',
        createdBy: 'user123',
      });
      // Project is active, so cannot be deleted

      mockRepository.findById.mockResolvedValue(mockProject);

      await expect(deleteHandler.execute(command)).rejects.toThrow(
        'Cannot delete active project. Please deactivate or archive it first.'
      );

      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
