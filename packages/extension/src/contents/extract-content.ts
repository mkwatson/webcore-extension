import type { PlasmoContentScript } from "plasmo";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
// Import types from within the extension package
import type {
  ContentScriptRequest,
  ExtractedContent,
  GetContentResponse,
} from "../types/messaging-types"; // Updated path (relative from contents dir)

// Tell Plasmo to inject this script into all pages
export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  run_at: "document_idle",
};

// Export the core logic function for testability
export const extractReadableContent = (): ExtractedContent | { error: string } => {
  // Use a clone of the document to avoid modifying the live page
  const documentClone = document.cloneNode(true) as Document;
  let article: ReturnType<Readability['parse']>;

  try {
    const readability = new Readability(documentClone);
    article = readability.parse();
  } catch (e) {
    console.error("[WebCore Content Script] Readability parsing failed:", e);
    return { error: "Failed to parse page content with Readability." };
  }

  if (!article) {
    console.warn("[WebCore Content Script] Readability could not parse the article.");
    return { error: "Readability could not extract main content from this page." };
  }

  // Ensure article content exists before trying to convert
  if (!article.content) {
    console.warn("[WebCore Content Script] Readability article content is empty.");
    return { error: "Extracted article content is empty." };
  }

  let markdownContent: string;
  try {
    const turndownService = new TurndownService({ headingStyle: "atx" });
    markdownContent = turndownService.turndown(article.content);
  } catch (e) {
    console.error("[WebCore Content Script] Turndown conversion failed:", e);
    return { error: "Failed to convert extracted content to Markdown." };
  }

  console.log("[WebCore Content Script] Extracted:", { title: article.title, url: window.location.href });

  return {
    title: article.title || document.title, // Fallback to document.title
    markdownContent,
    url: window.location.href,
  };
};

// Listen for messages from the extension (e.g., sidebar)
chrome.runtime.onMessage.addListener((request: ContentScriptRequest, sender, sendResponse) => {
  console.log("[WebCore Content Script] Received message:", request);

  if (request.type === "GET_CONTENT_REQUEST") {
    const result = extractReadableContent();

    let response: GetContentResponse;
    if ("error" in result) {
      response = { type: "GET_CONTENT_RESPONSE", error: result.error };
    } else {
      response = { type: "GET_CONTENT_RESPONSE", payload: result };
    }

    console.log("[WebCore Content Script] Sending response:", response);
    // Use sendResponse to reply asynchronously (important!)
    sendResponse(response);
    // Indicate that the response will be sent asynchronously
    return true;
  }

  // Handle other message types here in the future if needed
  return false; // Indicate sync response or no response for unhandled types
});

// Log to confirm the script is injected and running
console.log("[WebCore Content Script] Injected and listening for messages.");

// Export {} is not strictly needed here because we have top-level imports and exports,
// but can be kept for consistency if preferred.
// export {}; 