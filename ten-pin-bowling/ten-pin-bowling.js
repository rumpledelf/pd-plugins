(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';

    const board = root.querySelector('.bowling-lane');
    const standingLayer = root.querySelector('[data-standing-pins]');
    const cleanupLayer = root.querySelector('[data-cleanup-effects]');
    const ball = root.querySelector('[data-ball]');
    const ballSpin = root.querySelector('[data-ball-spin]');
    const guide = root.querySelector('[data-guide]');
    const arc = root.querySelector('[data-arc]');
    const play = root.querySelector('.bowling-play');
    const meter = root.querySelector('.bowling-power');
    const powerLine = root.querySelector('[data-power]');
    const resetButton = root.querySelector('[data-reset]');
    const scorePanel = root.querySelector('.bowling-score');
    const scoreLabel = root.querySelector('[data-score]');
    const result = root.querySelector('[data-result]');
    if (!board || !standingLayer || !cleanupLayer || !ball || !ballSpin || !guide || !arc || !play || !meter || !powerLine || !resetButton || !scorePanel || !scoreLabel || !result) return;

    const pins = [
      { x: 240, y: 64 },
      { x: 225, y: 82 }, { x: 255, y: 82 },
      { x: 210, y: 100 }, { x: 240, y: 100 }, { x: 270, y: 100 },
      { x: 195, y: 118 }, { x: 225, y: 118 }, { x: 255, y: 118 }, { x: 285, y: 118 }
    ];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let standing = pins.map(function (_, index) { return index; });
    let score = 0;
    let remainingBalls = 2;
    let phase = 'ready';
    let frame = 0;
    let power = 0;
    let started = 0;
    let angle = 0;
    let position = 240;
    let dragX = 0;
    let dragAngle = 0;
    let dragPosition = 0;
    let throwPointer = null;
    let throwKey = null;

    function shape(tag, attributes, parent) {
      const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.keys(attributes).forEach(function (key) { element.setAttribute(key, attributes[key]); });
      parent.appendChild(element);
      return element;
    }

    function drawPin(pin, index) {
      const pinGroup = shape('g', { 'data-pin-index': index }, standingLayer);
      const x = pin.x;
      const y = pin.y;
      shape('ellipse', { cx: x, cy: y + 14, rx: 7, ry: 2.5, fill: '#B28D55', opacity: 0.5 }, pinGroup);
      shape('path', {
        d: 'M' + x + ' ' + (y - 17) +
          ' C' + (x - 3.5) + ' ' + (y - 17) + ' ' + (x - 4) + ' ' + (y - 14) + ' ' + (x - 3.5) + ' ' + (y - 11) +
          ' C' + (x - 3) + ' ' + (y - 8) + ' ' + (x - 2.5) + ' ' + (y - 6) + ' ' + (x - 4) + ' ' + (y - 3) +
          ' C' + (x - 5.5) + ' ' + y + ' ' + (x - 7) + ' ' + (y + 4) + ' ' + (x - 7) + ' ' + (y + 8) +
          ' C' + (x - 7) + ' ' + (y + 12) + ' ' + (x - 4.5) + ' ' + (y + 14) + ' ' + x + ' ' + (y + 14) +
          ' C' + (x + 4.5) + ' ' + (y + 14) + ' ' + (x + 7) + ' ' + (y + 12) + ' ' + (x + 7) + ' ' + (y + 8) +
          ' C' + (x + 7) + ' ' + (y + 4) + ' ' + (x + 5.5) + ' ' + y + ' ' + (x + 4) + ' ' + (y - 3) +
          ' C' + (x + 2.5) + ' ' + (y - 6) + ' ' + (x + 3) + ' ' + (y - 8) + ' ' + (x + 3.5) + ' ' + (y - 11) +
          ' C' + (x + 4) + ' ' + (y - 14) + ' ' + (x + 3.5) + ' ' + (y - 17) + ' ' + x + ' ' + (y - 17) + ' Z',
        fill: 'white',
        stroke: '#333333',
        'stroke-width': 1.5,
        'stroke-linejoin': 'round'
      }, pinGroup);
      shape('path', { d: 'M' + (x - 4) + ' ' + (y - 7) + ' Q' + x + ' ' + (y - 6) + ' ' + (x + 4) + ' ' + (y - 7), fill: 'none', stroke: '#B7287E', 'stroke-width': 2 }, pinGroup);
      shape('path', { d: 'M' + (x - 4) + ' ' + (y - 4) + ' Q' + x + ' ' + (y - 3) + ' ' + (x + 4) + ' ' + (y - 4), fill: 'none', stroke: '#B7287E', 'stroke-width': 2 }, pinGroup);
    }

    function drawPins() {
      standingLayer.replaceChildren();
      standing.forEach(function (index) { drawPin(pins[index], index); });
    }

    function projectedX(y) {
      return position + Math.tan(angle * Math.PI / 180) * (312 - y);
    }

    function moveBall(x, y, scale, rotation, opacity) {
      ball.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + scale + ')');
      ball.setAttribute('opacity', opacity === undefined ? 1 : opacity);
      ballSpin.setAttribute('transform', 'rotate(' + (rotation || 0) + ')');
    }

    function aimDescription() {
      const lanePosition = Math.abs(position - 240) < 4 ? 'centre' : (position < 240 ? 'left' : 'right') + ' side';
      const direction = angle === 0 ? 'straight ahead' : Math.abs(angle) + '° ' + (angle < 0 ? 'left' : 'right');
      return lanePosition + ', aimed ' + direction;
    }

    function updateAim() {
      const targetY = 48;
      guide.setAttribute('d', 'M' + position + ' 312 L' + projectedX(targetY) + ' ' + targetY);
      arc.setAttribute('d', 'M' + (position - 55) + ' 312 A55 55 0 0 1 ' + (position + 55) + ' 312');
      moveBall(position, 312, 1, 0, 1);
      play.setAttribute('aria-label', 'Bowl a ball from the ' + aimDescription() + '. Drag the ball to position it; drag the lane to aim; hold and release to bowl.');
    }

    function updatePower(value) {
      power = value;
      powerLine.style.width = power + '%';
      meter.setAttribute('aria-valuenow', Math.round(power));
      play.classList.toggle('is-full-power', power >= 99);
    }

    function updateScore() {
      scoreLabel.textContent = 'Score: ' + score + ' · Balls: ' + remainingBalls;
    }

    function charge(now) {
      if (!root.isConnected || phase !== 'charging') return;
      updatePower(Math.min(100, (now - started) / 16));
      frame = requestAnimationFrame(charge);
    }

    function hitPins(finalY) {
      if (finalY > 126) return [];
      const direct = standing.filter(function (index) {
        const pin = pins[index];
        const reachesPin = finalY <= pin.y + 14;
        return reachesPin && Math.abs(pin.x - projectedX(pin.y)) <= 12;
      });
      const knocked = direct.slice();
      const spread = power >= 88 ? 34 : power >= 70 ? 24 : 15;
      direct.forEach(function (index) {
        standing.forEach(function (otherIndex) {
          const pin = pins[index];
          const other = pins[otherIndex];
          if (other.y >= pin.y && Math.hypot(other.x - pin.x, other.y - pin.y) <= spread && knocked.indexOf(otherIndex) === -1) {
            knocked.push(otherIndex);
          }
        });
      });
      if (power >= 96 && direct.indexOf(0) !== -1 && standing.length === 10) return standing.slice();
      return knocked;
    }

    function animateImpact(knocked, progress, impactX) {
      const eased = 1 - Math.pow(1 - progress, 2);
      knocked.forEach(function (index) {
        const pin = pins[index];
        const pinElement = standingLayer.querySelector('[data-pin-index="' + index + '"]');
        if (!pinElement) return;
        let direction = Math.sign(pin.x - impactX);
        if (!direction) direction = index % 2 ? -1 : 1;
        const force = 0.65 + power / 250;
        const dx = direction * (7 + (index % 3) * 3) * force * eased;
        const dy = eased * (4 + (index % 2) * 2);
        const rotation = direction * (72 + (index % 3) * 16) * eased;
        pinElement.setAttribute('transform', 'translate(' + dx + ' ' + dy + ') rotate(' + rotation + ' ' + pin.x + ' ' + (pin.y + 13) + ')');
      });
    }

    function createPoof(index) {
      const pin = pins[index];
      const poof = shape('g', { 'data-poof-index': index }, cleanupLayer);
      for (let particle = 0; particle < 7; particle += 1) {
        shape('circle', {
          cx: pin.x,
          cy: pin.y,
          r: particle % 2 ? 3.5 : 5,
          fill: particle % 2 ? 'gainsboro' : 'white',
          stroke: '#999999',
          'stroke-width': 0.8,
          'data-particle': particle
        }, poof);
      }
      return poof;
    }

    function animatePoof(index, progress) {
      const pin = pins[index];
      const pinElement = standingLayer.querySelector('[data-pin-index="' + index + '"]');
      let poof = cleanupLayer.querySelector('[data-poof-index="' + index + '"]');
      if (!poof) poof = createPoof(index);
      if (pinElement) pinElement.setAttribute('opacity', Math.max(0, 1 - progress * 3));
      Array.from(poof.children).forEach(function (particle, particleIndex) {
        const direction = (Math.PI * 2 * particleIndex / 7) - Math.PI / 2;
        const distance = 5 + progress * (9 + particleIndex % 3 * 3);
        particle.setAttribute('cx', pin.x + Math.cos(direction) * distance);
        particle.setAttribute('cy', pin.y + Math.sin(direction) * distance * 0.65);
        particle.setAttribute('r', Math.max(0.6, (particleIndex % 2 ? 3.5 : 5) * (1 - progress * 0.75)));
        particle.setAttribute('opacity', Math.max(0, 1 - progress));
      });
    }

    function popScore() {
      scorePanel.classList.remove('is-scoring');
      void scorePanel.offsetWidth;
      scorePanel.classList.add('is-scoring');
    }

    function finishRoll(finalY, knocked) {
      standing = standing.filter(function (index) { return knocked.indexOf(index) === -1; });
      score += knocked.length;
      remainingBalls -= 1;
      drawPins();
      cleanupLayer.replaceChildren();
      if (knocked.length) popScore();

      const strike = standing.length === 0 && remainingBalls === 1;
      const finished = standing.length === 0 || remainingBalls === 0;
      if (strike) scoreLabel.textContent = 'Score: ' + score + ' · Strike';
      else if (standing.length === 0) scoreLabel.textContent = 'Score: ' + score + ' · Spare';
      else updateScore();
      phase = finished ? 'finished' : 'ready';
      play.setAttribute('aria-disabled', String(finished));
      arc.style.visibility = finished ? 'hidden' : 'visible';
      guide.style.visibility = finished ? 'hidden' : 'visible';
      ball.style.visibility = finished ? 'hidden' : 'visible';
      moveBall(position, 312, 1, 0, 1);
      updatePower(0);

      if (strike) result.textContent = 'Strike! All ten pins in one ball.';
      else if (standing.length === 0) result.textContent = 'Spare! You cleared the rack.';
      else if (!knocked.length && finalY > 126) result.textContent = 'The ball stopped short.' + (finished ? ' Final score: ' + score + '.' : ' One ball left.');
      else if (!knocked.length) result.textContent = 'Gutter ball.' + (finished ? ' Final score: ' + score + '.' : ' One ball left.');
      else result.textContent = knocked.length + ' pin' + (knocked.length === 1 ? '' : 's') + ' down.' + (finished ? ' Final score: ' + score + '.' : ' ' + standing.length + ' standing.');
    }

    function bowl() {
      cancelAnimationFrame(frame);
      phase = 'rolling';
      play.setAttribute('aria-disabled', 'true');
      result.textContent = 'Rolling…';
      arc.style.visibility = 'hidden';
      guide.style.visibility = 'hidden';

      const distance = power * 2.64;
      const finalY = 312 - distance;
      const finalX = projectedX(finalY);
      const knocked = hitPins(finalY);
      const impactY = knocked.length ? Math.max.apply(null, knocked.map(function (index) { return pins[index].y; })) + 14 : 0;
      const stopsShort = finalY > 126;
      const launch = performance.now();
      const rollDuration = reducedMotion ? 0 : 1800 + (100 - power) * 5;
      const impactDuration = reducedMotion ? 0 : 520;
      const impactHoldDuration = reducedMotion ? 0 : 1000;
      const poofStagger = reducedMotion ? 0 : 90;
      const poofDuration = reducedMotion ? 0 : 650;
      const cleanupDuration = knocked.length ? (knocked.length - 1) * poofStagger + poofDuration : 0;
      const settleDuration = reducedMotion ? 0 : 650;
      let impactStarted = 0;
      let impactSettled = false;
      let cleanupStarted = false;
      let settleStarted = 0;

      function roll(now) {
        if (!root.isConnected || phase !== 'rolling') return;
        const raw = rollDuration ? Math.min(1, (now - launch) / rollDuration) : 1;
        const travel = 1 - Math.pow(1 - raw, 2);
        const y = 312 + (finalY - 312) * travel;
        const x = position + (finalX - position) * travel;
        const depth = Math.max(0, Math.min(1, (312 - y) / 264));
        const scale = 1 - depth * 0.24;
        const rotation = depth * 1080;
        moveBall(x, y, scale, rotation, 1);

        if (!impactStarted && knocked.length && y <= impactY) {
          impactStarted = now;
        }

        let impactProgress = 0;
        let impactElapsed = 0;
        if (impactStarted) {
          impactElapsed = now - impactStarted;
          impactProgress = impactDuration ? Math.min(1, impactElapsed / impactDuration) : 1;
          animateImpact(knocked, impactProgress, projectedX(106));
          if (!impactSettled && impactProgress === 1) {
            impactSettled = true;
            result.textContent = knocked.length + ' pin' + (knocked.length === 1 ? '' : 's') + ' down…';
          }
          const cleanupElapsed = impactElapsed - impactDuration - impactHoldDuration;
          if (cleanupElapsed >= 0) {
            if (!cleanupStarted) {
              cleanupStarted = true;
              result.textContent = 'Clearing the deck…';
            }
            knocked.forEach(function (index, order) {
              const localElapsed = cleanupElapsed - order * poofStagger;
              if (localElapsed < 0) return;
              const poofProgress = poofDuration ? Math.min(1, localElapsed / poofDuration) : 1;
              animatePoof(index, poofProgress);
            });
          }
        }

        if (raw < 1 || (impactStarted && impactElapsed < impactDuration + impactHoldDuration + cleanupDuration)) {
          frame = requestAnimationFrame(roll);
          return;
        }

        if (stopsShort) {
          if (!settleStarted) {
            settleStarted = now;
            result.textContent = 'The ball rolls to a stop…';
          }
          const settle = settleDuration ? Math.min(1, (now - settleStarted) / settleDuration) : 1;
          const rock = Math.sin(settle * Math.PI * 3) * (1 - settle) * 8;
          const opacity = settle < 0.7 ? 1 : Math.max(0, 1 - (settle - 0.7) / 0.3);
          const finalScale = 1 - Math.max(0, Math.min(1, (312 - finalY) / 264)) * 0.24;
          moveBall(finalX, finalY, finalScale, rotation + rock, opacity);
          if (settle < 1) {
            frame = requestAnimationFrame(roll);
            return;
          }
        }

        finishRoll(finalY, knocked);
      }

      frame = requestAnimationFrame(roll);
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
      cleanupLayer.replaceChildren();
      if (phase !== 'charging') return;
      updatePower(Math.min(100, (performance.now() - started) / 16));
      bowl();
    }

    function cancelGesture() {
      throwPointer = null;
      throwKey = null;
      if (phase !== 'charging' && phase !== 'aiming' && phase !== 'positioning') return;
      cancelAnimationFrame(frame);
      phase = 'ready';
      updatePower(0);
      result.textContent = 'Gesture cancelled. Ready when you are.';
    }

    function pointerInViewBox(event) {
      const bounds = board.getBoundingClientRect();
      return {
        x: (event.clientX - bounds.left) * 480 / bounds.width,
        y: (event.clientY - bounds.top) * 340 / bounds.height
      };
    }

    play.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.isPrimary === false || phase !== 'ready') return;
      event.preventDefault();
      play.focus({ preventScroll: true });
      throwPointer = event.pointerId;
      dragX = event.clientX;
      dragAngle = angle;
      dragPosition = position;
      play.setPointerCapture(event.pointerId);
      const point = pointerInViewBox(event);
      if (Math.hypot(point.x - position, point.y - 312) <= 30) {
        phase = 'positioning';
        result.textContent = 'Slide left or right, then release to set the ball.';
      } else {
        beginCharge();
      }
    });
    play.addEventListener('pointermove', function (event) {
      if (event.pointerId !== throwPointer) return;
      if (phase === 'positioning') {
        const width = play.getBoundingClientRect().width;
        position = Math.round(Math.max(90, Math.min(390, dragPosition + (event.clientX - dragX) * 480 / width)));
        updateAim();
        return;
      }
      if (phase !== 'charging' && phase !== 'aiming') return;
      if (phase === 'charging') {
        if (Math.abs(event.clientX - dragX) < 8) return;
        cancelAnimationFrame(frame);
        phase = 'aiming';
        updatePower(0);
        result.textContent = 'Release to set aim. Then hold again to bowl.';
      }
      angle = Math.round(Math.max(-28, Math.min(28, dragAngle + (event.clientX - dragX) * 112 / play.getBoundingClientRect().width)));
      updateAim();
    });
    play.addEventListener('pointerup', function (event) {
      if (event.pointerId !== throwPointer) return;
      if (phase === 'positioning') {
        throwPointer = null;
        phase = 'ready';
        result.textContent = 'Ball positioned. Set your angle or hold to bowl.';
      } else if (phase === 'aiming') {
        throwPointer = null;
        phase = 'ready';
        result.textContent = 'Aim set. Hold anywhere off the ball to bowl.';
      } else {
        releaseThrow();
      }
    });
    play.addEventListener('pointercancel', function (event) {
      if (event.pointerId === throwPointer) cancelGesture();
    });
    play.addEventListener('lostpointercapture', function (event) {
      if (event.pointerId === throwPointer) cancelGesture();
    });
    play.addEventListener('blur', cancelGesture);
    play.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    play.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { cancelGesture(); return; }
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && phase === 'ready') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        if (event.shiftKey) angle = Math.max(-28, Math.min(28, angle + direction * 2));
        else position = Math.max(90, Math.min(390, position + direction * 6));
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
      standing = pins.map(function (_, index) { return index; });
      score = 0;
      remainingBalls = 2;
      power = 0;
      angle = 0;
      position = 240;
      throwPointer = null;
      throwKey = null;
      cleanupLayer.replaceChildren();
      play.classList.remove('is-full-power');
      scorePanel.classList.remove('is-scoring');
      powerLine.style.width = '0';
      meter.setAttribute('aria-valuenow', '0');
      drawPins();
      play.setAttribute('aria-disabled', 'false');
      arc.style.visibility = 'visible';
      guide.style.visibility = 'visible';
      ball.style.visibility = 'visible';
      result.textContent = 'Two balls. Can you clear all ten pins?';
      updateScore();
      updateAim();
    });

    drawPins();
    updateAim();
  }

  boot(document.getElementById('plugin_ten-pin-bowling'));
})();
