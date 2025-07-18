import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateRelationshipHandler } from '@lib/bounded-contexts/relationship/application/handlers/create-relationship.handler';
import { 
  GetRelationshipHandler, 
  GetRelationshipByCodeHandler, 
  GetRelationshipsByProjectHandler,
  GetRelationshipsPaginatedHandler,
  GetRelationshipsByEntityHandler,
  GetRelationshipGraphHandler,
  GetRelationshipStatsHandler
} from '@lib/bounded-contexts/relationship/application/handlers/get-relationship.handler';
import { RelationshipPrismaRepository } from '@infra/bounded-contexts/relationship/relationship-prisma.repository';

const CommandHandlers = [
  CreateRelationshipHandler,
];

const QueryHandlers = [
  GetRelationshipHandler,
  GetRelationshipByCodeHandler,
  GetRelationshipsByProjectHandler,
  GetRelationshipsPaginatedHandler,
  GetRelationshipsByEntityHandler,
  GetRelationshipGraphHandler,
  GetRelationshipStatsHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'RelationshipRepository',
      useClass: RelationshipPrismaRepository,
    },
  ],
  exports: [
    ...CommandHandlers,
    ...QueryHandlers,
    'RelationshipRepository',
  ],
})
export class RelationshipModule {}
