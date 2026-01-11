// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get the close welcome button
  const closeWelcomeButton = document.getElementById('closeWelcome');
  
  // Add click event listener to the button
  if (closeWelcomeButton) {
    closeWelcomeButton.addEventListener('click', function() {
      // Close the welcome window
      window.close();
    });
  }
});

// Show the current tab URL in the popup
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  console.log('Current tab URL:', tabs[0].url);
});