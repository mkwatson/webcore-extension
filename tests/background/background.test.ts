import '../../tests/mocks/chrome';

// Mock the ExtensionIconManager
jest.mock('../../src/background/ExtensionIconManager', () => {
  // Create a mock class that extends EventTarget
  return {
    ExtensionIconManager: jest.fn().mockImplementation(() => {
      const eventTarget = new EventTarget();
      return {
        isActive: false,
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
        toggle: jest.fn(),
        setActive: jest.fn()
      };
    })
  };
});

describe('Background Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset console mocks
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Clear module cache to ensure fresh import each time
    jest.resetModules();
  });

  test('initializes ExtensionIconManager on load', () => {
    // Import to create the manager
    const backgroundModule = require('../../src/background/background');
    
    // Verify the manager was initialized
    expect(backgroundModule.iconManager).toBeDefined();
  });

  test('sets up onInstalled listener on load', () => {
    // Import to register listeners
    require('../../src/background/background');
    
    // Verify the listener was registered
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
  });

  test('handles sidebar toggle events', () => {
    // Import to register listeners
    const backgroundModule = require('../../src/background/background');
    
    // Create a mock sidebar toggle event
    const toggleEvent = new CustomEvent('sidebarToggle', {
      detail: { isActive: true }
    });
    
    // Dispatch the event on the icon manager
    backgroundModule.iconManager.dispatchEvent(toggleEvent);
    
    // Verify that the console.warn was called with the appropriate message
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('active')
    );
    
    // Test with inactive state
    const inactiveEvent = new CustomEvent('sidebarToggle', {
      detail: { isActive: false }
    });
    
    backgroundModule.iconManager.dispatchEvent(inactiveEvent);
    
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('inactive')
    );
  });
}); 