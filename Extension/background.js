// Register the side panel for all pages by default
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for when the extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open the welcome page when the extension is first installed
    chrome.tabs.create({ url: "welcome.html" });
  }
});

// Listen for when a tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // We only care about tabs that are completely loaded
  if (changeInfo.status === "complete") {
    // Enable the side panel for all pages
    chrome.sidePanel.setOptions({
      tabId: tabId,
      path: "sidebar.html",
      enabled: true
    });
  }
});

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle_sidebar") {
    // Toggle the side panel when the shortcut is pressed
    chrome.sidePanel.open({windowId: chrome.windows.WINDOW_ID_CURRENT});
  }
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSidePanel") {
    chrome.sidePanel.open({windowId: chrome.windows.WINDOW_ID_CURRENT})
      .then(() => sendResponse({success: true}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Keep the message channel open for async response
  }
});