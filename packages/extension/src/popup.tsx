// import { useState } from 'react'
import { useFirebase } from "./firebase/hook" // Import the hook

// Optional: Import basic styling if needed
// import './style.css'

function IndexPopup() {
  // Use the state and functions provided by the hook
  const { user, isLoading, error, onLogin, onLogout } = useFirebase()

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
        minWidth: 250 // Give it a minimum width
      }}>
      <h2>WebCore Auth (Plasmo Hook)</h2>
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
    </div>
  )
}

export default IndexPopup
