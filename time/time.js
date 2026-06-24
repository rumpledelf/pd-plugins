(function () {
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (e) {
      return {};
    }
  }

  function randomTime() {
    const hour = Math.floor(Math.random() * 12) + 1;
    const minute = MINUTES[Math.floor(Math.random() * MINUTES.length)];
    return { hour, minute };
  }

  function setHands(root, hour, minute) {
    const hourAngle = (hour % 12) * 30 + minute * 0.5;
    const minuteAngle = minute * 6;

    const hourRad = (hourAngle * Math.PI) / 180;
    const minuteRad = (minuteAngle * Math.PI) / 180;

    const hourTip = {
      x: 100 + 50 * Math.sin(hourRad),
      y: 100 - 50 * Math.cos(hourRad)
    };
    const minuteTip = {
      x: 100 + 68 * Math.sin(minuteRad),
      y: 100 - 68 * Math.cos(minuteRad)
    };

    const $hour = root.querySelector('.clock-hand-hour');
    const $minute = root.querySelector('.clock-hand-minute');

    if ($hour) {
      $hour.setAttribute('x2', hourTip.x);
      $hour.setAttribute('y2', hourTip.y);
    }
    if ($minute) {
      $minute.setAttribute('x2', minuteTip.x);
      $minute.setAttribute('y2', minuteTip.y);
    }
  }

  function formatTime(hour, minute) {
    return hour + ':' + String(minute).padStart(2, '0');
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    parseSettings(root);

    let current = randomTime();
    setHands(root, current.hour, current.minute);

    const $random = root.querySelector('#clock-random');
    const $reveal = root.querySelector('#clock-reveal');
    const $digital = root.querySelector('#clock-digital');
    const $hourInput = root.querySelector('#clock-hour-input');
    const $minuteInput = root.querySelector('#clock-minute-input');
    const $check = root.querySelector('#clock-check');
    const $result = root.querySelector('#clock-result');

    function newTime() {
      current = randomTime();
      setHands(root, current.hour, current.minute);
      if ($digital) { $digital.textContent = ''; }
      if ($result) { $result.textContent = ''; $result.className = ''; }
      if ($hourInput) { $hourInput.value = ''; }
      if ($minuteInput) { $minuteInput.value = ''; }
    }

    if ($random) {
      $random.addEventListener('click', newTime);
    }

    if ($reveal && $digital) {
      $reveal.addEventListener('click', function () {
        $digital.textContent = formatTime(current.hour, current.minute);
      });
    }

    if ($check && $hourInput && $minuteInput && $result) {
      $check.addEventListener('click', function () {
        const h = parseInt($hourInput.value, 10);
        const m = parseInt($minuteInput.value, 10);

        if (isNaN(h) || isNaN(m)) {
          $result.textContent = 'Enter a time first.';
          $result.className = '';
          return;
        }

        if (h === current.hour && m === current.minute) {
          $result.textContent = '✓';
          $result.className = 'greentext';
        } else {
          $result.textContent = '✗';
          $result.className = 'magentatext';
        }
      });
    }
  }

  boot(document.getElementById('plugin_time'));
})();
