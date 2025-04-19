// Import types using package name (enabled by TS project references)
import type {
  ChatMessage,
  ExtractedContent
} from "@webcore/shared/types/messaging"
import { useEffect, useRef, useState } from "react" // Add useState, useEffect, and useRef imports
import { sendToBackground } from "@plasmohq/messaging" // Import Plasmo messaging

import MessageList from "./components/MessageList" // Revert to relative path import
import { useFirebase } from "./firebase/hook" // Import the hook

// Assuming package name is @webcore/shared

// Optional: Import basic styling if needed
import './style.css'

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

  // Helper to display user info
  const getUserDisplay = () => {
    if (!user) return ""
    return user.displayName || user.email || user.uid
  }

  const handleGetContent = async () => {
    setExtractionError(null)
    setExtractedContent(null)
    setIsExtracting(true)

    try {
      console.log("[WebCore SidePanel] Sending getContent message to background")

      // Rely on type inference, provide correct body
      const response = await sendToBackground({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - Re-suppress persistent lint error for name
        name: "getContent",
        body: { type: "GET_CONTENT_REQUEST" }
      })

      console.log("[WebCore SidePanel] Received response from background:", response)

      // Check if response is undefined first
      if (!response) {
        setExtractionError("No response received from background script.")
        return
      }

      // Process the response (already in GetContentResponse format)
      if (response.payload) {
        setExtractedContent(response.payload)
        setIsSummaryGenerated(false); // Reset summary state when new content is loaded
      } else if (response.error) {
        setExtractionError(response.error)
      } else {
        setExtractionError(
          "Received unexpected empty response from background script."
        )
      }
    } catch (err) {
      console.error("[WebCore SidePanel] Error sending message to background:", err)
      setExtractionError(
        err instanceof Error ? err.message : "An unknown error occurred sending message."
      )
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
          // If a predefined message is provided, use it directly
          userMessage = predefinedMessage;
          content = predefinedMessage.content;
          // No need to prevent default or clear input value here
      } else if (event) {
          // Handle form submission or synthetic event like before
          const isSyntheticEvent = !("preventDefault" in event);
          content = isSyntheticEvent 
              ? (event.target as { value: string }).value.trim() 
              : (event.target as HTMLFormElement).querySelector('input')?.value.trim() || "";

          if (!isSyntheticEvent) {
              event.preventDefault();
          }
          setInputValue(""); // Clear input only if triggered by form/input event
          userMessage = { role: "user", content }; // Create standard user message
      } else {
          // Should not happen if called correctly, but handle defensively
          console.error("[UI Error] handleSendMessage called without event or predefined message.");
          return;
      }
      
      // console.log(`[UI Debug] handleSendMessage called. Content: "${content}", isWaiting: ${isWaitingForResponse}`) // Removed log

      // Check if content context is available before sending any message
      if (!extractedContent) {
         console.warn("[UI Debug] handleSendMessage called but extractedContent is null."); // Keep warning
         setIsWaitingForResponse(false); // Ensure waiting state is reset
         return; // Don't send if no content context
      }

      if (!content || isWaitingForResponse) {
        // console.log("[UI Debug] handleSendMessage returning early (no content or waiting).") // Removed log
        return;
      }

      setIsWaitingForResponse(true);
      // setInputValue("") // Moved clearing input to event handling block

      // Add user message (either predefined or created from event) to state
      // const userMessage: ChatMessageWithId = { role: "user", content }; // Logic moved up
      const placeholderId = `placeholder-${Date.now()}`;
      const placeholderMessage: ChatMessageWithId = {
        id: placeholderId,
        role: "assistant",
        content: ""
      }

      // Build the message array: *only* chat history + new user message
      // Context is sent separately via the payload.context object when needed
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const chatHistory = messages.map(({ id, ...rest }) => rest)
      const messagesToSend: ChatMessage[] = [
        ...chatHistory,
        userMessage
      ]

      // console.log("[UI Debug] Base messages for payload:", messagesToSend) // Removed log

      setMessages((prev) => [...prev, userMessage, placeholderMessage])

      // Determine if context needs to be sent - ALWAYS send if available
      const payloadToSend: { messages: ChatMessage[]; context?: { systemPrompt: string; pageContent: string; title?: string; url?: string } } = {
        messages: messagesToSend
      };

      if (extractedContent) { // Check only if content exists
        console.log("[UI Debug] Including context in this message."); // Updated log message slightly
        payloadToSend.context = {
          systemPrompt: SYSTEM_PROMPT,
          pageContent: extractedContent.markdownContent,
          title: extractedContent.title, // Include title in context
          url: extractedContent.url     // Include URL in context
        };
      }

      // --- Streaming via port ---
      try {
        // console.log("[UI Debug] Attempting to connect to background script port 'callApiStream'...") // Removed log
        const port = chrome.runtime.connect({ name: "callApiStream" })
        // console.log("[UI Debug] Port connection established. Sending payload:", payloadToSend) // Removed log
        port.postMessage(payloadToSend) // Send the potentially augmented payload
        
        let accumulatedContent = "" // Store the processed content delta
        let sseBuffer = "" // Buffer for incomplete SSE messages

        port.onMessage.addListener((msg) => {
          console.log("[UI Stream Debug] Raw msg from background:", msg); // Log raw message

          if (msg.chunk) {
            sseBuffer += msg.chunk;
            const events = sseBuffer.split("\n\n");
            sseBuffer = events.pop() || ""; 

            for (const event of events) {
               console.log(`[UI Stream Debug] Processing event string: "${event}"`); // Log event string
              if (event.trim() === "data: [DONE]") {
                continue; 
              }

              if (event.startsWith("data: ")) {
                const dataString = event.substring(6).trim();
                console.log(`[UI Stream Debug] Extracted data string: "${dataString}"`); // Log data string
                try {
                  const parsedData = JSON.parse(dataString);
                  console.log("[UI Stream Debug] Parsed data:", parsedData); // Log parsed object

                  if (parsedData.content) {
                    const contentDelta = parsedData.content;
                    console.log(`[UI Stream Debug] Extracted content delta: "${contentDelta}"`); // Log delta
                    accumulatedContent += contentDelta;
                    console.log(`[UI Stream Debug] About to setMessages for placeholderId: ${placeholderId} with accumulated content: "${accumulatedContent.substring(0, 50)}..."`); // Log before setMessages
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === placeholderId
                          ? { ...m, content: accumulatedContent }
                          : m
                      )
                    );
                  } else {
                      console.log("[UI Stream Debug] Parsed data does not contain 'content' key.");
                  }
                } catch (parseError) {
                  console.error(
                    "[UI Stream Debug] Failed to parse JSON from SSE data:",
                    dataString,
                    parseError
                  );
                }
              } else {
                // Log if it's not empty and doesn't start with "data: "
                if (event.trim()) {
                    console.warn(`[UI Stream Debug] Received non-empty event string that doesn't start with 'data: ': "${event}"`);
                }
              }
            }
          } else if (msg.done) {
            console.log("[UI Stream Debug] Received {done: true} signal from background.");
            setIsWaitingForResponse(false) // Allow sending new messages
            port.disconnect()
          } else if (msg.error) {
            console.error("[UI Stream Debug] Received error from background port:", msg.error)
            // Update the placeholder message to show the error
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId ? { ...m, content: `Error: ${msg.error}` } : m
              )
            )
            setIsWaitingForResponse(false) // Allow sending new messages
            port.disconnect()
          }
        });

        // Handle port disconnection
        port.onDisconnect.addListener(() => {
          console.log("[UI Stream Debug] Background port disconnected.");
          setIsWaitingForResponse(false); // Ensure waiting state is reset if port closes unexpectedly
          // Check if the placeholder still exists and hasn't been fully replaced
          setMessages(prev => {
            const placeholderExists = prev.some(m => m.id === placeholderId && m.content === "");
            if (placeholderExists) {
              // If disconnected unexpectedly before completion, show an error or remove placeholder?
              console.warn("[UI Stream Debug] Port disconnected but placeholder message might be incomplete or empty.");
              // Option: Update placeholder to show an error
              return prev.map(m => m.id === placeholderId ? {...m, content: "Error: Stream disconnected unexpectedly."} : m);
            }
            return prev; // Otherwise, no change needed
          });
        });

      } catch (error) {
        console.error("[UI Debug] Error establishing port connection or sending initial message:", error);
        // Update placeholder to show connection error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === placeholderId ? { ...m, content: `Error: Failed to connect to backend. ${error instanceof Error ? error.message : ''}` } : m
          )
        );
        setIsWaitingForResponse(false);
      }
  }

  // Update the summary button to get content, then send the summary prompt
  const handleSummarize = async () => {
    // console.log("[UI Debug] Summary button clicked.") // Removed log
    setExtractionError(null); // Clear previous extraction errors

    // 1. Check if content is already available (should be loaded by useEffect)
    if (!extractedContent) {
      console.warn("[UI Debug] Summary clicked, but extractedContent is not yet available. Extraction might have failed or is slow.");
      setExtractionError("Page content not loaded. Please wait or try reloading.");
      return; // Stop if no content
    }

    // 2. Check if content extraction was successful (handleGetContent sets state)
    // ... (checks remain the same) ...

    // 3. Send Summary Message (handleSendMessage will add context if needed)
    // Create the user message object with the flag
    const userMessagePayload: ChatMessageWithId = {
        role: 'user',
        content: SUMMARIZE_PROMPT_TEMPLATE,
        isActionTriggered: true // Add the flag here
    };
    
    // Simulate the event structure handleSendMessage expects for non-form events
    // const fakeEvent = { target: { value: SUMMARIZE_PROMPT_TEMPLATE } };
    
    // Note: handleSendMessage will internally create its *own* user message object.
    // We need to adjust handleSendMessage slightly, or pass the flag differently.
    // Let's adjust handleSendMessage to accept an optional pre-built message object.
    
    // Temporarily, let's just call handleSendMessage and set the flag afterwards (less ideal)
    // handleSendMessage(fakeEvent); 

    // Mark summary as generated for this content (to remove the button)
    // setIsSummaryGenerated(true);
    
    // // Ideal approach: Modify handleSendMessage to take the flagged object
    handleSendMessage(undefined, userMessagePayload); // Pass undefined for event, provide payload
    setIsSummaryGenerated(true); // Mark summary as generated *after* calling send
  }

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages]) // Dependency array ensures this runs when messages update

  // Effect to extract content when the sidepanel mounts and user is logged in
  useEffect(() => {
    // console.log("[UI Debug] Sidepanel mounted, triggering content extraction."); // Removed log
    if (user) { // Only extract content if logged in
        handleGetContent();
    }
    // This effect should run only once on mount or when user logs in/out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Re-run if user state changes

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        boxSizing: 'border-box' // Ensure padding doesn't add to height
      }}>
      {isLoading && ( // Show loading indicator fullscreen if loading auth state
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p>Loading...</p>
        </div>
      )}

      {!isLoading && !user && ( // Signed-out state
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            padding: "16px",
            textAlign: 'center'
          }}>
          <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '600' }}>Welcome to WebCore</h2>
          <p style={{ marginBottom: '32px', color: '#555', fontSize: '14px' }}>Sign in to activate the AI assistant.</p>
          {error && <p style={{ color: "red", marginBottom: '16px' }}>Error: {error}</p>}
          <button 
            onClick={onLogin} 
            disabled={isLoading} 
            style={{ 
                // Google-like button styling
                backgroundColor: '#ffffff',
                color: '#444', // Dark grey text
                border: '1px solid #dadce0', // Subtle grey border
                borderRadius: '4px',
                padding: '10px 24px', // Adjust padding
                fontSize: '14px', 
                fontWeight: '500',
                cursor: 'pointer', 
                display: 'inline-flex', // Align icon and text if icon added later
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)', // Subtle shadow
                transition: 'border-color .218s, background-color .218s, box-shadow .218s',
                // Add hover effect (optional)
                // ':hover': { backgroundColor: '#f8f9fa' }
            }}
          >
            {/* Add Google G icon SVG here later if desired */}
            {/* <img src='google-icon.svg' alt="" style={{ marginRight: '12px', height: '18px', width: '18px' }} /> */}
            Sign In with Google
          </button>
        </div>
      )}

      {!isLoading && user && ( // Signed-in state - Wrap existing UI
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 16px 16px 16px' }}> 
          {/* Keep original padding here */}
          <div style={{ paddingTop: 16 }}>
            {" "}
            {/* Added padding top here */}
            <h2>WebCore SidePanel</h2> 
            {/* Removed loading/error here as handled above or differently below */}
            {/* User info section - keep for now, address in next step */}
            <div> 
              <p>Signed in as:</p>
              <p>
                <strong>{getUserDisplay()}</strong>
              </p>
              <button onClick={onLogout} disabled={isLoading}>
                Sign Out
              </button>
            </div>
            <div
              style={{
                marginTop: "10px",
                borderTop: "1px solid #eee",
                paddingTop: "10px"
              }}>
              {/* Conditionally render the button based on summary generation status */}
              {!isSummaryGenerated && (
                  <button
                      onClick={handleSummarize}
                      disabled={isExtracting || !extractedContent || !user} // Keep original disable logic minus the isSummaryGenerated check
                  >
                      {isExtracting ? "Loading Page..." : "Summary"}
                  </button>
              )}
              {extractionError && (
                  <p style={{ color: "red", marginTop: "10px" }}>
                      Error: {extractionError}
                  </p>
              )}
              {/* Comment out the debug display for extracted content */}
              {/* {extractedContent && (...)} */}
            </div>
          </div>

          <MessageList messages={messages} ref={messagesEndRef} />

          <form
            onSubmit={handleSendMessage}
            style={{
              marginTop: "auto",
              borderTop: "1px solid #ccc",
              paddingTop: "10px",
              display: "flex"
            }}>
            <input
              type="text"
              placeholder="Ask something..."
              style={{ flexGrow: 1, padding: "8px", marginRight: "8px" }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading || isWaitingForResponse || isExtracting || !extractedContent} // Also disable if extracting or no content
            />
            <button
              type="submit"
              style={{ padding: "8px 12px" }}
              disabled={isLoading || !inputValue.trim() || isWaitingForResponse || isExtracting || !extractedContent} // Also disable if extracting or no content
            >
              {isWaitingForResponse ? "Waiting..." : "Send"}
            </button>
          </form>
        </div> // End signed-in wrapper
      )}
    </div>
  )
}

export default IndexSidePanel
