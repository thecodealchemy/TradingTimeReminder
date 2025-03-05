function checkMarketStatus(timezone, openTime, closeTime) {
  const now = new Date().toLocaleString('en-US', { timeZone: timezone });
  const currentTime = new Date(now);

  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const marketOpen = new Date(currentTime);
  marketOpen.setHours(openHour, openMinute, 0);

  const marketClose = new Date(currentTime);
  marketClose.setHours(closeHour, closeMinute, 0);

  return currentTime >= marketOpen && currentTime <= marketClose;
}

function formatTime(date, timezone) {
  return date.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
}

function parseTime(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time;
}

function calculateNextOccurrence(time, repeat = 'once') {
  const next = new Date(time);

  if (next <= new Date()) {
    switch (repeat) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      default:
        return null; // For one-time reminders in the past
    }
  }

  return next;
}