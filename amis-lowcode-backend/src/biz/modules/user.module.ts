import { Module } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { UserBaseController } from '../base/controllers/user.base.controller';
import { UserBaseService } from '../base/services/user.base.service';
import { PrismaModule } from '../shared/database/prisma.module';
import { UserProfileModule } from './user-profile.module';

@Module({
  imports: [
    PrismaModule,
    UserProfileModule,
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserBaseService,
    UserBaseController,
  ],
  exports: [
    UserService,
    UserBaseService,
  ],
})
export class UserModule {}
