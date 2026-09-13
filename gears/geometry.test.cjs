const assert = require('node:assert/strict');
const { profile, drivenAngle } = require('./geometry.js');
const rotate = (points, a, x = 0) => points.map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), px * Math.sin(a) + py * Math.cos(a)]);
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function intersects(a, b, c, d) {
  if (Math.max(a[0], b[0]) < Math.min(c[0], d[0]) || Math.max(c[0], d[0]) < Math.min(a[0], b[0]) || Math.max(a[1], b[1]) < Math.min(c[1], d[1]) || Math.max(c[1], d[1]) < Math.min(a[1], b[1])) return false;
  return cross(a, b, c) * cross(a, b, d) < -1e-10 && cross(c, d, a) * cross(c, d, b) < -1e-10;
}
for (const teeth of [18, 27, 36]) {
  const a = profile(18), b = profile(teeth), distance = a.pitch + b.pitch;
  for (let step = 0; step < 180; step++) {
    const angle = step * Math.PI * 2 / 180;
    const ap = rotate(a.points, angle), bp = rotate(b.points, drivenAngle(angle, 18, teeth), distance);
    const left = ap.map((p, j) => [p, ap[(j + 1) % ap.length]]).filter(([p, q]) => Math.max(p[0], q[0]) > distance - b.outer);
    const right = bp.map((p, j) => [p, bp[(j + 1) % bp.length]]).filter(([p, q]) => Math.min(p[0], q[0]) < a.outer);
    for (const [p, q] of left) for (const [r, s] of right) assert.ok(!intersects(p, q, r, s), `Tooth crossing: ${teeth} teeth, phase ${step}`);
  }
  const speed = (drivenAngle(.123, 18, teeth) - drivenAngle(0, 18, teeth)) / .123;
  assert.ok(Math.abs(speed + 18 / teeth) < 1e-10, 'Incorrect angular speed ratio');
  console.log(`18:${teeth}: 180 meshing phases and angular ratio pass`);
}
