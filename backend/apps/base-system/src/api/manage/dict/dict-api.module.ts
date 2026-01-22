import { Module } from '@nestjs/common';

import { PrismaModule } from '@lib/shared/prisma/prisma.module';

import { DictController } from './rest/dict.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DictController],
})
export class DictApiModule {}
