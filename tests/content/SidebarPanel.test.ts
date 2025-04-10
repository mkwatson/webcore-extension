import { chrome } from 'jest-chrome';
import { SidebarPanel } from '../../src/content/SidebarPanel';

// Setup mocks for DOM and event listeners
const eventHandlers: { [key: string]: Function } = {};
const documentEventHandlers: { [key: string]: Function } = {};

// Mock element class to simulate DOM elements
class MockElement {
  classList = {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn().mockReturnValue(false),
    toggle: jest.fn(),
  };
  style = {};
  children: any[] = [];
  childNodes: any[] = [];
  innerHTML = '';
  textContent = '';
  appendChild = jest.fn().mockImplementation(child => {
    this.children.push(child);
    this.childNodes.push(child);
    return child;
  });
  append = jest.fn();
  removeChild = jest.fn();
  addEventListener = jest.fn().mockImplementation((eventType, handler) => {
    eventHandlers[eventType] = handler;
  });
  removeEventListener = jest.fn();
  attachShadow = jest.fn().mockReturnValue({
    appendChild: jest.fn(),
    innerHTML: '',
  });
  getAttribute = jest.fn();
  setAttribute = jest.fn();
  getBoundingClientRect = jest.fn().mockReturnValue({
    top: 0,
    left: 0,
    width: 400,
    height: 600,
    right: 400,
    bottom: 600,
  });
  insertBefore = jest.fn();
  querySelectorAll = jest.fn().mockReturnValue([]);
  querySelector = jest.fn().mockReturnValue(null);
  contains = jest.fn().mockReturnValue(false);
}

// Mock document.createElement
jest.mock('../../src/content/SidebarPanel', () => {
  // Import the real module
  const originalModule = jest.requireActual('../../src/content/SidebarPanel');
  
  // Return modified exports
  return {
    ...originalModule,
    // Override specific methods or properties as needed
  };
});

// Create mock elements using our MockElement class
class MockHTMLDivElement extends MockElement {
  tagName = 'DIV';
  
  // Override addEventListener to store handlers
  addEventListener = jest.fn().mockImplementation((eventType: string, handler: Function) => {
    eventHandlers[eventType] = handler;
  });
}

class MockShadowRoot extends MockElement {
  mode = 'open';
}

// Mock document methods
document.createElement = jest.fn().mockImplementation((tag): any => {
  if (tag === 'div') {
    return new MockHTMLDivElement();
  }
  if (tag === 'style') {
    return { textContent: '' };
  }
  return new MockElement();
});

document.body.contains = jest.fn().mockReturnValue(false);
document.body.appendChild = jest.fn();

// Store document event handlers
document.addEventListener = jest.fn().mockImplementation((eventType: string, handler: Function) => {
  documentEventHandlers[eventType] = handler;
});
document.removeEventListener = jest.fn();

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { value: 1920 });
Object.defineProperty(window, 'innerHeight', { value: 1080 });

// Define proper types for storage mocks and chrome API
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

describe('SidebarPanel', () => {
  let sidebarPanel: SidebarPanel;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Clear event handlers
    Object.keys(eventHandlers).forEach(key => delete eventHandlers[key]);
    Object.keys(documentEventHandlers).forEach(key => delete documentEventHandlers[key]);

    // Mock storage methods with proper type assertions
    (chrome.storage.local.get as jest.Mock).mockImplementation(createStorageGetMock({
      'sidebar-width-example.com': 400
    }));
    
    (chrome.storage.local.set as jest.Mock).mockImplementation(createStorageSetMock());
    
    // Initialize SidebarPanel
    sidebarPanel = new SidebarPanel();

    // Silence console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  describe('Initialization', () => {
    it('should create sidebar element', () => {
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(sidebarPanel.element.classList.add).toHaveBeenCalledWith('webcore-sidebar');
    });
    
    it('should set up Shadow DOM', () => {
      expect(sidebarPanel.element.attachShadow).toHaveBeenCalledWith({ mode: 'open' });
    });
    
    it('should set default width', () => {
      // Using value from storage mock (400px) not the default (380px)
      expect(sidebarPanel.element.style.width).toBe('400px');
    });
    
    it('should start in hidden state', () => {
      expect(sidebarPanel.isVisible).toBe(false);
      expect(sidebarPanel.element.style.transform).toContain('translateX');
    });
    
    it('should set up resize handle', () => {
      // Check that the resize handle was created
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(sidebarPanel.resizeHandle.classList.add).toHaveBeenCalledWith('resize-handle');
      
      // Check that event listeners were added to the resize handle
      expect(sidebarPanel.resizeHandle.addEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
    });
  });
  
  describe('Visibility Control', () => {
    it('should show the sidebar', () => {
      // Mock setTimeout
      jest.spyOn(global, 'setTimeout');
      
      sidebarPanel.show();
      
      // Check that the sidebar is added to the document
      expect(document.body.appendChild).toHaveBeenCalledWith(sidebarPanel.element);
      
      // Check that visibility state is updated
      expect(sidebarPanel.isVisible).toBe(true);
      
      // Check for setTimeout call for animation
      expect(setTimeout).toHaveBeenCalled();
    });
    
    it('should hide the sidebar', () => {
      // First make it visible
      sidebarPanel.isVisible = true;
      
      // Then hide it
      sidebarPanel.hide();
      
      // Check visibility state
      expect(sidebarPanel.isVisible).toBe(false);
      expect(sidebarPanel.element.style.transform).toContain('translateX');
    });
    
    it('should toggle from hidden to visible', () => {
      // Initial state is hidden
      sidebarPanel.isVisible = false;
      
      // Mock the show method
      const showSpy = jest.spyOn(sidebarPanel, 'show');
      
      // Toggle should call show
      sidebarPanel.toggle();
      
      expect(showSpy).toHaveBeenCalled();
    });
    
    it('should toggle from visible to hidden', () => {
      // Set initial state to visible
      sidebarPanel.isVisible = true;
      
      // Mock the hide method
      const hideSpy = jest.spyOn(sidebarPanel, 'hide');
      
      // Toggle should call hide
      sidebarPanel.toggle();
      
      expect(hideSpy).toHaveBeenCalled();
    });
  });
  
  describe('Resize Functionality', () => {
    it('should set up resize event handlers on mousedown', () => {
      // Verify the handler was registered
      expect(sidebarPanel.resizeHandle.addEventListener).toHaveBeenCalledWith(
        'mousedown',
        expect.any(Function)
      );
      
      // Trigger the mousedown event with mock event
      const mockEvent = { preventDefault: jest.fn(), clientX: 1600 };
      const mousedownHandler = eventHandlers['mousedown'];
      mousedownHandler(mockEvent);
      
      // Check that event.preventDefault was called
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      
      // Check that document event listeners were added
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
    
    it('should update width on resize', () => {
      // Mock setWidth method
      const setWidthSpy = jest.spyOn(sidebarPanel, 'setWidth');
      
      // Trigger mousedown
      const mockMousedownEvent = { preventDefault: jest.fn(), clientX: 1600 };
      const mousedownHandler = eventHandlers['mousedown'];
      mousedownHandler(mockMousedownEvent);
      
      // Trigger mousemove
      const mockMousemoveEvent = { preventDefault: jest.fn(), clientX: 1500 };
      const mousemoveHandler = documentEventHandlers['mousemove'];
      mousemoveHandler(mockMousemoveEvent);
      
      // Should calculate new width = window.innerWidth - clientX = 1920 - 1500 = 420
      expect(setWidthSpy).toHaveBeenCalledWith(420);
    });
    
    it('should respect minimum width constraint', () => {
      // Set width to less than minimum
      sidebarPanel.setWidth(200);
      
      // Should be constrained to minimum (280px)
      expect(sidebarPanel.element.style.width).toBe('280px');
    });
    
    it('should respect maximum width constraint', () => {
      // Max width is 50% of window width = 1920 * 0.5 = 960px
      sidebarPanel.setWidth(1000);
      
      // Should be constrained to max (960px)
      expect(sidebarPanel.element.style.width).toBe('960px');
    });
    
    it('should cleanup resize event handlers on mouseup', () => {
      // Trigger mousedown
      const mockMousedownEvent = { preventDefault: jest.fn(), clientX: 1600 };
      const mousedownHandler = eventHandlers['mousedown'];
      mousedownHandler(mockMousedownEvent);
      
      // Trigger mouseup
      const mouseupHandler = documentEventHandlers['mouseup'];
      mouseupHandler();
      
      // Check that document event listeners were removed
      expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
    
    it('should save width when resize ends', () => {
      // Mock the saveCurrentWidth method
      const saveWidthSpy = jest.spyOn(sidebarPanel as any, 'saveCurrentWidth');
      
      // Trigger mousedown
      const mockMousedownEvent = { preventDefault: jest.fn(), clientX: 1600 };
      const mousedownHandler = eventHandlers['mousedown'];
      mousedownHandler(mockMousedownEvent);
      
      // Trigger mouseup
      const mouseupHandler = documentEventHandlers['mouseup'];
      mouseupHandler();
      
      // Check that saveCurrentWidth was called
      expect(saveWidthSpy).toHaveBeenCalled();
    });
  });
  
  describe('Settings Persistence', () => {
    it('should load saved width from storage on initialization', () => {
      // Create a new instance to verify the call
      const newSidebarPanel = new SidebarPanel();
      
      // Verify chrome.storage.local.get was called with the correct key
      // Use proper typing for mock access
      const getMock = chrome.storage.local.get as jest.Mock;
      expect(getMock.mock.calls.some((call: any) => 
        call[0] === 'sidebar-width-example.com'
      )).toBe(true);
    });
    
    it('should save width to storage', () => {
      // Set a width first
      sidebarPanel.element.style.width = '400px';
      
      // Call private method using type casting
      (sidebarPanel as any).saveCurrentWidth();
      
      // Use proper typing for mock access
      const setMock = chrome.storage.local.set as jest.Mock;
      const lastSetCall = setMock.mock.calls[setMock.mock.calls.length - 1];
      expect(lastSetCall[0]).toEqual(expect.objectContaining({
        'sidebar-width-example.com': 400
      }));
    });
    
    it('should handle storage errors gracefully', () => {
      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock chrome.storage.local.get to throw an error
      (chrome.storage.local.get as jest.Mock).mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      // Try to load settings (should catch error)
      sidebarPanel.loadSavedSettings();
      
      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading sidebar settings:',
        expect.any(Error)
      );
    });
  });
}); 