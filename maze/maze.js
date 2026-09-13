(function () {
  const SIZE = 9, CELL = 32, OFFSET = 41;
  const DIRECTIONS = [
    {x: 0, y: -1, wall: 1, opposite: 4},
    {x: 1, y: 0, wall: 2, opposite: 8},
    {x: 0, y: 1, wall: 4, opposite: 1},
    {x: -1, y: 0, wall: 8, opposite: 2}
  ];
  function reachable(cells) {
    const seen = new Set([0]), queue = [0];
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], x = index % SIZE, y = Math.floor(index / SIZE);
      DIRECTIONS.forEach(function (dir) {
        const nx = x + dir.x, ny = y + dir.y, next = ny * SIZE + nx;
        if (!(cells[index] & dir.wall) && nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !seen.has(next)) { seen.add(next); queue.push(next); }
      });
    }
    return seen;
  }
  function route(cells) {
    const parent = new Map([[0, null]]), queue = [0];
    for (let head = 0; head < queue.length; head++) {
      const index = queue[head], x = index % SIZE, y = Math.floor(index / SIZE);
      for (const dir of DIRECTIONS) {
        const nx = x + dir.x, ny = y + dir.y, next = ny * SIZE + nx;
        if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE || cells[index] & dir.wall || parent.has(next)) continue;
        parent.set(next, index); queue.push(next);
      }
    }
    const path = [];
    for (let at = SIZE * SIZE - 1; at !== null && at !== undefined; at = parent.get(at)) path.push(at);
    return path.reverse();
  }
  function quality(cells) {
    const path = route(cells);
    const degree = index => DIRECTIONS.filter(dir => !(cells[index] & dir.wall)).length;
    let turns = 0, straight = 0, longestStraight = 0, previousDirection = null;
    for (let i = 1; i < path.length; i++) {
      const direction = path[i] - path[i - 1];
      if (direction !== previousDirection) {
        if (previousDirection !== null) turns++;
        straight = 1;
      } else straight++;
      longestStraight = Math.max(longestStraight, straight);
      previousDirection = direction;
    }
    return {length: path.length, choices: path.slice(1,-1).filter(index => degree(index) >= 3).length,
      turns, longestStraight, deadEnds: cells.filter((_, index) => degree(index) === 1).length};
  }
  // Adapted from ROT.js DividedMaze by Ondrej Zara (BSD-3-Clause).
  // Source: https://github.com/ondras/rot.js/blob/master/src/map/dividedmaze.ts
  // Full notice: ROT-LICENSE.txt. Adaptations: local RNG, plain JS and wall bits.
  function divided(random) {
    const dimension = SIZE * 2 + 1;
    const map = Array.from({length: dimension}, (_, x) =>
      Array.from({length: dimension}, (_, y) =>
        x === 0 || y === 0 || x === dimension - 1 || y === dimension - 1 ? 1 : 0));
    const rooms = [[1, 1, dimension - 2, dimension - 2]];
    const pick = values => values[Math.floor(random() * values.length)];
    for (let head = 0; head < rooms.length; head++) {
      const room = rooms[head], availX = [], availY = [];
      for (let i = room[0] + 1; i < room[2]; i++) {
        if (map[i][room[1] - 1] && map[i][room[3] + 1] && !(i % 2)) availX.push(i);
      }
      for (let j = room[1] + 1; j < room[3]; j++) {
        if (map[room[0] - 1][j] && map[room[2] + 1][j] && !(j % 2)) availY.push(j);
      }
      if (!availX.length || !availY.length) continue;
      const x = pick(availX), y = pick(availY), walls = [[], [], [], []];
      map[x][y] = 1;
      for (let i = room[0]; i < x; i++) {
        map[i][y] = 1; if (i % 2) walls[0].push([i, y]);
      }
      for (let i = x + 1; i <= room[2]; i++) {
        map[i][y] = 1; if (i % 2) walls[1].push([i, y]);
      }
      for (let j = room[1]; j < y; j++) {
        map[x][j] = 1; if (j % 2) walls[2].push([x, j]);
      }
      for (let j = y + 1; j <= room[3]; j++) {
        map[x][j] = 1; if (j % 2) walls[3].push([x, j]);
      }
      const solid = pick(walls);
      for (const wall of walls) {
        if (wall === solid) continue;
        const hole = pick(wall); map[hole[0]][hole[1]] = 0;
      }
      rooms.push([room[0], room[1], x - 1, y - 1],
        [x + 1, room[1], room[2], y - 1],
        [room[0], y + 1, x - 1, room[3]],
        [x + 1, y + 1, room[2], room[3]]);
    }
    return Array.from({length: SIZE * SIZE}, (_, index) => {
      const x = (index % SIZE) * 2 + 1, y = Math.floor(index / SIZE) * 2 + 1;
      return DIRECTIONS.reduce((bits, dir) => map[x + dir.x][y + dir.y] ? bits | dir.wall : bits, 0);
    });
  }
  function generate(random) {
    // Our presentation filter: require wrong turns on the actual solution.
    let best = null, bestScore = -1;
    for (let attempt = 0; attempt < 300; attempt++) {
      const cells = divided(random);
      const q = quality(cells), score = q.turns * 10 + q.choices * 5 + q.length - q.longestStraight * 20;
      if (score > bestScore) { best = cells; bestScore = score; }
      if (q.choices >= 6 && q.length >= 29 && q.turns >= 14 && q.longestStraight <= 4 && q.deadEnds >= 10) { best = cells; break; }
    }
    if (reachable(best).size !== SIZE * SIZE) throw new Error('Maze generation disconnected a cell.');
    best[0] &= ~8; best[SIZE * SIZE - 1] &= ~2;
    return best;
  }
  function position(index) {
    if (index === -1) return {x: -1, y: 0};
    if (index === SIZE * SIZE) return {x: SIZE, y: SIZE - 1};
    return {x: index % SIZE, y: Math.floor(index / SIZE)};
  }
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const stage = root.querySelector('.maze-stage'), walls = root.querySelector('.maze-walls');
    const player = root.querySelector('.maze-player'), mouse = root.querySelector('.maze-mouse');
    const status = root.querySelector('.maze-status'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!stage || !walls || !player) return;
    let cells = [], current = -1, facing = 0, pointer = null, completed = false, animation = 0;
    function drawPlayer() {
      const p = position(current);
      player.setAttribute('transform', 'translate(' + (OFFSET + (p.x + .5) * CELL) + ' ' + (OFFSET + (p.y + .5) * CELL) + ')');
      mouse.setAttribute('transform', 'rotate(' + facing + ')');
      const location = current === -1 ? 'outside the entrance on the left' : current === SIZE * SIZE ? 'at the cheese outside the exit on the right' : 'at row ' + (p.y + 1) + ', column ' + (p.x + 1);
      stage.setAttribute('aria-label', 'Mouse ' + location + '. Reach the exit at the bottom right. Drag or swipe. Click the maze, then use arrow keys.');
      player.dataset.cell = current;
    }
    function celebrate() {
      completed = true; status.textContent = 'Found it! Time for a little cheese.';
      if (reduced.matches) return;
      const start = performance.now();
      function frame(now) {
        if (!root.isConnected) return;
        const t = Math.min(1, (now - start) / 650);
        mouse.setAttribute('transform', 'rotate(' + (facing + Math.sin(t * Math.PI * 6) * 12 * (1 - t)) + ')');
        if (t < 1) animation = requestAnimationFrame(frame);
      }
      animation = requestAnimationFrame(frame);
    }
    function move(direction) {
      if (completed) return false;
      const dir = DIRECTIONS[direction];
      if (!dir) return false;
      if (current === -1) {
        if (direction !== 1) return false;
        current = 0;
      } else {
        if (cells[current] & dir.wall) return false;
        if (current === 0 && direction === 3) current = -1;
        else if (current === SIZE * SIZE - 1 && direction === 1) current = SIZE * SIZE;
        else {
          const p = position(current), nx = p.x + dir.x, ny = p.y + dir.y;
          if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) return false;
          current = ny * SIZE + nx;
        }
      }
      facing = [-90, 0, 90, 180][direction]; drawPlayer();
      if (current === SIZE * SIZE) celebrate();
      return true;
    }
    function newMaze() {
      cancelAnimationFrame(animation); pointer = null; completed = false; current = -1; facing = 0;
      cells = generate(Math.random); walls.replaceChildren();
      cells.forEach(function (cell, index) {
        const x = OFFSET + index % SIZE * CELL, y = OFFSET + Math.floor(index / SIZE) * CELL;
        let path = '';
        if (cell & 1) path += 'M' + x + ' ' + y + 'h' + CELL;
        if (cell & 8) path += 'M' + x + ' ' + y + 'v' + CELL;
        if (index % SIZE === SIZE - 1 && cell & 2) path += 'M' + (x + CELL) + ' ' + y + 'v' + CELL;
        if (Math.floor(index / SIZE) === SIZE - 1 && cell & 4) path += 'M' + x + ' ' + (y + CELL) + 'h' + CELL;
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', path); node.dataset.cell = index; node.dataset.walls = cell; walls.appendChild(node);
      });
      drawPlayer(); status.textContent = 'Drag or swipe. Click the maze, then use arrow keys.';
    }
    function point(event) {
      const matrix = stage.getScreenCTM();
      return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : {x: 0, y: 0};
    }
    stage.addEventListener('pointerdown', function (event) {
      if (pointer || completed || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      stage.focus({preventScroll: true});
      const p = point(event);
      pointer = {id: event.pointerId, start: p, previous: p, drag: !!event.target.closest('.maze-player')};
      stage.setPointerCapture(event.pointerId);
    });
    stage.addEventListener('pointermove', function (event) {
      if (!pointer || pointer.id !== event.pointerId || !pointer.drag || completed) return;
      const p = point(event), from = pointer.previous;
      // Sample every eighth-cell along the complete pointer segment. Each
      // candidate movement must cross exactly one open edge of the current
      // cell, so even a fast drag cannot skip a wall or jump diagonally.
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / (CELL / 8)));
      for (let i = 1; i <= steps; i++) {
        const x = Math.floor((from.x + (p.x - from.x) * i / steps - OFFSET) / CELL);
        const y = Math.floor((from.y + (p.y - from.y) * i / steps - OFFSET) / CELL);
        const outsideDoor = (x === -1 && y === 0) || (x === SIZE && y === SIZE - 1);
        if (!outsideDoor && (x < 0 || x >= SIZE || y < 0 || y >= SIZE)) continue;
        const cell = position(current), dx = x - cell.x, dy = y - cell.y;
        if (Math.abs(dx) + Math.abs(dy) !== 1) continue;
        move(dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0);
      }
      pointer.previous = p;
    });
    function end(event, cancelled) {
      if (!pointer || pointer.id !== event.pointerId) return;
      const gesture = pointer; pointer = null;
      if (cancelled || gesture.drag) return;
      const p = point(event), dx = p.x - gesture.start.x, dy = p.y - gesture.start.y;
      if (Math.hypot(dx, dy) < 12) return;
      move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : 3 : dy > 0 ? 2 : 0);
    }
    stage.addEventListener('pointerup', function (event) { end(event, false); });
    stage.addEventListener('pointercancel', function (event) { end(event, true); });
    stage.addEventListener('lostpointercapture', function (event) { end(event, true); });
    root.addEventListener('keydown', function (event) {
      const dir = {ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3}[event.key];
      if (dir !== undefined) { event.preventDefault(); move(dir); }
    });
    root.querySelectorAll('[data-direction]').forEach(function (button) { button.addEventListener('click', function () { move(Number(button.dataset.direction)); }); });
    root.querySelector('.maze-new').addEventListener('click', function () {
      newMaze(); stage.focus({preventScroll: true});
    });
    newMaze();
  }
  boot(document.getElementById('plugin_maze'));
})();
