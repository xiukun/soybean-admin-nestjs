import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateProjectCommand } from '@project/application/commands/update-project.command';
import { Project } from '@project/domain/project.model';
import { ProjectRepository } from '@project/domain/project.repository';

@CommandHandler(UpdateProjectCommand)
export class UpdateProjectHandler implements ICommandHandler<UpdateProjectCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(command: UpdateProjectCommand): Promise<Project> {
    // 查找项目
    const project = await this.projectRepository.findById(command.id);
    if (!project) {
      throw new NotFoundException(`Project with id '${command.id}' not found`);
    }

    // 检查代码冲突
    if (command.code && command.code !== project.code) {
      const existingProject = await this.projectRepository.existsByCode(
        command.code,
        command.id,
      );

      if (existingProject) {
        throw new ConflictException(
          `Project with code '${command.code}' already exists`,
        );
      }
    }

    // 更新项目
    project.update({
      name: command.name,
      code: command.code,
      description: command.description,
      version: command.version,
      config: command.config,
      updatedBy: command.updatedBy || 'system',
    });

    // 保存更新
    return await this.projectRepository.update(project);
  }
}
