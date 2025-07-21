import { Module } from '@nestjs/common';
import { RoleController } from '@controllers/role.controller';
import { RoleService } from '@services/role.service';
import { PrismaService } from '@shared/services/prisma.service';

@Module({
  controllers: [RoleController],
  providers: [RoleService, PrismaService],
  exports: [RoleService],
})
export class RoleModule {}
