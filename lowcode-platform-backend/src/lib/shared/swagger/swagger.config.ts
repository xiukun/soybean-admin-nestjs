import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  path: string;
  enableAuth: boolean;
  enableExamples: boolean;
  enableSchemas: boolean;
  servers?: Array<{
    url: string;
    description: string;
  }>;
  contact?: {
    name: string;
    email: string;
    url: string;
  };
  license?: {
    name: string;
    url: string;
  };
}

export function setupSwagger(app: INestApplication, configService: ConfigService): void {
  const config: SwaggerConfig = {
    title: configService.get('SWAGGER_TITLE', 'Low-code Platform API'),
    description: configService.get('SWAGGER_DESCRIPTION', 
      `A comprehensive low-code platform API that enables rapid application development through:
      
      ## Features
      - **Project Management**: Create and manage low-code projects
      - **Entity Design**: Visual entity modeling with relationships
      - **Template Management**: Code generation templates with versioning
      - **Code Generation**: Intelligent code generation with multiple architectures
      - **Real-time Preview**: Live preview of generated code
      - **Multi-framework Support**: NestJS, Express, Spring Boot, and more
      
      ## Architecture Support
      - Base-Biz Architecture
      - Domain Driven Design (DDD)
      - Clean Architecture
      - Microservices Architecture
      
      ## Supported Frameworks
      - **Backend**: NestJS, Express.js, Spring Boot, FastAPI
      - **Frontend**: Vue 3, React, Angular (coming soon)
      - **Database**: PostgreSQL, MySQL, MongoDB
      
      ## Getting Started
      1. Create a new project
      2. Design your entities and relationships
      3. Select or customize templates
      4. Generate and download your code
      
      ## Authentication
      Most endpoints require JWT authentication. Use the /auth/login endpoint to obtain a token.
      `),
    version: configService.get('API_VERSION', '1.0.0'),
    path: configService.get('SWAGGER_PATH', 'api'),
    enableAuth: configService.get('SWAGGER_ENABLE_AUTH', 'true') === 'true',
    enableExamples: configService.get('SWAGGER_ENABLE_EXAMPLES', 'true') === 'true',
    enableSchemas: configService.get('SWAGGER_ENABLE_SCHEMAS', 'true') === 'true',
    servers: [
      {
        url: configService.get('API_BASE_URL', 'http://localhost:3000'),
        description: 'Development server',
      },
      {
        url: configService.get('API_PROD_URL', 'https://api.lowcode-platform.com'),
        description: 'Production server',
      },
    ],
    contact: {
      name: 'Low-code Platform Team',
      email: 'support@lowcode-platform.com',
      url: 'https://lowcode-platform.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  };

  const documentBuilder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addTag('Projects', 'Project management operations')
    .addTag('Entities', 'Entity design and management')
    .addTag('Templates', 'Template management and versioning')
    .addTag('Code Generation', 'Code generation and preview')
    .addTag('Metadata', 'Metadata aggregation and management')
    .addTag('Health', 'Health check and system status')
    .addTag('Authentication', 'User authentication and authorization');

  // Add servers
  if (config.servers) {
    config.servers.forEach(server => {
      documentBuilder.addServer(server.url, server.description);
    });
  }

  // Add contact information
  if (config.contact) {
    documentBuilder.setContact(
      config.contact.name,
      config.contact.url,
      config.contact.email,
    );
  }

  // Add license information
  if (config.license) {
    documentBuilder.setLicense(config.license.name, config.license.url);
  }

  // Add authentication
  if (config.enableAuth) {
    documentBuilder
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API Key for service-to-service communication',
        },
        'API-Key',
      );
  }

  // Add global responses
  documentBuilder
    .addGlobalParameters({
      name: 'X-Request-ID',
      in: 'header',
      required: false,
      description: 'Unique request identifier for tracing',
      schema: {
        type: 'string',
        format: 'uuid',
      },
    })
    .addGlobalParameters({
      name: 'Accept-Language',
      in: 'header',
      required: false,
      description: 'Preferred language for response messages',
      schema: {
        type: 'string',
        default: 'en-US',
        enum: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'],
      },
    });

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Add custom schemas if enabled
  if (config.enableSchemas) {
    addCustomSchemas(document);
  }

  // Add examples if enabled
  if (config.enableExamples) {
    addExamples(document);
  }

  // Setup Swagger UI
  SwaggerModule.setup(config.path, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customSiteTitle: config.title,
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { color: #3b82f6; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; }
    `,
    customCssUrl: '/swagger-ui-custom.css',
  });
}

function addCustomSchemas(document: any): void {
  // Add common response schemas
  document.components.schemas.ApiResponse = {
    type: 'object',
    properties: {
      status: {
        type: 'integer',
        description: 'Response status (0 = success, 1 = error)',
        enum: [0, 1],
      },
      msg: {
        type: 'string',
        description: 'Response message',
        example: 'success',
      },
      data: {
        description: 'Response data',
        nullable: true,
      },
    },
    required: ['status', 'msg', 'data'],
  };

  document.components.schemas.ErrorResponse = {
    type: 'object',
    properties: {
      status: {
        type: 'integer',
        description: 'Error status (always 1)',
        example: 1,
      },
      msg: {
        type: 'string',
        description: 'Error message',
        example: 'error',
      },
      data: {
        type: 'null',
        description: 'Always null for errors',
      },
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Error code',
            example: 'VALIDATION_FAILED',
          },
          message: {
            type: 'string',
            description: 'Detailed error message',
            example: 'Validation failed for field: name',
          },
          details: {
            description: 'Additional error details',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp',
          },
          path: {
            type: 'string',
            description: 'Request path',
            example: '/api/v1/projects',
          },
          method: {
            type: 'string',
            description: 'HTTP method',
            example: 'POST',
          },
        },
      },
    },
  };

  document.components.schemas.PaginationMeta = {
    type: 'object',
    properties: {
      current: {
        type: 'integer',
        description: 'Current page number',
        minimum: 1,
        example: 1,
      },
      size: {
        type: 'integer',
        description: 'Page size',
        minimum: 1,
        maximum: 100,
        example: 10,
      },
      total: {
        type: 'integer',
        description: 'Total number of records',
        minimum: 0,
        example: 100,
      },
      pages: {
        type: 'integer',
        description: 'Total number of pages',
        minimum: 0,
        example: 10,
      },
    },
  };

  document.components.schemas.PaginatedResponse = {
    allOf: [
      { $ref: '#/components/schemas/ApiResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              records: {
                type: 'array',
                description: 'Array of records',
              },
              meta: {
                $ref: '#/components/schemas/PaginationMeta',
              },
            },
          },
        },
      },
    ],
  };
}

function addExamples(document: any): void {
  // Add request/response examples
  const examples = {
    ProjectCreateRequest: {
      summary: 'Create a new project',
      value: {
        name: 'E-commerce Platform',
        code: 'ecommerce-platform',
        description: 'A comprehensive e-commerce platform with user management, product catalog, and order processing',
        framework: 'nestjs',
        architecture: 'ddd',
        language: 'typescript',
        database: 'postgresql',
        features: ['authentication', 'authorization', 'caching', 'logging'],
        settings: {
          enableSwagger: true,
          enableTesting: true,
          enableDocker: true,
        },
      },
    },
    EntityCreateRequest: {
      summary: 'Create a new entity',
      value: {
        name: 'User',
        code: 'User',
        tableName: 'users',
        description: 'User entity for authentication and profile management',
        fields: [
          {
            name: 'Email',
            code: 'email',
            type: 'STRING',
            nullable: false,
            isUnique: true,
            length: 255,
            description: 'User email address',
          },
          {
            name: 'First Name',
            code: 'firstName',
            type: 'STRING',
            nullable: false,
            length: 100,
            description: 'User first name',
          },
          {
            name: 'Last Name',
            code: 'lastName',
            type: 'STRING',
            nullable: false,
            length: 100,
            description: 'User last name',
          },
          {
            name: 'Age',
            code: 'age',
            type: 'INTEGER',
            nullable: true,
            min: 0,
            max: 150,
            description: 'User age',
          },
        ],
      },
    },
    CodeGenerationRequest: {
      summary: 'Generate code for entities',
      value: {
        projectId: '01HQZX1234567890ABCDEF',
        templateIds: ['nestjs-entity', 'nestjs-service', 'nestjs-controller'],
        entityIds: ['01HQZX1234567890ABCDEF', '01HQZX1234567890ABCDEG'],
        outputPath: './generated',
        variables: {
          packageName: 'com.example.ecommerce',
          baseUrl: '/api/v1',
          enableAuth: true,
          enableValidation: true,
        },
        options: {
          overwriteExisting: false,
          generateTests: true,
          generateDocs: true,
          architecture: 'ddd',
          framework: 'nestjs',
        },
      },
    },
  };

  // Add examples to document
  if (!document.components.examples) {
    document.components.examples = {};
  }

  Object.assign(document.components.examples, examples);
}
