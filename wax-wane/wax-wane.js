(function () {
  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function getMoonPath(P, R) {
    if (P <= 0.5) {
      // Waxing
      const rx = R * Math.abs(1 - 4 * P);
      const sweepTerminator = P < 0.25 ? 0 : 1;
      return `M 0 ${-R} A ${R} ${R} 0 0 1 0 ${R} A ${rx} ${R} 0 0 ${sweepTerminator} 0 ${-R} Z`;
    } else {
      // Waning
      const P_wan = P - 0.5;
      const rx = R * Math.abs(1 - 4 * P_wan);
      const sweepTerminator = P_wan < 0.25 ? 0 : 1;
      return `M 0 ${-R} A ${R} ${R} 0 0 0 0 ${R} A ${rx} ${R} 0 0 ${sweepTerminator} 0 ${-R} Z`;
    }
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    // Query DOM elements
    const moonGroup = root.querySelector('#wax-wane-moon');
    const moonClipPath = root.querySelector('#moon-clip-path');
    const dayCounter = root.querySelector('#wax-wane-day-counter');
    const startButton = root.querySelector('#wax-wane-start');
    const stopButton = root.querySelector('#wax-wane-stop');
    const timeLapseGroups = root.querySelectorAll('.time-lapse-group');
    const stars = root.querySelectorAll('#wax-wane-stars circle');

    if (!moonGroup || !moonClipPath || !dayCounter || !startButton || !stopButton) {
      return;
    }

    // State Variables
    let currentDay = 1;
    let isPlaying = false;
    let animationTimer = null;
    let transitionTimer = null;
    const totalDays = 30;
    const stepDuration = 1000; // 1 second per day
    const fadeDuration = 150;  // 150ms cross-fade shutter effect

    function applyStarsState(day) {
      stars.forEach((star, index) => {
        // Base radius varies by index to preserve variation
        const baseRadius = 1.0 + (index % 5) * 0.2; // 1.0, 1.2, 1.4, 1.6, 1.8
        // Fluctuate size by +/- 0.4px based on day and index
        const delta = Math.sin(day * 1.7 + index) * 0.4;
        const newRadius = Math.max(0.6, baseRadius + delta);
        star.setAttribute('r', newRadius.toFixed(2));
        // Fluctuate opacity between 0.4 and 1.0 for a twinkling effect
        const opacity = 0.4 + Math.abs(Math.cos(day * 1.3 + index)) * 0.6;
        star.setAttribute('opacity', opacity.toFixed(2));
      });
    }

    function applyDayState(day) {
      currentDay = day;
      
      // Calculate phase percentage P:
      // - Days 1 to 15: P goes from 0.0 to 0.5
      // - Days 15 to 30: P goes from 0.5 to ~0.97
      let P;
      if (currentDay <= 15) {
        P = 0.5 * ((currentDay - 1) / 14);
      } else {
        P = 0.5 + 0.5 * ((currentDay - 15) / 16);
      }
      
      // Update Moon clipPath mask
      const R = 40;
      const pathString = getMoonPath(P, R);
      moonClipPath.setAttribute('d', pathString);
      
      // Update Moon position along parabolic curve:
      // - Horizontal x progresses from 50 to 550
      // - Vertical y calculated as a parabola peaking at (300, 80)
      const x = 50 + 500 * ((currentDay - 1) / 29);
      const y = 0.00352 * Math.pow(x - 300, 2) + 80;
      moonGroup.setAttribute('transform', `translate(${x}, ${y})`);
      
      // Calculate phase text label
      let phaseLabel = '';
      if (currentDay === 1) {
        phaseLabel = 'New Moon';
      } else if (currentDay >= 2 && currentDay <= 7) {
        phaseLabel = 'Waxing Crescent';
      } else if (currentDay === 8) {
        phaseLabel = 'First Quarter';
      } else if (currentDay >= 9 && currentDay <= 14) {
        phaseLabel = 'Waxing Gibbous';
      } else if (currentDay === 15) {
        phaseLabel = 'Full Moon';
      } else if (currentDay >= 16 && currentDay <= 22) {
        phaseLabel = 'Waning Gibbous';
      } else if (currentDay === 23) {
        phaseLabel = 'Third Quarter';
      } else {
        phaseLabel = 'Waning Crescent';
      }
      
      // Set the combined Day and Phase Counter text
      dayCounter.textContent = `Day ${currentDay}: ${phaseLabel}`;
      
      // Update star twinkling states
      applyStarsState(currentDay);
    }

    function updateDay(day) {
      if (transitionTimer) {
        clearTimeout(transitionTimer);
      }
      
      // Trigger snappy cross-fade out
      timeLapseGroups.forEach(g => g.classList.add('fading'));
      
      transitionTimer = setTimeout(() => {
        applyDayState(day);
        // Fade back in
        timeLapseGroups.forEach(g => g.classList.remove('fading'));
        transitionTimer = null;
      }, fadeDuration);
    }

    function tick() {
      if (!isPlaying) return;
      
      let nextDay = currentDay + 1;
      if (nextDay > totalDays) {
        nextDay = 1;
      }
      
      updateDay(nextDay);
      animationTimer = setTimeout(tick, stepDuration);
    }

    function updateButtons() {
      if (isPlaying) {
        startButton.className = 'blue';
        stopButton.className = 'grey';
      } else {
        startButton.className = 'grey';
        stopButton.className = 'blue';
      }
    }

    function startTimeline() {
      if (isPlaying) return;
      isPlaying = true;
      updateButtons();
      tick();
    }

    // Set up button listeners
    startButton.addEventListener('click', startTimeline);
    stopButton.addEventListener('click', function () {
      if (!isPlaying) return;
      isPlaying = false;
      updateButtons();
      if (animationTimer) {
        clearTimeout(animationTimer);
        animationTimer = null;
      }
    });

    // Initialize state
    applyDayState(1);
    updateButtons();
  }

  // Boot on the root container
  boot(document.getElementById('plugin_wax-wane'));
})();
