// Popup script for the Chrome extension
document.addEventListener('DOMContentLoaded', () => {
  console.warn('Popup loaded');
  
  // Get button element
  const actionButton = document.getElementById('actionButton');
  
  // Add click event listener
  if (actionButton) {
    actionButton.addEventListener('click', () => {
      console.warn('Button clicked');
      
      // Send a message to the background script
      chrome.runtime.sendMessage({ action: 'buttonClicked' }, (response) => {
        console.warn('Response:', response);
      });
    });
  }
}); 