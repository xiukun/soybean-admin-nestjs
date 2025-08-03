import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '@src/app.module';
import { PrismaService } from '@lib/shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BaseBizArchitectureTemplate } from '@code-generation/templates/base-biz-architecture.template';

describe('Secondary Development Support Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;
  let testProjectId: string;
  let architectureTemplate: BaseBizArchitectureTemplate;
  let testDir: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [BaseBizArchitectureTemplate],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    architectureTemplate = moduleFixture.get<BaseBizArchitectureTemplate>(BaseBizArchitectureTemplate);

    await app.init();

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        username: 'secondarydevuser',
        email: 'secondarydev@example.com',
        password: 'hashedpassword',
        status: 'ACTIVE',
      },
    });
    testUserId = testUser.id;

    // Create test project
    const testProject = await prisma.project.create({
      data: {
        name: 'Secondary Development Test Project',
        description: 'Test project for secondary development capabilities',
        version: '1.0.0',
        status: 'ACTIVE',
        createdBy: testUserId,
      },
    });
    testProjectId = testProject.id;

    authToken = jwtService.sign({
      sub: testUserId,
      username: testUser.username,
      email: testUser.email,
    });

    testDir = './generated/secondary-dev-test';
  });

  afterAll(async () => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Clean up test data
    await prisma.project.delete({ where: { id: testProjectId } });
    await prisma.user.delete({ where: { id: testUserId } });

    await app.close();
  });

  describe('Base Code Regeneration Safety', () => {
    it('should preserve biz customizations when base code is regenerated', async () => {
      const entities = [
        {
          code: 'user',
          name: 'User',
          tableName: 'users',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'username', name: 'Username', type: 'VARCHAR', length: 50, nullable: false },
            { code: 'email', name: 'Email', type: 'VARCHAR', length: 255, nullable: false },
          ],
        },
      ];

      // Generate initial code
      const baseTemplates = architectureTemplate.generateBaseStructure('secondary-dev-test', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('secondary-dev-test', entities);

      // Create directories and write files
      this.createFilesFromTemplates([...baseTemplates, ...bizTemplates]);

      // Simulate user customization in biz layer
      const customBizService = `import { Injectable } from '@nestjs/common';
import { UserBaseService } from 'base/services/user.base.service';

@Injectable()
export class UserService extends UserBaseService {
  // Custom method added by developer
  async findActiveUsers() {
    return this.findAll({ active: true });
  }

  // Override base method with custom logic
  async create(createDto: any, userId?: string) {
    // Custom validation
    if (!createDto.username || createDto.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    
    // Call base implementation
    return super.create(createDto, userId);
  }

  // Custom business logic
  async getUserStats() {
    const total = await this.count();
    const active = await this.count({ active: true });
    return { total, active, inactive: total - active };
  }
}`;

      const bizServicePath = path.join(testDir, 'biz/services/user.service.ts');
      fs.writeFileSync(bizServicePath, customBizService);

      // Simulate base code regeneration (e.g., after schema changes)
      const updatedEntities = [
        {
          ...entities[0],
          fields: [
            ...entities[0].fields,
            { code: 'active', name: 'Active', type: 'BOOLEAN', nullable: false, defaultValue: 'true' },
            { code: 'created_at', name: 'Created At', type: 'TIMESTAMP', nullable: false },
          ],
        },
      ];

      const newBaseTemplates = architectureTemplate.generateBaseStructure('secondary-dev-test', updatedEntities);
      
      // Write only base files (simulating regeneration)
      this.createFilesFromTemplates(newBaseTemplates, true);

      // Verify biz customizations are preserved
      const preservedBizService = fs.readFileSync(bizServicePath, 'utf8');
      expect(preservedBizService).toContain('findActiveUsers()');
      expect(preservedBizService).toContain('getUserStats()');
      expect(preservedBizService).toContain('Custom validation');

      // Verify base service was updated with new fields
      const baseServicePath = path.join(testDir, 'base/services/user.base.service.ts');
      const updatedBaseService = fs.readFileSync(baseServicePath, 'utf8');
      expect(updatedBaseService).toContain('UserBaseService');
      expect(updatedBaseService).toContain('// AUTO-GENERATED FILE - DO NOT MODIFY');
    });

    it('should support extending base DTOs with custom fields', async () => {
      const entities = [
        {
          code: 'product',
          name: 'Product',
          tableName: 'products',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'name', name: 'Name', type: 'VARCHAR', length: 200, nullable: false },
            { code: 'price', name: 'Price', type: 'DECIMAL', precision: 10, scale: 2, nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('secondary-dev-test', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('secondary-dev-test', entities);

      this.createFilesFromTemplates([...baseTemplates, ...bizTemplates]);

      // Create custom DTO with additional fields
      const customDto = `import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { CreateProductBaseDto, UpdateProductBaseDto, ProductQueryBaseDto } from 'base/dto/product.base.dto';

export class CreateProductDto extends CreateProductBaseDto {
  @ApiPropertyOptional({ description: 'Product category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Product tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;
}

export class UpdateProductDto extends UpdateProductBaseDto {
  @ApiPropertyOptional({ description: 'Product category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Product tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Discount percentage' })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;
}

export class ProductQueryDto extends ProductQueryBaseDto {
  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  maxPrice?: number;
}

// Re-export base response DTO
export { ProductResponseDto } from '../../base/dto/product.base.dto';`;

      const customDtoPath = path.join(testDir, 'biz/dto/product.dto.ts');
      fs.writeFileSync(customDtoPath, customDto);

      // Verify custom DTO extends base DTO properly
      const dtoContent = fs.readFileSync(customDtoPath, 'utf8');
      expect(dtoContent).toContain('extends CreateProductBaseDto');
      expect(dtoContent).toContain('extends UpdateProductBaseDto');
      expect(dtoContent).toContain('extends ProductQueryBaseDto');
      expect(dtoContent).toContain('@ApiPropertyOptional');
      expect(dtoContent).toContain('@IsOptional()');
    });

    it('should support custom controllers with additional endpoints', async () => {
      const entities = [
        {
          code: 'order',
          name: 'Order',
          tableName: 'orders',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'order_number', name: 'Order Number', type: 'VARCHAR', length: 50, nullable: false },
            { code: 'status', name: 'Status', type: 'VARCHAR', length: 20, nullable: false },
            { code: 'total_amount', name: 'Total Amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('secondary-dev-test', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('secondary-dev-test', entities);

      this.createFilesFromTemplates([...baseTemplates, ...bizTemplates]);

      // Create custom controller with additional endpoints
      const customController = `import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrderBaseController } from 'base/controllers/order.base.controller';
import { OrderService } from '@test/services/order.service';

@Controller('orders')
@ApiTags('Order Management')
export class OrderController extends OrderBaseController {
  constructor(
    protected readonly orderService: OrderService,
  ) {
    super(orderService);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Order statistics retrieved successfully' })
  async getStatistics() {
    return this.orderService.getOrderStatistics();
  }

  @Get('by-status/:status')
  @ApiOperation({ summary: 'Get orders by status' })
  async getOrdersByStatus(@Param('status') status: string) {
    return this.orderService.findByStatus(status);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  @Post(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill order' })
  async fulfillOrder(@Param('id') id: string) {
    return this.orderService.fulfillOrder(id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export orders to CSV' })
  async exportOrders(@Query() query: any) {
    return this.orderService.exportToCSV(query);
  }

  @Post('bulk-update-status')
  @ApiOperation({ summary: 'Bulk update order status' })
  async bulkUpdateStatus(@Body() data: { orderIds: string[]; status: string }) {
    return this.orderService.bulkUpdateStatus(data.orderIds, data.status);
  }
}`;

      const customControllerPath = path.join(testDir, 'biz/controllers/order.controller.ts');
      fs.writeFileSync(customControllerPath, customController);

      // Verify custom controller extends base controller
      const controllerContent = fs.readFileSync(customControllerPath, 'utf8');
      expect(controllerContent).toContain('extends OrderBaseController');
      expect(controllerContent).toContain('super(orderService)');
      expect(controllerContent).toContain('@Get(\'statistics\')');
      expect(controllerContent).toContain('@Post(\':id/cancel\')');
      expect(controllerContent).toContain('getOrderStatistics()');
      expect(controllerContent).toContain('cancelOrder(id)');
    });
  });

  describe('Business Logic Extension', () => {
    it('should support complex business logic in biz services', async () => {
      const entities = [
        {
          code: 'invoice',
          name: 'Invoice',
          tableName: 'invoices',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'invoice_number', name: 'Invoice Number', type: 'VARCHAR', length: 50, nullable: false },
            { code: 'amount', name: 'Amount', type: 'DECIMAL', precision: 10, scale: 2, nullable: false },
            { code: 'status', name: 'Status', type: 'VARCHAR', length: 20, nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('secondary-dev-test', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('secondary-dev-test', entities);

      this.createFilesFromTemplates([...baseTemplates, ...bizTemplates]);

      // Create complex business logic service
      const complexBizService = `import { Injectable, BadRequestException } from '@nestjs/common';
import { InvoiceBaseService } from 'base/services/invoice.base.service';

@Injectable()
export class InvoiceService extends InvoiceBaseService {
  // Complex business logic for invoice processing
  async processInvoice(invoiceId: string, userId: string) {
    const invoice = await this.findOne(invoiceId);
    
    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be processed');
    }

    // Validate invoice data
    await this.validateInvoiceData(invoice);
    
    // Calculate taxes and totals
    const calculations = await this.calculateInvoiceTotals(invoice);
    
    // Update invoice with calculations
    const updatedInvoice = await this.update(invoiceId, {
      ...calculations,
      status: 'PROCESSED',
    }, userId);

    // Send notifications
    await this.sendInvoiceNotifications(updatedInvoice);
    
    // Log audit trail
    await this.logInvoiceProcessing(invoiceId, userId);

    return updatedInvoice;
  }

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.count({ 
      invoice_number: { startsWith: \`INV-\${year}-\` } 
    });
    
    return \`INV-\${year}-\${String(count + 1).padStart(6, '0')}\`;
  }

  async getInvoiceAnalytics(startDate: Date, endDate: Date) {
    // Complex analytics calculation
    const invoices = await this.findAll({
      createdAt: { gte: startDate, lte: endDate }
    });

    const analytics = {
      totalInvoices: invoices.records.length,
      totalAmount: invoices.records.reduce((sum, inv) => sum + inv.amount, 0),
      averageAmount: 0,
      statusBreakdown: {},
      monthlyTrend: [],
    };

    analytics.averageAmount = analytics.totalAmount / analytics.totalInvoices || 0;

    // Calculate status breakdown
    invoices.records.forEach(invoice => {
      analytics.statusBreakdown[invoice.status] = 
        (analytics.statusBreakdown[invoice.status] || 0) + 1;
    });

    return analytics;
  }

  private async validateInvoiceData(invoice: any): Promise<void> {
    if (!invoice.amount || invoice.amount <= 0) {
      throw new BadRequestException('Invoice amount must be greater than 0');
    }

    // Additional business validations
    if (invoice.amount > 100000) {
      // Require additional approval for high-value invoices
      await this.requireHighValueApproval(invoice);
    }
  }

  private async calculateInvoiceTotals(invoice: any) {
    const taxRate = 0.1; // 10% tax
    const taxAmount = invoice.amount * taxRate;
    const totalAmount = invoice.amount + taxAmount;

    return {
      tax_amount: taxAmount,
      total_amount: totalAmount,
    };
  }

  private async sendInvoiceNotifications(invoice: any): Promise<void> {
    // Integration with notification service
    console.log(\`Sending notification for invoice \${invoice.invoice_number}\`);
  }

  private async logInvoiceProcessing(invoiceId: string, userId: string): Promise<void> {
    // Integration with audit service
    console.log(\`Invoice \${invoiceId} processed by user \${userId}\`);
  }

  private async requireHighValueApproval(invoice: any): Promise<void> {
    // Integration with approval workflow
    console.log(\`High-value invoice \${invoice.invoice_number} requires approval\`);
  }
}`;

      const complexServicePath = path.join(testDir, 'biz/services/invoice.service.ts');
      fs.writeFileSync(complexServicePath, complexBizService);

      // Verify complex business logic is properly structured
      const serviceContent = fs.readFileSync(complexServicePath, 'utf8');
      expect(serviceContent).toContain('extends InvoiceBaseService');
      expect(serviceContent).toContain('processInvoice(');
      expect(serviceContent).toContain('generateInvoiceNumber()');
      expect(serviceContent).toContain('getInvoiceAnalytics(');
      expect(serviceContent).toContain('private async validateInvoiceData(');
      expect(serviceContent).toContain('BadRequestException');
    });

    it('should support custom middleware and decorators', async () => {
      // Create custom middleware directory
      const middlewareDir = path.join(testDir, 'biz/middleware');
      if (!fs.existsSync(middlewareDir)) {
        fs.mkdirSync(middlewareDir, { recursive: true });
      }

      // Create custom middleware
      const customMiddleware = `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      console.log(\`\${req.method} \${req.url} - \${res.statusCode} - \${duration}ms\`);
      
      // Log to audit service
      this.logAuditEvent({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id,
        timestamp: new Date(),
      });
    });

    next();
  }

  private logAuditEvent(event: any) {
    // Integration with audit logging service
    console.log('Audit event:', event);
  }
}`;

      const middlewarePath = path.join(middlewareDir, 'audit.middleware.ts');
      fs.writeFileSync(middlewarePath, customMiddleware);

      // Create custom decorators directory
      const decoratorsDir = path.join(testDir, 'biz/decorators');
      if (!fs.existsSync(decoratorsDir)) {
        fs.mkdirSync(decoratorsDir, { recursive: true });
      }

      // Create custom decorator
      const customDecorator = `import { SetMetadata } from '@nestjs/common';

export const REQUIRE_PERMISSION_KEY = 'requirePermission';
export const RequirePermission = (permission: string) => 
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);

export const AUDIT_ACTION_KEY = 'auditAction';
export const AuditAction = (action: string) => 
  SetMetadata(AUDIT_ACTION_KEY, action);

export const RATE_LIMIT_KEY = 'rateLimit';
export const RateLimit = (requests: number, windowMs: number) =>
  SetMetadata(RATE_LIMIT_KEY, { requests, windowMs });`;

      const decoratorPath = path.join(decoratorsDir, 'custom.decorators.ts');
      fs.writeFileSync(decoratorPath, customDecorator);

      // Verify custom middleware and decorators
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      expect(middlewareContent).toContain('implements NestMiddleware');
      expect(middlewareContent).toContain('logAuditEvent');

      const decoratorContent = fs.readFileSync(decoratorPath, 'utf8');
      expect(decoratorContent).toContain('RequirePermission');
      expect(decoratorContent).toContain('AuditAction');
      expect(decoratorContent).toContain('SetMetadata');
    });
  });

  describe('Integration and Module Configuration', () => {
    it('should support custom module configuration with additional providers', async () => {
      const entities = [
        {
          code: 'notification',
          name: 'Notification',
          tableName: 'notifications',
          fields: [
            { code: 'id', name: 'ID', type: 'UUID', primaryKey: true, nullable: false },
            { code: 'title', name: 'Title', type: 'VARCHAR', length: 200, nullable: false },
            { code: 'message', name: 'Message', type: 'TEXT', nullable: false },
          ],
        },
      ];

      const baseTemplates = architectureTemplate.generateBaseStructure('secondary-dev-test', entities);
      const bizTemplates = architectureTemplate.generateBizStructure('secondary-dev-test', entities);

      this.createFilesFromTemplates([...baseTemplates, ...bizTemplates]);

      // Create custom services directory
      const customDir = path.join(testDir, 'biz/custom');
      if (!fs.existsSync(customDir)) {
        fs.mkdirSync(customDir, { recursive: true });
      }

      // Create custom services
      const emailService = `import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    console.log(\`Sending email to \${to}: \${subject}\`);
    // Integration with email provider
  }

  async sendBulkEmail(recipients: string[], subject: string, body: string): Promise<void> {
    for (const recipient of recipients) {
      await this.sendEmail(recipient, subject, body);
    }
  }
}`;

      const smsService = `import { Injectable } from '@nestjs/common';

@Injectable()
export class SmsService {
  async sendSms(to: string, message: string): Promise<void> {
    console.log(\`Sending SMS to \${to}: \${message}\`);
    // Integration with SMS provider
  }
}`;

      fs.writeFileSync(path.join(customDir, 'email.service.ts'), emailService);
      fs.writeFileSync(path.join(customDir, 'sms.service.ts'), smsService);

      // Update module to include custom services
      const customModule = `import { Module, MiddlewareConsumer } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

// Import biz services
import { NotificationService } from '@test/integration/services/notification.service';

// Import biz controllers
import { NotificationController } from '@test/integration/controllers/notification.controller';

// Import custom services
import { EmailService } from '@test/integration/custom/email.service';
import { SmsService } from '@test/integration/custom/sms.service';

// Import custom middleware
import { AuditMiddleware } from '@test/integration/middleware/audit.middleware';

@Module({
  imports: [
  ],
  controllers: [
    NotificationController,
  ],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
  ],
  exports: [
    NotificationService,
    EmailService,
    SmsService,
  ],
})
export class SecondaryDevTestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditMiddleware)
      .forRoutes('*');
  }
}`;

      const modulePath = path.join(testDir, 'biz/secondary-dev-test.module.ts');
      fs.writeFileSync(modulePath, customModule);

      // Verify custom module configuration
      const moduleContent = fs.readFileSync(modulePath, 'utf8');
      expect(moduleContent).toContain('EmailService');
      expect(moduleContent).toContain('SmsService');
      expect(moduleContent).toContain('AuditMiddleware');
      expect(moduleContent).toContain('configure(consumer: MiddlewareConsumer)');
    });
  });
});

// Helper function to create files from templates
function createFilesFromTemplates(templates: any[], testDir: string, baseOnly = false) {
  for (const template of templates) {
    if (baseOnly && !template.path.includes('/base/')) {
      continue; // Skip non-base files when regenerating base only
    }

    const fullPath = path.join(testDir, template.path.replace('secondary-dev-test/', ''));
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, template.content);
  }
}
