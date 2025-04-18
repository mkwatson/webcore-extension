// packages/extension/src/background.ts
import "./background/callApiStream" // Import to register the listener

// Listen for clicks on the extension's toolbar icon
chrome.action.onClicked.addListener(async (tab) => {
  // The side panel API doesn't automatically open the panel on left-click.
  // We need to explicitly open it for the current tab.
  if (!tab.id) {
    console.error("Tab ID not found for action click.")
    return
  }
  console.log("Action clicked, attempting to open side panel for tab:", tab.id)
  try {
    await chrome.sidePanel.open({ tabId: tab.id })
    console.log("Side panel open command issued for tab:", tab.id)
  } catch (error) {
    console.error("Error opening side panel:", error)
  }
})

// Optional: Keep the service worker alive briefly if needed,
// though usually not necessary just for this listener.
// chrome.runtime.onInstalled.addListener(() => {
//   console.log("WebCore background script installed.");
// });

console.log("WebCore background script loaded and action listener attached.")
