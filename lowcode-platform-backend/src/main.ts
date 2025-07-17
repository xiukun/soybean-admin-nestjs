import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create Fastify adapter with enhanced options
  const fastifyAdapter = new FastifyAdapter({
    logger: process.env.NODE_ENV === 'development',
    trustProxy: true,
    bodyLimit: 10485760, // 10MB
    keepAliveTimeout: 30000,
    connectionTimeout: 30000,
  });

  // Register Fastify plugins
  try {
    // Enable CORS
    await fastifyAdapter.register(require('@fastify/cors'), {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:9527', 'http://localhost:9528'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    });

    // Enable multipart support for file uploads
    await fastifyAdapter.register(require('@fastify/multipart'), {
      limits: {
        fieldNameSize: 100,
        fieldSize: 100,
        fields: 10,
        fileSize: 10485760, // 10MB
        files: 5,
        headerPairs: 2000,
      },
    });

    // Enable compression
    await fastifyAdapter.register(require('@fastify/compress'), {
      global: true,
      threshold: 1024,
    });

    // Enable rate limiting
    await fastifyAdapter.register(require('@fastify/rate-limit'), {
      max: parseInt(process.env.RATE_LIMIT_MAX || '200'),
      timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
      skipOnError: true,
    });
  } catch (error) {
    logger.warn('Some Fastify plugins failed to register:', error.message);
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      logger: process.env.NODE_ENV === 'development' ? ['log', 'debug', 'error', 'verbose', 'warn'] : ['error', 'warn'],
    }
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix (excluding health endpoints)
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/health/detailed', '/health/ready', '/health/live', '/health/metrics'],
  });

  // Setup Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Low-Code Platform API')
      .setDescription('API documentation for the Low-Code Platform Backend')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('Projects', 'Project management endpoints')
      .addTag('Entities', 'Entity management endpoints')
      .addTag('Fields', 'Field management endpoints')
      .addTag('Relationships', 'Relationship management endpoints')
      .addTag('API Configuration', 'API configuration endpoints')
      .addTag('Code Templates', 'Code template management endpoints')
      .addTag('Code Generation', 'Code generation endpoints')
      .addTag('Health Check', 'Health monitoring endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      },
    });

    logger.log('Swagger documentation available at: http://localhost:3000/api-docs');
  }

  // Graceful shutdown handlers
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });

  // Start the server
  const port = parseInt(process.env.PORT || '3000');
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen(port, host);
    logger.log(`🚀 Low-Code Platform Backend is running on: http://${host}:${port}`);
    logger.log(`📚 API Documentation: http://${host}:${port}/api-docs`);
    logger.log(`💓 Health Check: http://${host}:${port}/health`);
    logger.log(`📊 Metrics: http://${host}:${port}/health/metrics`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle bootstrap errors
bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to bootstrap application:', error);
  process.exit(1);
});
