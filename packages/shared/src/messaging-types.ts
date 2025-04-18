// Common types for messaging between extension components

export interface GetContentRequest {
  type: 'GET_CONTENT_REQUEST'
}

export interface ExtractedContent {
  title: string
  markdownContent: string
  url: string
}

export interface GetContentResponse {
  type: 'GET_CONTENT_RESPONSE'
  payload?: ExtractedContent // Present on success
  error?: string // Present on failure
}

// Union type for messages handled by the content script
export type ContentScriptRequest = GetContentRequest // Add others later if needed

// Union type for messages sent FROM the content script (responses)
export type ContentScriptResponse = GetContentResponse // Add others later if needed

// Chat Message Type
export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  // Optional timestamp or message ID could be added later
}

// This file is maintained for backward compatibility.
// New code should import from '@webcore/shared/types/messaging'
export * from './types/messaging';
