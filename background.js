// Check market status and update badge
function updateBadge() {
  const indiaTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const usTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  
  const indiaMarketOpen = checkMarketStatus('Asia/Kolkata', '09:15', '15:30');
  const usMarketOpen = checkMarketStatus('America/New_York', '09:30', '16:00');
  
  if (indiaMarketOpen || usMarketOpen) {
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    chrome.action.setBadgeText({ 
      text: indiaMarketOpen ? 'IST' : 'EDT'
    });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Initialize alarms for market open/close notifications
function initializeAlarms() {
  chrome.alarms.create('updateBadge', { periodInMinutes: 1 });
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBadge') {
    updateBadge();
  }
});

// Initialize extension
initializeAlarms();
updateBadge();

// Handle reminder notifications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'createReminder') {
    chrome.alarms.create(`reminder-${request.id}`, {
      when: request.time
    });
    sendResponse({ success: true });
  }
});
