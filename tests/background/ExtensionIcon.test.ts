// Import the chrome mock
import '../mocks/chrome';
import { ExtensionIconManager } from '../../src/background/ExtensionIconManager';

// Get the chrome mock from global object 
const chromeMock = (global as any).chrome;

describe('ExtensionIconManager', () => {
  let iconManager: ExtensionIconManager;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a new instance of the icon manager for each test
    iconManager = new ExtensionIconManager();
  });
  
  describe('initialization', () => {
    test('should initialize with default state (inactive)', () => {
      expect(iconManager.isActive).toBe(false);
    });
    
    test('should set up click event listener on initialization', () => {
      // Verify that action.onClicked listener is set up
      expect(chromeMock.action.onClicked.addListener).toHaveBeenCalled();
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
      expect(chromeMock.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          16: expect.any(String),
          32: expect.any(String),
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
      expect(chromeMock.action.setIcon).toHaveBeenCalledWith({
        path: expect.objectContaining({
          16: expect.any(String),
          32: expect.any(String),
        }),
      });
    });
    
    test('should update title when state changes', () => {
      iconManager.toggle();
      
      // Verify chrome.action.setTitle was called with appropriate title
      expect(chromeMock.action.setTitle).toHaveBeenCalledWith({
        title: expect.stringContaining('Active'),
      });
      
      // Toggle back and check title update
      iconManager.toggle();
      expect(chromeMock.action.setTitle).toHaveBeenCalledWith({
        title: expect.stringContaining('Inactive'),
      });
    });
  });
  
  describe('event handling', () => {
    test('should toggle state when icon is clicked', () => {
      // Get the click handler callback
      const clickHandler = (chromeMock.action.onClicked.addListener as jest.Mock).mock.calls[0][0];
      
      // Simulate a click event by calling the handler directly
      clickHandler({ id: 'test-tab' });
      
      // Verify that the state is now active
      expect(iconManager.isActive).toBe(true);
      
      // Simulate another click
      clickHandler({ id: 'test-tab' });
      
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