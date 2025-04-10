// Integration test for the sidebar toggle functionality
import { chrome } from 'jest-chrome';
import { ExtensionIconManager } from '../../src/background/ExtensionIconManager';

// Mock browser tab
const mockTab = { id: 123, active: true, currentWindow: true };

// Helper function for chrome.action
function getChromeAction<T = any>() {
  return (chrome as unknown as { action: T }).action;
}

describe('Sidebar Toggle Integration', () => {
  let iconManager: ExtensionIconManager;
  let consoleWarnSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Spy on console.warn for error assertions
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Setup chrome.action mock
    Object.assign(chrome, {
      action: {
        setIcon: jest.fn(),
        setTitle: jest.fn(),
        onClicked: {
          addListener: jest.fn()
        }
      }
    });
    
    // Initialize extension icon manager
    iconManager = new ExtensionIconManager();
  });
  
  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });
  
  test('sends message to active tab when icon is clicked', async () => {
    // Arrange: Setup chrome.tabs.query to return our mock tab
    (chrome.tabs.query as jest.Mock).mockImplementationOnce(() => Promise.resolve([mockTab]));
    
    // Get the click handler registered with chrome.action.onClicked
    const clickHandler = getChromeAction<{ onClicked: { addListener: jest.Mock } }>()
      .onClicked.addListener.mock.calls[0][0];
    
    // Act: Simulate first click on the extension icon
    await clickHandler();
    
    // Assert: Check chrome.tabs.query was called with the right params
    expect(chrome.tabs.query).toHaveBeenCalledWith({ 
      active: true, 
      currentWindow: true 
    });
    
    // Assert: sendMessage should be called with showSidebar action
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      mockTab.id,
      { action: 'showSidebar' }
    );
    
    // Setup for second click - reset mocks
    jest.clearAllMocks();
    (chrome.tabs.query as jest.Mock).mockImplementationOnce(() => Promise.resolve([mockTab]));
    
    // Act: Simulate second click
    await clickHandler();
    
    // Assert: sendMessage should be called with hideSidebar action
    expect(chrome.tabs.query).toHaveBeenCalledWith({ 
      active: true, 
      currentWindow: true 
    });
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      mockTab.id,
      { action: 'hideSidebar' }
    );
  });
  
  test('handles case where no active tab is found', async () => {
    // Arrange: Setup chrome.tabs.query to return empty array
    (chrome.tabs.query as jest.Mock).mockImplementationOnce(() => Promise.resolve([]));
    
    // Get the click handler registered with chrome.action.onClicked
    const clickHandler = getChromeAction<{ onClicked: { addListener: jest.Mock } }>()
      .onClicked.addListener.mock.calls[0][0];
    
    // Act: Simulate click on the extension icon
    await clickHandler();
    
    // Assert: chrome.tabs.query should be called
    expect(chrome.tabs.query).toHaveBeenCalledWith({ 
      active: true, 
      currentWindow: true 
    });
    
    // Assert: sendMessage should not be called
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    
    // Assert: Warning should be logged
    expect(consoleWarnSpy).toHaveBeenCalledWith('No active tab found');
  });
  
  test('handles case where active tab has no ID', async () => {
    // Arrange: Setup chrome.tabs.query to return a tab without an ID
    const tabWithoutId = { active: true, currentWindow: true };
    (chrome.tabs.query as jest.Mock).mockImplementationOnce(() => Promise.resolve([tabWithoutId]));
    
    // Get the click handler registered with chrome.action.onClicked
    const clickHandler = getChromeAction<{ onClicked: { addListener: jest.Mock } }>()
      .onClicked.addListener.mock.calls[0][0];
    
    // Act: Simulate click on the extension icon
    await clickHandler();
    
    // Assert: chrome.tabs.query should be called
    expect(chrome.tabs.query).toHaveBeenCalledWith({ 
      active: true, 
      currentWindow: true 
    });
    
    // Assert: sendMessage should not be called
    expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    
    // Assert: Warning should be logged
    expect(consoleWarnSpy).toHaveBeenCalledWith('Active tab has no ID');
  });
}); 