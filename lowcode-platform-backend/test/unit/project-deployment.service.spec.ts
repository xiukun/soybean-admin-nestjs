import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AmisDeploymentService } from '@project/application/services/amis-deployment.service';
import { ProjectCodeGenerationService } from '@project/application/services/project-code-generation.service';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as net from 'net';

// Mock fs-extra
jest.mock('fs-extra');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
  spawn: jest.fn()
}));

describe('AmisDeploymentService', () => {
  let service: AmisDeploymentService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmisDeploymentService,
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<AmisDeploymentService>(AmisDeploymentService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('/mock/amis-backend-path');
  });

  describe('checkPortAvailability', () => {
    it('should return true for available port', async () => {
      const mockServer = {
        listen: jest.fn((port, callback) => callback()),
        close: jest.fn(),
        once: jest.fn((event, callback) => callback()),
        on: jest.fn()
      };

      jest.spyOn(net, 'createServer').mockReturnValue(mockServer as any);

      const result = await service.checkPortAvailability(9522);
      expect(result).toBe(true);
      expect(mockServer.listen).toHaveBeenCalledWith(9522, expect.any(Function));
      expect(mockServer.close).toHaveBeenCalled();
    });

    it('should return false for unavailable port', async () => {
      const mockServer = {
        listen: jest.fn(),
        close: jest.fn(),
        once: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Port in use'));
          }
        })
      };

      jest.spyOn(net, 'createServer').mockReturnValue(mockServer as any);

      const result = await service.checkPortAvailability(9522);
      expect(result).toBe(false);
    });
  });

  describe('deployProject', () => {
    beforeEach(() => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.copy.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue(['test.module.ts'] as any);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('PORT=9521\n');
    });

    it('should deploy project successfully', async () => {
      const projectId = 'test-project';
      const port = 9522;
      const config = { environment: 'development' };

      // Mock successful deployment
      jest.spyOn(service, 'checkPortAvailability').mockResolvedValue(true);

      await expect(service.deployProject(projectId, port, config)).resolves.not.toThrow();

      expect(mockFs.pathExists).toHaveBeenCalled();
      expect(mockFs.copy).toHaveBeenCalled();
    });

    it('should throw error if port is not available', async () => {
      const projectId = 'test-project';
      const port = 9522;

      jest.spyOn(service, 'checkPortAvailability').mockResolvedValue(false);

      await expect(service.deployProject(projectId, port)).rejects.toThrow('Port 9522 is already in use');
    });

    it('should throw error if amis backend path does not exist', async () => {
      const projectId = 'test-project';
      mockFs.pathExists.mockResolvedValueOnce(false); // amis backend path

      await expect(service.deployProject(projectId)).rejects.toThrow('Amis backend path does not exist');
    });
  });

  describe('stopProject', () => {
    it('should stop project successfully', async () => {
      const projectId = 'test-project';
      
      // Mock deployment info
      service['deployedProjects'].set(projectId, { port: 9522 });

      await expect(service.stopProject(projectId)).resolves.not.toThrow();
      expect(service['deployedProjects'].has(projectId)).toBe(false);
    });

    it('should throw error if project is not deployed', async () => {
      const projectId = 'non-existent-project';

      await expect(service.stopProject(projectId)).rejects.toThrow('Project non-existent-project is not deployed');
    });
  });

  describe('getProjectDeploymentInfo', () => {
    it('should return deployment info for deployed project', () => {
      const projectId = 'test-project';
      const deploymentInfo = { port: 9522 };
      
      service['deployedProjects'].set(projectId, deploymentInfo);

      const result = service.getProjectDeploymentInfo(projectId);
      expect(result).toEqual({
        port: 9522,
        isRunning: false
      });
    });

    it('should return null for non-deployed project', () => {
      const projectId = 'non-existent-project';

      const result = service.getProjectDeploymentInfo(projectId);
      expect(result).toBeNull();
    });
  });

  describe('updateAppModule', () => {
    beforeEach(() => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readdir.mockResolvedValue(['user.module.ts', 'role.module.ts'] as any);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should update app module with generated modules', async () => {
      const projectId = 'test-project';

      await service['updateAppModule'](projectId);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('app.module.ts'),
        expect.stringContaining('UserModule'),
        'utf-8'
      );
    });

    it('should handle no generated modules gracefully', async () => {
      const projectId = 'test-project';
      mockFs.pathExists.mockResolvedValueOnce(false); // no modules path

      await expect(service['updateAppModule'](projectId)).resolves.not.toThrow();
    });
  });

  describe('findAvailablePort', () => {
    it('should find available port starting from default', async () => {
      jest.spyOn(service, 'checkPortAvailability')
        .mockResolvedValueOnce(false) // 9522 not available
        .mockResolvedValueOnce(true);  // 9523 available

      const result = await service['findAvailablePort']();
      expect(result).toBe(9523);
    });

    it('should throw error if no ports available', async () => {
      jest.spyOn(service, 'checkPortAvailability').mockResolvedValue(false);

      await expect(service['findAvailablePort'](9600)).rejects.toThrow('No available ports found');
    });
  });
});

describe('ProjectCodeGenerationService', () => {
  let service: ProjectCodeGenerationService;
  let mockProjectRepository: any;
  let mockPrismaService: any;
  let mockCodeGenerator: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockProjectRepository = {
      findById: jest.fn()
    };

    mockPrismaService = {
      entity: {
        findMany: jest.fn()
      },
      api: {
        findMany: jest.fn()
      },
      codeTemplate: {
        findMany: jest.fn()
      }
    };

    mockCodeGenerator = {
      generateFiles: jest.fn()
    };

    mockConfigService = {
      get: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectCodeGenerationService,
        {
          provide: 'ProjectRepository',
          useValue: mockProjectRepository
        },
        {
          provide: 'PrismaService',
          useValue: mockPrismaService
        },
        {
          provide: 'IntelligentCodeGeneratorService',
          useValue: mockCodeGenerator
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ],
    }).compile();

    service = module.get<ProjectCodeGenerationService>(ProjectCodeGenerationService);

    // Reset mocks
    jest.clearAllMocks();
    mockFs.ensureDir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  describe('generateProjectCode', () => {
    const mockProject = {
      id: 'test-project',
      name: 'Test Project',
      code: 'test-project',
      description: 'Test Description',
      version: '1.0.0',
      config: {}
    };

    beforeEach(() => {
      mockProjectRepository.findById.mockResolvedValue(mockProject);
      mockPrismaService.entity.findMany.mockResolvedValue([]);
      mockPrismaService.api.findMany.mockResolvedValue([]);
      mockPrismaService.codeTemplate.findMany.mockResolvedValue([]);
      mockCodeGenerator.generateFiles.mockResolvedValue([]);
      mockConfigService.get.mockReturnValue('/mock/output/path');
    });

    it('should generate project code successfully', async () => {
      const result = await service.generateProjectCode('test-project');

      expect(result.success).toBe(true);
      expect(result.generatedFiles).toEqual(expect.arrayContaining([
        expect.stringContaining('schema.prisma'),
        expect.stringContaining('package.json'),
        expect.stringContaining('README.md')
      ]));
      expect(mockProjectRepository.findById).toHaveBeenCalledWith('test-project');
    });

    it('should handle project not found', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      const result = await service.generateProjectCode('non-existent');

      expect(result.success).toBe(false);
      expect(result.errors).toContain("Project with id 'non-existent' not found");
    });

    it('should handle code generation errors', async () => {
      mockCodeGenerator.generateFiles.mockRejectedValue(new Error('Generation failed'));

      const result = await service.generateProjectCode('test-project');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Generation failed');
    });
  });
});
