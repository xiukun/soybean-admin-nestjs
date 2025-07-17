import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { CreateProjectCommand } from '../commands/create-project.command';
import { Project } from '../../domain/project.model';
import { ProjectRepository } from '../../domain/project.repository';

@CommandHandler(CreateProjectCommand)
export class CreateProjectHandler implements ICommandHandler<CreateProjectCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(command: CreateProjectCommand): Promise<Project> {
    // 检查项目代码是否已存在
    const existingProject = await this.projectRepository.findByCode(command.code);

    if (existingProject) {
      throw new ConflictException(
        `Project with code '${command.code}' already exists`,
      );
    }

    // 创建项目
    const project = Project.create({
      name: command.name,
      code: command.code,
      description: command.description,
      version: command.version,
      config: command.config,
      createdBy: command.createdBy || 'system',
    });

    // 保存项目
    return await this.projectRepository.save(project);
  }
}
