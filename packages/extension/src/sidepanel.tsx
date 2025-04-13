import { useState } from "react" // Add useState import

import { useFirebase } from "./firebase/hook" // Import the hook

// Optional: Import basic styling if needed
// import './style.css'

function IndexSidePanel() {
  // Renamed from IndexPopup
  // Use the state and functions provided by the hook
  const { user, isLoading, error, onLogin, onLogout } = useFirebase()
  const [inputValue, setInputValue] = useState("") // State for the chat input

  // Helper to display user info
  const getUserDisplay = () => {
    if (!user) return ""
    return user.displayName || user.email || user.uid
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
        {/* Basic chat display area could go here */}
      </div>
    </div>
  )
}

export default IndexSidePanel // Renamed export
