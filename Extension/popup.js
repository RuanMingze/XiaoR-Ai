// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get the open sidebar button
  const openSidebarButton = document.getElementById('openSidebar');
  
  // Add click event listener to the button
  openSidebarButton.addEventListener('click', function() {
    // Open the sidebar
    chrome.sidePanel.open({windowId: chrome.windows.WINDOW_ID_CURRENT});
  });
  
  // Add double click event listener to open welcome page
  document.addEventListener('dblclick', function() {
    // Open the welcome page
    chrome.tabs.create({ url: 'welcome.html' });
  });
});

// Show the current tab URL in the popup
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  console.log('Current tab URL:', tabs[0].url);
});