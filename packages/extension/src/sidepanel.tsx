// Import types using package name (enabled by TS project references)
import type {
  ChatMessage,
  ExtractedContent
} from "@webcore/shared/types/messaging"
import {
  Avatar,
  Box,
  Button,
  Center,
  ChakraProvider,
  Flex,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  VStack
} from "@chakra-ui/react" // Import Chakra components
import { useEffect, useRef, useState } from "react" // Add useState, useEffect, and useRef imports
import { sendToBackground } from "@plasmohq/messaging" // Import Plasmo messaging

import MessageList from "./components/MessageList" // Revert to relative path import
import { useFirebase } from "./firebase/hook" // Import the hook

// Optional: Import basic styling if needed
import "./style.css"

// Extend ChatMessage to include an optional ID and action trigger flag
interface ChatMessageWithId extends ChatMessage {
  id?: string; // Unique ID for tracking placeholder messages
  isActionTriggered?: boolean; // Flag for highlighting messages triggered by actions
}

// Constant for the summary prompt
const SUMMARIZE_PROMPT_TEMPLATE =
  "Please provide a concise summary of the content, clearly highlighting the main points and key takeaways in one short paragraph."

// System prompt constant
const SYSTEM_PROMPT = `[System role instructions]
You are a helpful browsing assistant that can summarize webpage content and answer questions about it.
- Only use the information from the user-provided page text; do not add facts from elsewhere.
- Provide clear, concise, and correct answers or summaries.
- If you are unsure or the answer is not in the text, say you don't have that information.
- Stay objective and factual in your responses.`

function IndexSidePanel() {
  // Renamed from IndexPopup
  // Use the state and functions provided by the hook
  const { user, isLoading, error, onLogin, onLogout } = useFirebase()
  const [inputValue, setInputValue] = useState("") // State for the chat input
  // State for content extraction results
  const [extractedContent, setExtractedContent] =
    useState<ExtractedContent | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  // State for chat messages - use ChatMessageWithId
  const [messages, setMessages] = useState<ChatMessageWithId[]>([])
  // State to track if waiting for API response
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  // State to track if summary has been generated for the current content
  const [isSummaryGenerated, setIsSummaryGenerated] = useState(false);
  // Ref for the message list container
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Helper to display user initials for Avatar
  const getUserInitials = () => {
    if (!user) return ""
    const name = user.displayName
    const email = user.email
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "?" // Fallback
  }

  // Helper to display user info
  const getUserDisplay = () => {
    if (!user) return ""
    return user.displayName || user.email || user.uid
  }

  const handleGetContent = async () => {
    setExtractionError(null)
    // Don't reset extracted content here, only on success below
    // setExtractedContent(null)
    setIsExtracting(true)
    setIsSummaryGenerated(false); // Reset summary state when starting extraction

    try {
      console.log("[WebCore SidePanel] Sending getContent message to background")
      // ... (rest of sendToBackground logic remains the same)
      const response = await sendToBackground({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Re-suppress persistent lint error for name
        name: "getContent",
        body: { type: "GET_CONTENT_REQUEST" }
      })

      console.log("[WebCore SidePanel] Received response from background:", response)

      if (!response) {
        setExtractionError("No response received from background script.")
        setExtractedContent(null) // Clear content on error
        return
      }

      if (response.payload) {
        setExtractedContent(response.payload)
        // setIsSummaryGenerated(false); // Moved reset to start of function
      } else if (response.error) {
        setExtractionError(response.error)
        setExtractedContent(null) // Clear content on error
      } else {
        setExtractionError(
          "Received unexpected empty response from background script."
        )
        setExtractedContent(null) // Clear content on error
      }
    } catch (err) {
      console.error("[WebCore SidePanel] Error sending message to background:", err)
      setExtractionError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred sending message."
      )
      setExtractedContent(null) // Clear content on error
    } finally {
      setIsExtracting(false)
    }
  }

  // Function to handle sending a message with streaming
  const handleSendMessage = async (
    event?: React.FormEvent<HTMLFormElement> | { target: { value: string } },
    predefinedMessage?: ChatMessageWithId
  ) => {
    let content = "";
    let userMessage: ChatMessageWithId;

    if (predefinedMessage) {
      userMessage = predefinedMessage;
      content = predefinedMessage.content;
    } else if (event) {
      const isSyntheticEvent = !("preventDefault" in event);
      content =
        isSyntheticEvent
          ? (event.target as { value: string }).value.trim()
          : (event.target as HTMLFormElement).querySelector("input")?.value.trim() ||
            "";

      if (!isSyntheticEvent) {
        event.preventDefault();
      }
      setInputValue("");
      userMessage = { role: "user", content };
    } else {
      console.error(
        "[UI Error] handleSendMessage called without event or predefined message."
      );
      return;
    }

    if (!extractedContent) {
      console.warn("[UI Debug] handleSendMessage called but extractedContent is null.");
      setIsWaitingForResponse(false);
      return;
    }

    if (!content || isWaitingForResponse) {
      return;
    }

    setIsWaitingForResponse(true);
    const placeholderId = `placeholder-${Date.now()}`;
    const placeholderMessage: ChatMessageWithId = {
      id: placeholderId,
      role: "assistant",
      content: "..."
    };

    const chatHistory = messages.map(({ id, isActionTriggered, ...rest }) => rest) // Strip runtime flags
    const messagesToSend: ChatMessage[] = [
      ...chatHistory,
      { role: "user", content: userMessage.content } // Send only core ChatMessage fields
    ];

    setMessages((prev) => [...prev, userMessage, placeholderMessage])

    const payloadToSend: {
      messages: ChatMessage[];
      context?: {
        systemPrompt: string;
        pageContent: string;
        title?: string;
        url?: string;
      };
    } = {
      messages: messagesToSend
    };

    if (extractedContent) {
      console.log("[UI Debug] Including context in this message.");
      payloadToSend.context = {
        systemPrompt: SYSTEM_PROMPT,
        pageContent: extractedContent.markdownContent,
        title: extractedContent.title,
        url: extractedContent.url
      };
    }

    try {
      const port = chrome.runtime.connect({ name: "callApiStream" })
      port.postMessage(payloadToSend)
      // ... (rest of streaming logic remains the same)
      let accumulatedContent = "" // Store the processed content delta
      let sseBuffer = "" // Buffer for incomplete SSE messages

      port.onMessage.addListener((msg) => {
        // console.log("[UI Stream Debug] Raw msg from background:", msg); // Log raw message

        if (msg.chunk) {
          sseBuffer += msg.chunk;
          const events = sseBuffer.split("\n\n");
          sseBuffer = events.pop() || "";

          for (const event of events) {
            // console.log(`[UI Stream Debug] Processing event string: \"${event}\"`); // Log event string
            if (event.trim() === "data: [DONE]") {
              continue;
            }

            if (event.startsWith("data: ")) {
              const dataString = event.substring(6).trim();
              // console.log(`[UI Stream Debug] Extracted data string: \"${dataString}\"`); // Log data string
              try {
                const parsedData = JSON.parse(dataString);
                // console.log("[UI Stream Debug] Parsed data:", parsedData); // Log parsed object

                if (parsedData.content) {
                  const contentDelta = parsedData.content;
                  // console.log(`[UI Stream Debug] Extracted content delta: \"${contentDelta}\"`); // Log delta
                  accumulatedContent += contentDelta;
                  // console.log(`[UI Stream Debug] About to setMessages for placeholderId: ${placeholderId} with accumulated content: \"${accumulatedContent.substring(0, 50)}...\"`); // Log before setMessages
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === placeholderId
                        ? { ...m, content: accumulatedContent }
                        : m
                    )
                  );
                } else {
                  // console.log("[UI Stream Debug] Parsed data does not contain 'content' key.");
                }
              } catch (parseError) {
                console.error(
                  "[UI Stream Debug] Failed to parse JSON from SSE data:",
                  dataString,
                  parseError
                );
              }
            } else {
              if (event.trim()) {
                // console.warn(`[UI Stream Debug] Received non-empty event string that doesn't start with \'data: \': \"${event}\"`);
              }
            }
          }
        } else if (msg.done) {
          console.log("[UI Stream Debug] Received {done: true} signal from background.");
          setIsWaitingForResponse(false) // Allow sending new messages
          port.disconnect()
        } else if (msg.error) {
          console.error("[UI Stream Debug] Received error from background port:", msg.error)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === placeholderId ? { ...m, content: `Error: ${msg.error}` } : m
            )
          )
          setIsWaitingForResponse(false) // Allow sending new messages
          port.disconnect()
        }
      });

      port.onDisconnect.addListener(() => {
        console.log("[UI Stream Debug] Background port disconnected.");
        setIsWaitingForResponse(false);
        setMessages((prev) => {
          const placeholderExists =
            prev.some((m) => m.id === placeholderId && m.content === "..."); // Check for loading indicator
          if (placeholderExists) {
            console.warn(
              "[UI Stream Debug] Port disconnected but placeholder message might be incomplete or empty."
            );
            return prev.map((m) =>
              m.id === placeholderId
                ? {
                    ...m,
                    content: "Error: Stream disconnected unexpectedly."
                  }
                : m
            );
          }
          return prev;
        });
      });
    } catch (error) {
      console.error(
        "[UI Debug] Error establishing port connection or sending initial message:",
        error
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                content: `Error: Failed to connect to backend. ${
                  error instanceof Error ? error.message : ""
                }`
              }
            : m
        )
      );
      setIsWaitingForResponse(false);
    }
  };

  // Update the summary button to get content, then send the summary prompt
  const handleSummarize = async () => {
    setExtractionError(null);

    if (!extractedContent) {
      console.warn(
        "[UI Debug] Summary clicked, but extractedContent is not yet available. Extraction might have failed or is slow."
      );
      setExtractionError("Page content not loaded. Please wait or try reloading.");
      return;
    }

    const userMessagePayload: ChatMessageWithId = {
      role: "user",
      content: SUMMARIZE_PROMPT_TEMPLATE,
      isActionTriggered: true
    };

    handleSendMessage(undefined, userMessagePayload);
    setIsSummaryGenerated(true);
  };

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    const scrollableContainer = messagesEndRef.current;
    if (scrollableContainer) {
      // Set the scrollTop to the full scroll height to scroll to the bottom
      scrollableContainer.scrollTop = scrollableContainer.scrollHeight;
    }
  }, [messages])

  // Effect to extract content when the sidepanel mounts and user is logged in
  useEffect(() => {
    if (user) {
      handleGetContent();
    }
  }, [user]);

  // Form submission handler
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      handleSendMessage(event); // Call the main handler
  };

  return (
    <ChakraProvider>
      <Flex direction="column" h="100vh">
        {isLoading && (
          <Center h="100%">
            <Text>Loading...</Text>
          </Center>
        )}

        {!isLoading && !user && ( // Signed-out state using Chakra
          <Center h="100%" p={4}>
            <VStack spacing={6}>
              <Heading as="h2" size="lg">
                Welcome to WebCore
              </Heading>
              <Text color="gray.600">
                Sign in to activate the AI assistant.
              </Text>
              {error && (
                <Text color="red.500" mb={4}>
                  Error: {error}
                </Text>
              )}
              <Button
                onClick={onLogin}
                isLoading={isLoading}
                colorScheme="blue" // Use Chakra color scheme
                variant="outline"
                boxShadow="sm" // Add slight shadow
                // size="lg" // Make button larger
              >
                Sign In with Google
              </Button>
            </VStack>
          </Center>
        )}

        {!isLoading && user && ( // Signed-in state using Chakra
          <Flex direction="column" h="100%">
            {/* Header */}
            <Flex
              as="header"
              align="center"
              justify="space-between"
              p={2}
              borderBottomWidth="1px">
              {/* Left side (empty for now) */}
              <Box /> 

              {/* Right side - User Menu */}
              <Menu>
                <MenuButton
                  as={IconButton} // Use IconButton for better spacing/looks
                  aria-label="User menu"
                  icon={<Avatar size="sm" name={getUserDisplay()} getInitials={getUserInitials} />}
                  variant="ghost"
                  isRound
                />
                <MenuList>
                  <MenuItem isDisabled>
                      <Text fontWeight="bold">{getUserDisplay()}</Text>
                  </MenuItem>
                  <MenuItem onClick={onLogout} isDisabled={isLoading}>
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>

            {/* Main Content - Chat Area */}
            <Box
              flexGrow={1}
              overflowY="auto"
              px={4} // Add horizontal padding
              py={2} // Add vertical padding
              ref={messagesEndRef} // Pass ref here for scrolling
            >
              <MessageList messages={messages} /> { /* Removed ref from here */ }
            </Box>

            {/* Footer */}
            <Box as="footer" p={4} borderTopWidth="1px">
                {/* Contextual Actions Area */}
                {!isSummaryGenerated && extractedContent && (
                    <Button 
                        onClick={handleSummarize}
                        isDisabled={isExtracting || !extractedContent || !user}
                        size="sm" 
                        variant="outline" 
                        mb={2} // Margin bottom to space from input
                    >
                        {isExtracting ? "Loading Page..." : "Summarize"}
                    </Button>
                )}
                {extractionError && !extractedContent && (
                    <Text color="red.500" fontSize="sm" mb={2}>
                      Error loading page content: {extractionError}
                    </Text>
                )}

                {/* Input Form Area */}
                <form onSubmit={handleFormSubmit} style={{ display: "flex" }}>
                    <Input
                        placeholder="Ask something..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        isDisabled={isLoading || isWaitingForResponse || isExtracting || !extractedContent}
                        mr={2} // Margin right
                    />
                    <Button
                        type="submit"
                        isDisabled={isLoading || !inputValue.trim() || isWaitingForResponse || isExtracting || !extractedContent}
                        isLoading={isWaitingForResponse} // Use Chakra loading state
                        loadingText="Send"
                    >
                        Send
                    </Button>
                </form>
            </Box>
          </Flex>
        )}
      </Flex>
    </ChakraProvider>
  )
}

export default IndexSidePanel
