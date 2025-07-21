module.exports = {
  displayName: 'Low-code Platform Backend',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  // Test file patterns
  testMatch: [
    '<rootDir>/test/**/*.spec.ts',
    '<rootDir>/test/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts'
  ],

  // Transform configuration
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // Module resolution
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@views/(.*)$': '<rootDir>/src/views/$1',
    '^@resources/(.*)$': '<rootDir>/src/resources/$1',
    '^@entity/(.*)$': '<rootDir>/src/lib/bounded-contexts/entity/$1',
    '^@api-context/(.*)$': '<rootDir>/src/lib/bounded-contexts/api/$1',
    '^@codegen/(.*)$': '<rootDir>/src/lib/bounded-contexts/codegen/$1',
    '^@project/(.*)$': '<rootDir>/src/lib/bounded-contexts/project/$1',
    '^@code-generation/(.*)$': '<rootDir>/src/lib/code-generation/$1',
    '^@shared/(.*)$': '<rootDir>/src/lib/shared/$1',
    '^@config/(.*)$': '<rootDir>/src/lib/config/$1',
    '^@utils/(.*)$': '<rootDir>/src/lib/utils/$1',
    '^@controllers/(.*)$': '<rootDir>/src/lib/shared/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/lib/shared/services/$1',
    '^@middleware/(.*)$': '<rootDir>/src/lib/shared/middleware/$1',
    '^@decorators/(.*)$': '<rootDir>/src/lib/shared/decorators/$1',
    '^@interceptors/(.*)$': '<rootDir>/src/lib/shared/interceptors/$1',
    '^@dto/(.*)$': '<rootDir>/src/lib/shared/dto/$1',
    '^@prisma/(.*)$': '<rootDir>/src/lib/shared/prisma/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@test-utils/(.*)$': '<rootDir>/test/utils/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test timeout
  testTimeout: 30000,

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/*.spec.ts',
        '<rootDir>/test/unit/**/*.spec.ts'
      ],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/test/integration/**/*.spec.ts'
      ],
      testEnvironment: 'node',
    },
    {
      displayName: 'e2e',
      testMatch: [
        '<rootDir>/test/e2e/**/*.spec.ts'
      ],
      testEnvironment: 'node',
    },
    {
      displayName: 'performance',
      testMatch: [
        '<rootDir>/test/performance/**/*.spec.ts'
      ],
      testEnvironment: 'node',
      testTimeout: 60000,
    }
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Error handling
  errorOnDeprecated: true,

  // Module file extensions
  moduleFileExtensions: ['js', 'json', 'ts'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/'
  ],

  // Force exit after tests complete
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Max workers for parallel execution
  maxWorkers: '50%',
};
