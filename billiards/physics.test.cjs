const assert = require('node:assert/strict');
const test = require('node:test');
const P = require('./physics.js');
function world(count) {
  const w = P.createWorld();
  w.balls = w.balls.slice(0, count);
  for (const b of w.balls) Object.assign(b, {vx: 0, vy: 0, pocketed: false});
  return w;
}
const speed = b => Math.hypot(b.vx, b.vy);
const energy = w => w.balls.reduce((sum, b) => sum + b.vx * b.vx + b.vy * b.vy, 0);
const advance = (w, seconds) => { for (let i = 0; i < Math.ceil(seconds * 240); i++) P.step(w, 1 / 240); };
test('free roll never accelerates and eventually rests', () => {
  const w = world(1), b = w.balls[0]; Object.assign(b, {x: 250, y: 210, vx: 35});
  let previous = speed(b);
  for (let i = 0; i < 7200; i++) { P.step(w, 1 / 240); assert(speed(b) <= previous + 1e-8); previous = speed(b); }
  assert(P.settled(w)); assert.equal(speed(b), 0); assert(b.x > 250 && b.x < 700);
});
test('head-on hit transfers momentum without lateral movement', () => {
  const w = world(2), [a, b] = w.balls;
  Object.assign(a, {x: 250, y: 210, vx: 180}); Object.assign(b, {x: 295, y: 210});
  advance(w, .25);
  assert(b.vx > 80 && Math.abs(a.vx) < 40); assert(Math.abs(a.vy) < 1e-6 && Math.abs(b.vy) < 1e-6);
  assert(a.x < b.x); assert(energy(w) <= 180 ** 2 + 1e-6);
});
test('glancing hit deflects both balls without creating energy', () => {
  const w = world(2), [a, b] = w.balls;
  Object.assign(a, {x: 250, y: 210, vx: 180}); Object.assign(b, {x: 285, y: 219});
  advance(w, .3);
  assert(a.vy < 0 && b.vy > 0 && b.vx > 0); assert(energy(w) <= 180 ** 2 + 1e-6);
});
test('fast ball cannot tunnel through another ball between frames', () => {
  const w = world(2), [a, b] = w.balls;
  Object.assign(a, {x: 250, y: 210, vx: 1000}); Object.assign(b, {x: 290, y: 210});
  P.step(w, 1 / 15);
  assert(b.vx > 100 && a.x < b.x); assert(energy(w) <= 1000 ** 2 + 1e-6);
});
test('cushion reverses normal velocity without adding speed', () => {
  const w = world(1), a = w.balls[0]; Object.assign(a, {x: 725, y: 210, vx: 220, vy: 20});
  const before = speed(a); advance(w, .25);
  assert(a.vx < 0 && a.vy > 0 && speed(a) <= before && a.x <= 751);
});
test('all six pocket mouths capture approaching balls exactly once', () => {
  P.POCKETS.forEach((p, index) => {
    const w = world(1), b = w.balls[0];
    const dx = p.x - 400, dy = p.y - 220, length = Math.hypot(dx, dy);
    Object.assign(b, {x: p.x - dx / length * 60, y: p.y - dy / length * 60, vx: dx / length * 160, vy: dy / length * 160});
    advance(w, 1);
    assert(b.pocketed, `pocket ${index}`); assert.equal(b.pocket, index);
    assert.equal(w.events.filter(e => e.type === 'pocket').length, 1); assert.equal(speed(b), 0);
  });
});
test('scratch respots only after rest and never on an object ball', () => {
  const w = world(2), [cue, object] = w.balls;
  cue.pocketed = true; Object.assign(object, {x: 220, y: 220, vx: 10});
  assert.equal(P.respawnCue(w), false); object.vx = 0;
  assert.equal(P.respawnCue(w), true); assert(!cue.pocketed);
  assert(Math.hypot(cue.x - object.x, cue.y - object.y) > P.TABLE.radius * 2);
});
test('shots cannot be queued while balls move', () => {
  const w = P.createWorld(); assert.equal(P.shoot(w, 0, .5), true);
  assert.equal(P.shoot(w, 1, .5), false); assert.equal(w.shots, 1);
});
test('many shot directions stay finite, lose energy and settle', () => {
  for (let sample = 0; sample < 108; sample++) {
    const w = P.createWorld(); P.shoot(w, Math.floor(sample / 3) * Math.PI / 18, (sample % 3 + 1) / 3);
    let previous = energy(w);
    for (let i = 0; i < 2400; i++) {
      P.step(w, 1 / 120); const next = energy(w);
      assert(next <= previous + .1, `energy increased in shot ${sample}: ${previous} -> ${next}`); previous = next;
      for (const b of w.balls) assert([b.x, b.y, b.vx, b.vy].every(Number.isFinite));
    }
    assert(P.settled(w), `shot ${sample} never settled`);
  }
});
