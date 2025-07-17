import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DeleteProjectCommand } from '../commands/delete-project.command';
import { ProjectRepository } from '../../domain/project.repository';

@CommandHandler(DeleteProjectCommand)
export class DeleteProjectHandler implements ICommandHandler<DeleteProjectCommand> {
  constructor(
    @Inject('ProjectRepository')
    private readonly projectRepository: ProjectRepository,
  ) {}

  async execute(command: DeleteProjectCommand): Promise<void> {
    // 查找项目
    const project = await this.projectRepository.findById(command.id);
    if (!project) {
      throw new NotFoundException(`Project with id '${command.id}' not found`);
    }

    // 检查是否可以删除
    if (!project.canDelete()) {
      throw new BadRequestException(
        'Cannot delete active project. Please deactivate or archive it first.',
      );
    }

    // 删除项目
    await this.projectRepository.delete(command.id);
  }
}
