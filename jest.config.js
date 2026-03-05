module.exports = {
  displayName: 'Secure Task Management System',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/libs'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  testPathIgnorePatterns: ['.*/.*\\.e2e\\.spec\\.ts$'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    'apps/**/*.{ts,tsx}',
    'libs/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.config.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.spec.ts',
    '!**/*.test.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@data(.*)$': '<rootDir>/libs/data/src$1',
    '^@auth(.*)$': '<rootDir>/libs/auth/src$1',
  },
  testTimeout: 10000,
  verbose: true,
}; 