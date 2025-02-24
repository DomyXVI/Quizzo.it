function updateCountdowns() {
  const now = new Date();

  document.querySelectorAll('.countdown').forEach(timer => {
      const resetHour = parseInt(timer.getAttribute('data-time'));
      
      let resetTime = new Date(now);
      resetTime.setHours(resetHour, 0, 0, 0);

      if (resetTime < now) {
          // If the reset time has passed, set it for tomorrow
          resetTime.setDate(resetTime.getDate() + 1);
      }

      let diff = resetTime - now;
      let hours = Math.floor(diff / (1000 * 60 * 60));
      let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Ensure double digits (01, 05, etc.)
      hours = hours.toString().padStart(2, '0');
      minutes = minutes.toString().padStart(2, '0');
      seconds = seconds.toString().padStart(2, '0');

      timer.textContent = `${hours}:${minutes}:${seconds}`;
  });
}

// Update countdowns every second
setInterval(updateCountdowns, 1000);
updateCountdowns(); // Run immediately on page load
