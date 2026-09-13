const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('./physics.js');
const energy = w => w.balls.reduce((s, b) => s + b.r ** 2 * (b.vx ** 2 + b.vy ** 2), 0);
test('low power stops before the cluster', () => {
  const w = P.createWorld(); P.shoot(w, -Math.PI / 2, 0);
  for (let i = 0; i < 600; i++) P.step(w, 1 / 120);
  assert(P.settled(w)); assert(w.balls[0].y > 330); assert(w.balls.slice(1).every(b => !b.out));
});
test('many angles and powers never add kinetic energy and always settle', () => {
  for (let shot = 0; shot < 72; shot++) {
    const w = P.createWorld(), a = shot * Math.PI / 36;
    P.position(w, a); P.shoot(w, a + Math.PI + (shot % 3 - 1) * .12, (shot % 4 + 1) / 4);
    let previous = energy(w);
    for (let i = 0; i < 1800; i++) {
      P.step(w, 1 / 120); const next = energy(w); assert(next <= previous + .001); previous = next;
      assert(w.balls.every(b => [b.x, b.y, b.vx, b.vy].every(Number.isFinite)));
    }
    assert(P.settled(w));
  }
});
test('marble counts out only when completely outside ring and remains parked', () => {
  const w = P.createWorld(), b = w.balls[1]; b.x = P.CX + P.RING + 9; b.y = P.CY;
  P.step(w, .01); assert(!b.out); b.vx = 100; P.step(w, .05); assert(b.out);
  const x = b.x; P.step(w, .1); assert.equal(b.x, x); assert.equal(b.vx, 0);
});
test('moving balls reject a second shot and repositioning', () => {
  const w = P.createWorld(); assert(P.shoot(w, -Math.PI / 2, 1));
  assert(!P.shoot(w, 0, 1)); assert(!P.position(w, 0)); assert.equal(w.shots, 1);
});
test('shooter returns to a clear spot near the chosen rim position', () => {
  const w = P.createWorld();
  Object.assign(w.balls[1], {x: P.CX + 159, y: P.CY});
  P.position(w, 0);
  assert(w.balls.slice(1).every(b => Math.hypot(w.balls[0].x - b.x, w.balls[0].y - b.y) > w.balls[0].r + b.r));
});
