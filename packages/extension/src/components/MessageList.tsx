import { ChatMessage } from "@webcore/shared/types/messaging"
import { Box, Text } from "@chakra-ui/react" // Import Chakra components
import React, { forwardRef } from "react"

// Use the extended type from sidepanel (or define it locally/share it)
interface ChatMessageWithId extends ChatMessage {
  id?: string;
  isActionTriggered?: boolean;
}

interface MessageListProps {
  messages: ChatMessageWithId[] // Update to use extended type
}

// Use forwardRef to allow parent component to pass a ref to the underlying div
const MessageList = forwardRef<HTMLDivElement, MessageListProps>((
  { messages },
  _ref // Ref is the second argument - Mark as unused with underscore
) => {
  // Simple check for empty messages array
  if (!messages || messages.length === 0) {
    // Return null or a placeholder, avoiding unnecessary rendering
    return null
  }

  return (
    <Box w="100%"> {/* Ensure it takes full width */}
      {messages.map((msg, index) => {
        const messageClasses =
          msg.isActionTriggered ? "message message--highlight-action" : "message";
        const isUser = msg.role === "user";
        const isWaiting = msg.content === "...";

        return (
          <Box
            key={msg.id || index}
            className={messageClasses} // Pass className for highlight animation
            alignSelf={isUser ? "flex-end" : "flex-start"}
            bg={isUser ? "blue.100" : "gray.100"} // Use Chakra theme colors
            color={isWaiting ? "gray.500" : "black"} // Grey out loading dots
            px={3} // Chakra padding
            py={2}
            mb={2} // Chakra margin
            borderRadius="lg" // Chakra border radius
            maxWidth="80%"
            fontStyle={isWaiting ? "italic" : "normal"}
            textAlign={isWaiting ? "center" : "left"}
            ml={isUser ? "auto" : 0} // Use 0 instead of 10px for cleaner alignment
            mr={isUser ? 0 : "auto"}
          >
            {/* Use Text component with pre-wrap for message content */}
            {/* Render loading state directly, or Text for regular messages */}
            {isWaiting ? (
              msg.content 
            ) : (
              <Text 
                whiteSpace="pre-wrap" 
                wordBreak="break-word"
                fontSize="sm" // Apply consistent small font size
                lineHeight="base" // Apply base line height for readability
              >
                {msg.content}
              </Text>
            )}
          </Box>
        )
      })}
      {/* Dummy div for scrolling - parent Box in sidepanel handles ref */}
      {/* <div style={{ float: "left", clear: "both" }} /> */}
    </Box>
  )
})

// Add display name for React DevTools
MessageList.displayName = "MessageList"

export default MessageList
