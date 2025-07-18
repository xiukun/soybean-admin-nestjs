import { ProjectStatus } from '@project/domain/project.model';

export class UpdateProjectStatusCommand {
  constructor(
    public readonly id: string,
    public readonly status: ProjectStatus,
    public readonly updatedBy?: string,
  ) {}
}
