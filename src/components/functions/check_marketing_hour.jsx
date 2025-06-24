export const isIndianMarketOpen = () => {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

  const indianTime = new Intl.DateTimeFormat('en-US', options).formatToParts(now);
  const hours = parseInt(indianTime.find(part => part.type === 'hour')?.value || '0', 10);
  const minutes = parseInt(indianTime.find(part => part.type === 'minute')?.value || '0', 10);
  const day = now.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });

  const currentTime = hours * 60 + minutes;
  const marketOpenTime = 0 * 60 + 15; // 09:15 AM
  const marketCloseTime = 24 * 60 + 0; // 03:30 PM

  // Market is closed on Saturdays (Sat) and Sundays (Sun)
  if (day === 'Sat'|| day === 'Su' ) {
    return false;
  }

  return currentTime >= marketOpenTime && currentTime <= marketCloseTime;
};
