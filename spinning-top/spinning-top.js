(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const field = root.querySelector('.top-playfield');
    const position = root.querySelector('.top-position');
    const lean = root.querySelector('.top-lean');
    const shadow = root.querySelector('.top-shadow');
    const ribs = root.querySelector('.top-ribs');
    const power = root.querySelector('.top-power');
    const status = root.querySelector('#top-status');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let state = 'ready', frame = 0, started = 0, duration = 0, phase = 0, previous = 0, pointer = null, key = null;
    let launchPower = 0;
    const lines = Array.from({ length: 6 }, function () {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      ribs.appendChild(path);
      return path;
    });
    function drawRibs() {
      lines.forEach(function (line, index) {
        const angle = phase + index * Math.PI / 3;
        const x = Math.sin(angle);
        line.setAttribute('d', 'M' + (47 * x) + ' -77 Q' + (66 * x) + ' -56 ' + (3 * x) + ' -8');
        line.style.opacity = Math.cos(angle) > 0 ? '1' : '0';
      });
    }
    function pose(x, y, angle) {
      position.setAttribute('transform', 'translate(' + x + ' ' + y + ')');
      lean.setAttribute('transform', 'rotate(' + angle + ')');
      shadow.setAttribute('cx', x + Math.sin(angle * Math.PI / 180) * 36);
      shadow.setAttribute('rx', 49 + Math.abs(angle) * .28);
    }
    function tick(now) {
      if (!root.isConnected) { frame = 0; return; }
      const dt = Math.min((now - previous) / 1000, .05);
      previous = now;
      if (state === 'charging') {
        const charge = Math.min(1, (now - started) / 1600);
        power.setAttribute('stroke-dashoffset', 1 - charge);
        pose(300, 184, -charge * 7);
      } else if (state === 'spinning') {
        const elapsed = (now - started) / 1000;
        const progress = Math.min(1, elapsed / duration);
        phase += dt * (2 + (8 + 18 * launchPower) * Math.pow(1 - progress, 1.2));
        const wobble = Math.pow(Math.max(0, (progress - .5) / .5), 2);
        const drift = reduced.matches ? 0 : 1;
        const x = 300 + drift * (Math.sin(elapsed * .65) * 27 + Math.sin(elapsed * 1.3) * 8);
        const y = 181 + drift * Math.sin(elapsed * .9) * 3;
        pose(x, y, drift * Math.sin(phase * .5) * (1 + wobble * 24));
        drawRibs();
        if (progress === 1) {
          state = 'falling'; started = now;
          field.dataset.fallX = x; field.dataset.fallY = y;
          field.dataset.fallAngle = drift * Math.sin(phase * .5) * 25;
          status.textContent = 'One last wobble…';
        }
      } else if (state === 'falling') {
        const t = Math.min(1, (now - started) / (reduced.matches ? 240 : 1900));
        const initial = Number(field.dataset.fallAngle);
        const direction = initial < 0 ? -1 : 1;
        const fall = Math.min(1, t / .63);
        const angle = initial + (direction * 78 - initial) * fall * fall;
        const bounce = !reduced.matches && t > .63 ? Math.sin((t - .63) / .37 * Math.PI * 3) * (1 - t) * 15 : 0;
        pose(Number(field.dataset.fallX), Number(field.dataset.fallY) - Math.abs(angle) * .33, angle + bounce);
        phase += dt * (1 - t) * 2;
        drawRibs();
        if (t === 1) { state = 'rest'; status.textContent = 'All spun out. Hold to spin again.'; }
      }
      field.dataset.state = state;
      frame = state === 'charging' || state === 'spinning' || state === 'falling' ? requestAnimationFrame(tick) : 0;
    }
    function begin() {
      if (state === 'charging') return;
      cancelAnimationFrame(frame);
      state = 'charging'; started = previous = performance.now();
      field.classList.add('is-charging');
      status.textContent = 'Hold longer for more oomph…';
      tick(started);
    }
    function release(cancelled) {
      if (state !== 'charging') return;
      const charge = Math.min(1, (performance.now() - started) / 1600);
      launchPower = charge;
      field.classList.remove('is-charging');
      state = cancelled ? 'ready' : 'spinning';
      duration = 5 + charge * 15;
      started = previous = performance.now();
      pose(300, 184, 0);
      status.textContent = cancelled ? 'Hold to wind up · release to spin' : 'Spinning…';
      if (cancelled) { cancelAnimationFrame(frame); frame = 0; }
      field.dataset.state = state;
    }
    field.addEventListener('pointerdown', function (event) {
      if (!event.isPrimary || event.button !== 0 || key !== null) return;
      event.preventDefault(); pointer = event.pointerId;
      field.focus({ preventScroll: true }); field.setPointerCapture(pointer); begin();
    });
    field.addEventListener('pointerup', function (event) { if (event.pointerId === pointer) { pointer = null; release(false); } });
    field.addEventListener('pointercancel', function () { pointer = null; release(true); });
    field.addEventListener('lostpointercapture', function () { if (pointer !== null) { pointer = null; release(true); } });
    field.addEventListener('keydown', function (event) {
      if (![' ', 'Enter'].includes(event.key)) return;
      event.preventDefault();
      if (event.repeat || key !== null || pointer !== null) return;
      key = event.key; begin();
    });
    field.addEventListener('keyup', function (event) { if (event.key === key) { event.preventDefault(); key = null; release(false); } });
    field.addEventListener('blur', function () { key = null; pointer = null; release(true); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { key = null; pointer = null; release(true); }
    });
    drawRibs();
  }
  boot(document.getElementById('plugin_spinning-top'));
})();
