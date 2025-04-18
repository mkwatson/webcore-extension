// packages/extension/jest.setup.ts

// Add NodeJS types for global references
/// <reference types="node" />

// Define a port type for better type checking in tests
type MockPort = {
  postMessage: jest.Mock;
  onMessage: {
    addListener: jest.Mock;
    listeners?: Array<(message: Record<string, unknown>) => void>;
  };
  onDisconnect: {
    addListener: jest.Mock;
    listeners?: Array<() => void>;
  };
  disconnect: jest.Mock;
};

// Mock the chrome API globally for Jest tests
// We use a simplified mock for the Chrome API in tests
// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    connect: jest.fn(() => {
      const port: MockPort = {
        postMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn((callback) => {
            // Store listeners to allow tests to trigger them
            if (!port.onMessage.listeners) {
              port.onMessage.listeners = [];
            }
            port.onMessage.listeners.push(callback);
            
            // Return the listener for test convenience
            return callback;
          }),
          listeners: []
        },
        onDisconnect: {
          addListener: jest.fn((callback) => {
            // Store listeners to allow tests to trigger them
            if (!port.onDisconnect.listeners) {
              port.onDisconnect.listeners = [];
            }
            port.onDisconnect.listeners.push(callback);
            
            // Return the listener for test convenience
            return callback;
          }),
          listeners: []
        },
        disconnect: jest.fn()
      };
      
      // Store the port for test access
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global.chrome.runtime as any)._lastPort = port;
      
      return port;
    }),
    onConnect: {
      addListener: jest.fn()
    },
    // Store reference to mock port for testing
    _lastPort: null as unknown
  },
  tabs: {
    query: jest.fn().mockResolvedValue([{ id: 1 }]),
    sendMessage: jest.fn().mockImplementation(() => {
      return Promise.resolve({ 
        type: "GET_CONTENT_RESPONSE",
        payload: {
          title: "Test Page Title",
          markdownContent: "This is the page content.",
          url: "http://example.com"
        }
      });
    })
  }
  // Add other chrome namespaces if needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any // Using any for test simplicity

// Mock scrollIntoView for JSDOM environment
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
}

// This makes TypeScript treat this file as a module
export {}
