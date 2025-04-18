// Background streaming handler for chat API
// Listens for port connections, fetches the backend /api/chat endpoint, and streams each chunk to the sidepanel via the port.
// Handles stream completion and errors.

// import type { ChatMessage } from "@webcore/shared/messaging-types"

// Plasmo/Chrome extension background scripts can use the chrome.runtime.onConnect API
chrome.runtime.onConnect.addListener((port) => {
  console.log(`[Background Debug] Port connected: ${port.name}`, port)
  if (port.name !== "callApiStream") return

  console.log(`[Background Debug] Accepted connection from port: ${port.name}`)

  port.onMessage.addListener(async (msg) => {
    console.log(`[Background Debug] Received message on port ${port.name}:`, msg)

    // Validate the incoming message structure
    if (!msg || !msg.messages || !Array.isArray(msg.messages)) {
      console.error("[Background Debug] Invalid message received (missing or invalid messages array).")
      port.postMessage({ error: "Invalid request: Missing or invalid messages array." })
      port.disconnect()
      return
    }

    const apiUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000/api/chat'
      : '/api/chat'
      
    console.log(`[Background Debug] Fetching API: ${apiUrl} with payload:`, msg)
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      })
      if (!response.ok || !response.body) {
        let errorBody = "Failed to fetch from backend."
        try {
          const errorJson = await response.json()
          errorBody = errorJson.error || JSON.stringify(errorJson)
        } catch (parseError) {
          errorBody = `Backend responded with status ${response.status}: ${response.statusText}`
        }
        port.postMessage({ error: errorBody })
        port.disconnect()
        console.log("[Background Debug] API fetch error, port disconnected.")
        return
      }
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const { value, done: streamDone } = await reader.read()
        if (value) {
          const chunkText = decoder.decode(value, { stream: true })
          port.postMessage({ chunk: chunkText })
        }
        done = streamDone
      }
      port.postMessage({ done: true })
      port.disconnect()
    } catch (error) {
      console.error("[Background Debug] Unexpected error during fetch:", error)
      port.postMessage({ error: error instanceof Error ? error.message : "Unknown error" })
      port.disconnect()
      console.log("[Background Debug] Unexpected error, port disconnected.")
    }
  })

  // Add listener for port disconnection
  port.onDisconnect.addListener(() => {
    console.log(`[Background Debug] Port ${port.name} disconnected.`)
  })
})

console.log("[Background Debug] callApiStream listener attached.") 