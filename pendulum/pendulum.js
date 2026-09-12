(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const stage = root.querySelector('.pendulum-stage');
    const arm = root.querySelector('.pendulum-arm');
    const bob = root.querySelector('.pendulum-bob');
    const hint = root.querySelector('.pendulum-hint');
    const stop = root.querySelector('.pendulum-stop');
    if (!stage || !arm || !bob) return;
    const limit = 78 * Math.PI / 180;
    let angle = 0, velocity = 0, frame = 0, previous = 0, pointer = null, held = false;
    function controls(moving) { stop.hidden = !moving; hint.hidden = moving; }
    function draw() {
      arm.setAttribute('transform', 'rotate(' + (-angle * 180 / Math.PI) + ' 210 21)');
      bob.setAttribute('aria-valuenow', Math.round(angle * 180 / Math.PI));
    }
    function animate(now) {
      if (!root.isConnected) return;
      let dt = Math.min((now - previous) / 1000, .05);
      previous = now;
      // A damped pendulum: restoring force follows sine of the angle, with
      // small integration steps so an irregular frame rate cannot add energy.
      while (dt > 0) {
        const step = Math.min(dt, 1 / 240);
        velocity += (-14 * Math.sin(angle) - .38 * velocity) * step;
        angle += velocity * step;
        dt -= step;
      }
      draw();
      if (Math.abs(angle) < .003 && Math.abs(velocity) < .009) {
        angle = 0; velocity = 0; draw(); controls(false); hint.textContent = 'Pull the bob to one side, then let go.'; return;
      }
      frame = requestAnimationFrame(animate);
    }
    function release() {
      if (!held) return;
      held = false; previous = performance.now();
      controls(true);
      frame = requestAnimationFrame(animate);
    }
    function move(event) {
      const matrix = stage.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      angle = Math.max(-limit, Math.min(limit, Math.atan2(point.x - 210, point.y - 21)));
      velocity = 0; draw();
    }
    bob.addEventListener('pointerdown', function (event) {
      if (pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); cancelAnimationFrame(frame);
      pointer = event.pointerId; held = true; velocity = 0;
      bob.setPointerCapture(pointer); move(event); controls(false); hint.textContent = 'Let go to watch it swing.';
    });
    bob.addEventListener('pointermove', function (event) { if (event.pointerId === pointer) move(event); });
    function end(event) {
      if (event.pointerId !== pointer) return;
      pointer = null; release();
    }
    bob.addEventListener('pointerup', end);
    bob.addEventListener('pointercancel', end);
    bob.addEventListener('lostpointercapture', end);
    bob.addEventListener('keydown', function (event) {
      if (event.key.startsWith('Arrow')) {
        event.preventDefault(); cancelAnimationFrame(frame); held = true; velocity = 0;
        angle = Math.max(-limit, Math.min(limit, angle + (event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : 1) * Math.PI / 18));
        draw(); controls(false); hint.textContent = 'Press Space to let go.';
      } else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); if (!event.repeat) release(); }
    });
    bob.addEventListener('blur', function () { if (pointer === null) release(); });
    stop.addEventListener('click', function () {
      cancelAnimationFrame(frame); frame = 0; held = false; pointer = null; angle = 0; velocity = 0;
      draw(); controls(false); hint.textContent = 'Pull the bob to one side, then let go.';
    });
    draw();
  }
  boot(document.getElementById('plugin_pendulum'));
})();
