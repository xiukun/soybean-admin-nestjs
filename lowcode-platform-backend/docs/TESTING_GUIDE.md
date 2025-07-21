# Testing Guide for Enhanced Code Generation System

## Overview

This guide covers comprehensive testing strategies for the enhanced code generation system, including unit tests, integration tests, and end-to-end tests.

## Test Structure

```
test/
├── unit/                           # Unit tests
│   ├── metadata-aggregator.service.spec.ts
│   ├── intelligent-code-generator.service.spec.ts
│   └── template-engine.service.spec.ts
├── integration/                    # Integration tests
│   ├── code-generation.integration.spec.ts
│   ├── metadata-aggregation.integration.spec.ts
│   └── template-rendering.integration.spec.ts
├── e2e/                           # End-to-end tests
│   ├── lowcode-platform.e2e-spec.ts
│   └── code-generation-workflow.e2e-spec.ts
├── utils/                         # Test utilities
│   └── test-helpers.ts
├── setup.ts                       # Global test setup
└── jest-e2e.json                 # Jest E2E configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

### Watch Mode
```bash
npm run test:watch
```

## Unit Testing

### MetadataAggregatorService Tests

Tests cover:
- Project metadata retrieval with default fields
- Entity metadata enhancement
- Field categorization
- Caching mechanisms
- Validation logic
- Error handling

**Example Test:**
```typescript
describe('getProjectMetadata', () => {
  it('should return project metadata with default fields', async () => {
    // Arrange
    mockPrismaService.project.findUnique.mockResolvedValue(mockProject);
    mockPrismaService.$queryRaw.mockResolvedValue([mockEntity]);

    // Act
    const result = await service.getProjectMetadata('test-project-1', false);

    // Assert
    expect(result.entities[0].fields).toContain(
      expect.objectContaining({ code: 'id', isPrimaryKey: true })
    );
  });
});
```

### IntelligentCodeGeneratorService Tests

Tests cover:
- File generation workflow
- Template variable validation
- Field categorization logic
- Template context building
- Error handling scenarios

**Example Test:**
```typescript
describe('generateFiles', () => {
  it('should generate files with enhanced field categorization', async () => {
    // Arrange
    const generationRequest = { /* ... */ };
    mockTemplateEngine.compileTemplateFromString.mockImplementation((template, context) => {
      expect(context.searchableFields).toBeDefined();
      expect(context.filterableFields).toBeDefined();
      return Promise.resolve('generated content');
    });

    // Act
    const result = await service.generateFiles(generationRequest);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].content).toContain('generated content');
  });
});
```

## Integration Testing

### Code Generation Integration Tests

Tests the complete code generation workflow:

```typescript
describe('Code Generation Integration', () => {
  it('should generate complete CRUD service', async () => {
    // Create test project, entity, and template
    const project = await createTestProject();
    const entity = await createTestEntity(project.id);
    const template = await createTestTemplate(project.id);

    // Generate code
    const result = await codeGeneratorService.generateFiles({
      projectId: project.id,
      templateIds: [template.id],
      entityIds: [entity.id],
      variables: { entityName: 'TestUser' },
      options: { architecture: 'base-biz', framework: 'nestjs' }
    });

    // Verify generated files
    expect(result).toHaveLength(1);
    expect(result[0].content).toContain('TestUserService');
    expect(result[0].content).toContain('findAll');
    expect(result[0].content).toContain('findById');
  });
});
```

### Metadata Aggregation Integration Tests

Tests metadata retrieval and enhancement:

```typescript
describe('Metadata Aggregation Integration', () => {
  it('should aggregate complete project metadata', async () => {
    // Create test data
    const project = await createTestProject();
    const entity = await createTestEntityWithFields(project.id);

    // Get metadata
    const metadata = await metadataService.getProjectMetadata(project.id);

    // Verify metadata structure
    expect(metadata.project).toBeDefined();
    expect(metadata.entities).toHaveLength(1);
    expect(metadata.entities[0].fields).toContain(
      expect.objectContaining({ code: 'id', isPrimaryKey: true })
    );
  });
});
```

## End-to-End Testing

### Complete Workflow Tests

Tests the entire system through HTTP APIs:

```typescript
describe('Code Generation E2E', () => {
  it('should complete full generation workflow', async () => {
    // Create project
    const projectResponse = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(testProjectData)
      .expect(201);

    // Create entity
    const entityResponse = await request(app.getHttpServer())
      .post('/api/v1/entities')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ ...testEntityData, projectId: projectResponse.body.data.id })
      .expect(201);

    // Generate code
    const generationResponse = await request(app.getHttpServer())
      .post('/api/v1/code-generation/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        projectId: projectResponse.body.data.id,
        templateIds: [testTemplateId],
        entityIds: [entityResponse.body.data.id],
        variables: { entityName: 'TestUser' },
        options: { architecture: 'base-biz', framework: 'nestjs' }
      })
      .expect(201);

    // Verify generation result
    expect(generationResponse.body.success).toBe(true);
    expect(generationResponse.body.generatedFiles).toHaveLength(1);
  });
});
```

## Test Data Management

### Test Helpers

Utility functions for creating test data:

```typescript
export class TestDataHelper {
  static createTestProject(overrides = {}) {
    return {
      name: 'Test Project',
      code: 'test-project',
      description: 'Test project description',
      ...overrides
    };
  }

  static createTestEntity(projectId: string, overrides = {}) {
    return {
      projectId,
      name: 'TestUser',
      code: 'TestUser',
      tableName: 'test_users',
      description: 'Test user entity',
      category: 'business',
      ...overrides
    };
  }

  static createTestFields(entityId: string) {
    return [
      {
        entityId,
        name: 'Name',
        code: 'name',
        type: 'STRING',
        length: 100,
        nullable: false,
        sortOrder: 1
      },
      {
        entityId,
        name: 'Email',
        code: 'email',
        type: 'STRING',
        length: 255,
        nullable: false,
        uniqueConstraint: true,
        sortOrder: 2
      }
    ];
  }
}
```

### Database Test Utilities

Helper functions for database operations in tests:

```typescript
export class DatabaseTestUtils {
  constructor(private prisma: PrismaService) {}

  async cleanDatabase(): Promise<void> {
    await this.prisma.field.deleteMany();
    await this.prisma.entity.deleteMany();
    await this.prisma.codeTemplate.deleteMany();
    await this.prisma.project.deleteMany();
  }

  async createTestProject(data = {}): Promise<any> {
    return this.prisma.project.create({
      data: {
        ...TestDataHelper.createTestProject(),
        createdBy: 'test-user',
        ...data
      }
    });
  }

  async createTestEntity(projectId: string, data = {}): Promise<any> {
    return this.prisma.entity.create({
      data: {
        ...TestDataHelper.createTestEntity(projectId),
        createdBy: 'test-user',
        ...data
      }
    });
  }
}
```

## Mock Strategies

### Service Mocking

Mock external dependencies for isolated testing:

```typescript
const mockMetadataService = {
  getProjectMetadata: jest.fn(),
  getEntityMetadata: jest.fn(),
  validateEntityStructure: jest.fn(),
  invalidateProjectCache: jest.fn(),
  invalidateEntityCache: jest.fn(),
};

const mockTemplateEngine = {
  compileTemplateFromString: jest.fn(),
  registerPartial: jest.fn(),
  loadPartials: jest.fn(),
};
```

### Database Mocking

Mock Prisma service for unit tests:

```typescript
const mockPrismaService = {
  project: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  entity: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
};
```

## Test Configuration

### Jest Configuration

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.dto.ts"
  ],
  "coverageDirectory": "./coverage",
  "coverageReporters": ["text", "lcov", "html"],
  "setupFilesAfterEnv": ["<rootDir>/test/setup.ts"],
  "testTimeout": 30000
}
```

### Environment Setup

Test environment configuration:

```typescript
// test/setup.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/lowcode_test';
process.env.JWT_SECRET = 'test-jwt-secret';

jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  mockDate: (date: string | Date) => {
    const mockDate = new Date(date);
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  },
  restoreDate: () => {
    jest.restoreAllMocks();
  },
};
```

## Coverage Requirements

### Minimum Coverage Thresholds

```json
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    },
    "src/lib/bounded-contexts/code-generation/": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    },
    "src/lib/bounded-contexts/metadata/": {
      "branches": 85,
      "functions": 85,
      "lines": 85,
      "statements": 85
    }
  }
}
```

## Performance Testing

### Load Testing

Test system performance under load:

```typescript
describe('Performance Tests', () => {
  it('should handle multiple concurrent generations', async () => {
    const promises = Array.from({ length: 10 }, () =>
      codeGeneratorService.generateFiles(testGenerationRequest)
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should cache metadata efficiently', async () => {
    // First call - populate cache
    const start1 = Date.now();
    await metadataService.getProjectMetadata('test-project', true);
    const duration1 = Date.now() - start1;

    // Second call - use cache
    const start2 = Date.now();
    await metadataService.getProjectMetadata('test-project', true);
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(duration1 * 0.1); // Cached call should be 10x faster
  });
});
```

## Continuous Integration

### GitHub Actions Configuration

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: lowcode_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/lowcode_test
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/lowcode_test
      
      - name: Run e2e tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/lowcode_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Best Practices

### Test Organization
1. Group related tests in describe blocks
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Keep tests focused and isolated
5. Use proper setup and teardown

### Mock Management
1. Reset mocks between tests
2. Use specific mock implementations
3. Verify mock calls when relevant
4. Avoid over-mocking
5. Mock at the right level

### Data Management
1. Use test-specific data
2. Clean up after tests
3. Use factories for test data
4. Avoid shared mutable state
5. Use realistic test data

### Performance
1. Run tests in parallel when possible
2. Use database transactions for isolation
3. Cache expensive operations
4. Profile slow tests
5. Optimize test setup/teardown

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase Jest timeout
- Check for unresolved promises
- Verify database connections

**Flaky tests:**
- Check for race conditions
- Ensure proper cleanup
- Verify mock implementations

**Low coverage:**
- Add missing test cases
- Test error scenarios
- Cover edge cases

**Slow tests:**
- Profile test execution
- Optimize database operations
- Use appropriate mocking

### Debug Mode

Enable debug logging for tests:
```bash
DEBUG=true npm test
```

## Contributing

When adding new tests:

1. Follow existing patterns
2. Add both positive and negative test cases
3. Include integration tests for new features
4. Update documentation
5. Ensure good test coverage
