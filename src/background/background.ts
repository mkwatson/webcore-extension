// Chrome extension background script
import DebugLogger from '../utils/DebugLogger';

// Keep track of service worker state
let serviceWorkerState = 'starting';

DebugLogger.info('Background', 'Background script loaded at ' + new Date().toISOString());

// Set up click handler for the extension icon
chrome.action.onClicked.addListener((tab) => {
  DebugLogger.info('Background', 'Extension icon clicked', { tabId: tab.id });
  
  // Toggle the icon state (active/inactive)
  toggleIconState();
  
  // Send message to content script
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' }, (response) => {
      if (chrome.runtime.lastError) {
        DebugLogger.error('Background', 'Error sending message to tab', chrome.runtime.lastError);
        return;
      }
      
      DebugLogger.info('Background', 'Message response received', response || { error: 'No response' });
    });
  }
});

// Track when the service worker starts up
serviceWorkerState = 'active';
DebugLogger.info('Background', 'Service worker activated');

// Simple state tracking for the icon
let isActive = false;

// Function to toggle the icon state
function toggleIconState() {
  isActive = !isActive;
  
  // Update icon
  const iconPath = isActive 
    ? { 
        16: '/icons/active-16.png',
        32: '/icons/active-32.png',
        48: '/icons/active-48.png',
        128: '/icons/active-128.png'
      }
    : {
        16: '/icons/default-16.png',
        32: '/icons/default-32.png',
        48: '/icons/default-48.png',
        128: '/icons/default-128.png'
      };
      
  chrome.action.setIcon({ path: iconPath });
  
  // Update title
  chrome.action.setTitle({ 
    title: `WebCore Extension (${isActive ? 'Active' : 'Inactive'})` 
  });
  
  DebugLogger.info('Background', `Icon state changed to ${isActive ? 'active' : 'inactive'}`);
}

// Use an interval to keep service worker alive longer
const keepAliveInterval = setInterval(() => {
  DebugLogger.info('Background', 'Service worker keepalive ping', { state: serviceWorkerState });
}, 25000);

// Clean up on unload
self.addEventListener('unload', () => {
  DebugLogger.info('Background', 'Service worker unloading');
  clearInterval(keepAliveInterval);
});

// Set up a handler for runtime.onMessage for integration with the debug page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  DebugLogger.info('Background', 'Received message', { message, sender: sender.id });
  
  if (message.action === 'getDebugInfo') {
    // Return debug information about the extension state
    const debugInfo = {
      iconManagerActive: isActive,
      serviceWorkerStatus: serviceWorkerState,
      timestamp: new Date().toISOString()
    };
    
    DebugLogger.info('Background', 'Sending debug info', debugInfo);
    sendResponse(debugInfo);
  }
  
  // Return true to indicate async response
  return true;
});

// Make available for debugging (in service worker context)
(self as any).toggleIconState = toggleIconState; 