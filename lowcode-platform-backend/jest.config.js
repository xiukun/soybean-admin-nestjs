module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@entity/(.*)$': '<rootDir>/lib/bounded-contexts/entity/$1',
    '^@api/(.*)$': '<rootDir>/lib/bounded-contexts/api/$1',
    '^@codegen/(.*)$': '<rootDir>/lib/bounded-contexts/codegen/$1',
    '^@project/(.*)$': '<rootDir>/lib/bounded-contexts/project/$1',
    '^@shared/(.*)$': '<rootDir>/lib/shared/$1',
    '^@config/(.*)$': '<rootDir>/lib/config/$1',
    '^@utils/(.*)$': '<rootDir>/lib/utils/$1',
  },
};
