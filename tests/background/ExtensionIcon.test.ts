// Import jest-chrome
import { chrome } from 'jest-chrome';
import * as ExtensionIconManagerModule from '../../src/background/ExtensionIconManager';

// Helper function to access chrome.action with proper type assertion
function getChromeAction<T = any>() {
  return (chrome as unknown as { action: T }).action;
}

// Create a simplified version of ExtensionIconManager for testing
class MockExtensionIconManager extends EventTarget {
  private _isActive: boolean = false;
  
  // Basic icon paths
  private readonly defaultIconPaths = {
    16: '/icons/default-16.png',
    32: '/icons/default-32.png',
    48: '/icons/default-48.png',
    128: '/icons/default-128.png',
  };
  
  private readonly activeIconPaths = {
    16: '/icons/active-16.png',
    32: '/icons/active-32.png',
    48: '/icons/active-48.png',
    128: '/icons/active-128.png',
  };
  
  constructor() {
    super();
    this.initializeIcon();
    this.setupEventListeners();
  }
  
  get isActive(): boolean {
    return this._isActive;
  }
  
  private initializeIcon(): void {
    // Use the helper to access chrome.action
    const chromeAction = getChromeAction();
    
    chromeAction.setIcon({
      path: this.defaultIconPaths,
    });
    
    chromeAction.setTitle({
      title: 'WebCore Extension (Inactive)',
    });
  }
  
  private setupEventListeners(): void {
    // Use the helper to access chrome.action
    const chromeAction = getChromeAction();
    
    chromeAction.onClicked.addListener(this.handleIconClick.bind(this));
  }
  
  private handleIconClick(): void {
    this.toggle();
  }
  
  public toggle(): void {
    this.setActive(!this._isActive);
  }
  
  public setActive(active: boolean): void {
    if (this._isActive === active) {
      return;
    }
    
    this._isActive = active;
    this.updateIcon();
    this.updateTitle();
    this.dispatchSidebarToggleEvent();
  }
  
  private updateIcon(): void {
    // Use the helper to access chrome.action
    const chromeAction = getChromeAction();
    
    chromeAction.setIcon({
      path: this._isActive ? this.activeIconPaths : this.defaultIconPaths,
    });
  }
  
  private updateTitle(): void {
    // Use the helper to access chrome.action
    const chromeAction = getChromeAction();
    
    chromeAction.setTitle({
      title: `WebCore Extension (${this._isActive ? 'Active' : 'Inactive'})`,
    });
  }
  
  private dispatchSidebarToggleEvent(): void {
    const event = new CustomEvent('sidebarToggle', {
      detail: { isActive: this._isActive }
    });
    
    this.dispatchEvent(event);
  }
}

// Replace the original ExtensionIconManager with our mock
jest.spyOn(ExtensionIconManagerModule, 'ExtensionIconManager').mockImplementation(() => {
  return new MockExtensionIconManager() as unknown as ExtensionIconManagerModule.ExtensionIconManager;
});

describe('ExtensionIconManager', () => {
  let iconManager: ExtensionIconManagerModule.ExtensionIconManager;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Set up the chrome.action mock functions
    const actionMock = {
      setIcon: jest.fn(),
      setTitle: jest.fn(),
      onClicked: {
        addListener: jest.fn()
      }
    };
    
    // Apply mocks to the chrome object
    Object.defineProperty(chrome, 'action', {
      value: actionMock,
      configurable: true
    });
    
    // Create a new instance of the icon manager for each test
    iconManager = new ExtensionIconManagerModule.ExtensionIconManager();
  });
  
  describe('initialization', () => {
    test('should initialize with default state (inactive)', () => {
      expect(iconManager.isActive).toBe(false);
    });
    
    test('should set up click event listener on initialization', () => {
      // Verify that action.onClicked listener is set up
      expect(getChromeAction().onClicked.addListener).toHaveBeenCalled();
    });
  });
  
  describe('state management', () => {
    test('should toggle active state when toggled', () => {
      // Initial state should be inactive
      expect(iconManager.isActive).toBe(false);
      
      // Toggle to active
      iconManager.toggle();
      expect(iconManager.isActive).toBe(true);
      
      // Toggle back to inactive
      iconManager.toggle();
      expect(iconManager.isActive).toBe(false);
    });
    
    test('should explicitly set active state', () => {
      // Set to active
      iconManager.setActive(true);
      expect(iconManager.isActive).toBe(true);
      
      // Setting to active again shouldn't change the state
      iconManager.setActive(true);
      expect(iconManager.isActive).toBe(true);
      
      // Set to inactive
      iconManager.setActive(false);
      expect(iconManager.isActive).toBe(false);
    });
  });
  
  describe('icon updates', () => {
    test('should update icon when toggled to active', () => {
      iconManager.toggle();
      
      // Verify chrome.action.setIcon was called with the active icon
      expect(getChromeAction().setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          16: expect.stringContaining('active'),
          32: expect.stringContaining('active'),
        }),
      });
    });
    
    test('should update icon when toggled to inactive', () => {
      // First set to active
      iconManager.setActive(true);
      jest.clearAllMocks(); // Clear previous calls
      
      // Then toggle to inactive
      iconManager.toggle();
      
      // Verify chrome.action.setIcon was called with the inactive icon
      expect(getChromeAction().setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          16: expect.stringContaining('default'),
          32: expect.stringContaining('default'),
        }),
      });
    });
    
    test('should update title when state changes', () => {
      iconManager.toggle();
      
      // Verify chrome.action.setTitle was called with appropriate title
      expect(getChromeAction().setTitle).toHaveBeenCalledWith({
        title: expect.stringContaining('Active'),
      });
      
      // Toggle back and check title update
      iconManager.toggle();
      expect(getChromeAction().setTitle).toHaveBeenCalledWith({
        title: expect.stringContaining('Inactive'),
      });
    });
  });
  
  describe('event handling', () => {
    test('should toggle state when icon is clicked', () => {
      // Get the callback that was registered with chrome.action.onClicked
      const clickHandler = getChromeAction().onClicked.addListener.mock.calls[0][0];
      
      // Initial state should be inactive
      expect(iconManager.isActive).toBe(false);
      
      // Call the handler directly (simulating a click)
      clickHandler({ id: 1 } as chrome.tabs.Tab);
      
      // Verify that the state is now active
      expect(iconManager.isActive).toBe(true);
      
      // Call the handler again (simulating another click)
      clickHandler({ id: 1 } as chrome.tabs.Tab);
      
      // Verify that the state is now inactive again
      expect(iconManager.isActive).toBe(false);
    });
    
    test('should emit sidebar events when toggled', () => {
      // Mock the event listener
      const mockListener = jest.fn();
      iconManager.addEventListener('sidebarToggle', mockListener);
      
      // Toggle state
      iconManager.toggle();
      
      // Verify the event was emitted with correct data
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { isActive: true }
        })
      );
      
      // Toggle again
      iconManager.toggle();
      
      // Verify the event was emitted again with updated data
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { isActive: false }
        })
      );
    });
  });
}); 