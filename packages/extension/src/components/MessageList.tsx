import type { ChatMessage } from "@webcore/shared/types/messaging"
import React, { forwardRef } from "react"

interface MessageListProps {
  messages: ChatMessage[]
}

// Use forwardRef to allow parent component to pass a ref to the underlying div
const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  (
    { messages },
    ref // Ref is the second argument
  ) => {
    // Simple check for empty messages array
    if (!messages || messages.length === 0) {
      // Return null or a placeholder, avoiding unnecessary rendering
      return null
    }

    return (
      <div
        ref={ref} // Attach the forwarded ref here
        style={{
          flexGrow: 1, // Allows the list to take available space
          overflowY: "auto", // Enable scrolling for long lists
          padding: "10px 0", // Add padding top/bottom, remove side padding
          display: "flex",
          flexDirection: "column" // Keep messages ordered top-to-bottom
          // Removed column-reverse as scroll-to-bottom logic will handle positioning
        }}>
        {messages.map((msg, index) => (
          <div
            key={index} // Simple key for now, consider more robust keys later
            style={{
              marginBottom: "10px",
              padding: "8px 12px",
              borderRadius: "8px",
              maxWidth: "80%",
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "#d1e7ff" : "#f8f9fa", // Simple background diff
              color: "#000",
              marginLeft: msg.role === "user" ? "auto" : "10px", // Align user right, assistant left
              marginRight: msg.role === "user" ? "10px" : "auto"
            }}>
            {/* Use pre-wrap to respect newlines in message content */}
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontFamily: "inherit"
              }}>
              {msg.content}
            </pre>
          </div>
        ))}
        {/* Add a dummy div at the end to ensure scrollIntoView targets the very bottom */}
        <div style={{ float: "left", clear: "both" }} />
      </div>
    )
  }
)

// Add display name for React DevTools
MessageList.displayName = "MessageList"

export default MessageList
