module.exports = {
  preset: "ts-jest", // Use ts-jest preset
  testEnvironment: "jsdom", // Use jsdom for browser-like environment (for React Testing Library)
  // Add a setup file for global mocks (like chrome API)
  setupFilesAfterEnv: [
    "@testing-library/jest-dom",
    "<rootDir>/jest.setup.ts" // Use .ts extension
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"
    // If you use path aliases in your src files that Jest needs to understand
    // Example:
    // '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    // '^~/(.*)$': '<rootDir>/src/$1',
    // For now, we don't strictly need this as imports are relative or node_modules
  },
  // Specify roots to prevent Jest from looking outside the package unnecessarily
  // (adjust if needed, but usually src is sufficient for unit/component tests)
  roots: ["<rootDir>/src"],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  testEnvironmentOptions: {
    // url: 'http://example.com/test', // Let tests set their own URL via mocks if needed
  }
}
