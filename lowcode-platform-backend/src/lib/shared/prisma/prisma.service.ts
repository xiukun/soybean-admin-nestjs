import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// Real Prisma Service with database connection
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
    this.logger.log('Using Real PrismaService with database connection');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Get database statistics
  async getDatabaseStats() {
    try {
      const projectCount = await this.project.count();
      const entityCount = await this.entity.count();
      const fieldCount = await this.field.count();

      return {
        projects: projectCount,
        entities: entityCount,
        fields: fieldCount,
        connected: true,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return {
        projects: 0,
        entities: 0,
        fields: 0,
        connected: false,
        error: error.message,
      };
    }
  }
}
