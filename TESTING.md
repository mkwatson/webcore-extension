# Testing Strategy

This document outlines our approach to testing the WebCore Extension.

## Test Categories

### Unit Tests
- Test individual functions and components in isolation
- Mock all Chrome APIs and external dependencies
- Focus on core business logic

### Integration Tests
- Test interactions between different parts of the extension
- Test communication between background scripts and content scripts
- Test storage interactions

### E2E Tests (Future)
- Test complete user workflows in a real browser environment
- Use Playwright to automate browser interactions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Best Practices

1. **Test Function, Not Implementation**
   - Focus on behavior, not implementation details
   - Tests should still pass after refactoring

2. **Mock Chrome APIs**
   - Always mock Chrome APIs to avoid browser dependencies
   - Create realistic mock responses

3. **Test Organization**
   - Mirror source code structure in test files
   - Name tests descriptively: `[component].[functionality].test.ts`

## Example: Testing a Background Script Function

```typescript
// background.ts
export function processData(data: any[]) {
  return data.map(item => ({ ...item, processed: true }));
}

// background.test.ts
import { processData } from './background';

describe('processData', () => {
  test('adds processed flag to all items', () => {
    const testData = [{ id: 1 }, { id: 2 }];
    const result = processData(testData);
    expect(result).toEqual([
      { id: 1, processed: true },
      { id: 2, processed: true }
    ]);
  });
});
```

## Example: Testing Message Passing

```typescript
// When testing functions that use Chrome API:
import '../mocks/chrome';
import { handleMessage } from './messaging';

describe('handleMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('responds to getData message', () => {
    const mockCallback = jest.fn();
    handleMessage({ type: 'getData' }, {}, mockCallback);
    
    expect(mockCallback).toHaveBeenCalledWith({ success: true, data: expect.any(Array) });
  });
}); 