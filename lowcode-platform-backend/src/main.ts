import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // 启用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 启用版本控制
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 设置全局前缀
  app.setGlobalPrefix('api');

  // 配置Swagger文档
  const config = new DocumentBuilder()
    .setTitle('Low-code Platform API')
    .setDescription('Low-code platform backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('entities', 'Entity management')
    .addTag('apis', 'API management')
    .addTag('codegen', 'Code generation')
    .addTag('projects', 'Project management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Low-code Platform Backend is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
}

bootstrap();
