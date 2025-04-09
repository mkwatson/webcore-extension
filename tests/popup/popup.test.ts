import '../../tests/mocks/chrome';

describe('Popup Script', () => {
  // Mocks
  let actionButton: HTMLButtonElement;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Mock console
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Create DOM elements for testing
    document.body.innerHTML = `
      <button id="actionButton">Click Me</button>
    `;
    
    // Get the button element
    actionButton = document.getElementById('actionButton') as HTMLButtonElement;
    expect(actionButton).not.toBeNull();
  });
  
  test('initializes when DOM is loaded', () => {
    // Create a mock for DOMContentLoaded event listener
    const originalAddEventListener = document.addEventListener;
    const mockAddEventListener = jest.fn();
    document.addEventListener = mockAddEventListener;
    
    // Import the popup script
    require('../../src/popup/popup');
    
    // Verify event listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
    
    // Restore original
    document.addEventListener = originalAddEventListener;
  });
  
  test('adds click listener to the action button', () => {
    // Simulate DOMContentLoaded event
    const domContentLoadedEvent = new Event('DOMContentLoaded');
    
    // Import popup script
    require('../../src/popup/popup');
    
    // Trigger DOMContentLoaded
    document.dispatchEvent(domContentLoadedEvent);
    
    // Simulate button click
    actionButton.click();
    
    // Verify message was sent
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'buttonClicked' },
      expect.any(Function)
    );
  });
}); 