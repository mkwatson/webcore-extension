// Setup file for Jest tests
// Configure the jest-chrome mock for Chrome Extension APIs
/* global jest, global, window, document */
Object.assign(global, require('jest-chrome'));

// Add missing chrome.action API for Manifest V3 testing
if (!global.chrome.action) {
  global.chrome.action = {
    setIcon: jest.fn(),
    setTitle: jest.fn(),
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      hasListener: jest.fn(),
      hasListeners: jest.fn(),
      callListeners: jest.fn(),
      clearListeners: jest.fn()
    }
  };
}

// Mock window.location for all tests
Object.defineProperty(window, 'location', {
  value: {
    hostname: 'example.com',
    pathname: '/',
    search: '',
    href: 'https://example.com/',
    origin: 'https://example.com'
  },
  writable: true
});

// Mock document methods that are commonly used
if (typeof document !== 'undefined') {
  // Use Jest's mock function for addEventListener
  document.addEventListener = jest.fn();
  document.removeEventListener = jest.fn();
}

// Additional Jest setup can go here 