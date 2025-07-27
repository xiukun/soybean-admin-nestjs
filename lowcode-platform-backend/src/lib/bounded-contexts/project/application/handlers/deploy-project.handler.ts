import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProjectRepository } from '@project/domain/project.repository';
import { Project, DeploymentStatus } from '@project/domain/project.model';
import { DeployProjectCommand, StopProjectDeploymentCommand, UpdateDeploymentStatusCommand } from '../commands/deploy-project.command';
import { ProjectCodeGenerationService } from '../services/project-code-generation.service';
import { AmisDeploymentService } from '../services/amis-deployment.service';

@CommandHandler(DeployProjectCommand)
export class DeployProjectHandler implements ICommandHandler<DeployProjectCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
    private readonly projectCodeGenerationService: ProjectCodeGenerationService,
    private readonly amisDeploymentService: AmisDeploymentService,
  ) {}

  async execute(command: DeployProjectCommand): Promise<Project> {
    // 查找项目
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new NotFoundException(`Project with id '${command.projectId}' not found`);
    }

    // 检查项目是否可以部署
    if (!project.canDeploy()) {
      throw new BadRequestException('Project cannot be deployed in current state');
    }

    // 检查端口是否已被占用
    if (command.port) {
      const isPortAvailable = await this.amisDeploymentService.checkPortAvailability(command.port);
      if (!isPortAvailable) {
        throw new BadRequestException(`Port ${command.port} is already in use`);
      }
    }

    // 开始部署流程
    project.startDeployment(command.port, command.config);
    
    // 保存项目状态
    const updatedProject = await this.projectRepository.update(project);

    // 异步执行部署流程
    this.executeDeploymentAsync(project.id!, command.port, command.config);

    return updatedProject;
  }

  private async executeDeploymentAsync(projectId: string, port?: number, config?: any): Promise<void> {
    try {
      // 1. 生成项目代码
      await this.projectCodeGenerationService.generateProjectCode(projectId);

      // 2. 部署到 amis-lowcode-backend
      await this.amisDeploymentService.deployProject(projectId, port, config);

      // 3. 更新部署状态为成功
      const project = await this.projectRepository.findById(projectId);
      if (project) {
        project.completeDeployment('Deployment completed successfully');
        await this.projectRepository.update(project);
      }
    } catch (error) {
      // 部署失败，更新状态
      const project = await this.projectRepository.findById(projectId);
      if (project) {
        project.failDeployment(error.message);
        await this.projectRepository.update(project);
      }
    }
  }
}

@CommandHandler(StopProjectDeploymentCommand)
export class StopProjectDeploymentHandler implements ICommandHandler<StopProjectDeploymentCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
    private readonly amisDeploymentService: AmisDeploymentService,
  ) {}

  async execute(command: StopProjectDeploymentCommand): Promise<Project> {
    // 查找项目
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new NotFoundException(`Project with id '${command.projectId}' not found`);
    }

    // 检查项目是否已部署
    if (!project.isDeployed()) {
      throw new BadRequestException('Project is not deployed');
    }

    // 停止部署
    await this.amisDeploymentService.stopProject(command.projectId);
    
    // 更新项目状态
    project.stopDeployment();
    
    return await this.projectRepository.update(project);
  }
}

@CommandHandler(UpdateDeploymentStatusCommand)
export class UpdateDeploymentStatusHandler implements ICommandHandler<UpdateDeploymentStatusCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(command: UpdateDeploymentStatusCommand): Promise<Project> {
    // 查找项目
    const project = await this.projectRepository.findById(command.projectId);
    if (!project) {
      throw new NotFoundException(`Project with id '${command.projectId}' not found`);
    }

    // 根据状态更新项目
    switch (command.status) {
      case 'DEPLOYING':
        project.startDeployment();
        break;
      case 'DEPLOYED':
        project.completeDeployment(command.logs);
        break;
      case 'FAILED':
        project.failDeployment(command.errorMsg);
        break;
      case 'INACTIVE':
        project.stopDeployment();
        break;
    }

    return await this.projectRepository.update(project);
  }
}
