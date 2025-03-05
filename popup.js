document.addEventListener("DOMContentLoaded", async () => {
  // Tab switching
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and contents
      document
        .querySelectorAll(".tab-btn")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));

      // Add active class to clicked tab and corresponding content
      tab.classList.add("active");
      const contentId = tab.getAttribute("data-tab");
      document.getElementById(contentId).classList.add("active");

      // Update market status immediately when switching to markets tab
      if (contentId === "markets") {
        updateMarketStatus();
      }
    });
  });

  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", newTheme);
    chrome.storage.local.set({ theme: newTheme });

    // Update emoji
    themeToggle.textContent = newTheme === "dark" ? "🌙" : "☀️";
  });

  // Load saved theme
  chrome.storage.local.get(["theme"], (result) => {
    if (result.theme) {
      document.body.setAttribute("data-theme", result.theme);
      themeToggle.textContent = result.theme === "dark" ? "🌙" : "☀️";
    }
  });

  // Reminders functionality
  const remindersList = document.querySelector(".reminders-list");
  const addReminderForm = document.querySelector(".add-reminder-form");
  const addReminderBtn = document.querySelector(".add-reminder-btn");

  // Show/hide reminder form
  addReminderBtn.addEventListener("click", () => {
    addReminderForm.style.display = "block";
    addReminderBtn.style.display = "none";
  });

  document.getElementById("cancel-reminder").addEventListener("click", () => {
    addReminderForm.style.display = "none";
    addReminderBtn.style.display = "block";
  });

  // Save reminder
  document
    .getElementById("save-reminder")
    .addEventListener("click", async () => {
      const time = document.getElementById("reminder-time").value;
      const repeat = document.getElementById("reminder-repeat").value;
      const early = document.getElementById("reminder-early").value;

      if (!time) return;

      const reminder = {
        id: Date.now(),
        time,
        repeat,
        early,
        enabled: true,
      };

      await Storage.addReminder(reminder);
      chrome.runtime.sendMessage({
        type: "createReminder",
        ...reminder,
      });

      renderReminders();
      addReminderForm.style.display = "none";
      addReminderBtn.style.display = "block";
    });

  // Render reminders
  async function renderReminders() {
    const reminders = await Storage.getReminders();
    remindersList.innerHTML = reminders
      .map(
        (reminder) => `
      <div class="reminder-item">
        <input type="checkbox" ${reminder.enabled ? "checked" : ""} 
               onchange="toggleReminder(${reminder.id})">
        <span>${reminder.time}</span>
        <span>${reminder.repeat}</span>
        <span>${reminder.early}m early</span>
        <button onclick="deleteReminder(${reminder.id})">
          🗑️
        </button>
      </div>
    `
      )
      .join("");
  }

  // Market status update
  function updateMarketStatus() {
    const markets = {
      india: {
        timezone: "Asia/Kolkata",
        openTime: "09:15",
        closeTime: "15:30",
      },
      us: {
        timezone: "America/New_York",
        openTime: "09:30",
        closeTime: "16:00",
      },
    };

    Object.entries(markets).forEach(([market, config]) => {
      const card = document.querySelector(
        `.market-card[data-market="${market}"]`
      );
      const status = card.querySelector(".status");
      const time = card.querySelector(".time");

      const isOpen = checkMarketStatus(
        config.timezone,
        config.openTime,
        config.closeTime
      );
      status.textContent = isOpen ? "🟢 Open" : "🔴 Closed";
      time.textContent = formatTime(new Date(), config.timezone);
    });
  }

  //Helper function (assumed from context)
  function formatTime(date, timezone) {
    return date.toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour12: false,
    });
  }

  // Initial render
  renderReminders();
  updateMarketStatus();
  setInterval(updateMarketStatus, 1000);

  // Global functions for reminder management
  window.toggleReminder = async (id) => {
    const reminders = await Storage.getReminders();
    const reminder = reminders.find((r) => r.id === id);
    if (reminder) {
      reminder.enabled = !reminder.enabled;
      await Storage.set("reminders", reminders);
      chrome.runtime.sendMessage({
        type: reminder.enabled ? "createReminder" : "removeReminder",
        id: reminder.id,
      });
    }
    renderReminders(); //Added to update UI after toggle
  };

  window.deleteReminder = async (id) => {
    await Storage.removeReminder(id);
    chrome.runtime.sendMessage({
      type: "removeReminder",
      id,
    });
    renderReminders();
  };
});
