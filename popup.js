document.addEventListener('DOMContentLoaded', async () => {
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

    // Update icon
    themeToggle.innerHTML = `<i data-feather="${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
    feather.replace();
  });

  // Load saved theme
  chrome.storage.local.get(['theme'], (result) => {
    if (result.theme) {
      document.body.setAttribute('data-theme', result.theme);
      themeToggle.innerHTML = `<i data-feather="${result.theme === 'dark' ? 'sun' : 'moon'}"></i>`;
      feather.replace();
    }
  });

  // Reminders functionality
  const remindersList = document.querySelector('.reminders-list');
  const addReminderForm = document.querySelector('.add-reminder-form');
  const addReminderBtn = document.querySelector('.add-reminder-btn');

  // Show/hide reminder form
  addReminderBtn.addEventListener('click', () => {
    addReminderForm.style.display = 'block';
    addReminderBtn.style.display = 'none';
  });

  document.getElementById('cancel-reminder').addEventListener('click', () => {
    addReminderForm.style.display = 'none';
    addReminderBtn.style.display = 'block';
  });

  // Save reminder
  document.getElementById('save-reminder').addEventListener('click', async () => {
    const time = document.getElementById('reminder-time').value;
    const repeat = document.getElementById('reminder-repeat').value;
    const early = document.getElementById('reminder-early').value;

    if (!time) return;

    const reminder = {
      id: Date.now(),
      time,
      repeat,
      early,
      enabled: true
    };

    await Storage.addReminder(reminder);
    chrome.runtime.sendMessage({
      type: 'createReminder',
      ...reminder
    });

    renderReminders();
    addReminderForm.style.display = 'none';
    addReminderBtn.style.display = 'block';
  });

  // Render reminders
  async function renderReminders() {
    const reminders = await Storage.getReminders();
    remindersList.innerHTML = reminders.map(reminder => `
      <div class="reminder-item">
        <input type="checkbox" ${reminder.enabled ? 'checked' : ''} 
               onchange="toggleReminder(${reminder.id})">
        <span>${reminder.time}</span>
        <span>${reminder.repeat}</span>
        <span>${reminder.early}m early</span>
        <button onclick="deleteReminder(${reminder.id})">
          <i data-feather="trash-2"></i>
        </button>
      </div>
    `).join('');
    feather.replace();
  }

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
      time.textContent = formatTime(new Date(), config.timezone);
    });
  }

  //Helper function (assumed from context)
  function formatTime(date, timezone) {
    return date.toLocaleTimeString('en-US', { timeZone: timezone, hour12: false });
  }

  // Initial render
  renderReminders();
  updateMarketStatus();
  setInterval(updateMarketStatus, 1000);

  // Global functions for reminder management
  window.toggleReminder = async (id) => {
    const reminders = await Storage.getReminders();
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
      reminder.enabled = !reminder.enabled;
      await Storage.set('reminders', reminders);
      chrome.runtime.sendMessage({
        type: reminder.enabled ? 'createReminder' : 'removeReminder',
        id: reminder.id
      });
    }
    renderReminders(); //Added to update UI after toggle
  };

  window.deleteReminder = async (id) => {
    await Storage.removeReminder(id);
    chrome.runtime.sendMessage({
      type: 'removeReminder',
      id
    });
    renderReminders();
  };
});