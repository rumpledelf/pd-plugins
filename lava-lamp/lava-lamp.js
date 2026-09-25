(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    const wax = root.querySelector('.lava-lamp-wax');
    const pool = root.querySelector('.lava-lamp-pool');
    if (!wax || !pool) return;
    root.dataset.pluginBooted = 'true';

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const turn = Math.PI * 2;
    const blobs = [
      { radius: 16, period: 53, phase: .02 },
      { radius: 13, period: 41, phase: .19 },
      { radius: 15, period: 61, phase: .43 },
      { radius: 11, period: 47, phase: .65 },
      { radius: 14, period: 57, phase: .83 },
      { radius: 9, period: 37, phase: .96 }
    ].map((blob, index) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      wax.append(path);
      return { ...blob, index, path };
    });

    // Nearby wax bodies join into necks, then separate as they move apart.
    function contour(cx, cy, rx, ry, time, index) {
      const points = Array.from({ length: 24 }, (_, i) => {
        const angle = i * turn / 24;
        const ripple = 1 + .07 * Math.sin(3 * angle + time * .23 + index)
          + .035 * Math.cos(2 * angle - time * .17 + index);
        return [cx + Math.cos(angle) * rx * ripple, cy + Math.sin(angle) * ry * ripple];
      });
      let path = `M${points[0].join(' ')}`;
      points.forEach((p1, i) => {
        const p0 = points[(i + 23) % 24];
        const p2 = points[(i + 1) % 24];
        const p3 = points[(i + 2) % 24];
        path += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} `
          + `${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2.join(' ')}`;
      });
      return path + 'Z';
    }

    function draw(time) {
      blobs.forEach(({ radius, period, phase, index, path }) => {
        const angle = turn * (time / period + phase);
        // Slow at the top and bottom, stretch during travel, then flatten
        // before falling or rejoining the warm pool at the base.
        const height = (1 - Math.cos(angle)) / 2;
        const cy = 185 - height * 130;
        const stretch = .82 + .4 * Math.abs(Math.sin(angle));
        const rx = radius / Math.sqrt(stretch);
        const ry = radius * stretch;
        const room = Math.max(0, 20 + (cy - 32) * .2 - rx - 4);
        const cx = 90 + room * Math.sin(angle + index * 1.9 + .25 * Math.sin(time * .09));
        path.setAttribute('d', contour(cx, cy, rx, ry, time, index));
      });
      pool.setAttribute('ry', String(13 + 1.5 * Math.sin(time * .18)));
    }

    let elapsed = 0, previous = null, frame = 0;
    function tick(now) {
      frame = 0;
      if (!root.isConnected) {
        document.removeEventListener('visibilitychange', syncMotion);
        reduced.removeEventListener('change', syncMotion);
        return;
      }
      if (previous !== null) elapsed += Math.min((now - previous) / 1000, .05);
      previous = now;
      draw(elapsed);
      frame = requestAnimationFrame(tick);
    }
    function syncMotion() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = null;
      if (!reduced.matches && !document.hidden && root.isConnected) {
        frame = requestAnimationFrame(tick);
      }
    }
    document.addEventListener('visibilitychange', syncMotion);
    reduced.addEventListener('change', syncMotion);
    draw(0);
    syncMotion();
  }

  boot(document.getElementById('plugin_lava-lamp'));
})();
