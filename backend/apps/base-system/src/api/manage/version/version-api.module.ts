import { Module } from '@nestjs/common';
import { VersionController } from './rest/version.controller';
import { HistoryController } from './rest/history.controller';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VersionController, HistoryController],
})
export class VersionApiModule {}
