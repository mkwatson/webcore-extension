// Properly typed chrome API mock object for tests
const addListenerMock = jest.fn();
const removeListenerMock = jest.fn();

export const chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
    onInstalled: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
  action: {
    setIcon: jest.fn(),
    setTitle: jest.fn(),
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }
};

// Set up proper mock implementation functions
(chrome.tabs.query as jest.Mock).mockImplementation = jest.fn();
(chrome.storage.local.get as jest.Mock).mockImplementation = jest.fn();
(chrome.storage.local.set as jest.Mock).mockImplementation = jest.fn();

// Using a proper type-safe approach to patch document.addEventListener
if (typeof document !== 'undefined') {
  // Save the original
  const originalAddEventListener = document.addEventListener;
  
  // Create a mock function with proper typing
  const mockAddEventListener = jest.fn<void, [string, EventListenerOrEventListenerObject, (boolean | AddEventListenerOptions)?]>(
    (type, listener, options) => {
      return originalAddEventListener.call(document, type, listener, options);
    }
  );
  
  // Replace the original
  document.addEventListener = mockAddEventListener;
}

// Make chrome available globally
Object.defineProperty(global, 'chrome', {
  value: chrome
}); 