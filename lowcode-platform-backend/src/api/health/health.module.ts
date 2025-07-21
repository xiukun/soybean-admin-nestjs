import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PerformanceMonitorService } from '@lib/shared/monitoring/performance-monitor.service';
import { EnhancedLoggerService } from '@lib/shared/logging/enhanced-logger.service';
import { PrismaModule } from '@prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [HealthController],
  providers: [
    PerformanceMonitorService,
    {
      provide: EnhancedLoggerService,
      useFactory: (configService) => new EnhancedLoggerService(configService, 'HealthModule'),
      inject: [ConfigService],
    },
  ],
})
export class HealthModule {}
