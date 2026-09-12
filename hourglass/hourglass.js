(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const timer = root.querySelector('.hourglass-timer');
    const body = root.querySelector('.hourglass-body');
    const top = root.querySelector('.hourglass-top-sand');
    const bottom = root.querySelector('.hourglass-bottom-sand');
    const stream = root.querySelector('.hourglass-stream');
    const grains = root.querySelector('.hourglass-grains');
    const caption = root.querySelector('.hourglass-caption');
    const announcement = root.querySelector('.hourglass-announcement');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let settings = {};
    try { settings = JSON.parse(root.dataset.pluginSettings || '{}'); } catch (error) {}
    const duration = Math.min(300, Math.max(5, Number(settings.seconds) || 30)) * 1000;
    let progress = 1, startProgress = 1, started = 0, running = false, flipping = false, frame = 0;
    // Integrate the actual bulb outline as a solid of revolution. Equal
    // quantities of sand must occupy equal volumes, not equal heights.
    const outline = root.querySelector('.hourglass-glass');
    const length = outline.getTotalLength();
    const contour = Array.from({ length: 1600 }, (_, i) => outline.getPointAtLength(length * i / 1600));
    const step = .25, cumulative = [0];
    for (let i = 0; i < 340; i++) {
      const y = 31 + (i + .5) * step, crossings = [];
      contour.forEach((p, j) => {
        const q = contour[(j + 1) % contour.length];
        if ((p.y > y) !== (q.y > y)) crossings.push(p.x + (q.x - p.x) * (y - p.y) / (q.y - p.y));
      });
      const width = crossings.length > 1 ? Math.max(...crossings) - Math.min(...crossings) : 0;
      cumulative.push(cumulative[i] + width * width * step);
    }
    const bulbVolume = cumulative[cumulative.length - 1];
    function level(fraction) {
      const target = Math.max(0, Math.min(1, fraction)) * bulbVolume;
      let lo = 0, hi = cumulative.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cumulative[mid] < target) lo = mid; else hi = mid; }
      const part = (target - cumulative[lo]) / (cumulative[hi] - cumulative[lo] || 1);
      return 31 + (lo + part) * step;
    }
    function draw(now) {
      const upperY = level(progress);
      top.setAttribute('y', upperY);
      top.setAttribute('height', Math.max(0, 116 - upperY));
      const baseY = 232 - level(progress);
      bottom.setAttribute('d', 'M49 201V' + baseY + 'H151V201Z');
      const show = running && progress < 1 && !reduced.matches;
      stream.setAttribute('visibility', show ? 'visible' : 'hidden');
      stream.setAttribute('d', 'M100 116V' + baseY);
      stream.setAttribute('stroke-dashoffset', -now / 35);
      grains.setAttribute('visibility', show ? 'visible' : 'hidden');
      grains.setAttribute('transform', 'translate(0 ' + (baseY - 196 + Math.sin(now / 90) * 2) + ')');
    }
    function tick(now) {
      if (!root.isConnected) { running = false; return; }
      progress = Math.min(1, startProgress + (now - started) / duration);
      if (progress >= 1) {
        running = false; caption.textContent = 'Time’s up · Tap to turn';
        announcement.textContent = 'The sand has run out.';
      } else caption.textContent = Math.ceil((1 - progress) * duration / 1000) + ' seconds · Tap to turn';
      draw(now);
      if (running) frame = requestAnimationFrame(tick);
    }
    function flip() {
      if (flipping) return;
      cancelAnimationFrame(frame);
      if (running) progress = Math.min(1, startProgress + (performance.now() - started) / duration);
      running = false; flipping = true;
      stream.setAttribute('visibility', 'hidden'); grains.setAttribute('visibility', 'hidden');
      const begin = performance.now();
      function rotate(now) {
        if (!root.isConnected) { flipping = false; return; }
        const t = reduced.matches ? 1 : Math.min(1, (now - begin) / 650);
        const ease = t * t * (3 - 2 * t);
        body.setAttribute('transform', 'rotate(' + (180 * ease) + ' 100 116)');
        if (t < 1) { frame = requestAnimationFrame(rotate); return; }
        body.removeAttribute('transform');
        progress = 1 - progress;
        startProgress = progress; started = now; running = progress < 1; flipping = false;
        announcement.textContent = 'Hourglass turned.';
        timer.setAttribute('aria-label', 'Flip the hourglass');
        tick(now);
      }
      frame = requestAnimationFrame(rotate);
    }
    timer.addEventListener('click', flip);
    timer.addEventListener('keydown', function (event) { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) flip(); } });
    caption.textContent = 'Tap to turn · ' + duration / 1000 + ' seconds';
    draw(0);
  }
  boot(document.getElementById('plugin_hourglass'));
})();
