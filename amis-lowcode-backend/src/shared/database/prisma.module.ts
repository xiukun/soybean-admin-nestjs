import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';

/**
 * Prisma模块
 * 提供数据库连接和服务
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
