// Import chrome from jest-chrome for better type support
import { chrome } from 'jest-chrome';
import { SidebarPanel } from '../../src/content/SidebarPanel';

// Define proper types for storage mocks
type StorageCallback = (result: { [key: string]: any }) => void;
type StorageGetMock = (keys: string | string[] | null | { [key: string]: any }, callback?: StorageCallback) => void;
type StorageSetMock = (items: { [key: string]: any }, callback?: () => void) => void;

// Mock implementation for chrome.storage.local.get
const createStorageGetMock = (initialData: { [key: string]: any } = {}) => {
  return (keys: string | string[] | { [key: string]: any } | null, callback?: StorageCallback) => {
    let result: { [key: string]: any } = {};

    if (keys === null) {
      // Return all data if keys is null
      result = { ...initialData };
    } else if (typeof keys === 'string') {
      // Single key lookup
      result[keys] = initialData[keys] || null;
    } else if (Array.isArray(keys)) {
      // Array of keys
      keys.forEach(key => {
        result[key] = initialData[key] || null;
      });
    } else {
      // Object with default values
      Object.keys(keys).forEach(key => {
        result[key] = initialData[key] !== undefined ? initialData[key] : keys[key];
      });
    }

    if (callback) {
      callback(result);
    }
  };
};

// Mock implementation for chrome.storage.local.set
const createStorageSetMock = () => {
  return (items: { [key: string]: any }, callback?: () => void) => {
    if (callback) {
      callback();
    }
  };
};

// Mock window.location.hostname
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'example.com'
  }
});

// Mock the SidebarPanel class
jest.mock('../../src/content/SidebarPanel', () => {
  return {
    SidebarPanel: jest.fn().mockImplementation(() => {
      return {
        toggle: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        loadSavedSettings: jest.fn(),
      };
    }),
  };
});

describe('Content Script', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset the module registry before each test
    jest.resetModules();
    
    // Set up mock implementations for Chrome API methods with proper typing
    (chrome.storage.local.get as jest.Mock).mockImplementation(createStorageGetMock());
    (chrome.storage.local.set as jest.Mock).mockImplementation(createStorageSetMock());

    // Mock console methods to prevent noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console mocks
    jest.restoreAllMocks();
  });
  
  test('should initialize SidebarPanel when loaded', () => {
    // Import the content script
    const contentScript = require('../../src/content/content');
    
    // Verify SidebarPanel was created
    const { SidebarPanel } = require('../../src/content/SidebarPanel');
    expect(SidebarPanel).toHaveBeenCalled();
    expect(contentScript.sidebarPanel).toBeDefined();
  });
  
  test('should set up message listener for sidebar toggle', () => {
    // Create a spy on the addListener method
    const addListenerSpy = jest.spyOn(chrome.runtime.onMessage, 'addListener');
    
    // Import to register listeners
    require('../../src/content/content');
    
    // Verify listener was added
    expect(addListenerSpy).toHaveBeenCalled();
    
    // Clean up spy
    addListenerSpy.mockRestore();
  });
  
  test('should toggle sidebar when receiving toggle message', () => {
    // Import to register listeners
    const contentScript = require('../../src/content/content');
    
    // Create mock message
    const toggleMessage = { action: 'toggleSidebar' };
    const sendResponse = jest.fn();
    
    // Simulate receiving a message
    chrome.runtime.onMessage.callListeners(
      toggleMessage,
      {},
      sendResponse
    );
    
    // Verify sidebar toggle was called
    expect(contentScript.sidebarPanel.toggle).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should show sidebar when receiving show message', () => {
    // Import to register listeners
    const contentScript = require('../../src/content/content');
    
    // Create mock message
    const showMessage = { action: 'showSidebar' };
    const sendResponse = jest.fn();
    
    // Simulate receiving a message
    chrome.runtime.onMessage.callListeners(
      showMessage,
      {},
      sendResponse
    );
    
    // Verify sidebar show was called
    expect(contentScript.sidebarPanel.show).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should hide sidebar when receiving hide message', () => {
    // Import to register listeners
    const contentScript = require('../../src/content/content');
    
    // Create mock message
    const hideMessage = { action: 'hideSidebar' };
    const sendResponse = jest.fn();
    
    // Simulate receiving a message
    chrome.runtime.onMessage.callListeners(
      hideMessage,
      {},
      sendResponse
    );
    
    // Verify sidebar hide was called
    expect(contentScript.sidebarPanel.hide).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should return error for unknown actions', () => {
    // Import to register listeners
    require('../../src/content/content');
    
    // Create mock message with unknown action
    const unknownMessage = { action: 'unknownAction' };
    const sendResponse = jest.fn();
    
    // Simulate receiving a message
    chrome.runtime.onMessage.callListeners(
      unknownMessage,
      {},
      sendResponse
    );
    
    // Verify error response
    expect(sendResponse).toHaveBeenCalledWith({ 
      success: false, 
      error: expect.stringContaining('Unknown action') 
    });
  });
}); 