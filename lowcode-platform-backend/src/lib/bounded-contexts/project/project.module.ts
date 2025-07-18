import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateProjectHandler } from '@project/application/handlers/create-project.handler';
import { UpdateProjectHandler } from '@project/application/handlers/update-project.handler';
import { DeleteProjectHandler } from '@project/application/handlers/delete-project.handler';
import {
  GetProjectHandler,
  GetProjectByCodeHandler,
  GetProjectsHandler,
  GetProjectsPaginatedHandler
} from '@project/application/handlers/get-project.handler';
import { ProjectPrismaRepository } from '@infra/bounded-contexts/project/project-prisma.repository';

const CommandHandlers = [
  CreateProjectHandler,
  UpdateProjectHandler,
  DeleteProjectHandler,
];

const QueryHandlers = [
  GetProjectHandler,
  GetProjectByCodeHandler,
  GetProjectsHandler,
  GetProjectsPaginatedHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'ProjectRepository',
      useClass: ProjectPrismaRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    'ProjectRepository',
  ],
})
export class ProjectModule {}
