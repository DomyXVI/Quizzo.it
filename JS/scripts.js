document.querySelectorAll('.card').forEach((card, index) => {
    let delayTimeout;       // Delay before showing loader
    let loaderInterval;     // Interval for updating loader progress
    let loadedTimeout;      // Safety timeout for full hold duration
    let longPressTimer;     // Timer to mark a long press (≥1.1s)
    let pointerDownTime = 0; // Tracks when pointerdown occurred
    let startX = 0, startY = 0; // Tracks initial pointer position
    let pointerDown = false;    // True while user is pressing
    let longPressTriggered = false; // True if user actually long‐pressed
    const longPressThreshold = 1100; // 1.1s threshold
    const moveThreshold = 10;       // Movement in px to consider it a scroll
    const cardKey = `card-${index}`; // Unique key for localStorage
  
    // Restore red border if stored
    if (localStorage.getItem(cardKey) === "true") {
      card.style.borderColor = 'red';
    }
  
    // Check expiration every 5s
    function checkExpiration() {
      const expiryTime = localStorage.getItem(`${cardKey}-expiry`);
      if (expiryTime && Date.now() > expiryTime) {
        if (!card.dataset.expiring) {
          card.dataset.expiring = "true";
          card.style.borderColor = 'green';
          setTimeout(() => {
            card.style.borderColor = 'transparent';
            localStorage.removeItem(cardKey);
            localStorage.removeItem(`${cardKey}-expiry`);
            delete card.dataset.expiring;
            card.style.transform = ''; // Clear inline transform (for hover)
          }, 3000);
        }
      }
    }
    setInterval(checkExpiration, 5000);
  
    // --- Loader Reset ---
    function resetLoader() {
      clearTimeout(delayTimeout);
      clearTimeout(loadedTimeout);
      clearTimeout(longPressTimer);
      clearInterval(loaderInterval);
      const loader = card.querySelector('.loader');
      loader.style.transition = 'none';
      loader.style.width = '0';
      loader.style.opacity = '0';
    }
  
    // --- On Pointer Down ---
    card.addEventListener('pointerdown', (e) => {
      // Do NOT preventDefault() so user can still scroll if they move
      pointerDownTime = Date.now();
      startX = e.clientX; 
      startY = e.clientY;
      pointerDown = true;
      longPressTriggered = false; 
  
      resetLoader(); // Make sure everything is fresh
  
      // If the card is green (reset phase), do nothing
      if (card.style.borderColor === 'green') return;
  
      const loader = card.querySelector('.loader');
  
      // Timer to mark a press as "long" after 1.1s
      longPressTimer = setTimeout(() => {
        longPressTriggered = true;
      }, longPressThreshold);
  
      // --- If card is already red, pressing triggers the "reset to green" loader ---
      if (card.style.borderColor === 'red') {
        loader.style.opacity = '1';
        loader.style.transition = 'width 1s linear';
        const startTime = Date.now();
        loaderInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / 1000, 1);
          loader.style.width = `${progress * 100}%`;
          if (progress >= 1) {
            clearInterval(loaderInterval);
            setTimeout(() => {
              loader.style.opacity = '0';
              // Pop animation -> green
              card.style.transform = 'scale(1.1)';
              setTimeout(() => {
                card.style.transform = '';
                card.style.borderColor = 'green';
              }, 200);
              // After 3s, reset
              setTimeout(() => {
                card.style.borderColor = 'transparent';
                localStorage.removeItem(cardKey);
                localStorage.removeItem(`${cardKey}-expiry`);
              }, 3000);
            }, 200);
          }
        }, 10);
        return; 
      }
  
      // --- Normal branch: card not red yet ---
      delayTimeout = setTimeout(() => {
        loader.style.opacity = '1';
        loader.style.transition = 'width 1s linear';
        const startTime = Date.now();
        loaderInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / 1000, 1);
          loader.style.width = `${progress * 100}%`;
          if (progress >= 1) {
            clearInterval(loaderInterval);
            longPressTriggered = true;
            // Pop -> red
            card.style.borderColor = 'red';
            card.style.transform = 'scale(1.1)';
            setTimeout(() => {
              card.style.transform = '';
              loader.style.opacity = '0';
            }, 200);
            // Store red state (24h)
            const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
            localStorage.setItem(cardKey, "true");
            localStorage.setItem(`${cardKey}-expiry`, expiryTime);
          }
        }, 10);
      }, 100); // 100ms delay
  
      // Safety: set border red after 1.1s
      loadedTimeout = setTimeout(() => {
        card.style.borderColor = 'red';
      }, longPressThreshold);
    });
  
    // --- On Pointer Move (check if user is scrolling) ---
    card.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      // If user moves beyond threshold, assume scrolling or panning -> cancel
      if (dist > moveThreshold) {
        pointerDown = false;
        resetLoader(); 
      }
    });
  
    // --- On Pointer Up/Cancel/Leave ---
    function cancelPress() {
      if (!pointerDown) return; 
      pointerDown = false;
  
      const pressDuration = Date.now() - pointerDownTime;
      resetLoader();
  
      // If user did NOT hold long enough (<1.1s), open the link
      if (pressDuration < longPressThreshold) {
        const link = card.querySelector('a');
        if (link) link.click();
      }
    }
  
    card.addEventListener('pointerup', cancelPress);
    card.addEventListener('pointercancel', cancelPress);
    card.addEventListener('pointerleave', cancelPress);
  });