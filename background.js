// Check market status and update badge
function updateBadge() {
  const indiaMarketOpen = checkMarketStatus("Asia/Kolkata", "09:15", "15:30");
  const usMarketOpen = checkMarketStatus("America/New_York", "09:30", "16:00");

  if (indiaMarketOpen || usMarketOpen) {
    const currentTime = new Date()
      .toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(/^24/, "00");

    chrome.action.setBadgeText({ text: currentTime });
    chrome.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] }); // transparent background
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Initialize alarms for market open/close notifications
function initializeAlarms() {
  chrome.alarms.create("updateBadge", { periodInMinutes: 1 });

  // Check for market opening/closing notifications
  chrome.storage.local.get(
    ["notifyMarketOpen", "notifyMarketClose", "closeNotificationTime"],
    (settings) => {
      if (settings.notifyMarketOpen) {
        chrome.alarms.create("checkMarketOpen", { periodInMinutes: 1 });
      }
      if (settings.notifyMarketClose) {
        chrome.alarms.create("checkMarketClose", { periodInMinutes: 1 });
      }
    }
  );
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case "updateBadge":
      updateBadge();
      break;
    case "checkMarketOpen":
      checkMarketOpenNotification();
      break;
    case "checkMarketClose":
      checkMarketCloseNotification();
      break;
    default:
      if (alarm.name.startsWith("reminder-")) {
        handleReminderAlarm(alarm.name);
      }
  }
});

// Check if markets are about to open
async function checkMarketOpenNotification() {
  const settings = await chrome.storage.local.get([
    "trackIndianMarket",
    "trackUSMarket",
  ]);

  if (settings.trackIndianMarket) {
    const indiaOpenTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    // Check 5 minutes before market opens
    if (isTimeNearTarget(indiaOpenTime, "09:15", 5)) {
      showNotification(
        "Indian Market Opening",
        "Indian market will open in 5 minutes"
      );
    }
  }

  if (settings.trackUSMarket) {
    const usOpenTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    if (isTimeNearTarget(usOpenTime, "09:30", 5)) {
      showNotification("US Market Opening", "US market will open in 5 minutes");
    }
  }
}

// Check if markets are about to close
async function checkMarketCloseNotification() {
  const settings = await chrome.storage.local.get([
    "trackIndianMarket",
    "trackUSMarket",
    "closeNotificationTime",
  ]);

  const minutesBefore = parseInt(settings.closeNotificationTime) || 5;

  if (settings.trackIndianMarket) {
    const indiaTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    if (isTimeNearTarget(indiaTime, "15:30", minutesBefore)) {
      showNotification(
        "Indian Market Closing",
        `Indian market will close in ${minutesBefore} minutes`
      );
    }
  }

  if (settings.trackUSMarket) {
    const usTime = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    if (isTimeNearTarget(usTime, "16:00", minutesBefore)) {
      showNotification(
        "US Market Closing",
        `US market will close in ${minutesBefore} minutes`
      );
    }
  }
}

// Handle custom reminder alarms
async function handleReminderAlarm(alarmName) {
  const reminderId = alarmName.replace("reminder-", "");
  const reminders = await Storage.getReminders();
  const reminder = reminders.find((r) => r.id.toString() === reminderId);

  if (reminder && reminder.enabled) {
    showNotification("Market Reminder", `Your reminder for ${reminder.time}`);

    // Handle recurring reminders
    if (reminder.repeat !== "once") {
      const nextTime = calculateNextReminderTime(reminder);
      chrome.alarms.create(`reminder-${reminder.id}`, {
        when: nextTime.getTime(),
      });
    }
  }
}

// Helper function to show notifications
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "assets/icon.svg",
    title,
    message,
    priority: 2,
  });
}

// Helper function to check if current time is near target time
function isTimeNearTarget(currentTime, targetTime, minutesBefore) {
  const current = new Date(currentTime);
  const [targetHour, targetMinute] = targetTime.split(":").map(Number);
  const target = new Date(current);
  target.setHours(targetHour, targetMinute, 0);

  const diffMinutes = (target - current) / (1000 * 60);
  return diffMinutes > 0 && diffMinutes <= minutesBefore;
}

// Helper function to calculate next reminder time for recurring reminders
function calculateNextReminderTime(reminder) {
  const [hours, minutes] = reminder.time.split(":").map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);

  if (reminder.repeat === "daily") {
    if (next <= new Date()) {
      next.setDate(next.getDate() + 1);
    }
  } else if (reminder.repeat === "weekly") {
    while (next <= new Date()) {
      next.setDate(next.getDate() + 7);
    }
  }

  return next;
}

// Initialize extension
initializeAlarms();
updateBadge();

// Handle reminder notifications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "createReminder") {
    const [hours, minutes] = request.time.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (reminderTime <= new Date()) {
      if (request.repeat === "daily") {
        reminderTime.setDate(reminderTime.getDate() + 1);
      } else if (request.repeat === "weekly") {
        reminderTime.setDate(reminderTime.getDate() + 7);
      } else {
        return; // Don't create alarm for past one-time reminders
      }
    }

    chrome.alarms.create(`reminder-${request.id}`, {
      when: reminderTime.getTime(),
    });
    sendResponse({ success: true });
  } else if (request.type === "removeReminder") {
    chrome.alarms.clear(`reminder-${request.id}`);
    sendResponse({ success: true });
  }
  return true;
});

// Placeholder for checkMarketStatus function (needs implementation)
function checkMarketStatus(timezone, openTime, closeTime) {
  const now = new Date().toLocaleTimeString("en-US", {
    timeZone: timezone,
    hour12: false,
  });
  const [openHour, openMinute] = openTime.split(":").map(Number);
  const [closeHour, closeMinute] = closeTime.split(":").map(Number);
  const [currentHour, currentMinute] = now.split(":").map(Number);

  return (
    currentHour > openHour ||
    (currentHour === openHour &&
      currentMinute >= openMinute &&
      currentHour < closeHour) ||
    (currentHour === closeHour && currentMinute <= closeMinute)
  );
}

// Placeholder for Storage object (needs implementation - likely involves chrome.storage)
const Storage = {
  getReminders: async () => {
    return new Promise((resolve) => {
      chrome.storage.local.get(["reminders"], (result) => {
        resolve(result.reminders || []);
      });
    });
  },
};
