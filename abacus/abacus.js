(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    const stage = root.querySelector('.abacus-stage');
    if (!stage) return;
    root.dataset.pluginBooted = 'true';
    const ns = 'http://www.w3.org/2000/svg';
    const names = ['Thousands', 'Hundreds', 'Tens', 'Ones'];
    const places = [1000, 100, 10, 1];
    const colours = ['#64317B', '#0585BA', '#B7287E', '#4CAF50'];
    const columns = places.map(() => ({ upper: false, lower: 0, beads: [] }));
    const hint = root.querySelector('.abacus-hint');
    let held = null;
    function element(tag, attrs, parent) {
      const node = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
      parent.append(node); return node;
    }
    function render(columnIndex, explain = true) {
      const c = columns[columnIndex];
      c.beads.forEach((bead, index) => {
        const upper = index === 0;
        const active = upper ? c.upper : index <= c.lower;
        const y = upper ? (active ? 70 : 46) : (active ? 96 : 113) + (index - 1) * 20;
        bead.setAttribute('transform', `translate(${60 + columnIndex * 93.3333} ${y})`);
        bead.setAttribute('aria-pressed', String(active));
        bead.dataset.active = String(active);
      });
      const total = columns.reduce((sum, col, i) => sum + (Number(col.upper) * 5 + col.lower) * places[i], 0);
      root.querySelector('.abacus-total').textContent = total.toLocaleString('en-AU');
      if (explain) hint.textContent = `${names[columnIndex]}: (${c.upper ? 5 : 0} + ${c.lower}) × ${places[columnIndex]} = ${(Number(c.upper) * 5 + c.lower) * places[columnIndex]}`;
    }
    function change(col, beadIndex, direction) {
      const c = columns[col];
      if (beadIndex === 0) c.upper = direction === 'toggle' ? !c.upper : direction === 'down';
      else {
        const index = beadIndex - 1;
        c.lower = direction === 'toggle' ? (index < c.lower ? index : index + 1) : direction === 'up' ? index + 1 : index;
      }
      render(col);
    }
    columns.forEach((c, col) => {
      const x = 60 + col * 93.3333;
      element('text', {x, y: 17, 'text-anchor': 'middle', 'font-size': 16, fill: '#333333'}, root.querySelector('.abacus-labels')).textContent = names[col];
      element('path', {d: `M${x} 30V184`}, root.querySelector('.abacus-rods'));
      for (let i = 0; i < 5; i++) {
        const bead = element('g', {class: 'abacus-bead', tabindex: 0, role: 'button', 'aria-label': `${names[col]}, ${i === 0 ? 'five bead' : 'one bead ' + i}. Tap to move; arrow keys move up or down.`}, root.querySelector('.abacus-beads'));
        element('rect', {x: -27, y: -10, width: 54, height: 20, fill: 'transparent'}, bead);
        element('rect', {class: 'abacus-bead-body', x: -16, y: -9, width: 32, height: 18, rx: 9, fill: colours[col], stroke: '#333333', 'stroke-width': 1.2}, bead);
        c.beads.push(bead);
        bead.addEventListener('pointerdown', event => {
          if (held || !event.isPrimary || event.button !== 0) return;
          event.preventDefault(); bead.focus({preventScroll: true});
          stage.setPointerCapture(event.pointerId);
          held = {id: event.pointerId, y: event.clientY, col, i, upper: c.upper, lower: c.lower, dragged: false};
        });
        bead.addEventListener('keydown', event => {
          if (!['ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(event.key)) return;
          event.preventDefault();
          change(col, i, event.key === 'ArrowUp' ? 'up' : event.key === 'ArrowDown' ? 'down' : 'toggle');
        });
      }
      render(col, false);
    });
    stage.addEventListener('pointermove', event => {
      if (!held || event.pointerId !== held.id) return;
      const delta = event.clientY - held.y;
      if (Math.abs(delta) < 5) return;
      held.dragged = true;
      change(held.col, held.i, delta < 0 ? 'up' : 'down');
    });
    stage.addEventListener('pointerup', event => {
      if (!held || event.pointerId !== held.id) return;
      const {col, i, y, dragged} = held; held = null;
      const delta = event.clientY - y;
      if (!dragged) change(col, i, Math.abs(delta) < 5 ? 'toggle' : delta < 0 ? 'up' : 'down');
    });
    function cancel() {
      if (!held) return;
      const {col, upper, lower} = held; held = null;
      Object.assign(columns[col], {upper, lower}); render(col);
    }
    stage.addEventListener('pointercancel', cancel);
    stage.addEventListener('lostpointercapture', cancel);
    root.querySelector('.abacus-reset').addEventListener('click', () => {
      held = null;
      columns.forEach((c, i) => { c.upper = false; c.lower = 0; render(i, false); });
      hint.textContent = 'Towards the bar: top bead = 5; each lower bead = 1.';
    });
  }
  boot(document.getElementById('plugin_abacus'));
})();
