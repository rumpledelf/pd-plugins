(function () {
  const COUNT = 12, BASE = 205, PITCH = 3.5, TOP = BASE - COUNT * PITCH;
  function makeState() { return Array.from({length: COUNT + 1}, function () { return {x: 0, y: 0, vx: 0, vy: 0}; }); }
  function integrate(nodes, dt, held, target) {
    if (held) { nodes[COUNT].x = target.x; nodes[COUNT].y = target.y; nodes[COUNT].vx = target.vx || 0; nodes[COUNT].vy = target.vy || 0; }
    const forces = nodes.map(function (node, i) {
      if (!i || (held && i === COUNT)) return {x: 0, y: 0};
      const below = nodes[i - 1], above = nodes[i + 1];
      return {
        x: 650 * (below.x - node.x + (above ? above.x - node.x : 0)) - 1.05 * node.vx,
        y: 650 * (below.y - node.y + (above ? above.y - node.y : 0)) - 1.05 * node.vy
      };
    });
    for (let i = 1; i <= COUNT; i++) {
      if (held && i === COUNT) continue;
      const n = nodes[i];
      n.vx += forces[i].x * dt; n.vy += forces[i].y * dt;
      n.x += n.vx * dt; n.y += n.vy * dt;
    }
    const closingSpeed=nodes[COUNT].vy;
    // Compressed coils touch instead of passing through one another.
    // Sweep both ways so a held top can push the stack down onto its base.
    for (let i = COUNT - 1; i >= 1; i--) {
      const minimum = BASE - (i + 1) * PITCH + nodes[i + 1].y + 2.5;
      if (BASE - i * PITCH + nodes[i].y < minimum) { nodes[i].y = minimum - (BASE - i * PITCH); nodes[i].vy *= .25; }
    }
    for (let i = 1; i <= COUNT; i++) {
      const maximum = BASE - (i - 1) * PITCH + nodes[i - 1].y - 2.5;
      if (BASE - i * PITCH + nodes[i].y > maximum) { nodes[i].y = maximum - (BASE - i * PITCH); nodes[i].vy = -Math.abs(nodes[i].vy) * .3; }
    }
    if(!held&&nodes[COUNT].y>=-.5&&closingSpeed>5){
      // The closed stack transmits its impact back up the spring.
      for(let i=1;i<=COUNT;i++)nodes[i].vy=Math.min(nodes[i].vy,-closingSpeed*.45*i/COUNT);
    }
  }
  function tilt(nodes,i){
    if(i===0)return 0;
    const low=Math.max(0,i-1),high=Math.min(COUNT,i+1);
    return Math.max(-1.05,Math.min(1.05,Math.atan2(nodes[high].x-nodes[low].x,(high-low)*PITCH+nodes[low].y-nodes[high].y)));
  }
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const stage = root.querySelector('.boing-stage'), top = root.querySelector('.boing-top');
    const coils = root.querySelector('.boing-coils'), hint = root.querySelector('.boing-hint');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!stage || !top || !coils) return;
    let nodes = makeState(), held = false, pointer = null, target = {x: 0, y: 0}, frame = 0, active = false, previous = 0, lastHeldTime = 0;
    function draw() {
      let path = '';
      for (let step = 0; step <= COUNT * 24; step++) {
        const t = step / 24, index = Math.min(COUNT - 1, Math.floor(t)), blend = Math.min(1, t - index);
        const a = nodes[COUNT - index], b = nodes[COUNT - index - 1];
        const cx = 200 + a.x * (1 - blend) + b.x * blend;
        const cy = BASE - (COUNT - t) * PITCH + a.y * (1 - blend) + b.y * blend;
        const angle = t * Math.PI * 2;
        const bend=tilt(nodes,COUNT-index)*(1-blend)+tilt(nodes,COUNT-index-1)*blend;
        const u=38*Math.cos(angle),v=7*Math.sin(angle);
        const x = cx + u*Math.cos(bend)-v*Math.sin(bend), y = cy + u*Math.sin(bend)+v*Math.cos(bend);
        path += (step ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
      }
      coils.setAttribute('d', path);
      top.setAttribute('transform', 'translate(' + (200 + nodes[COUNT].x) + ' ' + (TOP + nodes[COUNT].y) + ') rotate(' + tilt(nodes,COUNT)*180/Math.PI + ')');
    }
    function rest() {
      cancelAnimationFrame(frame); active = false; held = false; pointer = null; nodes = makeState(); target = {x: 0, y: 0};
      hint.textContent = 'Pull the top coil, then let go.'; draw();
    }
    function tick(now) {
      if (!root.isConnected) { active = false; return; }
      let remaining = Math.min(.04, (now - previous) / 1000); previous = now;
      while (remaining > 0) { const dt = Math.min(remaining, 1 / 240); integrate(nodes, dt, held, target); remaining -= dt; }
      draw();
      const quiet = nodes.every(function (n) { return Math.abs(n.x) < .06 && Math.abs(n.y) < .06 && Math.abs(n.vx) < .1 && Math.abs(n.vy) < .1; });
      if (!held && quiet) { rest(); return; }
      frame = requestAnimationFrame(tick);
    }
    function start() {
      if (active || reduced.matches) return;
      active = true; previous = performance.now(); frame = requestAnimationFrame(tick);
    }
    function stretch(x, y) {
      const now=performance.now(),dt=Math.max(.016,(now-lastHeldTime)/1000);
      const next={x:Math.max(-95,Math.min(95,x)),y:Math.max(36-TOP,Math.min(0,y))};
      next.vx=held?Math.max(-350,Math.min(350,(next.x-target.x)/dt)):0;
      next.vy=held?Math.max(-350,Math.min(350,(next.y-target.y)/dt)):0;
      target=next;lastHeldTime=now;
      held = true; hint.textContent = 'Let go… boing!';
      if (reduced.matches) {
        for (let i = 1; i <= COUNT; i++) { nodes[i].x = target.x * i / COUNT; nodes[i].y = target.y * i / COUNT; nodes[i].vx = nodes[i].vy = 0; }
        draw();
      } else {
        nodes[COUNT].x = target.x; nodes[COUNT].y = target.y; draw(); start();
      }
    }
    function release() {
      if (!held) return;
      if(performance.now()-lastHeldTime>100)nodes[COUNT].vx=nodes[COUNT].vy=0;
      else{nodes[COUNT].vx=target.vx||0;nodes[COUNT].vy=target.vy||0;}
      held = false; hint.textContent = 'Boing…';
      if (reduced.matches) rest(); else start();
    }
    function point(event) {
      const matrix = stage.getScreenCTM();
      return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : {x: 200, y: TOP};
    }
    top.addEventListener('pointerdown', function (event) {
      if (pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); const p = point(event);
      pointer = {id: event.pointerId, x: p.x - (200 + nodes[COUNT].x), y: p.y - (TOP + nodes[COUNT].y)};
      top.setPointerCapture(event.pointerId); stretch(nodes[COUNT].x, nodes[COUNT].y);
    });
    top.addEventListener('pointermove', function (event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      const p = point(event); stretch(p.x - pointer.x - 200, p.y - pointer.y - TOP);
    });
    function end(event) { if (pointer && event.pointerId === pointer.id) { pointer = null; release(); } }
    top.addEventListener('pointerup', end); top.addEventListener('pointercancel', end); top.addEventListener('lostpointercapture', end);
    top.addEventListener('keydown', function (event) {
      if (event.key.startsWith('Arrow')) {
        event.preventDefault(); const dx = event.key === 'ArrowLeft' ? -12 : event.key === 'ArrowRight' ? 12 : 0;
        const dy = event.key === 'ArrowUp' ? -12 : event.key === 'ArrowDown' ? 12 : 0;
        stretch((held ? target.x : nodes[COUNT].x) + dx, (held ? target.y : nodes[COUNT].y) + dy);
      } else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release(); }
      else if (event.key === 'Escape') { event.preventDefault(); rest(); }
    });
    top.addEventListener('blur', function () { if (!pointer) release(); });
    reduced.addEventListener('change', rest);
    draw();
  }
  boot(document.getElementById('plugin_boing'));
})();
