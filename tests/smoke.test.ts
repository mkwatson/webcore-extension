import '../tests/mocks/chrome';

describe('Extension Initialization', () => {
  test('Extension environment is set up', () => {
    // Using any type to avoid TypeScript errors with the mocked chrome API
    const chromeMock = (global as any).chrome;
    expect(chromeMock).toBeDefined();
    expect(chromeMock.runtime).toBeDefined();
    expect(chromeMock.storage).toBeDefined();
  });
}); 