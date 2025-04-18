import { ChatMessage } from '@webcore/shared/types/messaging';
import { describe, it, expect } from 'vitest';

describe('Cross-package imports', () => {
  it('Can import ChatMessage from @webcore/shared/types/messaging', () => {
    const message: ChatMessage = {
      role: 'user',
      content: 'Test message'
    };
    expect(message.role).toBe('user');
    expect(message.content).toBe('Test message');
  });

  it('Object structure matches expected interface', () => {
    // This tests that we're getting the correct type definitions
    const message: ChatMessage = {
      role: 'assistant',
      content: 'Response message'
    };
    
    // These checks validate the structure matches what we expect
    expect(Object.keys(message).sort()).toEqual(['content', 'role'].sort());
    expect(['user', 'assistant', 'system']).toContain(message.role);
    expect(typeof message.content).toBe('string');
  });
}); 