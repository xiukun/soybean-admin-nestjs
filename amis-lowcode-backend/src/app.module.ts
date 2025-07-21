import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '@shared/services/prisma.service';
import { UserModule } from '@modules/user.module';
import { RoleModule } from '@modules/role.module';
import { DatabaseInitService } from '@shared/database/database-init.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    UserModule,
    RoleModule
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, DatabaseInitService],
})
export class AppModule {
  // This module is dynamically updated by the code generator
}