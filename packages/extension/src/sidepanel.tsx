import { useState } from "react" // Add useState import

import { useFirebase } from "./firebase/hook" // Import the hook

// Import types from within the extension package
import type {
  ExtractedContent,
  GetContentRequest,
  GetContentResponse,
} from "./types/messaging-types"

// Optional: Import basic styling if needed
// import './style.css'

function IndexSidePanel() {
  // Renamed from IndexPopup
  // Use the state and functions provided by the hook
  const { user, isLoading, error, onLogin, onLogout } = useFirebase()
  const [inputValue, setInputValue] = useState("") // State for the chat input
  // State for content extraction results
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)

  // Helper to display user info
  const getUserDisplay = () => {
    if (!user) return ""
    return user.displayName || user.email || user.uid
  }

  const handleGetContent = async () => {
    setExtractionError(null) // Clear previous errors/content
    setExtractedContent(null)

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      })

      if (!tab || !tab.id) {
        throw new Error("Could not find active tab.")
      }

      const request: GetContentRequest = { type: "GET_CONTENT_REQUEST" }
      console.log("[WebCore SidePanel] Sending request to tab:", tab.id, request)

      // Send message to the content script in the specific tab
      const response: GetContentResponse = await chrome.tabs.sendMessage(
        tab.id,
        request
      )

      console.log("[WebCore SidePanel] Received response:", response)

      if (response.type === "GET_CONTENT_RESPONSE") {
        if (response.payload) {
          setExtractedContent(response.payload)
        } else if (response.error) {
          setExtractionError(response.error)
        } else {
          setExtractionError("Received unexpected empty response from content script.")
        }
      } else {
        setExtractionError("Received unexpected message type from content script.")
      }
    } catch (err) {
      console.error("[WebCore SidePanel] Error getting content:", err)
      setExtractionError(err instanceof Error ? err.message : "An unknown error occurred.")
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16,
        // Sidepanel might need height: '100vh' or similar depending on design
        // minWidth: 250 // Keep or adjust as needed for sidebar
        height: "100vh" // Make it full height
      }}>
      <h2>WebCore SidePanel</h2> {/* Updated Title */}
      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {user ? (
        <div>
          <p>Signed in as:</p>
          <p>
            <strong>{getUserDisplay()}</strong>
          </p>
          {/* Use onLogout from the hook */}
          <button onClick={onLogout} disabled={isLoading}>
            Sign Out
          </button>
        </div>
      ) : (
        /* Use onLogin from the hook */
        <button onClick={onLogin} disabled={isLoading}>
          Sign In with Google
        </button>
      )}

      {/* Content Extraction Section */}
      <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
        <button onClick={handleGetContent} disabled={isExtracting}>
          {isExtracting ? "Extracting..." : "Get Page Content"}
        </button>
        {extractionError && (
          <p style={{ color: "red", marginTop: "10px" }}>Error: {extractionError}</p>
        )}
        {extractedContent && (
          <div style={{ marginTop: "10px", maxHeight: "300px", overflowY: "auto", background: "#f9f9f9", border: "1px solid #ddd", padding: "5px" }}>
            <h4>Extracted Content:</h4>
            <p><strong>Title:</strong> {extractedContent.title}</p>
            <p><strong>URL:</strong> {extractedContent.url}</p>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {extractedContent.markdownContent}
            </pre>
          </div>
        )}
      </div>

      {/* Placeholder for future chat elements */}
      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid #ccc",
          paddingTop: "10px"
        }}>
        <input
          type="text"
          placeholder="Ask something..."
          style={{ width: "calc(100% - 22px)", padding: "8px" }}
          value={inputValue} // Bind value to state
          onChange={(e) => setInputValue(e.target.value)} // Update state on change
        />
      </div>
    </div>
  )
}

export default IndexSidePanel // Renamed export
