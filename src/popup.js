// Get references to DOM elements
const toggleButton = document.getElementById('toggleButton');
const statusText = document.getElementById('status');

// Function to update the status text
function updateStatus(isActive) {
  statusText.textContent = `Status: ${isActive ? 'Active' : 'Inactive'}`;
}

// Initialize status by checking with the background script
chrome.runtime.sendMessage({ action: 'getStatus' }, response => {
  if (response && response.isActive !== undefined) {
    updateStatus(response.isActive);
  }
});

// Listen for status updates from the background
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'statusUpdate') {
    updateStatus(message.isActive);
  }
  return true;
});

// Set up click handler for the toggle button
toggleButton.addEventListener('click', () => {
  // Send toggle message to background script
  chrome.runtime.sendMessage({ action: 'toggleSidebar' }, response => {
    console.log('Toggle response:', response);
  });
}); 