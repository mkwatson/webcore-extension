// NOTE: This is a simplified test setup. A more robust solution might use JSDOM
// for better document/DOM mocking, but this demonstrates the principle.

// Import the function to test directly
import { extractReadableContent } from "./extract-content";

// Mock the necessary parts of the DOM and Readability/Turndown
const mockTurndown = jest.fn((html) => `MARKDOWN: ${html}`);
jest.mock('turndown', () => {
  return jest.fn().mockImplementation(() => {
    return { turndown: mockTurndown };
  });
});

// Mock Readability - adjust based on what extractReadableContent needs
const mockParse = jest.fn();
jest.mock('@mozilla/readability', () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: mockParse,
  })),
}));

// Mock global document - basic structure
global.document = {
  cloneNode: jest.fn(() => global.document), // Simple mock, might need refinement
  title: 'Original Document Title',
  // Add other document properties if needed by Readability mock
} as any;

global.window = {
  location: {
    href: 'http://example.com/test'
  }
} as any;

beforeEach(() => {
  // Reset mocks before each test
  mockParse.mockReset();
  mockTurndown.mockClear();

  // Set default successful parse for most tests
  mockParse.mockReturnValue({
    title: 'Parsed Title',
    content: '<p>Parsed Content</p>',
    // other Readability properties if needed
  });

  // Reset document/window mocks if necessary (though simple mocks might not need it)
  global.document.title = 'Original Document Title';
  global.window.location.href = 'http://example.com/test';
});

describe('extractReadableContent', () => {

  test('should return extracted content on successful parse', () => {
    const result = extractReadableContent();
    expect(result).toEqual({
      title: 'Parsed Title',
      markdownContent: 'MARKDOWN: <p>Parsed Content</p>', // Based on mockTurndown
      url: 'http://example.com/test',
    });
    expect(mockParse).toHaveBeenCalledTimes(1);
    expect(mockTurndown).toHaveBeenCalledWith('<p>Parsed Content</p>');
  });

  test('should return error if Readability parse throws', () => {
    mockParse.mockImplementation(() => { throw new Error('Parse Error'); });
    const result = extractReadableContent();
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('Readability');
    }
  });

  test('should return error if Readability returns null article', () => {
    mockParse.mockReturnValue(null);
    const result = extractReadableContent();
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('extract main content');
    }
  });

  test('should return error if article content is empty', () => {
    // Note: Testing the null check added earlier
    mockParse.mockReturnValue({ title: 'Test Title', content: null });
    const result = extractReadableContent();
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('content is empty');
    }
  });

  test('should return error if Turndown fails', () => {
    mockTurndown.mockImplementation(() => { throw new Error('Turndown Error'); });
    const result = extractReadableContent();
    expect(result).toHaveProperty('error');
    if ('error' in result) {
      expect(result.error).toContain('Markdown');
    }
  });

  test('should use document.title as fallback if Readability title is missing', () => {
    mockParse.mockReturnValue({ title: null, content: '<p>Content</p>' });
    const result = extractReadableContent();
    expect(result).toEqual({
      title: 'Original Document Title', // From mocked document
      markdownContent: 'MARKDOWN: <p>Content</p>',
      url: 'http://example.com/test',
    });
  });
}); 