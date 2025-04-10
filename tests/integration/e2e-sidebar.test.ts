// End-to-end test for the sidebar functionality
import { chrome } from 'jest-chrome';
import { ExtensionIconManager } from '../../src/background/ExtensionIconManager';
import { SidebarPanel } from '../../src/content/SidebarPanel';

// Mock browser tabs
const mockActiveTab = { id: 123, active: true, currentWindow: true };

// Helper function to access chrome APIs with proper type assertion
function getChromeAction<T = any>() {
  return (chrome as unknown as { action: T }).action;
}

// Mock SidebarPanel 
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

describe('End-to-End Sidebar Functionality', () => {
  let iconManager: ExtensionIconManager;
  let sidebarPanel: jest.Mocked<SidebarPanel>;
  let sendResponseMock: jest.Mock;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Mock chrome.tabs.query to return our mock active tab
    (chrome.tabs.query as jest.Mock).mockResolvedValue([mockActiveTab]);
    
    // Create a mock sendResponse function
    sendResponseMock = jest.fn();
    
    // Initialize the background script components
    iconManager = new ExtensionIconManager();
    
    // Initialize the content script components
    const contentScript = require('../../src/content/content');
    sidebarPanel = contentScript.sidebarPanel as jest.Mocked<SidebarPanel>;
  });
  
  test('should show sidebar when extension icon is clicked', async () => {
    // Arrange: Get the click handler registered with chrome.action.onClicked
    const clickHandler = getChromeAction<{ onClicked: { addListener: jest.Mock } }>()
      .onClicked.addListener.mock.calls[0][0];
    
    // Act: Simulate a click on the extension icon
    clickHandler();
    
    // Wait for async operations to complete
    await new Promise(process.nextTick);
    
    // Assert: Verify tabs.query was called
    expect(chrome.tabs.query).toHaveBeenCalledWith({ 
      active: true, 
      currentWindow: true 
    });
    
    // Assert: Verify tabs.sendMessage was called with showSidebar action
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      mockActiveTab.id,
      { action: 'showSidebar' }
    );
    
    // Simulate the content script receiving the message directly by calling chrome.runtime.onMessage.callListeners
    chrome.runtime.onMessage.callListeners(
      { action: 'showSidebar' },
      {},
      sendResponseMock
    );
    
    // Assert: Verify the sidebar show method was called 
    expect(sidebarPanel.show).toHaveBeenCalled();
    
    // Assert: Verify response was sent
    expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
  });
  
  test('should hide sidebar when extension icon is clicked again', async () => {
    // Arrange: Get the click handler and make the sidebar active
    const clickHandler = getChromeAction<{ onClicked: { addListener: jest.Mock } }>()
      .onClicked.addListener.mock.calls[0][0];
    
    // First click to activate
    clickHandler();
    await new Promise(process.nextTick);
    
    // Reset mocks to track the next calls
    jest.clearAllMocks();
    
    // Act: Second click to deactivate
    clickHandler();
    await new Promise(process.nextTick);
    
    // Assert: Verify message was sent with hideSidebar action
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      mockActiveTab.id,
      { action: 'hideSidebar' }
    );
    
    // Simulate content script receiving this message
    chrome.runtime.onMessage.callListeners(
      { action: 'hideSidebar' },
      {},
      sendResponseMock
    );
    
    // Assert: Verify sidebar hide method was called
    expect(sidebarPanel.hide).toHaveBeenCalled();
    
    // Assert: Verify response was sent
    expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
  });
  
  test('should handle toggling the sidebar explicitly', async () => {
    // Simulate the content script receiving a toggle message
    chrome.runtime.onMessage.callListeners(
      { action: 'toggleSidebar' },
      {},
      sendResponseMock
    );
    
    // Assert: Verify sidebar toggle method was called
    expect(sidebarPanel.toggle).toHaveBeenCalled();
    
    // Assert: Verify response was sent
    expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
  });
}); 