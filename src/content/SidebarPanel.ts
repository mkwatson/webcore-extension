/**
 * SidebarPanel class for the WebCore extension
 * Manages a sliding sidebar with resize functionality
 */
function SidebarPanel() {
  // DOM Elements
  this.element = document.createElement('div');
  this.element.classList.add('webcore-sidebar');
  
  // Create Shadow DOM for style isolation
  this.shadowRoot = this.element.attachShadow({ mode: 'open' });
  
  // Create the container
  const container = document.createElement('div');
  container.classList.add('sidebar-container');
  this.shadowRoot.appendChild(container);
  
  // Create the resize handle
  this.resizeHandle = document.createElement('div');
  this.resizeHandle.classList.add('resize-handle');
  container.appendChild(this.resizeHandle);
  
  // Create content area
  const contentArea = document.createElement('div');
  contentArea.classList.add('sidebar-content');
  contentArea.innerHTML = '<h2>WebCore Extension</h2><p>Sidebar content will go here.</p>';
  container.appendChild(contentArea);
  
  // Set initial styles
  this.applyStyles();
  
  // Set default width
  this.setWidth(380);
  
  // Set initial position (hidden)
  this.updatePosition(false);
  
  // Set up event listeners
  this.setupEventListeners();
  
  // Initial state
  this.isVisible = false;
}

// Constants
SidebarPanel.prototype.DEFAULT_WIDTH = 380;
SidebarPanel.prototype.MIN_WIDTH = 280;
SidebarPanel.prototype.MAX_WIDTH_PERCENT = 0.5; // 50% of window width
SidebarPanel.prototype.STORAGE_KEY_PREFIX = 'sidebar-width-';

/**
 * Apply styles to the sidebar elements
 */
SidebarPanel.prototype.applyStyles = function() {
  const style = document.createElement('style');
  style.textContent = `
    .sidebar-container {
      position: relative;
      width: 100%;
      height: 100%;
      background-color: white;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    .resize-handle {
      position: absolute;
      left: 0;
      top: 0;
      width: 6px;
      height: 100%;
      cursor: ew-resize;
      background: linear-gradient(to right, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0));
      z-index: 10;
    }
    
    .resize-handle:hover {
      background: linear-gradient(to right, rgba(0, 120, 255, 0.2), rgba(0, 0, 0, 0));
    }
    
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    
    h2 {
      margin-top: 0;
      font-size: 18px;
      color: #333;
    }
  `;
  this.shadowRoot.appendChild(style);
  
  // Set styles for the main element
  Object.assign(this.element.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    height: '100%',
    zIndex: '9999',
    transition: 'transform 0.3s ease-in-out',
    overflow: 'hidden'
  });
};

/**
 * Set up event listeners
 */
SidebarPanel.prototype.setupEventListeners = function() {
  // Resize handle events
  this.resizeHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
  
  // Add a window resize handler to adjust sidebar if needed
  window.addEventListener('resize', this.handleWindowResize.bind(this));
};

/**
 * Handle the start of a resize action
 */
SidebarPanel.prototype.handleMouseDown = function(e) {
  e.preventDefault();
  
  // Set up resize handlers
  document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  document.addEventListener('mouseup', this.handleMouseUp.bind(this));
};

/**
 * Handle mouse movement during resize
 */
SidebarPanel.prototype.handleMouseMove = function(moveEvent) {
  moveEvent.preventDefault();
  
  // Calculate the new width based on the mouse position
  const newWidth = window.innerWidth - moveEvent.clientX;
  this.setWidth(newWidth);
};

/**
 * Handle the end of a resize action
 */
SidebarPanel.prototype.handleMouseUp = function() {
  // Remove the event listeners
  document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  
  // Save the current width
  this.saveCurrentWidth();
};

/**
 * Handle window resize events
 */
SidebarPanel.prototype.handleWindowResize = function() {
  // Ensure the sidebar isn't wider than allowed
  const maxWidth = window.innerWidth * this.MAX_WIDTH_PERCENT;
  const currentWidth = parseInt(this.element.style.width || '0', 10);
  
  if (currentWidth > maxWidth) {
    this.setWidth(maxWidth);
  }
};

/**
 * Set the width of the sidebar, respecting min/max constraints
 */
SidebarPanel.prototype.setWidth = function(width) {
  const minWidth = this.MIN_WIDTH;
  const maxWidth = window.innerWidth * this.MAX_WIDTH_PERCENT;
  
  // Apply constraints
  const constrainedWidth = Math.min(maxWidth, Math.max(minWidth, width));
  
  // Set the width
  this.element.style.width = `${constrainedWidth}px`;
};

/**
 * Update the position of the sidebar based on visibility
 */
SidebarPanel.prototype.updatePosition = function(visible) {
  if (visible) {
    this.element.style.transform = 'translateX(0)';
  } else {
    // Move the element off-screen to the right
    const width = parseInt(this.element.style.width || '0', 10);
    this.element.style.transform = `translateX(${width}px)`;
  }
};

/**
 * Show the sidebar
 */
SidebarPanel.prototype.show = function() {
  if (!this.isVisible) {
    // Add to DOM if not already there
    if (!document.body.contains(this.element)) {
      document.body.appendChild(this.element);
    }
    
    // Set visible and update position with animation
    this.isVisible = true;
    
    // Use setTimeout to ensure the animation works
    // (adding and updating in the same tick can skip animation)
    setTimeout(() => {
      this.updatePosition(true);
    }, 10);
  }
};

/**
 * Hide the sidebar
 */
SidebarPanel.prototype.hide = function() {
  if (this.isVisible) {
    this.isVisible = false;
    this.updatePosition(false);
  }
};

/**
 * Toggle the sidebar visibility
 */
SidebarPanel.prototype.toggle = function() {
  if (this.isVisible) {
    this.hide();
  } else {
    this.show();
  }
};

/**
 * Save the current width to local storage
 */
SidebarPanel.prototype.saveCurrentWidth = function() {
  try {
    const width = parseInt(this.element.style.width || '0', 10);
    const key = this.STORAGE_KEY_PREFIX + window.location.hostname;
    
    if (width > 0) {
      chrome.storage.local.set({ [key]: width });
    }
  } catch (error) {
    console.error('Failed to save sidebar width:', error);
  }
};

/**
 * Load saved settings from storage
 */
SidebarPanel.prototype.loadSavedSettings = function() {
  try {
    const key = this.STORAGE_KEY_PREFIX + window.location.hostname;
    
    chrome.storage.local.get([key], (result) => {
      const savedWidth = result[key];
      
      if (savedWidth && typeof savedWidth === 'number') {
        this.setWidth(savedWidth);
      }
    });
  } catch (error) {
    console.error('Failed to load sidebar settings:', error);
  }
};

// Make SidebarPanel globally available
(window as any).SidebarPanel = SidebarPanel; 