import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@src/app.module';
import { IAppConfig, ICorsConfig, ConfigKeyPaths } from '@lib/shared/config';
import { FriendlyValidationPipe, FRIENDLY_VALIDATION_PIPE_OPTIONS } from '@lib/shared/pipes/friendly-validation.pipe';

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
    // Enable CORS (commented out due to version compatibility issues)
    // await fastifyAdapter.register(require('@fastify/cors'), {
    //   origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:9527', 'http://localhost:9528'],
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    //   credentials: true,
    // });

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
      encodings: ['gzip', 'deflate'],
    });

    // Enable rate limiting
    await fastifyAdapter.register(require('@fastify/rate-limit'), {
      max: 200,
      timeWindow: 60000, // 1 minute
      skipOnError: true,
      allowList: ['127.0.0.1', '::1'], // Allow localhost
    });
    logger.log('✅ Fastify plugins registered successfully');
  } catch (error) {
    logger.warn('⚠️ Some Fastify plugins failed to register:', error.message);
  }

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      logger: process.env.NODE_ENV === 'development' ? ['log', 'debug', 'error', 'verbose', 'warn'] : ['error', 'warn'],
    }
  );

  // Get configuration services
  const configService = app.get(ConfigService<ConfigKeyPaths>);
  const appConfig = configService.get<IAppConfig>('app', { infer: true });
  const corsConfig = configService.get<ICorsConfig>('cors', { infer: true });

  // Enable CORS using configuration
  if (corsConfig.enabled) {
    app.enableCors(corsConfig.corsOptions);
  }

  // Global validation pipe with friendly error messages
  const nodeEnv = appConfig.nodeEnv;
  const validationOptions = nodeEnv === 'development' 
    ? FRIENDLY_VALIDATION_PIPE_OPTIONS.debug
    : FRIENDLY_VALIDATION_PIPE_OPTIONS.strict;
    
  app.useGlobalPipes(
    new FriendlyValidationPipe(validationOptions)
  );

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: appConfig.apiVersion,
  });

  // Global prefix for all API endpoints
  app.setGlobalPrefix(appConfig.apiPrefix);

  // Setup Swagger documentation
  // 允许在所有环境中访问 API 文档，便于调试和开发
  if (appConfig.docSwaggerEnable) {
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

    const port = parseInt(process.env.APP_PORT || process.env.PORT || '3002');
    logger.log(`Swagger documentation available at: http://localhost:${port}/api-docs`);
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
  const port = appConfig.port;
  const host = appConfig.host;

  try {
    await app.listen(port, host);
    logger.log(`🚀 Low-Code Platform Backend is running on: http://${host}:${port}`);
    logger.log(`📚 API Documentation: http://${host}:${port}/${appConfig.docSwaggerPath}`);
    logger.log(`💓 Health Check: http://${host}:${port}/health`);
    logger.log(`📊 Metrics: http://${host}:${port}/health/metrics`);
    logger.log(`🌍 Environment: ${appConfig.nodeEnv}`);
    logger.log(`🔒 CORS Enabled: ${corsConfig.enabled}`);
    if (corsConfig.enabled) {
      logger.log(`🌐 CORS Origins: ${corsConfig.corsOptions.origin}`);
    }
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
