/**
 * Manages the extension's icon state and behavior
 */

// Interface for sidebar toggle event
interface SidebarToggleEventDetail {
  isActive: boolean;
}

/**
 * Extension Icon Manager Constructor 
 * Manages the extension's icon state and behavior
 */
function ExtensionIconManager() {
  // Initialize EventTarget as the prototype
  EventTarget.call(this);
  
  // Get the DebugLogger from the appropriate global scope
  const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
  
  // Current state
  this._isActive = false;
  
  // Base path for icons
  this.iconBasePath = '/icons';
  
  // Icon paths
  this.defaultIconPaths = {
    16: `${this.iconBasePath}/default-16.png`,
    32: `${this.iconBasePath}/default-32.png`,
    48: `${this.iconBasePath}/default-48.png`,
    128: `${this.iconBasePath}/default-128.png`,
  };
  
  this.activeIconPaths = {
    16: `${this.iconBasePath}/active-16.png`,
    32: `${this.iconBasePath}/active-32.png`,
    48: `${this.iconBasePath}/active-48.png`,
    128: `${this.iconBasePath}/active-128.png`,
  };
  
  debugLogger.info('IconManager', 'Initializing ExtensionIconManager');
  
  this.initializeIcon();
  this.setupEventListeners();
  
  debugLogger.info('IconManager', 'ExtensionIconManager initialized');
}

// Inherit from EventTarget
ExtensionIconManager.prototype = Object.create(EventTarget.prototype);
ExtensionIconManager.prototype.constructor = ExtensionIconManager;

/**
 * Returns the current active state of the extension
 */
Object.defineProperty(ExtensionIconManager.prototype, 'isActive', {
  get: function() {
    return this._isActive;
  }
});

/**
 * Initialize the icon state
 */
ExtensionIconManager.prototype.initializeIcon = function() {
  try {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.info('IconManager', 'Setting initial icon state');
    
    // Set initial icon state
    chrome.action.setIcon({
      path: this.defaultIconPaths,
    });
    
    // Set initial title
    chrome.action.setTitle({
      title: 'WebCore Extension (Inactive)',
    });
    
    debugLogger.info('IconManager', 'Initial icon state set successfully');
  } catch (error) {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.error('IconManager', 'Failed to initialize extension icon', error);
    console.error('Failed to initialize extension icon:', error);
  }
};

/**
 * Set up event listeners
 */
ExtensionIconManager.prototype.setupEventListeners = function() {
  try {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.info('IconManager', 'Setting up icon click listener');
    
    // Listen for clicks on the extension icon
    chrome.action.onClicked.addListener(this.handleIconClick.bind(this));
    
    debugLogger.info('IconManager', 'Icon click listener set up successfully');
  } catch (error) {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.error('IconManager', 'Failed to set up extension icon listeners', error);
    console.error('Failed to set up extension icon listeners:', error);
  }
};

/**
 * Handle clicks on the extension icon
 */
ExtensionIconManager.prototype.handleIconClick = function() {
  const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
  debugLogger.info('IconManager', 'Icon clicked', { currentState: this._isActive });
  this.toggle();
};

/**
 * Toggle the active state
 */
ExtensionIconManager.prototype.toggle = function() {
  const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
  debugLogger.info('IconManager', 'Toggling state', { from: this._isActive });
  this.setActive(!this._isActive);
};

/**
 * Set the active state explicitly
 */
ExtensionIconManager.prototype.setActive = function(active) {
  const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
  
  // If the state isn't changing, do nothing
  if (this._isActive === active) {
    debugLogger.info('IconManager', 'State unchanged, no action needed', { state: active });
    return;
  }
  
  debugLogger.info('IconManager', `Setting active state to ${active}`, { previousState: this._isActive });
  
  // Update the state
  this._isActive = active;
  
  // Update the icon
  this.updateIcon();
  
  // Update the title
  this.updateTitle();
  
  // Dispatch event
  this.dispatchSidebarToggleEvent();
};

/**
 * Update the icon based on current state
 */
ExtensionIconManager.prototype.updateIcon = function() {
  try {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.info('IconManager', 'Updating icon', { isActive: this._isActive });
    
    chrome.action.setIcon({
      path: this._isActive ? this.activeIconPaths : this.defaultIconPaths,
    });
    
    debugLogger.info('IconManager', 'Icon updated successfully');
  } catch (error) {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.error('IconManager', 'Failed to update extension icon', error);
    console.error('Failed to update extension icon:', error);
  }
};

/**
 * Update the title based on current state
 */
ExtensionIconManager.prototype.updateTitle = function() {
  try {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.info('IconManager', 'Updating title', { isActive: this._isActive });
    
    chrome.action.setTitle({
      title: `WebCore Extension (${this._isActive ? 'Active' : 'Inactive'})`,
    });
    
    debugLogger.info('IconManager', 'Title updated successfully');
  } catch (error) {
    const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
    debugLogger.error('IconManager', 'Failed to update extension title', error);
    console.error('Failed to update extension title:', error);
  }
};

/**
 * Dispatch an event when the sidebar state changes
 *
 * @fires sidebarToggle - Custom event containing the sidebar state
 * Event detail: { isActive: boolean }
 */
ExtensionIconManager.prototype.dispatchSidebarToggleEvent = function() {
  const debugLogger = ((typeof self !== 'undefined' ? self : window) as any).DebugLogger;
  debugLogger.info('IconManager', 'Dispatching sidebarToggle event', { isActive: this._isActive });
  
  const event = new CustomEvent<SidebarToggleEventDetail>('sidebarToggle', {
    detail: { isActive: this._isActive }
  });
  
  this.dispatchEvent(event);
};

// Make ExtensionIconManager available globally in the appropriate context
if (typeof self !== 'undefined') {
  (self as any).ExtensionIconManager = ExtensionIconManager;
} else if (typeof window !== 'undefined') {
  (window as any).ExtensionIconManager = ExtensionIconManager;
} 