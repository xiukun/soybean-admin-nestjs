import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { Entity } from '@entity/domain/entity.model';
import { Project } from '@project/domain/project.model';
import { Relationship, RelationshipType } from '@lib/bounded-contexts/relationship/domain/relationship.model';
import { CodegenTask, CodegenTaskType } from '@codegen/domain/codegen-task.model';

/**
 * Test data factories for creating test objects
 */
export class TestDataFactory {
  /**
   * Create a test project
   */
  static createProject(overrides: Partial<any> = {}): Project {
    return Project.create({
      name: 'Test Project',
      description: 'A test project',
      // type: 'web', // 移除不存在的字段
      config: { framework: 'react' },
      createdBy: 'test-user',
      ...overrides,
    });
  }

  /**
   * Create a test entity
   */
  static createEntity(overrides: Partial<any> = {}): Entity {
    return Entity.create({
      projectId: 'test-project-id',
      name: 'Test Entity',
      code: 'testEntity',
      tableName: 'test_entities',
      description: 'A test entity',
      category: 'core',
      createdBy: 'test-user',
      ...overrides,
    });
  }

  /**
   * Create multiple test entities
   */
  static createEntities(count: number, baseOverrides: Partial<any> = {}): Entity[] {
    return Array.from({ length: count }, (_, i) =>
      this.createEntity({
        name: `Test Entity ${i + 1}`,
        code: `testEntity${i + 1}`,
        tableName: `test_entities_${i + 1}`,
        ...baseOverrides,
      })
    );
  }

  /**
   * Create a test relationship
   */
  static createRelationship(overrides: Partial<any> = {}): Relationship {
    return Relationship.create({
      projectId: 'test-project-id',
      name: 'Test Relationship',
      code: 'testRelationship',
      type: RelationshipType.ONE_TO_MANY,
      sourceEntityId: 'source-entity-id',
      targetEntityId: 'target-entity-id',
      description: 'A test relationship',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      createdBy: 'test-user',
      ...overrides,
    });
  }

  /**
   * Create a test codegen task
   */
  static createCodegenTask(overrides: Partial<any> = {}): CodegenTask {
    return CodegenTask.create({
      projectId: 'test-project-id',
      name: 'Test Code Generation',
      type: CodegenTaskType.API,
      config: { entities: ['User'], framework: 'nestjs' },
      createdBy: 'test-user',
      ...overrides,
    });
  }

  /**
   * Create test data for API requests
   */
  static createProjectDto(overrides: Partial<any> = {}) {
    return {
      name: 'Test Project',
      description: 'A test project',
      type: 'web',
      config: { framework: 'react' },
      ...overrides,
    };
  }

  static createEntityDto(overrides: Partial<any> = {}) {
    return {
      projectId: 'test-project-id',
      name: 'Test Entity',
      code: 'testEntity',
      tableName: 'test_entities',
      description: 'A test entity',
      category: 'core',
      ...overrides,
    };
  }

  static createRelationshipDto(overrides: Partial<any> = {}) {
    return {
      projectId: 'test-project-id',
      name: 'Test Relationship',
      code: 'testRelationship',
      type: 'ONE_TO_MANY',
      sourceEntityId: 'source-entity-id',
      targetEntityId: 'target-entity-id',
      description: 'A test relationship',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      ...overrides,
    };
  }
}

/**
 * Database test utilities
 */
export class DatabaseTestUtils {
  constructor(private prisma: PrismaService) {}

  /**
   * Clean all test data from database
   */
  async cleanDatabase(): Promise<void> {
    await this.prisma.entity.deleteMany();
    await this.prisma.project.deleteMany();
    // Add other cleanup operations as needed
  }

  /**
   * Create a test project in database
   */
  async createTestProject(data: Partial<any> = {}): Promise<any> {
    return this.prisma.project.create({
      data: {
        name: 'Test Project',
        code: 'test-project',
        description: 'A test project',
        // type: 'web', // 移除不存在的字段
        status: 'ACTIVE',
        config: {},
        createdBy: 'test-user',
        ...data,
      },
    });
  }

  /**
   * Create a test entity in database
   */
  async createTestEntity(projectId: string, data: Partial<any> = {}): Promise<any> {
    return this.prisma.entity.create({
      data: {
        projectId,
        name: 'Test Entity',
        code: 'testEntity',
        tableName: 'test_entities',
        description: 'A test entity',
        category: 'core',
        status: 'DRAFT',
        createdBy: 'test-user',
        ...data,
      },
    });
  }

  /**
   * Create multiple test entities in database
   */
  async createTestEntities(projectId: string, count: number): Promise<any[]> {
    const entities = [];
    for (let i = 0; i < count; i++) {
      entities.push({
        projectId,
        name: `Test Entity ${i + 1}`,
        code: `testEntity${i + 1}`,
        tableName: `test_entities_${i + 1}`,
        description: `Test entity ${i + 1}`,
        category: i % 2 === 0 ? 'core' : 'business',
        status: 'DRAFT',
        createdBy: 'test-user',
      });
    }

    await this.prisma.entity.createMany({ data: entities });
    
    return this.prisma.entity.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    projectCount: number;
    entityCount: number;
    relationshipCount: number;
  }> {
    const [projectCount, entityCount] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.entity.count(),
    ]);
    const relationshipCount = 0; // 暂时设为 0，等 Prisma schema 更新

    return { projectCount, entityCount, relationshipCount };
  }
}

/**
 * Application test utilities
 */
export class AppTestUtils {
  static async createTestApp(moduleMetadata: any): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule(moduleMetadata).compile();
    
    const app = moduleFixture.createNestApplication();
    await app.init();
    
    return app;
  }

  static async closeTestApp(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }
}

/**
 * Mock utilities
 */
export class MockUtils {
  /**
   * Create a mock repository
   */
  static createMockRepository() {
    return {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findByProjectId: jest.fn(),
      findPaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      existsByCode: jest.fn(),
      existsByTableName: jest.fn(),
      existsBetweenEntities: jest.fn(),
    };
  }

  /**
   * Create a mock command bus
   */
  static createMockCommandBus() {
    return {
      execute: jest.fn(),
    };
  }

  /**
   * Create a mock query bus
   */
  static createMockQueryBus() {
    return {
      execute: jest.fn(),
    };
  }

  /**
   * Create a mock Prisma service
   */
  static createMockPrismaService() {
    return {
      project: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      entity: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      relationship: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
      $queryRaw: jest.fn(),
      $disconnect: jest.fn(),
    };
  }
}

/**
 * Test assertion utilities
 */
export class AssertionUtils {
  /**
   * Assert that an object has the expected properties
   */
  static assertObjectProperties(obj: any, expectedProperties: string[]): void {
    expectedProperties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  }

  /**
   * Assert that a response has the expected structure
   */
  static assertApiResponse(response: any, expectedStatus: number, expectedProperties?: string[]): void {
    expect(response.status).toBe(expectedStatus);
    
    if (expectedProperties) {
      this.assertObjectProperties(response.body, expectedProperties);
    }
  }

  /**
   * Assert that an array has the expected length and all items have expected properties
   */
  static assertArrayResponse(array: any[], expectedMinLength: number, expectedProperties?: string[]): void {
    expect(Array.isArray(array)).toBe(true);
    expect(array.length).toBeGreaterThanOrEqual(expectedMinLength);
    
    if (expectedProperties && array.length > 0) {
      array.forEach(item => {
        this.assertObjectProperties(item, expectedProperties);
      });
    }
  }

  /**
   * Assert that a paginated response has the correct structure
   */
  static assertPaginatedResponse(response: any, expectedProperties?: string[]): void {
    expect(response).toHaveProperty('data');
    expect(response).toHaveProperty('total');
    expect(response).toHaveProperty('page');
    expect(response).toHaveProperty('limit');
    expect(response).toHaveProperty('totalPages');
    
    expect(Array.isArray(response.data)).toBe(true);
    expect(typeof response.total).toBe('number');
    expect(typeof response.page).toBe('number');
    expect(typeof response.limit).toBe('number');
    expect(typeof response.totalPages).toBe('number');
    
    if (expectedProperties && response.data.length > 0) {
      response.data.forEach((item: any) => {
        this.assertObjectProperties(item, expectedProperties);
      });
    }
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceUtils {
  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return { result, duration };
  }

  /**
   * Run a function multiple times and get average execution time
   */
  static async measureAverageExecutionTime<T>(
    fn: () => Promise<T>, 
    iterations: number = 10
  ): Promise<{ averageDuration: number; minDuration: number; maxDuration: number }> {
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = await this.measureExecutionTime(fn);
      durations.push(duration);
    }
    
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    return { averageDuration, minDuration, maxDuration };
  }

  /**
   * Assert that execution time is within acceptable limits
   */
  static assertExecutionTime(duration: number, maxDuration: number, operation: string): void {
    expect(duration).toBeLessThan(maxDuration);
    console.log(`${operation} completed in ${duration}ms (limit: ${maxDuration}ms)`);
  }
}

/**
 * Random data generators
 */
export class RandomDataGenerator {
  static randomString(length: number = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomCode(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static randomEmail(): string {
    return `${this.randomString(8)}@${this.randomString(5)}.com`;
  }

  static randomNumber(min: number = 1, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static randomBoolean(): boolean {
    return Math.random() < 0.5;
  }

  static randomArrayElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
