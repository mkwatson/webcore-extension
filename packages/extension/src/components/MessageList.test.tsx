import { render, screen } from "@testing-library/react"
import React from "react"

import "@testing-library/jest-dom"

import type { ChatMessage } from "@webcore/shared/types/messaging"

import MessageList from "./MessageList"

describe("MessageList Component", () => {
  const mockMessages: ChatMessage[] = [
    { role: "user", content: "Hello there!" },
    { role: "assistant", content: "Hi! How can I help?" },
    { role: "user", content: "Tell me about Readability.js" }
  ]

  test("renders null when no messages are provided", () => {
    const { container } = render(<MessageList messages={[]} />)
    // Check if the component renders basically nothing (or its top-level div is empty)
    // Depending on the implementation, it might render a div, but it should be empty
    // If it returns null directly, the container might have minimal structure
    expect(container.firstChild).toBeNull() // If component returns null
    // Or check if placeholder text is NOT present
    expect(screen.queryByText(/no messages yet/i)).not.toBeInTheDocument()
  })

  test("renders a list of messages correctly", () => {
    render(<MessageList messages={mockMessages} />)

    // Check if all message contents are rendered
    expect(screen.getByText("Hello there!")).toBeInTheDocument()
    expect(screen.getByText("Hi! How can I help?")).toBeInTheDocument()
    expect(screen.getByText("Tell me about Readability.js")).toBeInTheDocument()
  })

  test("applies different styles for user and assistant messages", () => {
    render(<MessageList messages={mockMessages} />)

    const userMessage = screen.getByText("Hello there!").parentElement
    const assistantMessage = screen.getByText(
      "Hi! How can I help?"
    ).parentElement

    // Check alignment (crude check via style attribute)
    expect(userMessage).toHaveStyle("align-self: flex-end")
    expect(assistantMessage).toHaveStyle("align-self: flex-start")

    // Check background color (specific values depend on implementation)
    // These might be brittle if styles change often; consider testing class names if applicable
    expect(userMessage).toHaveStyle("background: #d1e7ff")
    expect(assistantMessage).toHaveStyle("background: #f8f9fa")
  })
})
