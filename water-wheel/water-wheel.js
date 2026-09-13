(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const ns = 'http://www.w3.org/2000/svg';
    const wheel = root.querySelector('.water-wheel');
    const spokes = root.querySelector('.water-spokes');
    const bucketGroup = root.querySelector('.water-buckets');
    const pours = root.querySelector('.water-pours');
    const channel = root.querySelector('.water-channel');
    const rippleGroup = root.querySelector('.water-ripples');
    const button = root.querySelector('button');
    const slider = root.querySelector('input');
    let angle = 0, last = 0, frame = 0, flowPhase = 0, wet = 0;
    let running = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    function element(tag, attributes, parent) {
      const node = document.createElementNS(ns, tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
      parent.appendChild(node); return node;
    }
    const buckets = Array.from({ length: 10 }, (_, index) => {
      const a = index * Math.PI * 2 / 10;
      element('path', { d: 'M210 115L' + (210 + Math.cos(a) * 79) + ' ' + (115 + Math.sin(a) * 79) }, spokes);
      const group = element('g', {}, bucketGroup);
      element('path', { d: 'M-10-5L-7 10Q0 13 7 10L10-5Z', fill: 'gainsboro', stroke: '#555555', 'stroke-width': 2 }, group);
      const water = element('path', { d: 'M-7 1H7L5 8Q0 10-5 8Z', fill: '#0585BA', opacity: 0 }, group);
      element('path', { d: 'M-10-5Q0-9 10-5', fill: 'none', stroke: '#555555', 'stroke-width': 2 }, group);
      const pour = element('path', { opacity: 0 }, pours);
      return { group, water, pour, full: false, offset: a };
    });
    const ripples = Array.from({ length: 12 }, () => element('path', {}, rippleGroup));
    function draw(dt) {
      const speed = Number(slider.value) / 100;
      angle += dt * speed * .85;
      flowPhase += dt * speed * 50;
      wheel.setAttribute('transform', 'rotate(' + angle * 180 / Math.PI + ' 210 115)');
      buckets.forEach(bucket => {
        const a = ((angle + bucket.offset) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const x = 210 + Math.cos(a) * 79, y = 115 + Math.sin(a) * 79;
        if (y > 186) bucket.full = true;
        const tipping = a > Math.PI * 1.5 && a < Math.PI * 1.75;
        const tip = tipping ? Math.sin((a - Math.PI * 1.5) / (Math.PI * .25) * Math.PI) * 100 : 0;
        bucket.group.setAttribute('transform', 'translate(' + x + ' ' + y + ') rotate(' + tip + ')');
        // Empty before the lip falls below the receiving channel.
        if (a >= Math.PI * 1.68 && a < Math.PI * 1.9) bucket.full = false;
        const pouring = bucket.full && tipping && tip > 25;
        bucket.pour.setAttribute('opacity', pouring ? '1' : '0');
        if (pouring) {
          const tilt = tip * Math.PI / 180;
          const lipX = x + 10 * Math.cos(tilt) + 5 * Math.sin(tilt);
          const lipY = y + 10 * Math.sin(tilt) - 5 * Math.cos(tilt);
          const landingX = Math.max(263, lipX + 18);
          const landingY = 62 + (landingX - 258) * 13 / 292;
          bucket.pour.setAttribute('d', 'M' + lipX + ' ' + lipY + ' Q' + (lipX + 12) + ' ' + Math.min(landingY, lipY + 6) + ' ' + landingX + ' ' + landingY);
          wet = 1;
        }
        bucket.water.setAttribute('opacity', bucket.full ? '1' : '0');
      });
      wet = Math.max(0, wet - dt * .12);
      channel.setAttribute('opacity', wet);
      channel.setAttribute('stroke-dasharray', '28 6');
      channel.setAttribute('stroke-dashoffset', -flowPhase);
      ripples.forEach((ripple, index) => {
        const x = 45 + ((index * 43 - flowPhase) % 505 + 505) % 505;
        const y = 197 + index % 3 * 5;
        ripple.setAttribute('d', 'M' + x + ' ' + y + 'q8 3 17 0');
      });
    }
    function tick(now) {
      if (!root.isConnected || !running || document.hidden) { frame = 0; return; }
      draw(last ? Math.min(.05, (now - last) / 1000) : 0);
      last = now;
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      button.textContent = running ? 'Pause' : 'Run';
      button.setAttribute('aria-label', running ? 'Pause water wheel' : 'Run water wheel');
      if (running && !frame && !document.hidden) { last = 0; frame = requestAnimationFrame(tick); }
      if (!running) { cancelAnimationFrame(frame); frame = 0; }
    }
    button.addEventListener('click', () => { running = !running; sync(); });
    document.addEventListener('visibilitychange', sync);
    draw(0); sync();
  }
  boot(document.getElementById('plugin_water-wheel'));
})();
