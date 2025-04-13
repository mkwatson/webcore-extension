import { render, screen } from "@testing-library/react"
import React from "react"

import "@testing-library/jest-dom" // Import jest-dom matchers

import { useFirebase } from "./firebase/hook"
import IndexSidePanel from "./sidepanel" // Adjust the import path as needed

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
})

describe("IndexSidePanel Component", () => {
  test("renders Sign In button when logged out", () => {
    render(<IndexSidePanel />)
    // Check if the Sign In button is present
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument()
    // Check if Sign Out button is NOT present
    expect(
      screen.queryByRole("button", { name: /sign out/i })
    ).not.toBeInTheDocument()
  })

  test("renders loading state", () => {
    // Override the mock implementation for this specific test
    ;(useFirebase as jest.Mock).mockImplementation(() => ({
      user: null,
      isLoading: true,
      error: null,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))
    render(<IndexSidePanel />)
    expect(screen.getByText(/loading.../i)).toBeInTheDocument()
  })

  test("renders error state", () => {
    const errorMessage = "Failed to authenticate"
    ;(useFirebase as jest.Mock).mockImplementation(() => ({
      user: null,
      isLoading: false,
      error: errorMessage,
      onLogin: mockLogin,
      onLogout: mockLogout
    }))
    render(<IndexSidePanel />)
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument()
  })

  test("renders user information and Sign Out button when logged in", () => {
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

    render(<IndexSidePanel />)

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

  // Potential future test: Test input field interaction
  // test('updates input field value on change', () => {
  //   render(<IndexSidePanel />);
  //   const input = screen.getByPlaceholderText(/ask something.../i);
  //   fireEvent.change(input, { target: { value: 'Test query' } });
  //   expect(input).toHaveValue('Test query');
  // });
})
