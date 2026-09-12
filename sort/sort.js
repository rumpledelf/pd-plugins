(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const svg = root.querySelector('.sort-stage');
    const layer = root.querySelector('.sort-dolls');
    const message = root.querySelector('.sort-message');
    const shuffleButton = root.querySelector('.sort-shuffle');
    if (!svg || !layer || !message || !shuffleButton) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const NS = 'http://www.w3.org/2000/svg';
    const colors = ['#0585BA', '#64317B', '#B7287E', '#4CAF50', '#0585BA'];
    const names = ['Smallest', 'Small', 'Middle-sized', 'Large', 'Largest'];
    let order = [2, 0, 4, 1, 3];
    let held = null, before = null, pointer = null;
    let dragX = 0, offsetX = 0, frame = 0, winTime = 0, solved = false;
    const dolls = [];
    const dollWidth = id => 116 * (.52 + id * .13);
    function slotX(index) {
      const gap = (540 - order.reduce((sum, id) => sum + dollWidth(id), 0)) / 4;
      let x = 20;
      for (let i = 0; i < index; i++) x += dollWidth(order[i]) + gap;
      return x + dollWidth(order[index]) / 2;
    }
    const inOrder = () => order.every((id, index) => id === index) || order.every((id, index) => id === 4 - index);
    function element(tag, attributes) {
      const node = document.createElementNS(NS, tag);
      Object.entries(attributes || {}).forEach(([key, value]) => node.setAttribute(key, value));
      return node;
    }
    for (let i = 0; i < 5; i++) {
      const shadow = element('ellipse', { cx: slotX(order.indexOf(i)), cy: 189, rx: dollWidth(i) * .34, ry: 4, fill: '#333333', opacity: '.10' });
      root.querySelector('.sort-slots').append(shadow);
      const group = element('g', { class: 'sort-doll', tabindex: 0, role: 'button', 'aria-describedby': 'sort-help', 'aria-pressed': 'false', 'data-size': i });
      const shell = i === 0 ? 'orange' : colors[i], accent = colors[(i + 2) % 5];
      const flower = i === 3 ? '#64317B' : i === 4 ? 'orange' : accent;
      group.innerHTML = `
        <g class="sort-art" transform="scale(${.52 + i * .13})">
          <path class="sort-focus" d="M-34 10 Q0 17 34 10"/>
          <path class="sort-shell" d="M-52 -76 C-58 -110 -48 -153 -16 -170 C-7 -175 7 -175 16 -170 C48 -153 58 -110 52 -76 C57 -51 48 -24 30 -8 C14 5 -14 5 -30 -8 C-48 -24 -57 -51 -52 -76Z" fill="${shell}"/>
          <path d="M-45 -126 C-39 -151 -23 -168 0 -172 C23 -168 39 -151 45 -126 C31 -137 19 -142 0 -142 C-19 -142 -31 -137 -45 -126Z" fill="#333333" opacity=".28"/>
          <ellipse cx="0" cy="-127" rx="25" ry="29" fill="url(#sort-face)"/>
          <path d="M-21 -139 Q0 -158 21 -139 Q11 -146 0 -143 Q-11 -146 -21 -139Z" fill="#333333"/>
          <path class="sort-line" d="M-13 -128 q4 -4 8 0 M5 -128 q4 -4 8 0"/>
          <circle cx="-9" cy="-127" r="1.6" fill="#333333"/><circle cx="9" cy="-127" r="1.6" fill="#333333"/>
          <ellipse cx="-17" cy="-118" rx="5.5" ry="3.2" fill="#B7287E" opacity=".25"/><ellipse cx="17" cy="-118" rx="5.5" ry="3.2" fill="#B7287E" opacity=".25"/>
          <path d="M-6 -114 Q0 -109 6 -114" fill="none" stroke="#B7287E" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M-42 -96 C-28 -89 28 -89 42 -96 L49 -78 C28 -72 -28 -72 -49 -78Z" fill="#333333" opacity=".3"/>
          <circle cx="0" cy="-87" r="5.5" fill="${accent}"/>
          <path d="M-41 -91 C-22 -85 22 -85 41 -91" fill="none" stroke="white" opacity=".35" stroke-width="3" stroke-linecap="round"/>
          <path d="M-31 -71 C-29 -46 -24 -23 0 -12 C24 -23 29 -46 31 -71 C18 -66 -18 -66 -31 -71Z" fill="url(#sort-apron)"/>
          <g transform="translate(0 -42) rotate(${i % 2 ? 18 : 0})">
            <g fill="${flower}"><ellipse cy="-12" rx="8" ry="15"/><ellipse cy="12" rx="8" ry="15"/><ellipse cx="-12" rx="15" ry="8"/><ellipse cx="12" rx="15" ry="8"/></g>
            <circle r="7" fill="white"/>
            <path d="M-5 19 C-22 18 -25 31 -27 40 C-13 38 -5 31 -2 21 M5 19 C22 18 25 31 27 40 C13 38 5 31 2 21" fill="#4CAF50"/>
          </g>
          <path class="sort-line" d="M-47 -75 Q0 -68 47 -75"/>
          <path d="M-41 -63 C-25 -58 25 -58 41 -63" fill="none" stroke="white" opacity=".24" stroke-width="3" stroke-linecap="round"/>
        </g>`;
      layer.append(group);
      dolls.push({ group, shadow, x: slotX(order.indexOf(i)), y: 186 });
      group.addEventListener('pointerdown', event => {
        if (held !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
        event.preventDefault();
        group.focus({ preventScroll: true });
        pick(i); pointer = event.pointerId;
        group.setPointerCapture(pointer);
        offsetX = point(event) - dolls[i].x; dragX = dolls[i].x;
      });
      group.addEventListener('pointermove', event => {
        if (held !== i || pointer !== event.pointerId) return;
        dragX = Math.max(40, Math.min(540, point(event) - offsetX));
        let nearest = 0;
        for (let slot = 1; slot < 5; slot++) {
          if (Math.abs(dragX - slotX(slot)) < Math.abs(dragX - slotX(nearest))) nearest = slot;
        }
        move(i, nearest); wake();
      });
      group.addEventListener('pointerup', event => { if (pointer === event.pointerId) drop(); });
      group.addEventListener('pointercancel', cancel);
      group.addEventListener('lostpointercapture', () => { if (pointer !== null) cancel(); });
      group.addEventListener('keydown', event => {
        if ([' ', 'Enter', 'ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key)) event.preventDefault();
        if (event.key === 'Escape') return cancel();
        if (event.key === ' ' || event.key === 'Enter') { if (held === i) drop(); else if (held === null) pick(i); }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          const index = Math.max(0, Math.min(4, order.indexOf(i) + (event.key === 'ArrowRight' ? 1 : -1)));
          if (held === i && pointer === null) move(i, index);
          else if (held === null) dolls[order[index]].group.focus();
        }
      });
    }
    function point(event) {
      const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
      return point.matrixTransform(svg.getScreenCTM().inverse()).x;
    }
    function labels() { order.forEach((id, index) => dolls[id].group.setAttribute('aria-label', `${names[id]} doll, position ${index + 1} of 5`)); }
    function pick(id) {
      held = id; before = order.slice(); winTime = 0;
      dolls[id].group.setAttribute('data-held', 'true'); dolls[id].group.setAttribute('aria-pressed', 'true');
      layer.append(dolls[id].group);
      message.textContent = `${names[id]} doll picked up.`; message.classList.remove('greentext'); wake();
    }
    function move(id, index) {
      const from = order.indexOf(id); if (from === index) return;
      order.splice(from, 1); order.splice(index, 0, id); labels(); wake();
      if (pointer === null) message.textContent = `${names[id]} doll: position ${index + 1} of 5.`;
    }
    function drop() {
      if (held === null) return;
      dolls[held].group.setAttribute('data-held', 'false'); dolls[held].group.setAttribute('aria-pressed', 'false');
      held = null; pointer = null;
      const nextSolved = inOrder();
      if (nextSolved && !solved) winTime = performance.now() + 150;
      solved = nextSolved;
      message.textContent = solved ? 'Sorted! Just right.' : 'Put the dolls in size order.';
      message.classList.toggle('greentext', solved); wake();
    }
    function cancel() { if (held !== null) { order = before.slice(); labels(); drop(); } }
    function wake() { if (!frame) frame = requestAnimationFrame(render); }
    function celebrationValue(t, stops) {
      if (t <= 0 || t >= 1) return 0;
      for (let i = 1; i < stops.length; i++) {
        if (t <= stops[i][0]) {
          let p = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
          p = p * p * (3 - 2 * p);
          return stops[i - 1][1] + (stops[i][1] - stops[i - 1][1]) * p;
        }
      }
      return 0;
    }
    function render(now) {
      frame = 0; if (!root.isConnected) return;
      let moving = false;
      dolls.forEach((doll, id) => {
        const index = order.indexOf(id);
        const tx = held === id && pointer !== null ? dragX : slotX(index);
        let ty = held === id ? 173 : 186;
        const beat = (now - winTime) / 600;
        let tilt = 0;
        if (winTime && !reduced.matches) {
          tilt = celebrationValue(beat, [[0, 0], [.2, -4], [.4, 4], [.6, -3], [.8, 3], [1, 0]]);
          ty += celebrationValue((now - winTime - index * 40) / 600, [[0, 0], [.35, -12], [.65, -4], [1, 0]]);
        }
        if (winTime && now < winTime + 1100 && !reduced.matches) moving = true;
        const dx = tx - doll.x, dy = ty - doll.y;
        if (Math.abs(dx) + Math.abs(dy) > .15) moving = true;
        doll.x = reduced.matches ? tx : doll.x + dx * .24; doll.y = reduced.matches ? ty : doll.y + dy * .25;
        if (held === id && !reduced.matches) tilt = Math.max(-6, Math.min(6, dx * -.14));
        doll.group.setAttribute('transform', `translate(${doll.x} ${doll.y}) rotate(${tilt})`);
        doll.shadow.setAttribute('cx', doll.x);
      });
      if (moving) wake();
    }
    shuffleButton.addEventListener('click', () => {
      cancel(); const previous = order.join();
      do {
        order = [0, 1, 2, 3, 4];
        for (let i = 4; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      } while (inOrder() || order.join() === previous);
      solved = false; winTime = 0; labels();
      message.textContent = 'Put the dolls in size order.'; message.classList.remove('greentext'); wake();
    });
    labels(); wake();
  }
  boot(document.getElementById('plugin_sort'));
})();
