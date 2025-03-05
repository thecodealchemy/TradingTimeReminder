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
