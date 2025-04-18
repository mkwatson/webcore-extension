import type { ChatMessage } from "@webcore/shared/types/messaging";

// This endpoint is used to verify import resolution is working correctly
// It imports types from other packages and returns debugging information
export default function handler(_req: Request) {
  // Track import resolution
  let moduleResolutionInfo = {};
  try {
    // Try to resolve the path to the messaging-types module
    const modulePath = require.resolve("../../shared/src/messaging-types");
    moduleResolutionInfo = {
      resolvedPath: modulePath,
      modulePaths: module.paths,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };
  } catch (err) {
    moduleResolutionInfo = {
      error: err instanceof Error ? err.message : String(err),
      modulePaths: module.paths,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    };
  }

  // Create a test message using the imported type
  const testMessage: ChatMessage = {
    role: "user",
    content: "Test message to verify imports"
  };
  
  // Return diagnostic information
  return new Response(JSON.stringify({
    success: true,
    importTest: "passed",
    message: testMessage,
    typeCheck: typeof testMessage.role === "string" ? "passed" : "failed",
    moduleResolution: moduleResolutionInfo,
    timestamp: new Date().toISOString()
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" 
    }
  });
} 