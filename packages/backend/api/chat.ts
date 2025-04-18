import type { ChatMessage } from "@webcore/shared/messaging-types";
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime"; // AWS SDK Import
import { truncateMessages, estimateTokenCount } from "../src/utils/messageUtils"; // Import truncation utils

// --- API Key Management Note ---
// For local dev, AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, [AWS_SESSION_TOKEN]) 
// and region (AWS_REGION) are read from process.env (e.g., via .env file).
// For production, configure these securely in Vercel environment variables.

// --- Debug AWS Credentials --- 
console.log("[AWS Cred Debug] AWS_REGION:", process.env.AWS_REGION);
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const sessionToken = process.env.AWS_SESSION_TOKEN; // Optional
console.log("[AWS Cred Debug] AWS_ACCESS_KEY_ID set:", !!accessKeyId);
console.log("[AWS Cred Debug] AWS_SECRET_ACCESS_KEY set:", !!secretAccessKey);
console.log("[AWS Cred Debug] AWS_SESSION_TOKEN set:", !!sessionToken);
// --- End Debug --- 

// Check if essential credentials are provided
if (!accessKeyId || !secretAccessKey) {
  console.error("[AWS Cred Error] AWS Access Key ID or Secret Access Key missing in environment variables!");
  // Optionally, throw an error or handle appropriately for startup
  // For now, the client might still be instantiated but fail later.
}

// Instantiate AWS Bedrock Runtime Client
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-west-2", // Default region now us-west-2
  credentials: {
    accessKeyId: accessKeyId || "", 
    secretAccessKey: secretAccessKey || "", 
    sessionToken: sessionToken 
  },
});
console.log(`[AWS Cred Debug] BedrockRuntimeClient instantiated for region: ${bedrockClient.config.region} with EXPLICIT credentials.`); // Updated log

const ANTHROPIC_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"; // Use Sonnet GA Model ID

const CONTEXT_LIMIT_TOKENS = 900000; // Target for gpt-4o-mini, adjust as needed - <<< KEEPING YOUR INCREASED VALUE FOR NOW

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    // Handle preflight request
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.log("[Backend Debug] Method not allowed:", req.method);
    return new Response('Method Not Allowed', { status: 405, headers: corsHeadersJson });
  }

  let rawBody: string | null = null; // Variable to store raw body for logging
  try {
    // Log raw body first (if possible, edge runtime might make this tricky)
    try {
      rawBody = await req.text(); // Consume body as text
    } catch (e) {
      console.error("[Backend Debug] Error reading raw request body:", e);
      return new Response('Error reading request body', { status: 500, headers: corsHeadersJson });
    }

    // Parse the stored raw body
    const body = JSON.parse(rawBody);

    // Extract potential context and original messages
    const originalMessages: ChatMessage[] = body.messages;
    const context = body.context; // Keep context separate for now

    if (!originalMessages || !Array.isArray(originalMessages) || originalMessages.length === 0) {
      console.log("[Backend Debug] Invalid messages array:", originalMessages);
      const errorBody = { error: 'Invalid request body: messages array is required.' };
      return new Response(JSON.stringify(errorBody), { status: 400, headers: corsHeadersJson });
    }

    // --- Truncation Logic (using imported function) --- 
    // Apply truncation *only* to the message history, context handled separately
    const { truncatedMessages, wasTruncated } = truncateMessages(originalMessages, CONTEXT_LIMIT_TOKENS);
    // TODO: Re-evaluate if context should also be part of truncation estimation/budget

    if (wasTruncated) {
        const finalEstimatedTokens = estimateTokenCount(truncatedMessages);
        console.log(`[Backend] Message history truncation occurred. Final message count: ${truncatedMessages.length}, Estimated tokens: ${finalEstimatedTokens}`);
    }
    // --- End Truncation Logic ---

    // --- Adapt Payload for Bedrock Anthropic Messages API --- 
    // Define specific types for Bedrock payload components
    type BedrockTextBlock = { type: "text"; text: string };
    type BedrockMessageContent = BedrockTextBlock[]; // Assuming only text for now
    type BedrockMessage = { role: 'user' | 'assistant'; content: BedrockMessageContent };
    
    const systemBlocks: BedrockTextBlock[] = []; // Use defined type
    const bedrockMessages: BedrockMessage[] = []; // Use defined type

    // Explicitly add system prompt and page content from context if available
    if (context) { 
        console.log("[Backend] Using context from request body for system prompt.")
        if (context.systemPrompt) {
             systemBlocks.push({ type: "text", text: context.systemPrompt });
        }
        if (context.pageContent) {
            const pageContextBlock: BedrockTextBlock = { // Use defined type
                 type: "text", 
                 text: `Page Title: ${context.title || 'N/A'}\nURL: ${context.url || 'N/A'}\n--- Page Content Start ---\n${context.pageContent}\n--- Page Content End ---`
            }
            systemBlocks.push(pageContextBlock);
        } else {
            console.warn("[Backend] Context object provided but pageContent is missing.");
        }
    } else {
        console.log("[Backend] No context object found in request body.")
    }

    // Process only user/assistant messages from the (now potentially truncated) message history
    let currentRole: 'user' | 'assistant' | null = null;
    let currentContent: BedrockMessageContent = []; // Use defined type

    for (const message of truncatedMessages) { 
      // Skip any system messages that might still be in truncatedMessages (shouldn't happen if context separated)
      if (message.role === 'system') {
        console.warn("[Backend] Skipping unexpected system message found in truncated message history array:", message.content?.substring(0, 50));
        continue;
      }
      
      if (message.role === 'user' || message.role === 'assistant') {
        if (message.role !== currentRole && currentRole !== null) {
            bedrockMessages.push({ role: currentRole, content: currentContent });
            currentContent = [];
        }
        currentRole = message.role;
        // Ensure content is always a text block
        currentContent.push({ type: "text", text: message.content || "" }); 
      }
    }
    if (currentRole) {
        bedrockMessages.push({ role: currentRole, content: currentContent });
    }
    
    const finalBedrockMessages = bedrockMessages; 

    const bedrockPayload = {
      anthropic_version: "bedrock-2023-05-31",
      system: systemBlocks, 
      messages: finalBedrockMessages, 
      max_tokens: 4096, 
      temperature: 0.7, 
    };

    console.log("[Backend] Sending Payload to Bedrock:", JSON.stringify(bedrockPayload, null, 2));

    console.log("[AWS Cred Debug] About to send command to Bedrock..."); // Log before send
    // --- Replace OpenAI Fetch with Bedrock SDK Call --- 
    try {
      const command = new InvokeModelWithResponseStreamCommand({
        modelId: ANTHROPIC_MODEL_ID,
        contentType: "application/json",
        body: JSON.stringify(bedrockPayload),
        accept: "application/json", // Specify expected response type
      });
      
      const bedrockRes = await bedrockClient.send(command);
      
      console.log("[Backend] Bedrock API response status: OK (stream starting)");
      
      if (!bedrockRes.body) {
          throw new Error("Bedrock response body is undefined.");
      }

      // ** TODO: Implement Bedrock Stream Parsing and Re-formatting **
      // The old direct piping logic is commented out below
      // We need to create a *new* ReadableStream here, read from bedrockRes.body,
      // parse the Bedrock/Anthropic chunks, extract the text delta, 
      // format it as SSE (data: {...}\n\n), and push it to the new stream.
      
      const outputStream = new ReadableStream({ 
          async start(controller) {
              console.log("[Backend] Starting Bedrock stream processing...");
              const decoder = new TextDecoder();
              try {
                  console.log("[Backend Stream Debug] Entered stream processing try block.");
                  let eventCount = 0;
                  let sdkErrorOccurred = false; // Flag to stop processing after SDK error
                  // Iterate through the async iterable stream
                  for await (const event of bedrockRes.body!) {
                       // Immediately skip if error occurred previously
                       if (sdkErrorOccurred) continue;

                       eventCount++; 

                       // Only process if no error has occurred *yet*
                       if (!sdkErrorOccurred) {
                            let processed = false;
                            if (event.chunk?.bytes) {
                                const chunkJsonString = decoder.decode(event.chunk.bytes, { stream: true });
                                try {
                                    const potentialJsons = chunkJsonString.split('\n').filter(s => s.trim() !== '');
                                    for (const singleJsonString of potentialJsons) {
                                      const bedrockChunk = JSON.parse(singleJsonString);
                                      
                                      if (bedrockChunk.type === 'content_block_delta' && bedrockChunk.delta?.type === 'text_delta') {
                                          processed = true; // Mark as processed
                                          const textDelta = bedrockChunk.delta.text;
                                          console.log(`[Backend Stream Debug] Event #${eventCount}: Found text delta: "${textDelta}"`); // Log delta
                                          if (textDelta) { // Ensure delta is not empty
                                            const ssePayload = { content: textDelta };
                                            const sseFormattedChunk = `data: ${JSON.stringify(ssePayload)}\n\n`;
                                            console.log(`[Backend Stream Debug] Event #${eventCount}: Enqueuing SSE chunk: ${JSON.stringify(ssePayload)}`); // Log before enqueue
                                            controller.enqueue(new TextEncoder().encode(sseFormattedChunk));
                                          } else {
                                            console.log(`[Backend Stream Debug] Event #${eventCount}: Delta text was empty, skipping enqueue.`);
                                          }
                                      } else if (bedrockChunk.type === 'message_stop') {
                                          processed = true; // Mark as processed
                                          console.log(`[Backend Stream Debug] Event #${eventCount}: Bedrock message_stop received.`);
                                      } else if (bedrockChunk.type === 'error') {
                                          processed = true; // Mark as processed
                                          console.error(`[Backend Stream Debug] Event #${eventCount}: Bedrock stream error chunk:`, bedrockChunk);
                                          controller.error(new Error(`Bedrock error: ${bedrockChunk.error?.message || 'Unknown'}`));
                                      } else {
                                          // Log other known/expected chunk types we are intentionally skipping
                                          if (['message_start', 'content_block_start', 'content_block_stop'].includes(bedrockChunk.type)) {
                                              processed = true; // Mark as processed (intentionally ignored)
                                              // console.log(`[Backend Stream Debug] Event #${eventCount}: Ignoring known chunk type: ${bedrockChunk.type}`);
                                          } else {
                                              // Log if it's an unknown type *after* JSON parsing
                                              console.warn(`[Backend Stream Debug] Event #${eventCount}: Received unhandled Bedrock chunk type after parse: ${bedrockChunk.type}`);
                                          }
                                      }
                                    }
                                } catch (jsonError) {
                                    console.error(`[Backend Stream Debug] Event #${eventCount}: Error parsing Bedrock chunk JSON:`, jsonError, "Chunk String:", chunkJsonString);
                                    // If JSON parsing fails, we didn't process it
                                }
                            } else if (event.internalServerException || event.modelStreamErrorException || event.throttlingException || event.validationException) {
                               processed = true; 
                               const errorDetails = event.internalServerException || event.modelStreamErrorException || event.throttlingException || event.validationException;
                               console.error("[Backend Stream Debug] SDK Stream Error Event:", errorDetails);
                               controller.error(new Error(`Bedrock SDK error: ${errorDetails?.message || 'Unknown SDK stream error'}`));
                               console.log("[Backend Stream Debug] Setting SDK error flag and breaking loop."); // Updated log
                               sdkErrorOccurred = true; // Set flag
                               break; // Exit the loop immediately after SDK error
                           }
                           // Log if the event was not processed by any known handler
                           if (!processed) {
                                console.log(`[Backend Stream Debug] Event #${eventCount}: Was not processed (no chunk bytes, SDK error, or known delta/error type). Event:`, JSON.stringify(event));
                           }
                       } // End of if (!sdkErrorOccurred) block for processing
                  }
                  // After the loop finishes naturally (or stops due to flag)
                  console.log(`[Backend Stream Debug] Bedrock async iteration finished after ${eventCount} events.`); 
                  if (!sdkErrorOccurred) {
                    controller.close(); // Only close if no SDK error occurred
                  }
              } catch (streamError) {
                  console.error("[Backend Stream Debug] Error iterating Bedrock stream (in catch block):", streamError);
                  controller.error(streamError);
              } 
          }
      });

      // Return the reformatted SSE stream
      return new Response(outputStream, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });

      /* --- OLD OpenAI Piping Logic (Commented Out) ---
      console.log("[Backend Debug] Piping OpenAI stream response to client.");
      // Pipe the OpenAI response stream directly to the client
      return new Response(openaiRes.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
        },
      });
      */
    } catch (error) {
       // Log specific Bedrock errors if possible
       console.error("[Backend] Error invoking Bedrock model:", error);
       // Add more detail about the error if available
       if (error instanceof Error) {
         console.error("[AWS Cred Debug] Error Name:", error.name);
         console.error("[AWS Cred Debug] Error Message:", error.message);
         console.error("[AWS Cred Debug] Error Stack:", error.stack);
       }
       let errorMessage = "Error communicating with AI model.";
       const statusCode = 500;
       if (error instanceof Error) {
         // Check for specific AWS SDK error types if needed
         errorMessage = error.message;
         // You might check error.name or error.$metadata for AWS-specific details
         // if (error.name === 'AccessDeniedException') statusCode = 403;
         // if (error.name === 'ResourceNotFoundException') statusCode = 404;
         // etc.
       }
       return new Response(JSON.stringify({ error: errorMessage }), {
         status: statusCode,
         headers: corsHeadersJson,
       });
    }

  } catch (error) {
    console.error("[Backend] General error in handler:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: corsHeadersJson,
    });
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const corsHeadersJson = {
  ...corsHeaders,
  'Content-Type': 'application/json',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
} 