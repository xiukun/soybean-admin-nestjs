import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ExecutionContext, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule, ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import * as casbin from 'casbin';
import { Redis } from 'ioredis';

//nest init
import { BootstrapModule } from '@lib/bootstrap/bootstrap.module';
import config, {
  ConfigKeyPaths,
  IThrottlerConfig,
  throttlerConfigToken,
  IRedisConfig,
  redisRegToken,
} from '@lib/config';
import { ISecurityConfig, securityRegToken } from '@lib/config/security.config';
import { GlobalCqrsModule } from '@lib/global/global.module';
import { SharedModule } from '@lib/global/shared.module';
import { AuthZModule, AUTHZ_ENFORCER, PrismaAdapter } from '@lib/infra/casbin';
import { AllExceptionsFilter } from '@lib/infra/filters/all-exceptions.filter';
import { CryptoModule } from '@lib/infra/crypto/crypto.module';
import { ApiKeyModule } from '@lib/infra/guard/api-key/api-key.module';
import { JwtAuthGuard } from '@lib/infra/guard/jwt.auth.guard';
import { TenantGuard } from '@lib/infra/guard/tenant.guard';
import { Reflector } from '@nestjs/core';
import { TenantContextService } from '@lib/shared/services/tenant-context.service';
import { JwtStrategy } from '@lib/infra/strategies/jwt.passport-strategy';
import { LoggerModule } from '@lib/logger';
import { IAuthentication } from '@lib/typings/global';
import { getConfigPath } from '@lib/utils/env';

import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const strategies = [JwtStrategy];

// 原nestjs-throttler-storage-redis废弃,迁移至@nest-lab/throttler-storage-redis
// https://github.com/kkoomen/nestjs-throttler-storage-redis
// https://github.com/jmcdo29/nest-lab/tree/main/packages/throttler-storage-redis
class ThrottlerStorageAdapter implements ThrottlerStorage {
  constructor(private readonly storageService: ThrottlerStorageRedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    return this.storageService.increment(
      key,
      ttl,
      limit,
      blockDuration,
      throttlerName,
    );
  }
}

@Module({
  imports: [
    //根据实际需要进行日志配置
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          console: true,
          file: true,
          filename: 'logs/base-system-%DATE%.log',
          level:
            configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          maxSize: '50m',
          maxFiles: '14d',
        };
      },
    }),
    TerminusModule,
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: ['.env.local', `.env.${process.env.NODE_ENV}`, '.env'],
      load: [...Object.values(config)],
    }),
    AuthZModule.register({
      imports: [ConfigModule],
      enforcerProvider: {
        provide: AUTHZ_ENFORCER,
        useFactory: async (configService: ConfigService) => {
          const adapter = await PrismaAdapter.newAdapter();
          const { casbinModel } = configService.get<ISecurityConfig>(
            securityRegToken,
            {
              infer: true,
            },
          );
          const casbinModelPath = getConfigPath(casbinModel);
          return casbin.newEnforcer(casbinModelPath, adapter);
        },
        inject: [ConfigService],
      },
      userFromContext: (ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user: IAuthentication = request.user;
        return user;
      },
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<ConfigKeyPaths>) => {
        const { ttl, limit, errorMessage } =
          configService.get<IThrottlerConfig>(throttlerConfigToken, {
            infer: true,
          });

        const redisOpts = configService.get<IRedisConfig>(redisRegToken, {
          infer: true,
        });

        let throttlerStorageRedisService: ThrottlerStorageRedisService;

        if (redisOpts.mode === 'cluster') {
          throttlerStorageRedisService = new ThrottlerStorageRedisService(
            new Redis.Cluster(redisOpts.cluster),
          );
        } else {
          throttlerStorageRedisService = new ThrottlerStorageRedisService(
            new Redis({
              host: redisOpts.standalone.host,
              port: redisOpts.standalone.port,
              password: redisOpts.standalone.password,
              db: redisOpts.standalone.db,
            }),
          );
        }

        const storageAdapter = new ThrottlerStorageAdapter(
          throttlerStorageRedisService,
        );

        return {
          errorMessage: errorMessage,
          throttlers: [{ ttl, limit }],
          storage: storageAdapter,
        };
      },
    }),

    GlobalCqrsModule,

    ApiModule,

    SharedModule,

    CryptoModule.register(),
    ApiKeyModule,
    BootstrapModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    ...strategies,

    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    //TODO 拦截器极度影响性能 有需要自行开启 对性能有要求使用decorator形式 每个接口手动加虽然麻烦点或者app.use指定路由统一使用相对代码量少
    // { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // { provide: APP_INTERCEPTOR, useClass: LogInterceptor },

    { provide: APP_GUARD, useClass: JwtAuthGuard },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, tenantContextService?: TenantContextService) => {
        console.log('=== TenantGuard FACTORY - reflector:', reflector);
        console.log('=== TenantGuard FACTORY - tenantContextService:', tenantContextService);
        return new TenantGuard(reflector, tenantContextService);
      },
      inject: [Reflector, TenantContextService],
    },
    // { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
