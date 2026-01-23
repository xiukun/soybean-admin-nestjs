import { Module } from '@nestjs/common';

import { PrismaModule } from '@lib/shared/prisma/prisma.module';

import { DeptController } from './rest/dept.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DeptController],
})
export class DeptApiModule {}
