import type { ChatMessage } from "@webcore/shared/types/messaging";

const CHARS_PER_TOKEN = 4; // Rough estimate, may need adjustment for Claude

export function estimateTokenCount(messages: ChatMessage[]): number {
  let totalChars = 0;
  for (const message of messages) {
    totalChars += message.content?.length || 0;
  }
  return Math.ceil(totalChars / CHARS_PER_TOKEN);
}

// Updated function to prioritize keeping system messages
export function truncateMessages(messages: ChatMessage[], limit: number): { truncatedMessages: ChatMessage[], wasTruncated: boolean } {
  const initialTokenCount = estimateTokenCount(messages);
  if (initialTokenCount <= limit) {
    return { truncatedMessages: messages, wasTruncated: false };
  }

  const essentialSystemMessages: ChatMessage[] = [];
  const historyMessages: ChatMessage[] = [];
  let essentialTokens = 0;

  // Identify essential system messages (instructions + potential page context)
  if (messages[0]?.role === 'system') {
    essentialSystemMessages.push(messages[0]);
    essentialTokens += estimateTokenCount([messages[0]]);
    if (messages[1]?.role === 'system') {
      essentialSystemMessages.push(messages[1]);
      essentialTokens += estimateTokenCount([messages[1]]);
      // Add remaining messages to history
      historyMessages.push(...messages.slice(2));
    } else {
      // Only first message was system, add rest to history
      historyMessages.push(...messages.slice(1));
    }
  } else {
    // No system messages found at the start, treat all as history
    historyMessages.push(...messages);
  }

  // Check if essential messages alone exceed the limit
  if (essentialTokens > limit) {
    console.warn(`[Backend Truncation] Essential system messages (${essentialTokens} tokens) exceed limit (${limit}). Returning only essential messages.`);
    // Return only essential messages if they alone exceed the limit.
    // Depending on the exact limit and message sizes, this might still fail OpenAI's hard limit,
    // but it's the best we can do without truncating the essentials.
    return { truncatedMessages: essentialSystemMessages, wasTruncated: true };
  }

  const remainingBudget = limit - essentialTokens;
  const truncatedHistory: ChatMessage[] = [];
  let historyTokens = 0;

  // Iterate history backwards (newest first)
  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const message = historyMessages[i];
    const messageTokens = estimateTokenCount([message]);
    if (historyTokens + messageTokens <= remainingBudget) {
      truncatedHistory.push(message);
      historyTokens += messageTokens;
    } else {
      // Stop adding messages once budget is exceeded
      break;
    }
  }

  // Reverse truncatedHistory to restore chronological order
  truncatedHistory.reverse();

  const finalMessages = [...essentialSystemMessages, ...truncatedHistory];
  const finalTokens = estimateTokenCount(finalMessages);

  console.log(`[Backend Truncation] Truncation occurred. Input: ${initialTokenCount}, Output: ${finalTokens} tokens (Limit: ${limit}). Final message count: ${finalMessages.length}`);

  return { truncatedMessages: finalMessages, wasTruncated: true };
} 