document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.local.get([
    'notifyMarketOpen',
    'notifyMarketClose',
    'closeNotificationTime',
    'trackIndianMarket',
    'trackUSMarket'
  ], (settings) => {
    document.getElementById('notifyMarketOpen').checked = settings.notifyMarketOpen ?? true;
    document.getElementById('notifyMarketClose').checked = settings.notifyMarketClose ?? true;
    document.getElementById('closeNotificationTime').value = settings.closeNotificationTime ?? '5';
    document.getElementById('trackIndianMarket').checked = settings.trackIndianMarket ?? true;
    document.getElementById('trackUSMarket').checked = settings.trackUSMarket ?? true;
  });

  // Save settings
  document.getElementById('save').addEventListener('click', () => {
    const settings = {
      notifyMarketOpen: document.getElementById('notifyMarketOpen').checked,
      notifyMarketClose: document.getElementById('notifyMarketClose').checked,
      closeNotificationTime: document.getElementById('closeNotificationTime').value,
      trackIndianMarket: document.getElementById('trackIndianMarket').checked,
      trackUSMarket: document.getElementById('trackUSMarket').checked
    };

    chrome.storage.local.set(settings, () => {
      // Show save confirmation
      const saveBtn = document.getElementById('save');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      saveBtn.style.background = 'var(--primary)';
      
      setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = '';
      }, 2000);
    });
  });
});
