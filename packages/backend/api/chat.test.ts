import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from '@aws-sdk/client-bedrock-runtime';
import type { ChatMessage } from "@webcore/shared/messaging-types";
import handler from './chat';

// Mock the Bedrock client
const bedrockMock = mockClient(BedrockRuntimeClient);

// Mock environment variables (important!)
vi.stubEnv('AWS_ACCESS_KEY_ID', 'test-key-id')
vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'test-secret-key')
vi.stubEnv('AWS_REGION', 'us-west-2')

// --- Helper Functions ---

// Helper function to read the response stream fully
async function readStreamToString(stream: ReadableStream<Uint8Array> | null | undefined): Promise<string> {
    if (!stream) {
        throw new Error("Cannot read null or undefined stream.");
    }
    const reader = stream.getReader();
    let result = '';
    const decoder = new TextDecoder();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
    }
    return result;
}

// Helper function to create mock Bedrock stream events
const createMockDeltaEvent = (text: string) => ({
  chunk: { 
    bytes: new TextEncoder().encode(JSON.stringify({
      type: 'content_block_delta',
      index: 0, // Assuming single block for simplicity in tests
      delta: { type: 'text_delta', text }
    }))
  }
});

const createMockMessageStopEvent = () => ({
  chunk: {
    bytes: new TextEncoder().encode(JSON.stringify({
      type: 'message_stop',
      "amazon-bedrock-invocationMetrics": { /* ... metrics data */ }
    }))
  }
});

// Helper function to create mock Bedrock model error chunk
const createMockModelErrorChunk = (message: string = 'Simulated model error') => ({
  chunk: { 
    bytes: new TextEncoder().encode(JSON.stringify({
      type: 'error',
      error: { type: 'model_error', message }
    }))
  }
});

// Helper to create a mock Request object
function createMockRequest(method: string, body: any = null, headersInit: HeadersInit = {}): Request {
    const url = 'http://localhost/api/chat'; // Dummy URL
    const headers = new Headers(headersInit); 

    let bodyInit: BodyInit | null = null;
    if (body !== null) {
        try {
            bodyInit = JSON.stringify(body);
            if (!headers.has('Content-Type')) { 
                headers.set('Content-Type', 'application/json');
            }
        } catch (e) {
             if (typeof body === 'string') {
                bodyInit = body;
            } else {
                bodyInit = String(body);
            }
        }
    }
    
    const request = new Request(url, {
        method: method,
        headers: headers, 
        body: bodyInit,
    });
    return request;
}

// Helper to read JSON response body
async function readResponseJson(response: Response): Promise<any> {
    try {
        return await response.json();
    } catch (e) {
        console.error("Failed to parse response JSON", e);
        try {
            const text = await response.text();
            console.error("Response text on JSON parse failure:", text);
        } catch (textError) {
             console.error("Failed to read response text after JSON parse failure", textError);
        }
        throw e; 
    }
}

// --- Test Suites ---

describe('API Handler: /api/chat', () => {

    beforeEach(() => {
        bedrockMock.reset(); 
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
        
         bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({
            body: (async function*() { 
                 yield { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ type: 'message_start', message: {} })) } };
                 yield { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ type: 'message_stop' })) } };
             })() as AsyncIterable<any> 
        });
    });

    afterEach(() => {
        vi.restoreAllMocks(); 
    });

    // --- Group 1: Input Validation ---
    describe('Input Validation', () => {
        it('should reject non-POST requests with 405', async () => {
            const req = createMockRequest('GET');
            const response = await handler(req);
            expect(response.status).toBe(405);
            // Use readStreamToString for plain text response
            expect(await readStreamToString(response.body)).toContain('Method Not Allowed'); 
        });

        it('should reject POST requests with missing "messages" array with 400', async () => {
            const req = createMockRequest('POST', { someOtherData: 'value' });
            const response = await handler(req);
            expect(response.status).toBe(400);
            expect(await readResponseJson(response)).toEqual({ error: 'Invalid request body: messages array is required.' });
        });

        it('should reject POST requests with empty "messages" array with 400', async () => {
            const req = createMockRequest('POST', { messages: [] });
            const response = await handler(req);
            expect(response.status).toBe(400);
             expect(await readResponseJson(response)).toEqual({ error: 'Invalid request body: messages array is required.' });
        });

        it('should reject POST requests where "messages" is not an array with 400', async () => {
            const req = createMockRequest('POST', { messages: 'not-an-array' });
            const response = await handler(req);
            expect(response.status).toBe(400);
            expect(await readResponseJson(response)).toEqual({ error: 'Invalid request body: messages array is required.' });
        });
        
         it('should return 400 if request body is invalid JSON', async () => {
            const req = createMockRequest('POST', '{invalid json', { 'Content-Type': 'application/json'}); 
            const response = await handler(req);
            expect(response.status).toBe(400); 
            const responseBody = await readResponseJson(response);
            expect(responseBody).toHaveProperty('error');
            expect(responseBody.error).toBe('Invalid request body: messages array is required.');
         });
         
         it('should handle OPTIONS requests for CORS preflight', async () => {
            const req = createMockRequest('OPTIONS');
            const response = await handler(req);
            expect(response.status).toBe(204); 
            expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
         });
    });

    // --- Group 2: Bedrock Payload Formatting ---
    describe('Bedrock Payload Formatting', () => {

        // Helper to get the sent payload from the mock
        const getSentPayload = () => {
            const calls = bedrockMock.calls();
            expect(calls).toHaveLength(1);
            const command = calls[0].args[0] as InvokeModelWithResponseStreamCommand;
            
            let payloadString = "";
            const body = command.input.body;
            if (body instanceof Uint8Array) {
              payloadString = new TextDecoder().decode(body);
            } else if (typeof body === 'string') {
              payloadString = body;
            } else {
              throw new Error("Unexpected body type in mock call");
            }
            return JSON.parse(payloadString);
        };

        it('formats basic user message correctly', async () => {
            const messages: ChatMessage[] = [{ role: 'user', content: 'Hello there' }];
            const req = createMockRequest('POST', { messages });
            await handler(req);

            const payload = getSentPayload();
            expect(payload.system).toEqual([]);
            expect(payload.messages).toEqual([{ role: 'user', content: [{ type: 'text', text: 'Hello there' }] }]);
            expect(payload.anthropic_version).toBeDefined();
            expect(payload.max_tokens).toBeDefined();
        });

        it('formats alternating user/assistant messages correctly', async () => {
            const messages: ChatMessage[] = [
                { role: 'user', content: 'Question 1' },
                { role: 'assistant', content: 'Answer 1' },
                { role: 'user', content: 'Question 2' },
            ];
            const req = createMockRequest('POST', { messages });
            await handler(req);

            const payload = getSentPayload();
            expect(payload.system).toEqual([]);
            expect(payload.messages).toEqual([
                { role: 'user', content: [{ type: 'text', text: 'Question 1' }] },
                { role: 'assistant', content: [{ type: 'text', text: 'Answer 1' }] },
                { role: 'user', content: [{ type: 'text', text: 'Question 2' }] },
            ]);
        });

        it('includes system prompt and page context in "system" block', async () => {
            const messages: ChatMessage[] = [{ role: 'user', content: 'Summarize this page' }];
            const context = {
                systemPrompt: 'Act as a concise summarizer.',
                pageContent: 'This is the content.',
                title: 'Page Title',
                url: 'http://example.com'
            };
            const expectedPageContextText = 
                `Page Title: ${context.title}\nURL: ${context.url}\n--- Page Content Start ---\n${context.pageContent}\n--- Page Content End ---`;

            const req = createMockRequest('POST', { messages, context });
            await handler(req);

            const payload = getSentPayload();
            expect(payload.system).toEqual([
                { type: 'text', text: context.systemPrompt },
                { type: 'text', text: expectedPageContextText }
            ]);
            expect(payload.messages).toEqual([{ role: 'user', content: [{ type: 'text', text: 'Summarize this page' }] }]);
        });

        it('handles requests with context but no system prompt/page content', async () => {
             const messages: ChatMessage[] = [{ role: 'user', content: 'What is this?' }];
             const context = { title: 'Incomplete Page', url: 'http://incomplete.com' }; 

             const req = createMockRequest('POST', { messages, context });
             await handler(req);

             const payload = getSentPayload();
             expect(payload.system).toEqual([]); 
             expect(payload.messages).toEqual([{ role: 'user', content: [{ type: 'text', text: 'What is this?' }] }]);
        });
        
         it('handles requests with empty context object', async () => {
             const messages: ChatMessage[] = [{ role: 'user', content: 'No context here' }];
             const context = {}; 

             const req = createMockRequest('POST', { messages, context });
             await handler(req);

             const payload = getSentPayload();
             expect(payload.system).toEqual([]);
             expect(payload.messages).toEqual([{ role: 'user', content: [{ type: 'text', text: 'No context here' }] }]);
        });

        it('applies truncation before formatting', async () => {
             const highLimit = 900000; 
             const charsPerToken = 4;
             const tokensToExceed = highLimit + 100;
             const charsToExceed = tokensToExceed * charsPerToken;
             
             const messagesForTruncation: ChatMessage[] = [
                 { role: 'user', content: 'A'.repeat(charsToExceed) }, 
                 { role: 'assistant', content: 'Short answer.' },
                 { role: 'user', content: 'Newest question.' }, 
             ];
             const context = { systemPrompt: 'System instructions.' };

            const req = createMockRequest('POST', { messages: messagesForTruncation, context });
            await handler(req);
            const payload = getSentPayload();
            expect(payload.system).toEqual([{ type: 'text', text: context.systemPrompt }]);
            expect(payload.messages).toEqual([
                 { role: 'assistant', content: [{ type: 'text', text: 'Short answer.' }] },
                 { role: 'user', content: [{ type: 'text', text: 'Newest question.' }] },
            ]);
        });
    });

    // --- Group 3: Stream Processing & SSE Formatting ---
    describe('Stream Processing & SSE Formatting', () => {

        it('parses successful stream with text deltas into SSE format', async () => {
            const mockBedrockStream = (async function*() { 
                yield createMockDeltaEvent('Hello');
                yield createMockDeltaEvent(' ');
                yield createMockDeltaEvent('World');
                yield createMockMessageStopEvent();
            })();
            
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });

            const messages: ChatMessage[] = [{ role: 'user', content: 'Test' }];
            const req = createMockRequest('POST', { messages });
            const response = await handler(req);
            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toBe('text/event-stream');
            const responseBody = await readStreamToString(response.body);
            const expectedSSE = 
              `data: ${JSON.stringify({ content: 'Hello' })}\n\n` +
              `data: ${JSON.stringify({ content: ' ' })}\n\n` +
              `data: ${JSON.stringify({ content: 'World' })}\n\n`;
            expect(responseBody).toBe(expectedSSE);
        });

        it('handles multiple text deltas correctly (concatenated)', async () => {
            const mockBedrockStream = (async function*() { 
                yield createMockDeltaEvent('This is ');
                yield createMockDeltaEvent('a longer response.');
                yield createMockMessageStopEvent();
            })();
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });
            const req = createMockRequest('POST', { messages: [{ role: 'user', content: 'Long test' }] });
            const response = await handler(req);
            const responseBody = await readStreamToString(response.body);
            const expectedSSE = 
              `data: ${JSON.stringify({ content: 'This is ' })}\n\n` +
              `data: ${JSON.stringify({ content: 'a longer response.' })}\n\n`;
            expect(responseBody).toBe(expectedSSE);
        });

        it('ignores non-text delta chunks gracefully', async () => {
            const mockBedrockStream = (async function*() { 
                yield { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ type: 'message_start', message: {} })) } };
                yield createMockDeltaEvent('Data');
                yield { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text' } })) } };
                yield createMockDeltaEvent(' Again');
                 yield { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ type: 'content_block_stop', index: 0 })) } };
                yield createMockMessageStopEvent();
            })();
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });
            const req = createMockRequest('POST', { messages: [{ role: 'user', content: 'Ignore test' }] });
            const response = await handler(req);
            const responseBody = await readStreamToString(response.body);
            const expectedSSE = 
              `data: ${JSON.stringify({ content: 'Data' })}\n\n` +
              `data: ${JSON.stringify({ content: ' Again' })}\n\n`;
            expect(responseBody).toBe(expectedSSE);
        });

        it('handles empty text deltas without sending empty SSE events', async () => {
             const mockBedrockStream = (async function*() { 
                yield createMockDeltaEvent('Start');
                yield createMockDeltaEvent(''); 
                yield createMockDeltaEvent('End');
                yield createMockMessageStopEvent();
            })();
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });
            const req = createMockRequest('POST', { messages: [{ role: 'user', content: 'Empty delta test' }] });
            const response = await handler(req);
            const responseBody = await readStreamToString(response.body);
            const expectedSSE = 
              `data: ${JSON.stringify({ content: 'Start' })}\n\n` +
              `data: ${JSON.stringify({ content: 'End' })}\n\n`;
            expect(responseBody).toBe(expectedSSE);
        });
    });

    // --- Group 4: Error Handling ---
    describe('Error Handling', () => {
        it('returns 500 if bedrockClient.send() throws', async () => {
            const testError = new Error('Bedrock Send Failed');
            bedrockMock.on(InvokeModelWithResponseStreamCommand).rejects(testError);

            const messages: ChatMessage[] = [{ role: 'user', content: 'Test Send Error' }];
            const req = createMockRequest('POST', { messages });

            const response = await handler(req);
            expect(response.status).toBe(500);
            const body = await readResponseJson(response);
            expect(body).toEqual({ error: testError.message }); 
        });
        
        it('returns 500 if Bedrock stream yields an SDK error event', async () => {
            const sdkErrorMessage = 'Simulated SDK Throttling';
            const dataBeforeError = 'Some data...';
            const dataAfterError = 'BAD DATA'; 
            const mockBedrockStream = (async function*() { 
                yield createMockDeltaEvent(dataBeforeError);
                yield { throttlingException: { message: sdkErrorMessage } }; 
                yield createMockDeltaEvent(dataAfterError); 
            })();
            
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });

            const messages: ChatMessage[] = [{ role: 'user', content: 'Test SDK Stream Error' }];
            const req = createMockRequest('POST', { messages });
            const response = await handler(req);
            
            expect(response.status).toBe(200); 
            
            const expectedHandlerError = `Bedrock SDK error: ${sdkErrorMessage}`;
            await expect(readStreamToString(response.body)).rejects.toThrow(expectedHandlerError);
        });

        it('returns 500 if Bedrock stream yields a model error chunk', async () => {
            const modelErrorMessage = 'Model computation failed';
            const dataBeforeError = 'Valid delta';
            const dataAfterError = 'This should not appear'; 
            const mockBedrockStream = (async function*() { 
                yield createMockDeltaEvent(dataBeforeError);
                yield createMockModelErrorChunk(modelErrorMessage);
                yield createMockDeltaEvent(dataAfterError); 
                yield createMockMessageStopEvent();
            })();
            
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });

            const messages: ChatMessage[] = [{ role: 'user', content: 'Test Model Stream Error' }];
            const req = createMockRequest('POST', { messages });
            const response = await handler(req);

            expect(response.status).toBe(200);

            const expectedHandlerError = `Bedrock error: ${modelErrorMessage}`;
            await expect(readStreamToString(response.body)).rejects.toThrow(expectedHandlerError);
        });
        
        it('returns 500 if stream processing logic throws unexpected error', async () => {
            const unexpectedErrorMessage = 'Something broke during processing';
            const mockBedrockStream = (async function*() { 
                yield createMockDeltaEvent('Good data');
                throw new Error(unexpectedErrorMessage);
            })();
            
            bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({ body: mockBedrockStream as AsyncIterable<any> });
            
            const messages: ChatMessage[] = [{ role: 'user', content: 'Test Unexpected Error' }];
            const req = createMockRequest('POST', { messages });
            const response = await handler(req);

            expect(response.status).toBe(200);
            await expect(readStreamToString(response.body)).rejects.toThrow(unexpectedErrorMessage);
        });
    });
}); 