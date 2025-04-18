import type { PlasmoMessaging } from "@plasmohq/messaging"
// Import only what's being used
import type {
  GetContentRequest,
  GetContentResponse
} from "@webcore/shared/types/messaging"

// Type the request body to match what sendToBackground sends
const handler: PlasmoMessaging.MessageHandler<
  GetContentRequest, // Expect the specific request type
  GetContentResponse // Will send GetContentResponse format
> = async (req, res) => {
  // The req.body will now be correctly typed as GetContentRequest | undefined
  // Note: Plasmo docs suggest req.body might be undefined if sender doesn't send body
  console.log("[WebCore Background] Received getContent message body:", req.body)

  try {
    // 1. Find the active tab in the current window
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })

    if (!tab || !tab.id) {
      throw new Error("Could not find active tab.")
    }

    // 2. Forward the GET_CONTENT_REQUEST to the content script in that tab
    // Note: The content script still uses chrome.runtime.onMessage
    const contentScriptRequest: GetContentRequest = { type: "GET_CONTENT_REQUEST" }
    console.log(
      `[WebCore Background] Forwarding message to tab ${tab.id}:`,
      contentScriptRequest
    )

    const responseFromContentScript: GetContentResponse = await chrome.tabs.sendMessage(
      tab.id,
      contentScriptRequest
    )

    console.log(
      "[WebCore Background] Received response from content script:",
      responseFromContentScript
    )

    // 3. Send the response (or error) back to the original sender (sidepanel)
    res.send(responseFromContentScript)

  } catch (error) {
    console.error("[WebCore Background] Error handling getContent:", error)
    // Send an error response back
    res.send({
      type: "GET_CONTENT_RESPONSE",
      error:
        error instanceof Error ? error.message : "An unknown background error occurred."
    })
  }
}

export default handler 