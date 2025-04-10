// Chrome extension background script
import { ExtensionIconManager } from './ExtensionIconManager';

// Interface for the sidebar toggle event detail
interface SidebarToggleEvent {
  isActive: boolean;
}

console.warn('Background script loaded');

// Initialize the extension icon manager
export const iconManager = new ExtensionIconManager();

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.warn('Extension installed');
});

// Listen for sidebar toggle events
iconManager.addEventListener('sidebarToggle', ((event: CustomEvent<SidebarToggleEvent>) => {
  const { isActive } = event.detail;
  console.warn(`Sidebar state changed: ${isActive ? 'active' : 'inactive'}`);
  
  // Here you would add code to show/hide the sidebar when implemented
}) as EventListener); 