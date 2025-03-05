document.addEventListener('DOMContentLoaded', () => {
  // Initialize Feather icons
  feather.replace();

  // Tab switching
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    chrome.storage.local.set({ theme: newTheme });
  });

  // Load saved theme
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme) {
      document.body.setAttribute('data-theme', result.theme);
    }
  });

  // Market status update
  function updateMarketStatus() {
    const markets = {
      india: {
        timezone: 'Asia/Kolkata',
        openTime: '09:15',
        closeTime: '15:30'
      },
      us: {
        timezone: 'America/New_York',
        openTime: '09:30',
        closeTime: '16:00'
      }
    };

    Object.entries(markets).forEach(([market, config]) => {
      const card = document.querySelector(`.market-card[data-market="${market}"]`);
      const status = card.querySelector('.status');
      const time = card.querySelector('.time');

      const isOpen = checkMarketStatus(config.timezone, config.openTime, config.closeTime);
      status.textContent = isOpen ? '🟢 Open' : '🔴 Closed';
      time.textContent = new Date().toLocaleTimeString('en-US', {
        timeZone: config.timezone,
        hour12: false
      });
    });
  }

  updateMarketStatus();
  setInterval(updateMarketStatus, 1000);
});
