import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // 设置全局前缀
  app.setGlobalPrefix('api/v1');

  // 启用CORS
  await app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Amis Lowcode Business API')
    .setDescription('Auto-generated business API compatible with Amis framework')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  logger.log(`🚀 Amis Lowcode Backend is running on http://localhost:${port}/api/v1`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/v1/docs`);
}

bootstrap().catch((error) => {
  Logger.error('Failed to start application', error);
  process.exit(1);
});
