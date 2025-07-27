import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { 
  DeployProjectHandler, 
  StopProjectDeploymentHandler,
  UpdateDeploymentStatusHandler 
} from '@project/application/handlers/deploy-project.handler';
import { 
  DeployProjectCommand, 
  StopProjectDeploymentCommand,
  UpdateDeploymentStatusCommand 
} from '@project/application/commands/deploy-project.command';
import { Project, ProjectDeploymentStatus } from '@project/domain/project.model';
import { ProjectCodeGenerationService } from '@project/application/services/project-code-generation.service';
import { AmisDeploymentService } from '@project/application/services/amis-deployment.service';

describe('DeployProjectHandler', () => {
  let handler: DeployProjectHandler;
  let mockProjectRepository: any;
  let mockCodeGenerationService: any;
  let mockAmisDeploymentService: any;

  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    canDeploy: jest.fn(),
    startDeployment: jest.fn(),
    completeDeployment: jest.fn(),
    failDeployment: jest.fn()
  } as any;

  beforeEach(async () => {
    mockProjectRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };

    mockCodeGenerationService = {
      generateProjectCode: jest.fn()
    };

    mockAmisDeploymentService = {
      checkPortAvailability: jest.fn(),
      deployProject: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeployProjectHandler,
        {
          provide: 'ProjectRepository',
          useValue: mockProjectRepository
        },
        {
          provide: ProjectCodeGenerationService,
          useValue: mockCodeGenerationService
        },
        {
          provide: AmisDeploymentService,
          useValue: mockAmisDeploymentService
        }
      ],
    }).compile();

    handler = module.get<DeployProjectHandler>(DeployProjectHandler);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const command = new DeployProjectCommand('test-project', 9522, { environment: 'development' });

    it('should deploy project successfully', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProject.canDeploy.mockReturnValue(true);
      mockAmisDeploymentService.checkPortAvailability.mockResolvedValue(true);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(command);

      expect(result).toBe(mockProject);
      expect(mockProject.startDeployment).toHaveBeenCalledWith(9522, { environment: 'development' });
      expect(mockProjectRepository.update).toHaveBeenCalledWith(mockProject);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
      expect(mockProjectRepository.findById).toHaveBeenCalledWith('test-project');
    });

    it('should throw BadRequestException if project cannot be deployed', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProject.canDeploy.mockReturnValue(false);

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if port is not available', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProject.canDeploy.mockReturnValue(true);
      mockAmisDeploymentService.checkPortAvailability.mockResolvedValue(false);

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
      expect(mockAmisDeploymentService.checkPortAvailability).toHaveBeenCalledWith(9522);
    });

    it('should handle deployment without port specification', async () => {
      const commandWithoutPort = new DeployProjectCommand('test-project');
      
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProject.canDeploy.mockReturnValue(true);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(commandWithoutPort);

      expect(result).toBe(mockProject);
      expect(mockProject.startDeployment).toHaveBeenCalledWith(undefined, undefined);
    });
  });

  describe('executeDeploymentAsync', () => {
    beforeEach(() => {
      mockCodeGenerationService.generateProjectCode.mockResolvedValue({
        success: true,
        generatedFiles: ['file1.ts', 'file2.ts']
      });
      mockAmisDeploymentService.deployProject.mockResolvedValue(undefined);
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(mockProject);
    });

    it('should complete deployment successfully', async () => {
      await handler['executeDeploymentAsync']('test-project', 9522, {});

      expect(mockCodeGenerationService.generateProjectCode).toHaveBeenCalledWith('test-project');
      expect(mockAmisDeploymentService.deployProject).toHaveBeenCalledWith('test-project', 9522, {});
      expect(mockProject.completeDeployment).toHaveBeenCalledWith('Deployment completed successfully');
    });

    it('should handle deployment failure', async () => {
      mockAmisDeploymentService.deployProject.mockRejectedValue(new Error('Deployment failed'));

      await handler['executeDeploymentAsync']('test-project', 9522, {});

      expect(mockProject.failDeployment).toHaveBeenCalledWith('Deployment failed');
    });

    it('should handle code generation failure', async () => {
      mockCodeGenerationService.generateProjectCode.mockRejectedValue(new Error('Code generation failed'));

      await handler['executeDeploymentAsync']('test-project', 9522, {});

      expect(mockProject.failDeployment).toHaveBeenCalledWith('Code generation failed');
    });
  });
});

describe('StopProjectDeploymentHandler', () => {
  let handler: StopProjectDeploymentHandler;
  let mockProjectRepository: any;
  let mockAmisDeploymentService: any;

  const mockProject = {
    id: 'test-project',
    isDeployed: jest.fn(),
    stopDeployment: jest.fn()
  } as any;

  beforeEach(async () => {
    mockProjectRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };

    mockAmisDeploymentService = {
      stopProject: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StopProjectDeploymentHandler,
        {
          provide: 'ProjectRepository',
          useValue: mockProjectRepository
        },
        {
          provide: AmisDeploymentService,
          useValue: mockAmisDeploymentService
        }
      ],
    }).compile();

    handler = module.get<StopProjectDeploymentHandler>(StopProjectDeploymentHandler);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const command = new StopProjectDeploymentCommand('test-project');

    it('should stop deployment successfully', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProject.isDeployed.mockReturnValue(true);
      mockAmisDeploymentService.stopProject.mockResolvedValue(undefined);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(command);

      expect(result).toBe(mockProject);
      expect(mockAmisDeploymentService.stopProject).toHaveBeenCalledWith('test-project');
      expect(mockProject.stopDeployment).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if project is not deployed', async () => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProject.isDeployed.mockReturnValue(false);

      await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    });
  });
});

describe('UpdateDeploymentStatusHandler', () => {
  let handler: UpdateDeploymentStatusHandler;
  let mockProjectRepository: any;

  const mockProject = {
    id: 'test-project',
    startDeployment: jest.fn(),
    completeDeployment: jest.fn(),
    failDeployment: jest.fn(),
    stopDeployment: jest.fn()
  } as any;

  beforeEach(async () => {
    mockProjectRepository = {
      findById: jest.fn(),
      update: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateDeploymentStatusHandler,
        {
          provide: 'ProjectRepository',
          useValue: mockProjectRepository
        }
      ],
    }).compile();

    handler = module.get<UpdateDeploymentStatusHandler>(UpdateDeploymentStatusHandler);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update status to DEPLOYING', async () => {
      const command = new UpdateDeploymentStatusCommand('test-project', 'DEPLOYING');
      
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(command);

      expect(result).toBe(mockProject);
      expect(mockProject.startDeployment).toHaveBeenCalled();
    });

    it('should update status to DEPLOYED', async () => {
      const command = new UpdateDeploymentStatusCommand('test-project', 'DEPLOYED', 'Success logs');
      
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(command);

      expect(result).toBe(mockProject);
      expect(mockProject.completeDeployment).toHaveBeenCalledWith('Success logs');
    });

    it('should update status to FAILED', async () => {
      const command = new UpdateDeploymentStatusCommand('test-project', 'FAILED', undefined, 'Error message');
      
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(command);

      expect(result).toBe(mockProject);
      expect(mockProject.failDeployment).toHaveBeenCalledWith('Error message');
    });

    it('should update status to INACTIVE', async () => {
      const command = new UpdateDeploymentStatusCommand('test-project', 'INACTIVE');
      
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockProjectRepository.update.mockResolvedValue(mockProject);

      const result = await handler.execute(command);

      expect(result).toBe(mockProject);
      expect(mockProject.stopDeployment).toHaveBeenCalled();
    });

    it('should throw NotFoundException if project not found', async () => {
      const command = new UpdateDeploymentStatusCommand('non-existent', 'DEPLOYED');
      
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    });
  });
});
