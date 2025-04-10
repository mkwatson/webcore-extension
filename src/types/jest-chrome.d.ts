// Type definitions for jest-chrome
declare module 'jest-chrome' {
  const chrome: typeof ChromeNamespace;
  
  namespace JestChromeNamespace {
    interface ChromeAPI {
      runtime: chrome.runtime;
      storage: chrome.storage;
      action: chrome.action;
      tabs: chrome.tabs;
      // Add other Chrome APIs as needed
    }
  }
  
  export { chrome };
}

// Augment the global jest-chrome namespace
interface Window {
  chrome: chrome.Chrome;
} 