// packages/extension/jest.setup.ts

// Add NodeJS types for global references
/// <reference types="node" />

// Mock the chrome API globally for Jest tests
// We use a simplified mock for the Chrome API in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
  // Add other chrome namespaces if needed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any // Using any for simplicity in tests

// This makes TypeScript treat this file as a module
export {}
