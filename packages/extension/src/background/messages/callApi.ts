import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { ChatMessage } from "@webcore/shared/types/messaging"

// Define the expected request body and response body types
interface CallApiRequestBody {
  messages: ChatMessage[];
}

interface CallApiResponse {
  // Successfully received message
  message?: ChatMessage;
  // Error details if the API call failed
  error?: string;
}

const handler: PlasmoMessaging.MessageHandler<
  CallApiRequestBody,
  CallApiResponse
> = async (req, res) => {
  console.log("[Background Message Handler - callApi] Received request:", req.body);

  if (!req.body || !req.body.messages) {
    console.error("[callApi] Invalid request: Missing messages.");
    return res.send({ error: "Invalid request: Missing messages." });
  }

  const { messages } = req.body;

  // Determine the API endpoint URL
  // Use relative URL for production/staging (same origin)
  // Use localhost for development (ensure backend runs on 3000)
  const apiUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/chat' 
    : '/api/chat'; 

  console.log(`[callApi] Sending ${messages.length} messages to ${apiUrl}`);

  // --- DIAGNOSIS LOGGING ---
  console.log("[DIAGNOSIS] Extension sending request:", {
    messageCount: messages.length,
    targetUrl: apiUrl,
    timestamp: new Date().toISOString()
  });
  // --- END DIAGNOSIS LOGGING ---

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    console.log(`[callApi] Received response status: ${response.status}`);

    // --- DIAGNOSIS LOGGING ---
    console.log("[DIAGNOSIS] Extension received response:", {
      status: response.status,
      statusText: response.statusText,
      hasBody: !!response.body,
      timestamp: new Date().toISOString()
    });
    // --- END DIAGNOSIS LOGGING ---

    if (!response.ok) {
      // Attempt to parse error from backend response body
      let errorBody = "Failed to fetch from backend.";
      try {
        const errorJson = await response.json();
        errorBody = errorJson.error || JSON.stringify(errorJson);
      } catch (parseError) {
        // If parsing fails, use the status text
        errorBody = `Backend responded with status ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorBody);
    }

    // --- MVP: Read the entire stream --- 
    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Response body is not readable.");
    }
    const decoder = new TextDecoder();
    let fullText = "";
    let chunk = await reader.read();
    while (!chunk.done) {
        fullText += decoder.decode(chunk.value, { stream: true });
        chunk = await reader.read();
    }
    // Decode any final bytes
    fullText += decoder.decode(); 
    console.log("[callApi] Successfully read full streamed response.");
    // --- End MVP Stream Reading ---

    // Send the complete message back
    res.send({
      message: {
        role: "assistant",
        content: fullText,
      },
    });

  } catch (error) {
    console.error("[callApi] Error fetching or processing API response:", error);
    
    // --- DIAGNOSIS LOGGING ---
    console.log("[DIAGNOSIS] Extension encountered error:", {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
    // --- END DIAGNOSIS LOGGING ---
    
    res.send({ error: error instanceof Error ? error.message : "An unknown error occurred." });
  }
};

export default handler; 