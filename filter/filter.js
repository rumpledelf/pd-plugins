(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const q = name => root.querySelector('.filter-' + name);
    const jug = q('jug'), clip = q('jug-clip'), water = q('jug-water'), muddy = q('muddy');
    const clean = q('clean'), pour = q('pour'), drips = q('drips'), splash = q('splash'), caption = q('caption');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let source = 1, cone = 0, collected = 0, tilt = 0, holding = false, pointer = null, key = null, frame = 0, last = 0;
    const polygon = [[-12.5,-58],[12.5,-58],[12.5,-18],[48,67],[44,70.5],[-44,70.5],[-48,67],[-12.5,-18]];
    const particles = [];
    for (let i = 0; i < 25; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const row = Math.floor(Math.sqrt(i));
      circle.setAttribute('cx', 240 + (i - row * row - row) * 3.4);
      circle.setAttribute('cy', 131 - row * 3.7);
      circle.setAttribute('r', '1.8'); q('residue').append(circle); particles.push(circle);
    }
    function area(points) {
      return Math.abs(points.reduce((sum, p, i) => { const n = points[(i + 1) % points.length]; return sum + p[0] * n[1] - n[0] * p[1]; }, 0)) / 2;
    }
    const capacity = area(polygon) * .7 * .7 * .8;
    function below(points, level) {
      const result = [];
      points.forEach((a, i) => {
        const b = points[(i + 1) % points.length], insideA = a[1] >= level, insideB = b[1] >= level;
        if (insideA) result.push(a);
        if (insideA !== insideB) { const t = (level - a[1]) / (b[1] - a[1]); result.push([a[0] + t * (b[0] - a[0]), level]); }
      });
      return result;
    }
    function draw(now, draining, incoming) {
      const lift = Math.min(1, tilt / 58), lipX = 145 + 65 * lift, lipY = 115 - 55 * lift;
      const transform = `translate(${lipX} ${lipY}) rotate(${tilt}) scale(.7) translate(-14 60)`;
      jug.setAttribute('transform', transform); clip.setAttribute('transform', transform);
      const radians = tilt * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
      const points = polygon.map(([x,y]) => [lipX + .7 * ((x - 14) * c - (y + 60) * s), lipY + .7 * ((x - 14) * s + (y + 60) * c)]);
      const shadow = q('jug-shadow');
      shadow.setAttribute('cx', lipX + .7 * (-14 * c - 70 * s));
      shadow.setAttribute('rx', 29 + lift * 9); shadow.setAttribute('opacity', .12 - lift * .06);
      let lo = Math.min(...points.map(p => p[1])), hi = Math.max(...points.map(p => p[1]));
      for (let i = 0; i < 22; i++) { const mid = (lo + hi) / 2; if (area(below(points, mid)) > capacity * source) lo = mid; else hi = mid; }
      const level = (lo + hi) / 2;
      water.setAttribute('d', `M0 ${level}H400V230H0Z`);
      water.setAttribute('opacity', source > .0001 ? '.75' : '0');
      const coneY = 135 - 55 * Math.sqrt(cone / .25);
      muddy.setAttribute('y', coneY); muddy.setAttribute('height', 135 - coneY);
      particles.forEach((particle, i) => particle.setAttribute('opacity', i < (1 - source) * 25 ? '1' : '0'));
      const cleanY = 204 - collected * 55;
      clean.setAttribute('x', '206'); clean.setAttribute('width', '68'); clean.setAttribute('y', cleanY); clean.setAttribute('height', 204 - cleanY);
      pour.setAttribute('visibility', incoming ? 'visible' : 'hidden');
      pour.setAttribute('d', `M${lipX} ${lipY}Q${lipX+18} ${lipY+3} 240 ${Math.max(82, coneY)}`);
      // Borrow the hourglass's falling-grain dash motion and moving landing flecks.
      drips.setAttribute('visibility', draining ? 'visible' : 'hidden');
      drips.setAttribute('d', 'M240 137V' + cleanY);
      drips.setAttribute('stroke-dashoffset', reduced.matches ? '0' : -now / 35);
      splash.setAttribute('visibility', draining && !reduced.matches ? 'visible' : 'hidden');
      splash.setAttribute('transform', 'translate(0 ' + (cleanY - 200 + Math.sin(now / 90) * 1.5) + ')');
    }
    function tick(now) {
      frame = 0;
      if (!root.isConnected) { holding = false; return; }
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      const target = holding && source > 0 ? 58 + 27 * (1 - source) : 0;
      tilt += (target - tilt) * Math.min(1, dt * (reduced.matches ? 100 : 8));
      if (Math.abs(target - tilt) < .1) tilt = target;
      const incoming = holding && source > 0 && tilt > 30;
      const added = incoming ? Math.min(source, dt * .12, .25 - cone) : 0;
      source -= added; cone += added;
      const removed = Math.min(cone, dt * .075);
      cone -= removed; collected += removed;
      if (source < .00001) source = 0;
      if (cone < .00001) cone = 0;
      draw(now, cone > 0, added > 0);
      if (source === 0 && cone === 0) caption.textContent = 'Particles stay in the filter. Water passes through.';
      else if (!holding && cone > 0) caption.textContent = 'Water keeps dripping through the filter.';
      else if (!holding) caption.textContent = 'Hold the flask to pour. The filter catches particles.';
      if ((holding && source > 0) || cone > 0 || tilt !== target) frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
    function begin() { holding = true; caption.textContent = source > 0 ? 'Pouring water and green particles…' : 'The flask is empty. Reset to try again.'; wake(); }
    function stop() { holding = false; if (cone === 0 && source > 0) caption.textContent = 'Hold the flask to pour. The filter catches particles.'; wake(); }
    jug.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || key !== null) return;
      event.preventDefault(); pointer = event.pointerId; jug.focus({preventScroll:true}); jug.setPointerCapture(pointer); begin();
    });
    jug.addEventListener('pointerup', event => { if (event.pointerId === pointer) { pointer = null; stop(); } });
    jug.addEventListener('pointercancel', () => { pointer = null; stop(); });
    jug.addEventListener('lostpointercapture', () => { if (pointer !== null) { pointer = null; stop(); } });
    jug.addEventListener('keydown', event => { if (![' ', 'Enter'].includes(event.key)) return; event.preventDefault(); if (!event.repeat && key === null && pointer === null) { key = event.key; begin(); } });
    jug.addEventListener('keyup', event => { if (event.key === key) { key = null; stop(); } });
    jug.addEventListener('blur', () => { key = null; pointer = null; stop(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { key = null; pointer = null; stop(); } });
    q('reset').addEventListener('click', () => {
      cancelAnimationFrame(frame); frame = 0; holding = false; pointer = key = null; source = 1; cone = collected = tilt = 0;
      caption.textContent = 'Hold the flask to pour. The filter catches particles.'; draw(0, false, false);
    });
    draw(0, false, false);
  }
  boot(document.getElementById('plugin_filter'));
})();
