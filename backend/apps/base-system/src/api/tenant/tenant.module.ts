import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { PrismaModule } from '../../../../../libs/shared/prisma/src/prisma.module';

/**
 * 租户管理模块
 * 提供租户的CRUD操作、状态管理和企业关联功能
 */
@Module({
  imports: [
    CqrsModule,
    PrismaModule,
  ],
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}