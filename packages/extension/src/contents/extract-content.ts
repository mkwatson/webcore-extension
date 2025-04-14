import { Readability } from "@mozilla/readability"
// Import types using package name (enabled by TS project references)
import type {
  ContentScriptRequest,
  ExtractedContent,
  GetContentResponse
} from "@webcore/shared/messaging-types"
import type { PlasmoContentScript } from "plasmo"
import TurndownService from "turndown"

// Assuming package name is @webcore/shared

// Tell Plasmo to inject this script into all pages
export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  run_at: "document_idle"
}

// Error messages used in the extraction process
const ERROR_MESSAGES = {
  READABILITY_PARSE: "Failed to parse page content with Readability.",
  READABILITY_NULL:
    "Readability could not extract main content from this page.",
  EMPTY_CONTENT: "Extracted article content is empty.",
  TURNDOWN_FAIL: "Failed to convert extracted content to Markdown."
}

// Log prefix for all console messages
const LOG_PREFIX = "[WebCore Content Script]"

/**
 * Extracts readable content from the current page using Readability and converts it to Markdown
 * @param options Optional parameters for testing
 * @returns Extracted content object or error object
 */
export const extractReadableContent = (options?: {
  testUrl?: string
}): ExtractedContent | { error: string } => {
  // Use a clone of the document to avoid modifying the live page
  const documentClone = document.cloneNode(true) as Document
  let article: ReturnType<Readability["parse"]>

  try {
    const readability = new Readability(documentClone)
    article = readability.parse()
  } catch (e) {
    console.error(`${LOG_PREFIX} Readability parsing failed:`, e)
    return { error: ERROR_MESSAGES.READABILITY_PARSE }
  }

  if (!article) {
    console.warn(`${LOG_PREFIX} Readability could not parse the article.`)
    return { error: ERROR_MESSAGES.READABILITY_NULL }
  }

  // Ensure article content exists before trying to convert
  if (!article.content) {
    console.warn(`${LOG_PREFIX} Readability article content is empty.`)
    return { error: ERROR_MESSAGES.EMPTY_CONTENT }
  }

  let markdownContent: string
  try {
    const turndownService = new TurndownService({ headingStyle: "atx" })
    markdownContent = turndownService.turndown(article.content)
  } catch (e) {
    console.error(`${LOG_PREFIX} Turndown conversion failed:`, e)
    return { error: ERROR_MESSAGES.TURNDOWN_FAIL }
  }

  // Use the testUrl if provided (for testing), otherwise use window.location.href
  const url = options?.testUrl || window.location.href
  console.log(`${LOG_PREFIX} Extracted:`, { title: article.title, url })

  return {
    title: article.title || document.title, // Fallback to document.title
    markdownContent,
    url
  }
}

// Listen for messages from the extension (e.g., sidebar)
chrome.runtime.onMessage.addListener(
  (request: ContentScriptRequest, sender, sendResponse) => {
    console.log(`${LOG_PREFIX} Received message:`, request)

    if (request.type === "GET_CONTENT_REQUEST") {
      const result = extractReadableContent()

      let response: GetContentResponse
      if ("error" in result) {
        response = { type: "GET_CONTENT_RESPONSE", error: result.error }
      } else {
        response = { type: "GET_CONTENT_RESPONSE", payload: result }
      }

      console.log(`${LOG_PREFIX} Sending response:`, response)
      // Use sendResponse to reply asynchronously (important!)
      sendResponse(response)
      // Indicate that the response will be sent asynchronously
      return true
    }

    // Handle other message types here in the future if needed
    return false // Indicate sync response or no response for unhandled types
  }
)

// Log to confirm the script is injected and running
console.log(`${LOG_PREFIX} Injected and listening for messages.`)

// Export {} is not strictly needed here because we have top-level imports and exports,
// but can be kept for consistency if preferred.
// export {};
