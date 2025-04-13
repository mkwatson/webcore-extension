/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  moduleNameMapper: {
    // Handle module aliases, especially Plasmo's '~'
    '^~/(.*)$': '<rootDir>/packages/extension/src/$1',
    // Handle workspace package imports
    '^@webcore/shared$': '<rootDir>/packages/shared/src/index.ts', // Point directly to source for tests
    // Add other aliases if needed
  },
  // Optionally specify projects for monorepo testing
  // projects: ['<rootDir>/packages/*'],
  // Ignore backend tests for now as they might need a different env
  testPathIgnorePatterns: ['<rootDir>/packages/backend/'],
}
