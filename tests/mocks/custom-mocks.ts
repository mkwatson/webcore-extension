/**
 * Custom test mocks
 * This file contains any custom mocking functionality needed beyond jest-chrome
 */

/**
 * Mock a DOM element with common methods
 * Useful for mocking the document or specific elements in tests
 */
export class MockElement {
  public style: Record<string, string> = {};
  public classList = {
    add: jest.fn(),
    remove: jest.fn(),
    contains: jest.fn().mockReturnValue(false),
    toggle: jest.fn()
  };
  public innerHTML = '';
  public children: MockElement[] = [];
  public parentElement: MockElement | null = null;
  
  // Create addEventListener as a Jest mock function
  public addEventListener = jest.fn();
  public removeEventListener = jest.fn();
  
  public appendChild = jest.fn().mockImplementation((child: MockElement) => {
    this.children.push(child);
    child.parentElement = this;
    return child;
  });
  
  public getBoundingClientRect = jest.fn().mockReturnValue({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0
  });
  
  public attachShadow = jest.fn().mockImplementation(() => {
    const shadow = new MockElement();
    return shadow;
  });
}

/**
 * Helper to create mock implementation for chrome.storage.local.get
 * @param mockData The data to be returned by the storage.get call
 */
export function createStorageGetMock(mockData: Record<string, any> = {}) {
  return (key: string | string[] | null | Record<string, any>, callback?: (items: Record<string, any>) => void) => {
    if (callback) {
      setTimeout(() => callback(mockData), 0);
    }
  };
}

/**
 * Helper to create mock implementation for chrome.storage.local.set
 */
export function createStorageSetMock() {
  return (items: Record<string, any>, callback?: () => void) => {
    if (callback) {
      setTimeout(() => callback(), 0);
    }
  };
}

/**
 * Helper to create mock implementation for chrome.tabs.query
 * @param mockTabs The tabs to be returned by the tabs.query call
 */
export function createTabsQueryMock(mockTabs: chrome.tabs.Tab[] = []) {
  return (queryInfo: chrome.tabs.QueryInfo, callback?: (result: chrome.tabs.Tab[]) => void) => {
    if (callback) {
      setTimeout(() => callback(mockTabs), 0);
    }
  };
}

/**
 * Helper to create mock implementation for chrome.tabs.sendMessage
 */
export function createTabsSendMessageMock() {
  return (tabId: number, message: any, callback?: (response: any) => void) => {
    if (callback) {
      setTimeout(() => callback({success: true}), 0);
    }
  };
} 