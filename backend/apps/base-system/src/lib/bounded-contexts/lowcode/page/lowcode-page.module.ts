import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

// Command Handlers
import { LowcodePageCreateCommandHandler } from './application/command-handlers/lowcode-page-create.command.handler';
import { LowcodePageUpdateCommandHandler } from './application/command-handlers/lowcode-page-update.command.handler';
import { LowcodePageDeleteCommandHandler } from './application/command-handlers/lowcode-page-delete.command.handler';
import { LowcodePageVersionCreateCommandHandler } from './application/command-handlers/lowcode-page-version-create.command.handler';

// Query Handlers
import { GetLowcodePagesQueryHandler } from './application/query-handlers/get-lowcode-pages.query.handler';
import { GetLowcodePageByIdQueryHandler } from './application/query-handlers/get-lowcode-page-by-id.query.handler';
import { GetLowcodePageByCodeQueryHandler } from './application/query-handlers/get-lowcode-page-by-code.query.handler';
import { GetLowcodePageByMenuQueryHandler } from './application/query-handlers/get-lowcode-page-by-menu.query.handler';
import { GetLowcodePageVersionsQueryHandler } from './application/query-handlers/get-lowcode-page-versions.query.handler';

// Repository
import { ILowcodePageRepository } from '@lowcode/page/domain/lowcode-page.repository';
import { LowcodePagePrismaRepository } from '@lowcode/page/infrastructure/lowcode-page-prisma.repository';

// Token for dependency injection
import { LOWCODE_PAGE_REPOSITORY } from '@lowcode/page/lowcode-page.tokens';

const CommandHandlers = [
  LowcodePageCreateCommandHandler,
  LowcodePageUpdateCommandHandler,
  LowcodePageDeleteCommandHandler,
  LowcodePageVersionCreateCommandHandler,
];

const QueryHandlers = [
  GetLowcodePagesQueryHandler,
  GetLowcodePageByIdQueryHandler,
  GetLowcodePageByCodeQueryHandler,
  GetLowcodePageByMenuQueryHandler,
  GetLowcodePageVersionsQueryHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    PrismaService,
    {
      provide: LOWCODE_PAGE_REPOSITORY,
      useClass: LowcodePagePrismaRepository,
    },
  ],
  exports: [LOWCODE_PAGE_REPOSITORY],
})
export class LowcodePageModule {}
