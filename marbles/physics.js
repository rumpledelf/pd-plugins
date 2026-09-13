(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { const root = document.getElementById('plugin_marbles'); if (root) root.marblesPhysics = factory(); }
})(function () {
  const CX = 220, CY = 210, RING = 150, EDGE = 174;
  function createWorld() {
    const balls = [{id: 0, x: CX, y: CY + EDGE, r: 12}];
    balls.push({id: 1, x: CX, y: CY, r: 10});
    for (let i = 0; i < 6; i++) balls.push({id: i + 2, x: CX + 26 * Math.cos(i * Math.PI / 3), y: CY + 26 * Math.sin(i * Math.PI / 3), r: 10});
    balls.forEach(b => Object.assign(b, {vx: 0, vy: 0, rotation: 0, out: false, outTime: 0}));
    return {balls, time: 0, shots: 0};
  }
  function settled(w) { return w.balls.every(b => b.out || Math.hypot(b.vx, b.vy) < .01); }
  function position(w, angle) {
    if (!settled(w)) return false;
    const b = w.balls[0];
    let chosen = angle;
    for (let attempt = 0; attempt < 160; attempt++) {
      chosen = angle + (attempt % 2 ? 1 : -1) * Math.ceil(attempt / 2) * .025;
      const x = CX + EDGE * Math.cos(chosen), y = CY + EDGE * Math.sin(chosen);
      if (w.balls.slice(1).every(other => other.out || Math.hypot(x - other.x, y - other.y) > b.r + other.r + 1)) break;
    }
    b.x = CX + EDGE * Math.cos(chosen); b.y = CY + EDGE * Math.sin(chosen); b.vx = b.vy = 0;
    b.out = false; b.exitX = b.exitY = 0;
    return true;
  }
  function shoot(w, angle, power) {
    if (!settled(w) || !Number.isFinite(angle) || !Number.isFinite(power)) return false;
    const speed = 45 + Math.max(0, Math.min(1, power)) * 315;
    w.balls[0].vx = Math.cos(angle) * speed; w.balls[0].vy = Math.sin(angle) * speed; w.shots++;
    return true;
  }
  function step(w, dt) {
    if (!(dt > 0) || !Number.isFinite(dt)) return;
    dt = Math.min(dt, .1);
    const maxSpeed = Math.max(...w.balls.map(b => Math.hypot(b.vx, b.vy)));
    const steps = Math.max(1, Math.ceil(dt * 240), Math.ceil(dt * maxSpeed / 4));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      w.time += h;
      for (const b of w.balls) {
        if (b.out) continue;
        const speed = Math.hypot(b.vx, b.vy);
        b.x += b.vx * h; b.y += b.vy * h; b.rotation += speed * h / b.r;
        const next = Math.max(0, speed - 42 * h);
        if (speed) { b.vx *= next / speed; b.vy *= next / speed; }
      }
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < w.balls.length; i++) for (let j = i + 1; j < w.balls.length; j++) {
          const a = w.balls[i], b = w.balls[j]; if (a.out || b.out) continue;
          const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy), limit = a.r + b.r;
          if (distance >= limit) continue;
          const nx = distance ? dx / distance : 1, ny = distance ? dy / distance : 0;
          const ia = 1 / (a.r * a.r), ib = 1 / (b.r * b.r), total = ia + ib;
          const overlap = limit - distance + .001;
          a.x -= nx * overlap * ia / total; a.y -= ny * overlap * ia / total;
          b.x += nx * overlap * ib / total; b.y += ny * overlap * ib / total;
          const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (approach < 0) {
            const impulse = -(1 + .94) * approach / total;
            a.vx -= impulse * nx * ia; a.vy -= impulse * ny * ia;
            b.vx += impulse * nx * ib; b.vy += impulse * ny * ib;
          }
        }
      }
      for (const b of w.balls) {
        if (b.id && !b.out && Math.hypot(b.x - CX, b.y - CY) > RING + b.r) {
          b.out = true; b.outTime = w.time;
          const speed = Math.hypot(b.vx, b.vy) || 1;
          b.exitX = b.vx / speed * 14; b.exitY = b.vy / speed * 14;
          b.vx = b.vy = 0;
        }
        if (!b.id && !b.out && Math.hypot(b.x - CX, b.y - CY) > EDGE + 12) {
          b.out = true; b.outTime = w.time;
          const speed = Math.hypot(b.vx, b.vy) || 1;
          b.exitX = b.vx / speed * 10; b.exitY = b.vy / speed * 10;
          b.vx = b.vy = 0;
        }
      }
    }
  }
  return {CX, CY, RING, EDGE, createWorld, settled, position, shoot, step};
});
