import '../../tests/mocks/chrome';

describe('Background Script', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset console mocks
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Clear module cache to ensure fresh import each time
    jest.resetModules();
  });

  test('sets up message listener on load', () => {
    // Manually import the script to test the listener registration
    require('../../src/background/background');
    
    // Verify the listener was registered
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });

  test('sets up onInstalled listener on load', () => {
    // Manually import the script to test the listener registration
    require('../../src/background/background');
    
    // Verify the listener was registered
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled();
  });

  test('responds to messages with a received status', () => {
    // Import to register listeners
    require('../../src/background/background');
    
    // Create a mock message handler by simulating what happens when a message is received
    const mockSendResponse = jest.fn();
    
    // Find the callback function (first argument to addListener)
    const onMessageCallback = (chrome.runtime.onMessage.addListener as jest.Mock).mock.calls[0][0];
    
    // Call it with a test message
    onMessageCallback({ type: 'test' }, { id: 'test-sender' }, mockSendResponse);
    
    // Verify the response
    expect(mockSendResponse).toHaveBeenCalledWith({ status: 'received' });
  });
}); 