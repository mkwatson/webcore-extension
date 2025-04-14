// NOTE: This is a simplified test setup. A more robust solution might use JSDOM
// for better document/DOM mocking, but this demonstrates the principle.

// Import the function to test directly
import { extractReadableContent } from "./extract-content"

// Mock the necessary parts of the DOM and Readability/Turndown
const mockTurndown = jest.fn((html) => `MARKDOWN: ${html}`)
jest.mock("turndown", () => {
  return jest.fn().mockImplementation(() => {
    return { turndown: mockTurndown }
  })
})

// Mock Readability - adjust based on what extractReadableContent needs
const mockParse = jest.fn()
jest.mock("@mozilla/readability", () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: mockParse
  }))
}))

// Mock global document - providing a partial type to avoid 'any'
global.document = {
  cloneNode: jest.fn(() => global.document),
  title: "Original Document Title"
  // We only mock the parts used by the function under test
} as unknown as Document // Use 'as unknown as Document' for stricter type casting

// Mock global window - providing a partial type
global.window = {
  location: {
    href: "http://example.com/test"
  }
} as unknown as Window & typeof globalThis // Use 'as unknown as Window...' for stricter type casting

// Default test URL for consistent testing
const TEST_URL = "http://example.com/test"

beforeEach(() => {
  // Reset mocks before each test
  mockParse.mockReset()
  mockTurndown.mockReset()

  // Set default mock behaviors
  mockTurndown.mockImplementation((html) => `MARKDOWN: ${html}`)
  mockParse.mockReturnValue({
    title: "Parsed Title",
    content: "<p>Parsed Content</p>"
    // other Readability properties if needed
  })

  // Reset document/window mocks
  global.document.title = "Original Document Title"
})

describe("extractReadableContent", () => {
  test("should return extracted content on successful parse", () => {
    const result = extractReadableContent({ testUrl: TEST_URL })
    expect(result).toEqual({
      title: "Parsed Title",
      markdownContent: "MARKDOWN: <p>Parsed Content</p>", // Based on mockTurndown
      url: TEST_URL
    })
    expect(mockParse).toHaveBeenCalledTimes(1)
    expect(mockTurndown).toHaveBeenCalledWith("<p>Parsed Content</p>")
  })

  test("should return error if Readability parse throws", () => {
    mockParse.mockImplementation(() => {
      throw new Error("Parse Error")
    })
    const result = extractReadableContent({ testUrl: TEST_URL })
    expect(result).toHaveProperty("error")
    if ("error" in result) {
      expect(result.error).toContain("Readability")
    }
  })

  test("should return error if Readability returns null article", () => {
    mockParse.mockReturnValue(null)
    const result = extractReadableContent({ testUrl: TEST_URL })
    expect(result).toHaveProperty("error")
    if ("error" in result) {
      expect(result.error).toContain("extract main content")
    }
  })

  test("should return error if article content is empty", () => {
    mockParse.mockReturnValue({ title: "Test Title", content: null })
    const result = extractReadableContent({ testUrl: TEST_URL })
    expect(result).toHaveProperty("error")
    if ("error" in result) {
      expect(result.error).toContain("content is empty")
    }
  })

  test("should return error if Turndown fails", () => {
    mockTurndown.mockImplementation(() => {
      throw new Error("Turndown Error")
    })
    const result = extractReadableContent({ testUrl: TEST_URL })
    expect(result).toHaveProperty("error")
    if ("error" in result) {
      expect(result.error).toContain("Markdown")
    }
  })

  test("should use document.title as fallback if Readability title is missing", () => {
    mockParse.mockReturnValue({ title: null, content: "<p>Content</p>" })
    const result = extractReadableContent({ testUrl: TEST_URL })
    expect(result).toEqual({
      title: "Original Document Title", // From mocked document
      markdownContent: "MARKDOWN: <p>Content</p>",
      url: TEST_URL
    })
  })
})
