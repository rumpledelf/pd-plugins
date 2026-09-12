(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const watch = root.querySelector('.stopwatch-watch');
    const display = root.querySelector('.stopwatch-display');
    const hand = root.querySelector('.stopwatch-hand');
    const action = root.querySelector('.stopwatch-action');
    const announcement = root.querySelector('.stopwatch-announcement');
    const ticks = root.querySelector('.stopwatch-ticks');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!watch || !display || !hand || !ticks) return;
    for (let i = 0; i < 60; i++) {
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tick.setAttribute('d', 'M115 36v' + (i % 5 ? 4 : 9));
      tick.setAttribute('transform', 'rotate(' + i * 6 + ' 115 127)');
      ticks.appendChild(tick);
    }
    let running = false, elapsed = 0, started = 0, frame = 0;
    function value(now) { return elapsed + (running ? now - started : 0); }
    function draw(now) {
      const ms = value(now);
      const centiseconds = Math.floor(ms / 10);
      display.textContent = String(Math.floor(centiseconds / 6000)).padStart(2, '0') + ':' + String(Math.floor(centiseconds / 100) % 60).padStart(2, '0') + '.' + String(centiseconds % 100).padStart(2, '0');
      const seconds = reduced.matches ? Math.floor(ms / 1000) : ms / 1000;
      hand.setAttribute('transform', 'rotate(' + ((seconds % 60) * 6) + ' 115 127)');
    }
    function tick(now) {
      if (!root.isConnected) { elapsed = value(now); running = false; return; }
      draw(now);
      if (running) frame = requestAnimationFrame(tick);
    }
    function update() {
      watch.setAttribute('aria-pressed', String(running));
      watch.setAttribute('aria-label', running ? 'Pause stopwatch' : 'Start stopwatch');
      action.textContent = running ? 'Tap to pause' : elapsed ? 'Tap to resume' : 'Tap to start';
    }
    function toggle() {
      const now = performance.now();
      if (running) { elapsed = value(now); running = false; cancelAnimationFrame(frame); }
      else { started = now; running = true; frame = requestAnimationFrame(tick); }
      draw(now); update();
      announcement.textContent = running ? 'Stopwatch running.' : 'Paused at ' + display.textContent;
    }
    watch.addEventListener('click', toggle);
    watch.addEventListener('keydown', function (event) { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) toggle(); } });
    root.querySelector('.stopwatch-reset').addEventListener('click', function () {
      cancelAnimationFrame(frame); running = false; elapsed = 0; draw(performance.now()); update(); announcement.textContent = 'Stopwatch reset.';
    });
  }
  boot(document.getElementById('plugin_stopwatch'));
})();
