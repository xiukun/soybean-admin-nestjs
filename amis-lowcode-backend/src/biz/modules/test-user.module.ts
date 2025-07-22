import { Module } from '@nestjs/common';
import { TestUserController } from '../controllers/test-user.controller';
import { TestUserService } from '../services/test-user.service';

import { PrismaModule } from '../../shared/database/prisma.module';


@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [TestUserController],
  providers: [
    TestUserService,
  ],
  exports: [
    TestUserService,
  ],
})
export class TestUserModule {}
