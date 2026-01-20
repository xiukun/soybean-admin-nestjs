import { Module } from '@nestjs/common';

import { PrismaModule } from '@lib/shared/prisma/prisma.module';

import { HistoryController } from './rest/history.controller';
import { VersionController } from './rest/version.controller';

@Module({
  imports: [PrismaModule],
  controllers: [VersionController, HistoryController],
})
export class VersionApiModule {}
