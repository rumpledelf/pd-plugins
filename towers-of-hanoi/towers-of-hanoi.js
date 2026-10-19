(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const stage = root.querySelector('.hanoi-stage');
    const pegs = Array.from(root.querySelectorAll('.hanoi-peg'));
    const status = root.querySelector('.hanoi-status');
    const score = root.querySelector('.hanoi-moves');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const names = ['Left', 'Middle', 'Right'], colors = ['#B7287E', '#0585BA', '#4CAF50', '#64317B'];
    const ns = 'http://www.w3.org/2000/svg';
    let stacks = [[4, 3, 2, 1], [], []], moves = 0, selected = null, pointer = null, motion = 0, busy = false;
    function top(index) { return stacks[index][stacks[index].length - 1]; }
    function position(index, height) { return {x: 100 + index * 200, y: 143 - height * 27}; }
    function element(tag, attributes) {
      const node = document.createElementNS(ns, tag);
      for (const key in attributes) node.setAttribute(key, attributes[key]);
      return node;
    }
    function render() {
      pegs.forEach(function (peg, index) {
        const layer = peg.querySelector('.hanoi-discs'); layer.replaceChildren();
        stacks[index].forEach(function (size, level) {
          const p = position(index, level + 1);
          const disc = element('g', {'class': 'hanoi-disc', 'data-size': size, transform: 'translate(' + p.x + ' ' + (p.y - (selected === index && size === top(index) ? 9 : 0)) + ')'});
          const width = 36 + size * 25;
          disc.appendChild(element('rect', {x: -width / 2, y: 0, width: width, height: 25, rx: 7, fill: colors[size - 1]}));
          layer.appendChild(disc);
        });
        peg.setAttribute('aria-label', names[index] + ' peg. ' + (stacks[index].length ? stacks[index].length + ' discs; top is size ' + top(index) + '.' : 'Empty.') + (selected === index ? ' Selected.' : ''));
        peg.setAttribute('aria-pressed', String(selected === index));
      });
      score.textContent = 'Moves: ' + moves;
    }
    function celebrateWin() {
      if (reduced.matches) return;
      cancelAnimationFrame(motion);
      const start = performance.now();
      const nodes = Array.from(pegs[2].querySelectorAll('.hanoi-disc'));
      function wave(now) {
        if (!root.isConnected) return;
        const elapsed = now - start;
        let active = false;
        nodes.forEach(function (node, level) {
          const p = position(2, level + 1);
          const t = (elapsed - level * 55) / 520;
          if (t > 0 && t < 1) {
            active = true;
            const hop = Math.sin(t * Math.PI) * (8 + level * 2);
            const tilt = Math.sin(t * Math.PI * 3) * (1 - t) * 4 * (level % 2 ? -1 : 1);
            const squash = Math.sin(t * Math.PI * 2) * (1 - t) * .08;
            node.setAttribute('transform', 'translate(' + p.x + ' ' + (p.y - hop).toFixed(2) + ') rotate(' + tilt.toFixed(2) + ' 0 12.5) scale(' + (1 + squash).toFixed(3) + ' ' + (1 - squash).toFixed(3) + ')');
          } else if (t >= 1) {
            node.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')');
          } else {
            active = true;
          }
        });
        if (active) motion = requestAnimationFrame(wave);
      }
      motion = requestAnimationFrame(wave);
    }
    function settle(node, from, to, mode, done) {
      cancelAnimationFrame(motion);
      const start = performance.now(); busy = true;
      const duration = reduced.matches ? 0 : mode === 'reject' ? 420 : 340;
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      const arc = !reduced.matches && mode !== 'cancel' ? Math.min(28, Math.abs(to.x - from.x) * .12 + 8) : 0;
      function step(now) {
        if (!root.isConnected) { busy = false; return; }
        const t = duration ? Math.min(1, (now - start) / duration) : 1;
        if (mode === 'reject' && t < .35) {
          const st = t / .35;
          const shake = Math.sin(st * Math.PI * 3) * (1 - st * .3);
          node.setAttribute('transform', 'translate(' + (from.x + shake * 9).toFixed(2) + ' ' + from.y.toFixed(2) + ') rotate(' + (shake * 6).toFixed(2) + ' 0 12.5)');
          motion = requestAnimationFrame(step);
          return;
        }
        const mt = mode === 'reject' ? (t - .35) / .65 : t;
        const ease = 1 - Math.pow(1 - mt, 3);
        const bounce = !reduced.matches && mt > .68 ? Math.sin((mt - .68) / .32 * Math.PI) * Math.min(5, 2 + dist * .01) : 0;
        const squash = !reduced.matches && mt > .68 ? Math.sin((mt - .68) / .32 * Math.PI * 1.5) * (1 - mt) * .12 : 0;
        const tilt = !reduced.matches && mt < .75 && Math.abs(to.x - from.x) > 10 ? Math.sin(mt / .75 * Math.PI) * Math.sign(to.x - from.x) * 4 : 0;
        const x = from.x + (to.x - from.x) * ease;
        const y = from.y + (to.y - from.y) * ease - Math.sin(mt * Math.PI) * arc - bounce;
        let transform = 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ')';
        if (Math.abs(tilt) > .05) transform += ' rotate(' + tilt.toFixed(2) + ' 0 12.5)';
        if (Math.abs(squash) > .003) transform += ' translate(0 25) scale(' + (1 + squash).toFixed(3) + ' ' + (1 - squash).toFixed(3) + ') translate(0 -25)';
        node.setAttribute('transform', transform);
        if (t < 1) motion = requestAnimationFrame(step);
        else { node.setAttribute('transform', 'translate(' + to.x + ' ' + to.y + ')'); busy = false; if (done) done(); }
      }
      motion = requestAnimationFrame(step);
    }
    function attempt(from, destination, heldPosition) {
      const size = top(from), original = position(from, stacks[from].length);
      if (!size) return;
      selected = null;
      const legal = destination !== null && destination !== from && (!top(destination) || top(destination) > size);
      if (legal) {
        stacks[from].pop(); stacks[destination].push(size); moves++;
        render();
        const node = pegs[destination].querySelector('[data-size="' + size + '"]');
        const target = position(destination, stacks[destination].length);
        const won = stacks[2].length === 4;
        status.textContent = won ? 'All four across! ' + moves + ' moves' + (moves === 15 ? ' — the fewest possible.' : '. Can you do it in 15?') : 'Move the stack to the right. Small discs go on larger ones.';
        settle(node, heldPosition || {x: original.x, y: original.y - 9}, target, 'land', won ? celebrateWin : null);
      } else {
        render();
        const isSame = destination === from || destination === null;
        status.textContent = isSame ? 'Move the stack to the right. Small discs go on larger ones.' : 'That disc needs an empty peg or a larger disc underneath.';
        const node = pegs[from].querySelector('[data-size="' + size + '"]');
        settle(node, heldPosition || {x: original.x, y: original.y - 9}, original, isSame ? 'cancel' : 'reject');
      }
    }
    function choose(index) {
      if (busy) return;
      if (selected !== null) { attempt(selected, index); return; }
      if (!stacks[index].length) { status.textContent = 'Choose a peg with a disc first.'; return; }
      selected = index; render(); status.textContent = 'Choose another peg, or press Escape to put it back.';
    }
    function point(event) {
      const matrix = stage.getScreenCTM();
      return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : {x: 0, y: 0};
    }
    stage.addEventListener('pointerdown', function (event) {
      if (busy || pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const peg = event.target.closest('[data-peg]');
      if (!peg) return;
      const index = Number(peg.dataset.peg), disc = event.target.closest('[data-size]');
      if (disc && Number(disc.dataset.size) !== top(index)) { status.textContent = 'Only the top disc can move.'; return; }
      event.preventDefault();
      const p = point(event);
      pointer = {id: event.pointerId, index: index, start: p, from: selected === null ? index : selected, canDrag: selected === null && !!disc, dragged: false, current: null, tilt: 0};
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', function (event) {
      if (!pointer || pointer.id !== event.pointerId || !pointer.canDrag) return;
      const p = point(event), dx = p.x - pointer.start.x, dy = p.y - pointer.start.y;
      if (!pointer.dragged && Math.hypot(dx, dy) < 5) return;
      pointer.dragged = true; stage.dataset.dragging = 'true';
      const origin = position(pointer.from, stacks[pointer.from].length);
      const nextX = origin.x + dx, nextY = origin.y + dy;
      if (!reduced.matches && pointer.current) pointer.tilt = Math.max(-8, Math.min(8, pointer.tilt * .6 + (nextX - pointer.current.x) * .5));
      pointer.current = {x: nextX, y: nextY};
      const node = pegs[pointer.from].querySelector('[data-size="' + top(pointer.from) + '"]');
      node.setAttribute('transform', 'translate(' + pointer.current.x.toFixed(2) + ' ' + pointer.current.y.toFixed(2) + ')' + (Math.abs(pointer.tilt) > .1 ? ' rotate(' + pointer.tilt.toFixed(2) + ' 0 12.5)' : ''));
      // Lift the entire source layer above the other pegs while dragging.
      stage.appendChild(pegs[pointer.from]);
    });
    function finish(event, cancelled) {
      if (!pointer || pointer.id !== event.pointerId) return;
      const drag = pointer; pointer = null; delete stage.dataset.dragging;
      if (drag.dragged) {
        const p = point(event);
        const destination = !cancelled && p.x >= 0 && p.x <= 600 && p.y >= -30 && p.y <= 180 ? Math.max(0, Math.min(2, Math.floor(p.x / 200))) : null;
        attempt(drag.from, destination, drag.current);
      } else if (!cancelled) choose(drag.index);
    }
    stage.addEventListener('pointerup', function (event) { finish(event, false); });
    stage.addEventListener('pointercancel', function (event) { finish(event, true); });
    stage.addEventListener('lostpointercapture', function (event) { finish(event, true); });
    pegs.forEach(function (peg, index) {
      peg.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!event.repeat && !pointer) choose(index); }
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); pegs[(index + (event.key === 'ArrowRight' ? 1 : 2)) % 3].focus(); }
        else if (event.key === 'Escape' && !pointer) { selected = null; render(); status.textContent = 'Move the stack to the right. Small discs go on larger ones.'; }
      });
    });
    root.querySelector('.hanoi-reset').addEventListener('click', function () {
      cancelAnimationFrame(motion); busy = false; pointer = null; selected = null; moves = 0;
      delete stage.dataset.dragging; stacks = [[4, 3, 2, 1], [], []]; render();
      status.textContent = 'Move the stack to the right. Small discs go on larger ones.';
    });
    render();
  }
  boot(document.getElementById('plugin_towers-of-hanoi'));
})();
