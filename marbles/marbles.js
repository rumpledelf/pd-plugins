(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true' || !root.marblesPhysics) return;
    root.dataset.pluginBooted = 'true';
    const P = root.marblesPhysics, stage = root.querySelector('.marbles-stage');
    if (!stage) return;
    const q = name => root.querySelector('.marbles-' + name);
    const ns = 'http://www.w3.org/2000/svg';
    const palette = ['orange', '#0585BA', '#64317B', '#B7287E', '#4CAF50', '#0585BA', '#64317B', '#B7287E'];
    let world = P.createWorld(), rim = Math.PI / 2, angle = -Math.PI / 2;
    let moving = false, gesture = null, key = null, chargeStart = 0, frame = 0, last = 0, restStart = null;
    const nodes = world.balls.map(b => {
      const group = document.createElementNS(ns, 'g'); group.dataset.ball = b.id;
      group.innerHTML = `<ellipse cy="${b.r - 1}" rx="${b.r * .9}" ry="3" fill="#333333" opacity=".15"/><g class="marbles-art"><circle r="${b.r}" fill="${palette[b.id]}" stroke="#333333" stroke-width="1.2"/><path d="M${-b.r * .7} ${b.r * .3}C${b.r * .8} ${b.r * .8} ${-b.r * .8} ${-b.r * .8} ${b.r * .7} ${-b.r * .3}" fill="none" stroke="${palette[(b.id + 2) % palette.length]}" stroke-width="3" stroke-linecap="round"/></g>`;
      q('balls').append(group); return group;
    });
    const power = now => Math.min(1, Math.max(0, (now - chargeStart) / 1600));
    function draw(now = performance.now()) {
      world.balls.forEach((b, i) => {
        const drift = b.out ? 1 - Math.pow(1 - Math.min(1, (world.time - b.outTime) / .7), 3) : 0;
        nodes[i].setAttribute('transform', `translate(${b.x + (b.exitX || 0) * drift} ${b.y + (b.exitY || 0) * drift})`);
        nodes[i].querySelector('.marbles-art').setAttribute('transform', `rotate(${b.rotation * 180 / Math.PI + drift * 55})`);
        nodes[i].dataset.out = String(b.out);
      });
      const count = world.balls.filter(b => b.id && b.out).length;
      q('score').textContent = `Out: ${count} / 7`;
      const cue = world.balls[0], dx = Math.cos(angle), dy = Math.sin(angle);
      const ready = !moving && count < 7;
      q('aim').setAttribute('visibility', ready ? 'visible' : 'hidden');
      q('guide').setAttribute('d', `M${cue.x + dx * 17} ${cue.y + dy * 17}L${cue.x + dx * 145} ${cue.y + dy * 145}`);
      q('handle').setAttribute('cx', cue.x + dx * 145); q('handle').setAttribute('cy', cue.y + dy * 145);
      const charging = !moving && (gesture?.mode === 'charge' || key !== null);
      q('power').setAttribute('visibility', charging ? 'visible' : 'hidden');
      q('power-fill').setAttribute('d', `M160 406H${160 + power(now) * 120}`);
      stage.dataset.shots = world.shots; stage.dataset.moving = String(moving); stage.dataset.angle = angle;
    }
    function tick(now) {
      frame = 0; if (!root.isConnected) return;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      if (moving) {
        P.step(world, dt);
        if (P.settled(world)) {
          if (restStart === null) restStart = now;
          if (now - restStart > 850) {
            moving = false; placeShooter();
            q('hint').textContent = world.balls.slice(1).every(b => b.out) ? 'All seven out! Nicely done.' : 'Move around the edge, or aim for your next shot.';
          }
        } else restStart = null;
      }
      draw(now);
      if (moving || gesture?.mode === 'charge' || key !== null) frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
    function shoot(now) {
      if (P.shoot(world, angle, power(now))) { moving = true; restStart = null; q('hint').textContent = 'Rolling…'; wake(); }
    }
    function point(event) {
      const p = stage.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
      return p.matrixTransform(stage.getScreenCTM().inverse());
    }
    function placeShooter() {
      P.position(world, rim);
      rim = Math.atan2(world.balls[0].y - P.CY, world.balls[0].x - P.CX);
      angle = rim + Math.PI;
    }
    function constrainAim(a) {
      const centre = rim + Math.PI, delta = Math.atan2(Math.sin(a - centre), Math.cos(a - centre));
      return centre + Math.max(-1.12, Math.min(1.12, delta));
    }
    function cancel() { gesture = null; key = null; draw(); }
    stage.addEventListener('pointerdown', event => {
      if (moving || gesture || key !== null || world.balls.slice(1).every(b => b.out) || !event.isPrimary || event.button !== 0) return;
      event.preventDefault(); stage.focus({preventScroll: true}); stage.setPointerCapture(event.pointerId);
      const p = point(event);
      gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, mode: 'charge', edge: Math.hypot(p.x - P.CX, p.y - P.CY) > P.RING - 18};
      chargeStart = performance.now(); q('hint').textContent = 'Hold for power. Release to shoot, or drag to adjust.'; wake();
    });
    stage.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 5) gesture.mode = 'drag';
      if (gesture.mode !== 'drag') return;
      const p = point(event), cue = world.balls[0];
      if (gesture.edge) { rim = Math.atan2(p.y - P.CY, p.x - P.CX); placeShooter(); }
      else angle = constrainAim(Math.atan2(p.y - cue.y, p.x - cue.x));
      q('hint').textContent = 'Lift, then hold again to shoot.'; draw();
    });
    stage.addEventListener('pointerup', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const mode = gesture.mode; gesture = null;
      if (mode === 'charge') shoot(performance.now()); else draw();
    });
    stage.addEventListener('pointercancel', cancel); stage.addEventListener('lostpointercapture', () => { if (gesture) cancel(); });
    stage.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape'].includes(event.key)) return;
      event.preventDefault(); if (moving || gesture || world.balls.slice(1).every(b => b.out)) return;
      if (event.key === 'Escape') { cancel(); return; }
      if (event.key.startsWith('Arrow') && key === null) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { rim += (event.key === 'ArrowUp' ? -1 : 1) * .08; placeShooter(); }
        else angle = constrainAim(angle + (event.key === 'ArrowLeft' ? -1 : 1) * .025);
        draw();
      } else if (!event.repeat && key === null && [' ', 'Enter'].includes(event.key)) { key = event.key; chargeStart = performance.now(); wake(); }
    });
    stage.addEventListener('keyup', event => { if (event.key === key) { event.preventDefault(); key = null; shoot(performance.now()); } });
    stage.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });
    q('reset').addEventListener('click', () => {
      cancelAnimationFrame(frame); frame = 0; gesture = null; key = null; moving = false;
      world = P.createWorld(); rim = Math.PI / 2; angle = -Math.PI / 2; restStart = null;
      q('hint').textContent = 'Drag the shooter around the edge. Aim, then hold and release.'; draw();
    });
    draw();
  }
  boot(document.getElementById('plugin_marbles'));
})();
