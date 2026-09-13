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
    function settle(node, from, to, done) {
      cancelAnimationFrame(motion);
      const start = performance.now(); busy = true;
      function step(now) {
        if (!root.isConnected) { busy = false; return; }
        const t = reduced.matches ? 1 : Math.min(1, (now - start) / 300);
        const ease = 1 - Math.pow(1 - t, 3);
        // A small damped landing settles the disc without bouncing the stack.
        const bounce = t > .65 ? Math.sin((t - .65) / .35 * Math.PI) * 2 : 0;
        node.setAttribute('transform', 'translate(' + (from.x + (to.x - from.x) * ease) + ' ' + (from.y + (to.y - from.y) * ease - bounce) + ')');
        if (t < 1) motion = requestAnimationFrame(step);
        else { busy = false; if (done) done(); }
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
        status.textContent = stacks[2].length === 4 ? 'All four across! ' + moves + ' moves' + (moves === 15 ? ' — the fewest possible.' : '. Can you do it in 15?') : 'Move the stack to the right. Small discs go on larger ones.';
        settle(node, heldPosition || {x: original.x, y: original.y - 9}, target);
      } else {
        render();
        status.textContent = destination === from ? 'Move the stack to the right. Small discs go on larger ones.' : 'That disc needs an empty peg or a larger disc underneath.';
        const node = pegs[from].querySelector('[data-size="' + size + '"]');
        settle(node, heldPosition || {x: original.x, y: original.y - 9}, original);
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
      pointer = {id: event.pointerId, index: index, start: p, from: selected === null ? index : selected, canDrag: selected === null && !!disc, dragged: false, current: null};
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', function (event) {
      if (!pointer || pointer.id !== event.pointerId || !pointer.canDrag) return;
      const p = point(event), dx = p.x - pointer.start.x, dy = p.y - pointer.start.y;
      if (!pointer.dragged && Math.hypot(dx, dy) < 5) return;
      pointer.dragged = true; stage.dataset.dragging = 'true';
      const origin = position(pointer.from, stacks[pointer.from].length);
      pointer.current = {x: origin.x + dx, y: origin.y + dy};
      const node = pegs[pointer.from].querySelector('[data-size="' + top(pointer.from) + '"]');
      node.setAttribute('transform', 'translate(' + pointer.current.x + ' ' + pointer.current.y + ')');
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
