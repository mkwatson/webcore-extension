// Content script for Chrome extension
import { DebugLogger } from '../utils/DebugLogger';
import { SidebarPanel } from './SidebarPanel';

// Initialize sidebar panel as null, will be created when DOM is ready
let sidebarPanel: any = null;

// Create and initialize the sidebar panel when the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  sidebarPanel = new SidebarPanel();
  DebugLogger.log('Content script loaded and sidebar panel initialized');
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  DebugLogger.log('Content script received message:', message);

  // Ensure the sidebar panel exists
  if (!sidebarPanel) {
    DebugLogger.warn('Sidebar panel not initialized yet');
    sendResponse({ success: false, error: 'Sidebar panel not initialized' });
    return;
  }

  try {
    // Handle different message actions
    switch (message.action) {
      case 'toggle':
        sidebarPanel.toggle();
        sendResponse({ success: true });
        break;
        
      case 'show':
        sidebarPanel.show();
        sendResponse({ success: true });
        break;
        
      case 'hide':
        sidebarPanel.hide();
        sendResponse({ success: true });
        break;
        
      default:
        DebugLogger.warn(`Unknown action: ${message.action}`);
        sendResponse({ success: false, error: `Unknown action: ${message.action}` });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    DebugLogger.error('Error handling message:', errorMessage);
    sendResponse({ success: false, error: errorMessage });
  }
});

// Send a ready message to the background script
try {
  console.warn('WebCore Extension: Sending ready message to background');
  chrome.runtime.sendMessage({ action: 'contentReady', url: window.location.href }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('WebCore Extension: Error sending ready message:', chrome.runtime.lastError);
    } else {
      console.warn('WebCore Extension: Ready message acknowledged', response);
    }
  });
} catch (error) {
  console.error('WebCore Extension: Failed to send ready message:', error);
} 