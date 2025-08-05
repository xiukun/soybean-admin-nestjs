import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '@lib/shared/prisma/prisma.module';
import { AppSpaceService } from './app-space.service';
import { AppSpaceController } from './app-space.controller';

/**
 * 应用空间模块
 * 提供应用空间管理的完整功能，包括CRUD操作和状态管理
 */
@Module({
  imports: [CqrsModule, PrismaModule],
  controllers: [AppSpaceController],
  providers: [AppSpaceService],
  exports: [AppSpaceService],
})
export class AppSpaceModule {}