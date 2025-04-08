// Popup script for the Chrome extension
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  
  // Get button element
  const actionButton = document.getElementById('actionButton');
  
  // Add click event listener
  if (actionButton) {
    actionButton.addEventListener('click', () => {
      console.log('Button clicked');
      
      // Send a message to the background script
      chrome.runtime.sendMessage({ action: 'buttonClicked' }, (response) => {
        console.log('Response:', response);
      });
    });
  }
}); 