import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateProjectHandler } from '@project/application/handlers/create-project.handler';
import { UpdateProjectHandler } from '@project/application/handlers/update-project.handler';
import { UpdateProjectStatusHandler } from '@project/application/handlers/update-project-status.handler';
import { DeleteProjectHandler } from '@project/application/handlers/delete-project.handler';
import {
  DeployProjectHandler,
  StopProjectDeploymentHandler,
  UpdateDeploymentStatusHandler
} from '@project/application/handlers/deploy-project.handler';
import {
  GetProjectHandler,
  GetProjectByCodeHandler,
  GetProjectsHandler,
  GetProjectsPaginatedHandler
} from '@project/application/handlers/get-project.handler';
import { ProjectPrismaRepository } from '@infra/bounded-contexts/project/project-prisma.repository';
import { ProjectCodeGenerationService } from '@project/application/services/project-code-generation.service';
import { AmisDeploymentService } from '@project/application/services/amis-deployment.service';
import { CodeGenerationModule } from '@code-generation/code-generation.module';

const CommandHandlers = [
  CreateProjectHandler,
  UpdateProjectHandler,
  UpdateProjectStatusHandler,
  DeleteProjectHandler,
  DeployProjectHandler,
  StopProjectDeploymentHandler,
  UpdateDeploymentStatusHandler,
];

const QueryHandlers = [
  GetProjectHandler,
  GetProjectByCodeHandler,
  GetProjectsHandler,
  GetProjectsPaginatedHandler,
];

@Module({
  imports: [CqrsModule, CodeGenerationModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'ProjectRepository',
      useClass: ProjectPrismaRepository,
    },
    ProjectCodeGenerationService,
    AmisDeploymentService,
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    'ProjectRepository',
    ProjectCodeGenerationService,
    AmisDeploymentService,
  ],
})
export class ProjectModule {}
