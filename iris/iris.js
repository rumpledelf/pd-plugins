(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    const stage = root.querySelector('.iris-stage');
    if (!stage) return;
    root.dataset.pluginBooted = 'true';
    const layer = root.querySelector('.iris-blades');
    const slider = root.querySelector('#iris-aperture');
    const button = root.querySelector('.iris-toggle');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const step = Math.PI / 4;
    const blades = Array.from({length: 8}, () => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', '#999999'); path.setAttribute('stroke', '#333333');
      path.setAttribute('stroke-width', '1'); path.setAttribute('stroke-linejoin', 'round');
      layer.append(path); return path;
    });
    let value = 0, target = 0, frame = 0;
    const point = (r, a) => `${r * Math.cos(a)} ${r * Math.sin(a)}`;
    function draw() {
      const radius = 78 * value;
      const twist = -.65 + value * .48;
      blades.forEach((blade, i) => {
        const a = i * step;
        // Adjacent blades share both inner and outer boundaries: the aperture
        // is one regular octagon, with no cracks as its radius changes.
        blade.setAttribute('d', `M${point(radius, a + twist)}L${point(radius, a + step + twist)}L${point(103, a + step + .58)}A103 103 0 0 0 ${point(103, a + .58)}Z`);
      });
      slider.value = String(Math.round(value * 100));
      slider.setAttribute('aria-valuetext', value < .005 ? 'Closed' : `${Math.round(value * 100)} percent open`);
      const action = target > .5 ? 'Close' : 'Open';
      button.textContent = action; stage.setAttribute('aria-label', `${action} the iris`);
      stage.dataset.aperture = value.toFixed(4);
    }
    function toggle() {
      cancelAnimationFrame(frame);
      target = target > .5 ? 0 : 1;
      const from = value, start = performance.now();
      function tick(now) {
        if (!root.isConnected) return;
        const t = reduced.matches ? 1 : Math.min(1, (now - start) / 1100);
        const eased = t * t * (3 - 2 * t);
        value = from + (target - from) * eased; draw();
        frame = t < 1 ? requestAnimationFrame(tick) : 0;
      }
      frame = requestAnimationFrame(tick);
    }
    button.addEventListener('click', toggle);
    stage.addEventListener('click', toggle);
    stage.addEventListener('keydown', event => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) { event.preventDefault(); toggle(); }
    });
    slider.addEventListener('input', () => {
      cancelAnimationFrame(frame); frame = 0;
      value = Number(slider.value) / 100; target = value; draw();
    });
    draw();
  }
  boot(document.getElementById('plugin_iris'));
})();
