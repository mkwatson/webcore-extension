// Chrome extension background script
console.warn('Background script loaded');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.warn('Extension installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.warn('Message received:', message);
  sendResponse({ status: 'received' });
  return true;
}); 