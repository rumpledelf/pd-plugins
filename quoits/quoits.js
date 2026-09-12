(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';

    const board = root.querySelector('.quoits-board');
    const pegsLayer = root.querySelector('[data-pegs]');
    const ringsLayer = root.querySelector('[data-rings]');
    const ring = root.querySelector('[data-ring]');
    const guide = root.querySelector('[data-guide]');
    const play = root.querySelector('.quoits-play');
    const arc = root.querySelector('[data-arc]');
    const meter = root.querySelector('.quoits-power');
    const powerLine = root.querySelector('[data-power]');
    const resetButton = root.querySelector('[data-reset]');
    const scorePanel = root.querySelector('.quoits-score');
    const scoreLabel = root.querySelector('[data-score]');
    const result = root.querySelector('[data-result]');
    if (!board || !pegsLayer || !ringsLayer || !ring || !guide || !play || !arc || !meter || !powerLine || !resetButton || !scorePanel || !scoreLabel || !result) return;

    const pegs = [
      { x: 240, y: 44, points: 30 },
      { x: 185, y: 90, points: 20 },
      { x: 295, y: 90, points: 20 },
      { x: 130, y: 150, points: 10 },
      { x: 350, y: 150, points: 10 }
    ];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let score = 0;
    let remaining = 6;
    let phase = 'ready';
    let frame = 0;
    let power = 0;
    let started = 0;
    let angle = 0;
    let dragX = 0;
    let dragAngle = 0;
    let throwPointer = null;
    let throwKey = null;

    function shape(tag, attributes, parent) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.keys(attributes).forEach(function (key) { element.setAttribute(key, attributes[key]); });
      parent.appendChild(element);
      return element;
    }

    pegs.forEach(function (peg) {
      shape('ellipse', { cx: peg.x, cy: peg.y, rx: 9, ry: 4, fill: 'gainsboro' }, pegsLayer);
      shape('path', { d: 'M' + peg.x + ' ' + peg.y + ' v-21', stroke: '#333333', 'stroke-width': 5, 'stroke-linecap': 'round' }, pegsLayer);
      shape('text', { x: peg.x, y: peg.y + 21, 'text-anchor': 'middle', 'font-size': 12, fill: '#333333' }, pegsLayer).textContent = peg.points;
    });

    function updateAim() {
      const radians = angle * Math.PI / 180;
      guide.setAttribute('d', 'M240 234 L' + (240 + Math.sin(radians) * 65) + ' ' + (234 - Math.cos(radians) * 65));
      const description = angle === 0 ? 'straight ahead' : Math.abs(angle) + '° ' + (angle < 0 ? 'left' : 'right');
      play.setAttribute('aria-label', 'Throw a quoit. Aim ' + description + '. Use arrow keys to aim; hold Space or Enter and release to throw.');
    }

    function updatePower(value) {
      power = value;
      powerLine.style.width = power + '%';
      meter.setAttribute('aria-valuenow', Math.round(power));
    }

    function updateScore() {
      scoreLabel.textContent = 'Score: ' + score + ' · Rings: ' + remaining;
    }

    function charge(now) {
      if (!root.isConnected || phase !== 'charging') return;
      updatePower(Math.min(100, (now - started) / 16));
      frame = requestAnimationFrame(charge);
    }

    function resetThrowingRing() {
      ring.setAttribute('cx', 240);
      ring.setAttribute('cy', 234);
      ring.setAttribute('rx', 19);
      ring.setAttribute('ry', 9);
      ring.removeAttribute('transform');
    }

    function land(x, y, peg) {
      shape('ellipse', { cx: peg ? peg.x : x, cy: peg ? peg.y : y, rx: 19, ry: 9, fill: 'none', stroke: peg ? '#0585BA' : '#999999', 'stroke-width': 4 }, ringsLayer);
      remaining -= 1;
      if (peg) {
        score += peg.points;
        scorePanel.classList.remove('is-scoring');
        void scorePanel.offsetWidth;
        scorePanel.classList.add('is-scoring');
      }
      updateScore();
      result.textContent = (peg ? '+' + peg.points + '! Ring on the peg.' : 'Missed. Try a different aim or power.') + (remaining ? '' : ' Final score: ' + score + '.');
      phase = remaining ? 'ready' : 'finished';
      play.setAttribute('aria-disabled', String(!remaining));
      arc.style.visibility = remaining ? 'visible' : 'hidden';
      resetThrowingRing();
      ring.style.visibility = remaining ? 'visible' : 'hidden';
      guide.style.visibility = remaining ? 'visible' : 'hidden';
    }

    function settle(x, y) {
      phase = 'landing';
      result.textContent = 'Landing…';
      const peg = pegs.find(function (target) {
        return Math.pow((x - target.x) / 17, 2) + Math.pow((y - target.y) / 11, 2) <= 1;
      });
      const targetX = peg ? peg.x : x;
      const targetY = peg ? peg.y : y;
      const startedLanding = performance.now();
      const duration = reducedMotion ? 0 : 420;
      function finishLanding(now) {
        if (!root.isConnected || phase !== 'landing') return;
        const t = duration ? Math.min(1, (now - startedLanding) / duration) : 1;
        const eased = 1 - Math.pow(1 - t, 3);
        const currentX = x + (targetX - x) * eased;
        const currentY = y + (targetY - y) * eased - Math.sin(Math.PI * t) * (peg ? 9 : 4);
        ring.setAttribute('cx', currentX);
        ring.setAttribute('cy', currentY);
        ring.setAttribute('rx', 19 + Math.sin(Math.PI * t) * 2);
        ring.setAttribute('ry', 9 - Math.sin(Math.PI * t) * 2);
        ring.setAttribute('transform', 'rotate(' + ((1 - eased) * 24) + ' ' + currentX + ' ' + currentY + ')');
        if (t < 1) frame = requestAnimationFrame(finishLanding);
        else land(x, y, peg);
      }
      frame = requestAnimationFrame(finishLanding);
    }

    function toss() {
      cancelAnimationFrame(frame);
      phase = 'flying';
      play.setAttribute('aria-disabled', 'true');
      result.textContent = 'Flying…';
      arc.style.visibility = 'hidden';
      guide.style.visibility = 'hidden';
      const distance = power * 2.1;
      const radians = angle * Math.PI / 180;
      const x = 240 + Math.sin(radians) * distance;
      const y = 234 - Math.cos(radians) * distance;
      const launch = performance.now();
      const duration = reducedMotion ? 0 : 900;
      function fly(now) {
        if (!root.isConnected || phase !== 'flying') return;
        const t = duration ? Math.min(1, (now - launch) / duration) : 1;
        const currentX = 240 + (x - 240) * t;
        const currentY = 234 + (y - 234) * t - Math.sin(Math.PI * t) * 65;
        ring.setAttribute('cx', currentX);
        ring.setAttribute('cy', currentY);
        ring.setAttribute('rx', 17 + Math.abs(Math.cos(t * Math.PI * 2.5)) * 2);
        ring.setAttribute('ry', 2 + Math.abs(Math.cos(t * Math.PI * 2.5)) * 7);
        ring.setAttribute('transform', 'rotate(' + (t * 300) + ' ' + currentX + ' ' + currentY + ')');
        if (t < 1) frame = requestAnimationFrame(fly);
        else settle(x, y);
      }
      frame = requestAnimationFrame(fly);
    }

    function beginCharge() {
      phase = 'charging';
      started = performance.now();
      updatePower(0);
      result.textContent = 'Hold for more power…';
      frame = requestAnimationFrame(charge);
    }

    function releaseThrow() {
      throwPointer = null;
      throwKey = null;
      if (phase !== 'charging') return;
      updatePower(Math.min(100, (performance.now() - started) / 16));
      toss();
    }

    function cancelCharge() {
      throwPointer = null;
      throwKey = null;
      if (phase !== 'charging' && phase !== 'aiming') return;
      cancelAnimationFrame(frame);
      phase = 'ready';
      updatePower(0);
      result.textContent = 'Throw cancelled. Ready when you are.';
    }

    play.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.isPrimary === false || phase !== 'ready') return;
      event.preventDefault();
      play.focus({ preventScroll: true });
      throwPointer = event.pointerId;
      dragX = event.clientX;
      dragAngle = angle;
      play.setPointerCapture(event.pointerId);
      beginCharge();
    });
    play.addEventListener('pointermove', function (event) {
      if (event.pointerId !== throwPointer || (phase !== 'charging' && phase !== 'aiming')) return;
      if (phase === 'charging') {
        // Ignore small finger movements during a hold. A drag becomes aim-only
        // until this pointer is released, even if it stops moving again.
        if (Math.abs(event.clientX - dragX) < 8) return;
        cancelAnimationFrame(frame);
        phase = 'aiming';
        updatePower(0);
        result.textContent = 'Release to set aim. Then hold again to throw.';
      }
      // A quarter of the board width swings through 60 degrees, also on phones.
      angle = Math.round(Math.max(-60, Math.min(60, dragAngle + (event.clientX - dragX) * 240 / play.getBoundingClientRect().width)));
      updateAim();
    });
    play.addEventListener('pointerup', function (event) {
      if (event.pointerId !== throwPointer) return;
      if (phase === 'aiming') {
        throwPointer = null;
        phase = 'ready';
        result.textContent = 'Aim set. Hold anywhere on the board to throw.';
      } else {
        releaseThrow();
      }
    });
    play.addEventListener('pointercancel', function (event) {
      if (event.pointerId === throwPointer) cancelCharge();
    });
    play.addEventListener('lostpointercapture', function (event) {
      if (event.pointerId === throwPointer) cancelCharge();
    });
    play.addEventListener('blur', cancelCharge);
    play.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    play.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { cancelCharge(); return; }
      const changes = { ArrowLeft: -2, ArrowDown: -2, ArrowRight: 2, ArrowUp: 2 };
      if (event.key in changes && (phase === 'ready' || phase === 'charging')) {
        event.preventDefault();
        angle = Math.max(-60, Math.min(60, angle + changes[event.key]));
        updateAim();
      }
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (event.repeat || phase !== 'ready') return;
      throwKey = event.key;
      beginCharge();
    });
    play.addEventListener('keyup', function (event) {
      if (event.key !== throwKey) return;
      event.preventDefault();
      releaseThrow();
    });
    resetButton.addEventListener('click', function () {
      cancelAnimationFrame(frame);
      phase = 'ready';
      score = 0;
      remaining = 6;
      updatePower(0);
      ringsLayer.replaceChildren();
      play.setAttribute('aria-disabled', 'false');
      angle = 0;
      throwPointer = null;
      throwKey = null;
      arc.style.visibility = 'visible';
      resetThrowingRing();
      ring.style.visibility = 'visible';
      guide.style.visibility = 'visible';
      result.textContent = 'Six rings. How many can you land?';
      scorePanel.classList.remove('is-scoring');
      updateScore();
      updateAim();
    });
    updateAim();
  }

  boot(document.getElementById('plugin_quoits'));
})();
