import { describe, it, expect, vi } from 'vitest'
import type { ChatMessage } from "@webcore/shared/types/messaging"
import { truncateMessages, estimateTokenCount } from './messageUtils'

// Mock console.warn to prevent excessive test output
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

// Helper to create dummy messages
const createMsg = (role: 'system' | 'user' | 'assistant', length: number): ChatMessage => ({
  role,
  content: 'A'.repeat(length)
});

describe('truncateMessages', () => {

  it('should not truncate if messages are within the limit', () => {
    const limit = 100;
    const messages: ChatMessage[] = [
      createMsg('system', 50), // ~13 tokens
      createMsg('user', 100),   // ~25 tokens
      createMsg('assistant', 50) // ~13 tokens
    ]; // Total ~51 tokens
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    expect(wasTruncated).toBe(false);
    expect(truncatedMessages).toEqual(messages);
    expect(estimateTokenCount(truncatedMessages)).toBeLessThanOrEqual(limit);
  });

  it('should truncate older history messages first', () => {
    const limit = 50; // Low limit
    const messages: ChatMessage[] = [
      createMsg('system', 20),    // ~5 tokens (essential)
      createMsg('user', 100),     // ~25 tokens (oldest history)
      createMsg('assistant', 100),// ~25 tokens 
      createMsg('user', 100),     // ~25 tokens (newest history)
    ]; // Total ~80 tokens
    
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    
    expect(wasTruncated).toBe(true);
    expect(truncatedMessages).toHaveLength(2);
    expect(truncatedMessages[0].role).toBe('system');
    expect(truncatedMessages[1].role).toBe('user');
    expect(truncatedMessages[1].content).toBe('A'.repeat(100));
    expect(estimateTokenCount(truncatedMessages)).toBeLessThanOrEqual(limit);
  });

  it('should keep multiple system messages if they fit', () => {
    const limit = 50;
    const messages: ChatMessage[] = [
      createMsg('system', 20), // ~5 tokens
      createMsg('system', 40), // ~10 tokens (total system ~15)
      createMsg('user', 200),   // ~50 tokens (old history)
      createMsg('user', 20),    // ~5 tokens (new history)
    ]; // Total ~70 tokens
    
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    
    expect(wasTruncated).toBe(true);
    expect(truncatedMessages).toHaveLength(3); // Both system + newest user
    expect(truncatedMessages[0].role).toBe('system');
    expect(truncatedMessages[1].role).toBe('system');
    expect(truncatedMessages[2].role).toBe('user');
    expect(truncatedMessages[2].content).toBe('A'.repeat(20)); // Newest user
    expect(estimateTokenCount(truncatedMessages)).toBeLessThanOrEqual(limit);
  });

  it('should return only system messages if they alone exceed the limit', () => {
    const limit = 10;
    const messages: ChatMessage[] = [
      createMsg('system', 50), // ~13 tokens
      createMsg('user', 20),    // ~5 tokens
    ];
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    expect(wasTruncated).toBe(true);
    expect(truncatedMessages).toHaveLength(1);
    expect(truncatedMessages[0].role).toBe('system');
  });
  
   it('should return only system messages if multiple system messages exceed the limit', () => {
    const limit = 15;
    const messages: ChatMessage[] = [
      createMsg('system', 30), // ~8 tokens
      createMsg('system', 40), // ~10 tokens (total ~18)
      createMsg('user', 20),    // ~5 tokens
    ];
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    expect(wasTruncated).toBe(true);
    expect(truncatedMessages).toHaveLength(2);
    expect(truncatedMessages[0].role).toBe('system');
    expect(truncatedMessages[1].role).toBe('system');
  });

  it('should handle cases exactly at the limit', () => {
    const limit = 51; // Exactly fits initial estimate
    const messages: ChatMessage[] = [
      createMsg('system', 50), // ~13 tokens
      createMsg('user', 100),   // ~25 tokens
      createMsg('assistant', 50) // ~13 tokens
    ]; // Total ~51 tokens
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    expect(wasTruncated).toBe(false); // Should not truncate
    expect(truncatedMessages).toEqual(messages);
  });

   it('should handle no system messages correctly', () => {
    const limit = 50;
    const messages: ChatMessage[] = [
      createMsg('user', 100),     // ~25 tokens (oldest)
      createMsg('assistant', 100),// ~25 tokens
      createMsg('user', 100),     // ~25 tokens (newest)
    ]; // Total ~75 tokens
    const { truncatedMessages, wasTruncated } = truncateMessages(messages, limit);
    expect(wasTruncated).toBe(true);
    expect(truncatedMessages).toHaveLength(2); // assistant + last user
    expect(truncatedMessages[0].role).toBe('assistant');
    expect(truncatedMessages[1].role).toBe('user');
    expect(estimateTokenCount(truncatedMessages)).toBeLessThanOrEqual(limit);
  });
}); 