import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { act } from "react-dom/test-utils" // Add explicit import for act

import "@testing-library/jest-dom" // Import jest-dom matchers

import { useFirebase } from "./firebase/hook"
import IndexSidePanel from "./sidepanel"
import { sendToBackground } from "@plasmohq/messaging" // Ensure this is imported

// Mock the useFirebase hook
// We need jest.fn() for functions like onLogin/onLogout to satisfy the type
const mockLogin = jest.fn()
const mockLogout = jest.fn()

// Explicitly type the mock implementation
jest.mock("./firebase/hook", () => ({
  useFirebase: jest.fn(() => ({
    user: null,
    isLoading: false,
    error: null,
    onLogin: mockLogin,
    onLogout: mockLogout
  }))
}))

// Mock the Plasmo messaging function
jest.mock("@plasmohq/messaging", () => ({
  sendToBackground: jest.fn()
}))

// Helper function to simulate streaming responses
const simulateStreamingResponse = async (
  mockPort: {
    postMessage: jest.Mock;
    onMessage: { addListener: jest.Mock };
    onDisconnect: { addListener: jest.Mock };
    disconnect: jest.Mock;
  }, 
  text: string
) => {
  // Get the message listener that was registered
  const messageListener = mockPort.onMessage.addListener.mock.calls[0][0];
  
  // First send a chunk with content
  await act(async () => {
    messageListener({chunk: `data: {"content":"${text}"}\n\n`});
    // Small delay to let React process the state update
    await new Promise(r => setTimeout(r, 0));
  });
  
  // Then send done signal
  await act(async () => {
    messageListener({done: true});
    await new Promise(r => setTimeout(r, 0));
  });
};

// Helper to reset mock state before each test
beforeEach(() => {
  // Reset the mock implementation before each test
  ;(useFirebase as jest.Mock).mockImplementation(() => ({
    user: null,
    isLoading: false,
    error: null,
    onLogin: mockLogin,
    onLogout: mockLogout
  }))
  // Clear any previous calls to mock functions
  mockLogin.mockClear()
  mockLogout.mockClear()
  
  // Reset the sendToBackground mock with a default implementation
  ;(sendToBackground as jest.Mock).mockReset()
  ;(sendToBackground as jest.Mock).mockImplementation(() => {
    return Promise.resolve({
      type: "GET_CONTENT_RESPONSE",
      payload: {
        title: "Test Page Title",
        markdownContent: "This is the page content.",
        url: "http://example.com"
      }
    })
  })
  
  // Reset any Chrome API mocks that might have been modified
  if (global.chrome?.runtime?.connect) {
    (global.chrome.runtime.connect as jest.Mock).mockReset();
    (global.chrome.runtime.connect as jest.Mock).mockImplementation(() => {
      const port = {
        postMessage: jest.fn(),
        onMessage: { addListener: jest.fn() },
        onDisconnect: { addListener: jest.fn() },
        disconnect: jest.fn()
      };
      return port;
    });
  }
})

// Add the prompt constant at the top level of the test file for reuse
const SUMMARIZE_PROMPT_TEMPLATE =
  "Please provide a concise summary of the content I've shared, clearly highlighting the main points and key takeaways in one short paragraph."

describe("IndexSidePanel Component", () => {
  test("renders Sign In button when logged out", async () => {
    await act(async () => {
      render(<IndexSidePanel />)
    })
    
    // Check if the Sign In button is present
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument()
    // Check if Sign Out button is NOT present
    expect(
      screen.queryByRole("button", { name: /sign out/i })
    ).not.toBeInTheDocument()
  })

  test("renders loading state", async () => {
    // Override the mock implementation for this specific test
    ;(useFirebase as jest.Mock).mockImplementation(() => ({
      user: null,
      isLoading: true,
      error: null,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))
    
    await act(async () => {
      render(<IndexSidePanel />)
    })
    
    // Use getAllByText and check that at least one exists
    const loadingElements = screen.getAllByText(/loading.../i)
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  test("renders error state", async () => {
    const errorMessage = "Failed to authenticate"
    ;(useFirebase as jest.Mock).mockImplementation(() => ({
      user: null,
      isLoading: false,
      error: errorMessage,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))
    
    await act(async () => {
      render(<IndexSidePanel />)
    })
    
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
  })

  test("renders user information and Sign Out button when logged in", async () => {
    const mockUser = {
      displayName: "Test User",
      email: "test@example.com",
      uid: "12345"
      // Add other necessary user properties if your hook/component uses them
    }
    ;(useFirebase as jest.Mock).mockImplementation(() => ({
      user: mockUser,
      isLoading: false,
      error: null,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))

    await act(async () => {
      render(<IndexSidePanel />)
    })

    // Check for user info (displayName is usually the most prominent)
    expect(screen.getByText(`Signed in as:`)).toBeInTheDocument()
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument()

    // Check if Sign Out button is present
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument()
    // Check if Sign In button is NOT present
    expect(
      screen.queryByRole("button", { name: /sign in with google/i })
    ).not.toBeInTheDocument()
  })

  test("adds user message and mock response on send", async () => {
    // Mock extracted content to be available
    (useFirebase as jest.Mock).mockImplementation(() => ({
      user: { uid: "test-user", displayName: "Test User" },
      isLoading: false,
      error: null,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))
    
    // Set up mocks for chrome.runtime.connect
    const mockPort = {
      postMessage: jest.fn(),
      onMessage: { addListener: jest.fn() },
      onDisconnect: { addListener: jest.fn() },
      disconnect: jest.fn()
    };
    (global.chrome.runtime.connect as jest.Mock).mockReturnValue(mockPort);
    
    await act(async () => {
      render(<IndexSidePanel />)
      // Allow initial useEffect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    })
    
    // Wait for content to be extracted and UI to update
    await waitFor(() => {
      expect(sendToBackground).toHaveBeenCalledWith({
        name: "getContent",
        body: { type: "GET_CONTENT_REQUEST" }
      })
    })

    // Now the UI should be ready for input
    const input = screen.getByPlaceholderText(/ask something.../i)
    const sendButton = screen.getByRole("button", { name: /send/i })

    // Wait for input to be enabled
    await waitFor(() => {
      expect(input).not.toBeDisabled()
    })

    // Type into input
    await act(async () => {
      fireEvent.change(input, { target: { value: "Test message" } })
    })
    expect(input).toHaveValue("Test message")

    // Click send button
    await act(async () => {
      fireEvent.click(sendButton)
      // Allow state updates to process
      await new Promise(resolve => setTimeout(resolve, 0));
    })

    // Verify user message appears
    expect(screen.getByText("Test message")).toBeInTheDocument()
    
    // Simulate streaming response
    await simulateStreamingResponse(mockPort, "This is the assistant response");
    
    // Verify assistant message appears
    expect(screen.getByText("This is the assistant response")).toBeInTheDocument()
  })

  test("does not send empty messages", async () => {
    // Mock extracted content to be available
    (useFirebase as jest.Mock).mockImplementation(() => ({
      user: { uid: "test-user", displayName: "Test User" },
      isLoading: false,
      error: null,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))
    
    await act(async () => {
      render(<IndexSidePanel />)
      // Allow initial useEffect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    })
    
    // Wait for extraction to complete
    await waitFor(() => {
      expect(sendToBackground).toHaveBeenCalled()
    })

    const input = screen.getByPlaceholderText(/ask something.../i)
    const sendButton = screen.getByRole("button", { name: /send/i })

    // Wait for input to be enabled after content extraction
    await waitFor(() => {
      expect(input).not.toBeDisabled()
    })

    // Button should still be disabled with empty input
    expect(sendButton).toBeDisabled()

    // Type whitespace
    await act(async () => {
      fireEvent.change(input, { target: { value: "   " } })
    })
    expect(sendButton).toBeDisabled()

    // Type something valid
    await act(async () => {
      fireEvent.change(input, { target: { value: "Valid" } })
    })
    expect(sendButton).not.toBeDisabled()

    // Clear input again
    await act(async () => {
      fireEvent.change(input, { target: { value: "" } })
    })
    expect(sendButton).toBeDisabled()
  })

  test("clicking Summarize Page adds summary request and mock response to chat", async () => {
    // Log in the user for this test
    const mockUser = { uid: "test-user", displayName: "Test User" }
    ;(useFirebase as jest.Mock).mockImplementation(() => ({
      user: mockUser,
      isLoading: false,
      error: null,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))

    // Set up mocks for chrome.runtime.connect
    const mockPort = {
      postMessage: jest.fn(),
      onMessage: { addListener: jest.fn() },
      onDisconnect: { addListener: jest.fn() },
      disconnect: jest.fn()
    };
    (global.chrome.runtime.connect as jest.Mock).mockReturnValue(mockPort);

    await act(async () => {
      render(<IndexSidePanel />)
      // Allow initial useEffect to complete
      await new Promise(resolve => setTimeout(resolve, 0));
    })

    // Wait for content extraction to complete
    await waitFor(() => {
      expect(sendToBackground).toHaveBeenCalledWith({
        name: "getContent",
        body: { type: "GET_CONTENT_REQUEST" }
      })
    })

    // Now the button should be enabled
    const summaryButton = screen.getByRole("button", { name: /summary/i })
    await waitFor(() => {
      expect(summaryButton).not.toBeDisabled()
    })
    
    // Click the summary button
    await act(async () => {
      fireEvent.click(summaryButton)
      // Allow state updates to process
      await new Promise(resolve => setTimeout(resolve, 0));
    })
    
    // Verify the summary request appears in the messages
    expect(screen.getByText(SUMMARIZE_PROMPT_TEMPLATE)).toBeInTheDocument()
    
    // Simulate streaming response
    await simulateStreamingResponse(mockPort, "This is a summary of the content");
    
    // Verify the summary response appears
    expect(screen.getByText("This is a summary of the content")).toBeInTheDocument()
  })

  test("Summary button is disabled when logged out", async () => {
    // Ensure user is logged out (default beforeEach state)
    await act(async () => {
      render(<IndexSidePanel />)
    })
    
    const summaryButton = screen.getByRole("button", { name: /summary/i })
    expect(summaryButton).toBeDisabled()
  })
})
