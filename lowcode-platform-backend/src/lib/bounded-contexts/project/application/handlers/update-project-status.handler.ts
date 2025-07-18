import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateProjectStatusCommand } from '@project/application/commands/update-project-status.command';
import { Project } from '@project/domain/project.model';
import { ProjectRepository } from '@project/domain/project.repository';

@CommandHandler(UpdateProjectStatusCommand)
export class UpdateProjectStatusHandler implements ICommandHandler<UpdateProjectStatusCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(command: UpdateProjectStatusCommand): Promise<Project> {
    // 查找项目
    const project = await this.projectRepository.findById(command.id);
    if (!project) {
      throw new NotFoundException(`Project with id '${command.id}' not found`);
    }

    // 更新项目状态
    project.update({
      status: command.status,
      updatedBy: command.updatedBy || 'system',
    });

    // 保存更新
    return await this.projectRepository.update(project);
  }
}
