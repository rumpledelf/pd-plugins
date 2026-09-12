(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const stage = root.querySelector('.jigsaw-stage'), defs = root.querySelector('.jigsaw-defs');
    const targets = root.querySelector('.jigsaw-targets'), layer = root.querySelector('.jigsaw-pieces');
    const choice = root.querySelector('.jigsaw-choice'), status = root.querySelector('.jigsaw-status');
    if (!stage || !defs || !targets || !layer) return;
    const ns = 'http://www.w3.org/2000/svg', reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const animals = [
      ['tiger', 'S.Brickman', 'https://www.flickr.com/photos/s-brickman/33450410056/'],
      ['lion', 'William Warby', 'https://www.flickr.com/photos/wwarby/2404546005/'],
      ['giraffe', 'David Davies', 'https://www.flickr.com/photos/davies/5896333233/'],
      ['koala', 'Guido Konrad', 'https://www.flickr.com/photos/icke48/50310119573/'],
      ['panda', 'Popofatticus', 'https://www.flickr.com/photos/barretthall/2478623520/'],
      ['meerkat', 'Ronnie Macdonald', 'https://www.flickr.com/photos/ronmacphotos/9687131881/'],
      ['horse', 'Andrew Grey', 'https://www.flickr.com/photos/97534175@N00/2728870718/'],
      ['cat', 'Susanne Nilsson', 'https://www.flickr.com/photos/infomastern/23895188918/'],
      ['dog', 'Donnie Ray Jones', 'https://www.flickr.com/photos/donnieray/8720881905/'],
      ['elephant', 'Alaa Abd El Fattah', 'http://www.flickr.com/photos/alaaosh/3456470039/'],
      ['zebra', 'Riaan Labuschagne', 'http://www.flickr.com/photos/muftirythm/5134546561/'],
      ['duck', 'Stripy T-Shirt', 'https://www.flickr.com/photos/dfw/27185740/'],
      ['owl', 'Brendan Lally', 'https://www.flickr.com/photos/pictiurfear/2815358116/'],
      ['penguin', 'Christian Zeiser', 'https://www.flickr.com/photos/moonshiner69/8741304536/'],
      ['rabbit', 'Shawn Nystrand', 'https://www.flickr.com/photos/the_webhamster/5024794832/'],
      ['fox', 'peupleloup', 'https://www.flickr.com/photos/peupleloup/905461590/'],
      ['frog', 'Vanessa Mock', 'https://www.flickr.com/photos/15447211@N06/1625728501/']
    ];
    const difficulty = root.querySelector('.jigsaw-difficulty');
    let animalIndex = Math.floor(Math.random() * animals.length), photo, cols = 3, rows = 2, w = 90, h = 135;
    const pieces = [];
    let board = {x: 15, y: 25}, small = false, drag = null, selected = null, slot = 0, generation = 0;
    function el(tag, attributes) { const n = document.createElementNS(ns, tag); for (const key in attributes) n.setAttribute(key, attributes[key]); return n; }
    function shape(index) {
      const col = index % cols, row = Math.floor(index / cols);
      const right = col < cols - 1 ? (col + row) % 2 ? -1 : 1 : 0;
      const left = col > 0 ? -((col - 1 + row) % 2 ? -1 : 1) : 0;
      const bottom = row < rows - 1 ? (col + row) % 2 ? -1 : 1 : 0;
      const top = row > 0 ? -((col + row - 1) % 2 ? -1 : 1) : 0;
      let path = 'M0 0';
      function edge(x, y, dx, dy, length, sign) {
        function p(t, outward) { return (x + dx * length * t + dy * outward * sign) + ' ' + (y + dy * length * t - dx * outward * sign); }
        if (!sign) { path += 'L' + p(1, 0); return; }
        path += 'L' + p(.37, 0) + 'C' + p(.43, 0) + ' ' + p(.42, 5) + ' ' + p(.39, 9);
        path += 'C' + p(.28, 23) + ' ' + p(.72, 23) + ' ' + p(.61, 9);
        path += 'C' + p(.58, 5) + ' ' + p(.57, 0) + ' ' + p(.63, 0) + 'L' + p(1, 0);
      }
      edge(0, 0, 1, 0, w, top); edge(w, 0, 0, 1, h, right);
      edge(w, h, -1, 0, w, bottom); edge(0, h, 0, -1, h, left);
      return path + 'Z';
    }
    function home(piece) { return {x: board.x + piece.index % cols * w, y: board.y + Math.floor(piece.index / cols) * h}; }
    function tray(piece) { return {x: (small ? 20 : 345) + piece.tray % 3 * 100, y: (small ? 340 : 25) + Math.floor(piece.tray / 3) * (h + 30)}; }
    function put(piece, p) { piece.x = p.x; piece.y = p.y; piece.node.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')'); }
    function build() {
    generation++; drag = null; clearSelection();
    defs.replaceChildren(); targets.replaceChildren(); layer.replaceChildren(); pieces.length = 0;
    const harder = difficulty.querySelector('input:checked').value === '12';
    cols = harder ? 4 : 3; rows = harder ? 3 : 2;
    w = 270 / cols; h = 270 / rows;
    const animal = animals[animalIndex];
    photo = 'https://photographicdictionary.com/images/' + animal[0][0] + '/' + animal[0] + '.jpg';
    const link = root.querySelector('.jigsaw-animal'), credit = root.querySelector('.jigsaw-credit a');
    link.textContent = animal[0]; link.setAttribute('href', '/' + animal[0][0] + '/' + animal[0]);
    root.querySelector('.jigsaw-article').textContent = /^[aeiou]/.test(animal[0]) ? 'an' : 'a';
    credit.textContent = animal[1]; credit.href = animal[2];
    stage.setAttribute('aria-label', cols * rows + '-piece ' + animal[0] + ' jigsaw. Drag pieces into the photograph, or use Tab, Enter and arrow keys.');
    for (let index = 0; index < cols * rows; index++) {
      const path = shape(index), id = 'jigsaw-clip-' + index;
      const clip = el('clipPath', {id: id}); clip.appendChild(el('path', {d: path})); defs.appendChild(clip);
      const node = el('g', {'class': 'jigsaw-piece', 'data-piece': index, tabindex: 0, role: 'button', 'aria-label': 'Puzzle piece ' + (index + 1) + '. Enter to pick up; arrows choose a space; Enter places it.'});
      node.appendChild(el('image', {href: photo, x: -(index % cols) * w, y: -Math.floor(index / cols) * h, width: 270, height: 270, 'clip-path': 'url(#' + id + ')', 'pointer-events': 'none'}));
      node.appendChild(el('path', {d: path, fill: 'transparent', 'pointer-events': 'all'}));
      node.appendChild(el('path', {d: path, 'class': 'jigsaw-edge'}));
      layer.appendChild(node);
      const target = el('path', {d: path, fill: 'whitesmoke', stroke: 'gainsboro', 'stroke-width': 1, 'data-slot': index});
      targets.appendChild(target);
      pieces.push({index: index, node: node, target: target, path: path, tray: index, locked: false, moving: false, x: 0, y: 0});
    }
    layout(); shuffle();
    const token = generation, image = new Image();
    image.onerror = function () { if (root.isConnected && token === generation) status.textContent = 'The photo could not load. Try another animal.'; };
    image.src = photo;
    }
    function clearSelection() { selected = null; choice.setAttribute('visibility', 'hidden'); }
    function showChoice() {
      const p = home(pieces[slot]); choice.setAttribute('d', pieces[slot].path);
      choice.setAttribute('transform', 'translate(' + p.x + ' ' + p.y + ')'); choice.setAttribute('visibility', 'visible');
    }
    function layout() {
      const nextSmall = root.getBoundingClientRect().width < 540;
      if (!pieces.length || (nextSmall === small && pieces[0].x)) return;
      small = nextSmall; board = {x: small ? 30 : 15, y: 25};
      root.dataset.jigsawCompact = String(small);
      const trayHeight = Math.ceil(pieces.length / 3) * (h + 30);
      stage.setAttribute('viewBox', small ? '0 0 330 ' + (340 + trayHeight) : '0 0 660 ' + Math.max(340, 25 + trayHeight));
      generation++; drag = null; clearSelection();
      pieces.forEach(function (piece) {
        piece.moving = false;
        const target = home(piece); piece.target.setAttribute('transform', 'translate(' + target.x + ' ' + target.y + ')');
        put(piece, piece.locked ? target : tray(piece));
      });
    }
    function shuffle() {
      generation++; drag = null; clearSelection(); stage.dataset.complete = 'false';
      const order = pieces.map(function (piece) { return piece.index; });
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      if (order.every(function (value, index) { return value === index; })) order.push(order.shift());
      pieces.forEach(function (piece, index) {
        piece.tray = order[index]; piece.locked = false; piece.moving = false;
        piece.node.dataset.locked = 'false'; piece.node.setAttribute('tabindex', 0); piece.node.setAttribute('aria-disabled', 'false');
        put(piece, tray(piece));
      });
      status.textContent = 'Drag the pieces into place.';
    }
    function animate(piece, destination, done) {
      const from = {x: piece.x, y: piece.y}, start = performance.now(), token = generation;
      piece.moving = true;
      function frame(now) {
        if (token !== generation || !root.isConnected) { piece.moving = false; return; }
        const t = reduced.matches ? 1 : Math.min(1, (now - start) / 240);
        const ease = 1 - Math.pow(1 - t, 3);
        put(piece, {x: from.x + (destination.x - from.x) * ease, y: from.y + (destination.y - from.y) * ease});
        if (t < 1) requestAnimationFrame(frame);
        else { piece.moving = false; if (done) done(); }
      }
      requestAnimationFrame(frame);
    }
    function place(piece, correct) {
      clearSelection();
      if (correct) {
        piece.locked = true; piece.node.dataset.locked = 'true'; piece.node.setAttribute('tabindex', -1); piece.node.setAttribute('aria-disabled', 'true');
        animate(piece, home(piece), function () {
          const count = pieces.filter(function (p) { return p.locked; }).length;
          if (count === pieces.length && pieces.every(function (p) { return !p.moving; })) { stage.dataset.complete = 'true'; status.textContent = 'The ' + animals[animalIndex][0] + ', all together!'; }
          else status.textContent = count + ' of ' + pieces.length + ' pieces in place.';
        });
      } else {
        status.textContent = 'Not quite — try another space.';
        animate(piece, tray(piece));
      }
    }
    function point(event) {
      const matrix = stage.getScreenCTM();
      return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : {x: 0, y: 0};
    }
    stage.addEventListener('pointerdown', function (event) {
      if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const target = event.target.closest('[data-slot]');
      if (selected !== null && target) { event.preventDefault(); const p = pieces[selected]; place(p, Number(target.dataset.slot) === selected); return; }
      const group = event.target.closest('[data-piece]'); if (!group) return;
      const piece = pieces[Number(group.dataset.piece)]; if (piece.locked || piece.moving) return;
      event.preventDefault(); clearSelection();
      const p = point(event); drag = {id: event.pointerId, piece: piece, x: p.x - piece.x, y: p.y - piece.y};
      layer.appendChild(piece.node); stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      const p = point(event);
      put(drag.piece, {x: p.x - drag.x, y: p.y - drag.y});
    });
    function end(event, cancelled) {
      if (!drag || drag.id !== event.pointerId) return;
      const piece = drag.piece; drag = null;
      const target = home(piece);
      place(piece, !cancelled && Math.hypot(piece.x - target.x, piece.y - target.y) < 34);
    }
    stage.addEventListener('pointerup', function (event) { end(event, false); });
    stage.addEventListener('pointercancel', function (event) { end(event, true); });
    stage.addEventListener('lostpointercapture', function (event) { end(event, true); });
    layer.addEventListener('keydown', function (event) {
        const group = event.target.closest('[data-piece]'); if (!group) return;
        const piece = pieces[Number(group.dataset.piece)];
        if (piece.locked || piece.moving || drag) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); if (event.repeat) return;
          if (selected === piece.index) place(piece, slot === piece.index);
          else { selected = piece.index; slot = 0; showChoice(); status.textContent = 'Arrows choose a space. Enter places the piece.'; }
        } else if (event.key.startsWith('Arrow') && selected === piece.index) {
          event.preventDefault();
          if (event.key === 'ArrowLeft') slot = Math.max(0, slot - 1);
          if (event.key === 'ArrowRight') slot = Math.min(pieces.length - 1, slot + 1);
          if (event.key === 'ArrowUp') slot = Math.max(0, slot - cols);
          if (event.key === 'ArrowDown') slot = Math.min(pieces.length - 1, slot + cols);
          showChoice();
        } else if (event.key === 'Escape') { clearSelection(); status.textContent = 'Drag the pieces into place.'; }
      });
    layer.addEventListener('focusout', function () { clearSelection(); });
    root.querySelector('.jigsaw-shuffle').addEventListener('click', function () {
      animalIndex = (animalIndex + 1 + Math.floor(Math.random() * (animals.length - 1))) % animals.length;
      build();
    });
    difficulty.addEventListener('change', build);
    const observer = new ResizeObserver(function () { if (!root.isConnected) { observer.disconnect(); return; } layout(); });
    observer.observe(root); build();
  }
  boot(document.getElementById('plugin_jigsaw'));
})();
