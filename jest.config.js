module.exports = {
  displayName: 'Secure Task Management System',
  preset: 'ts-jest',
  testEnvironment: 'node',
  // For root Jest coverage we focus on backend (api) + shared libs; Angular app uses its own Jest preset via Nx.
  roots: ['<rootDir>/apps/api', '<rootDir>/libs'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  // Ignore e2e specs and Angular dashboard tests here
  testPathIgnorePatterns: ['.*/.*\\.e2e\\.spec\\.ts$', '<rootDir>/apps/dashboard/'],
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
    'apps/api/**/*.{ts,tsx}',
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
  // Map TS path aliases used in Nest API and auth libs
  moduleNameMapper: {
    '^@data(.*)$': '<rootDir>/libs/data/src$1',
    '^@auth(.*)$': '<rootDir>/libs/auth/src$1',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  testTimeout: 10000,
  verbose: true,
}; 