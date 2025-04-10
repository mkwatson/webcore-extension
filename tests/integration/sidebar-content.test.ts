// Integration test for content script message handling
import { chrome } from 'jest-chrome';
import { SidebarPanel } from '../../src/content/SidebarPanel';

// Mock SidebarPanel implementation
jest.mock('../../src/content/SidebarPanel', () => {
  return {
    SidebarPanel: jest.fn().mockImplementation(() => {
      return {
        isVisible: false,
        toggle: jest.fn(),
        show: jest.fn(),
        hide: jest.fn(),
        loadSavedSettings: jest.fn()
      };
    })
  };
});

describe('Content Script Message Handling', () => {
  let sidebarPanel: jest.Mocked<SidebarPanel>;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Set up the mock SidebarPanel instance
    // We need to get the actual mocked instance created by the content script 
    const contentScript = require('../../src/content/content');
    sidebarPanel = contentScript.sidebarPanel as jest.Mocked<SidebarPanel>;
  });
  
  test('should load saved settings on initialization', () => {
    // Assert: loadSavedSettings should be called during initialization
    expect(sidebarPanel.loadSavedSettings).toHaveBeenCalled();
  });
  
  test('should toggle sidebar when receiving toggle message', () => {
    // Arrange: Create a message object and response callback
    const message = { action: 'toggleSidebar' };
    const sendResponse = jest.fn();
    
    // Act: Simulate receiving the message
    chrome.runtime.onMessage.callListeners(
      message,
      {},
      sendResponse
    );
    
    // Assert: Toggle should be called on the sidebarPanel
    expect(sidebarPanel.toggle).toHaveBeenCalled();
    
    // Assert: Response should be sent with success: true
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should show sidebar when receiving show message', () => {
    // Arrange
    const message = { action: 'showSidebar' };
    const sendResponse = jest.fn();
    
    // Act
    chrome.runtime.onMessage.callListeners(
      message,
      {},
      sendResponse
    );
    
    // Assert
    expect(sidebarPanel.show).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should hide sidebar when receiving hide message', () => {
    // Arrange
    const message = { action: 'hideSidebar' };
    const sendResponse = jest.fn();
    
    // Act
    chrome.runtime.onMessage.callListeners(
      message,
      {},
      sendResponse
    );
    
    // Assert
    expect(sidebarPanel.hide).toHaveBeenCalled();
    expect(sendResponse).toHaveBeenCalledWith({ success: true });
  });
  
  test('should return error for unknown actions', () => {
    // Arrange
    const message = { action: 'unknownAction' };
    const sendResponse = jest.fn();
    
    // Spy on console.warn
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Act
    chrome.runtime.onMessage.callListeners(
      message,
      {},
      sendResponse
    );
    
    // Assert
    expect(sendResponse).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Unknown action: unknownAction' 
    });
    
    // Clean up
    warnSpy.mockRestore();
  });
  
  test('should handle errors gracefully', () => {
    // Arrange: Set up the mock to throw an error
    sidebarPanel.toggle.mockImplementation(() => {
      throw new Error('Test error');
    });
    
    const message = { action: 'toggleSidebar' };
    const sendResponse = jest.fn();
    
    // Spy on console.error
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Act
    chrome.runtime.onMessage.callListeners(
      message,
      {},
      sendResponse
    );
    
    // Assert
    expect(sendResponse).toHaveBeenCalledWith({ 
      success: false, 
      error: 'Test error' 
    });
    
    // Clean up
    errorSpy.mockRestore();
  });
}); 