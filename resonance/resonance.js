(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const q = name => root.querySelector('.resonance-' + name);
    const slider = root.querySelector('input'), output = root.querySelector('output');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let playing = false, broken = false, strength = 0, stress = 0, phase = 0;
    const target = 535;
    let frame = 0, last = 0, shards = [], audio = null, tone = null, gain = null, generation = 0;
    function status(text) { if (q('status').textContent !== text) q('status').textContent = text; }
    function stopAudio() {
      generation++;
      if (audio) {
        const old = audio;
        if (gain) { gain.gain.cancelScheduledValues(old.currentTime); gain.gain.setTargetAtTime(0, old.currentTime, .015); }
        setTimeout(() => old.close().catch(() => {}), 120);
      }
      audio = tone = gain = null;
    }
    async function startAudio() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      const ticket = ++generation;
      try {
        const context = new Audio(); audio = context;
        await context.resume();
        if (ticket !== generation || !playing) return;
        tone = context.createOscillator(); gain = context.createGain();
        tone.type = 'sine'; tone.frequency.value = Number(slider.value);
        gain.gain.value = 0; tone.connect(gain); gain.connect(context.destination);
        tone.start(); gain.gain.setTargetAtTime(.035, context.currentTime, .03);
      } catch (_) { if (ticket === generation) stopAudio(); }
    }
    function tink() {
      if (!audio || audio.state !== 'running') { stopAudio(); return; }
      const context = audio;
      gain.gain.setTargetAtTime(0, context.currentTime, .01);
      [1450, 2130, 3190].forEach((hz, i) => {
        const osc = context.createOscillator(), envelope = context.createGain();
        osc.frequency.value = hz;
        envelope.gain.setValueAtTime(.018 / (i + 1), context.currentTime);
        envelope.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .45);
        osc.connect(envelope); envelope.connect(context.destination); osc.start(); osc.stop(context.currentTime + .5);
      });
      setTimeout(() => { if (audio === context) stopAudio(); }, 550);
    }
    function shatter() {
      broken = true; playing = false; strength = 0; tink();
      q('play').textContent = 'Play'; q('play').disabled = slider.disabled = true;
      q('play').classList.add('grey'); q('play').setAttribute('aria-pressed', 'false');
      q('bowl').setAttribute('visibility', 'hidden'); q('crack').setAttribute('visibility', 'hidden'); q('waves').setAttribute('opacity', 0);
      status('The glass broke! That pitch matched its resonant frequency.');
      shards = Array.from({length: 10}, (_, i) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        node.setAttribute('d', 'M-7-9L9-5L3 10Z'); q('shards').append(node);
        return {node, x: 303 + (i % 4) * 18, y: 36 + Math.floor(i / 4) * 22, vx: (i % 4 - 1.5) * 35, vy: -35 - (i % 3) * 18, angle: i * 37, spin: (i % 2 ? -1 : 1) * 160, rest: false};
      });
    }
    function tick(now) {
      frame = 0;
      if (!root.isConnected || document.hidden) { playing = false; stopAudio(); return; }
      const dt = last ? Math.min(.04, (now - last) / 1000) : 0; last = now;
      if (!broken) {
        const response = playing ? 1 / (1 + Math.pow((Number(slider.value) - target) / 14, 2)) : 0;
        strength += (response - strength) * (1 - Math.exp(-dt * 3));
        stress = Math.max(0, stress + dt * (strength > .88 ? 1 : -.8));
        phase += dt * 29;
        const wobble = reduced.matches ? 0 : Math.sin(phase) * strength * 5;
        q('bowl').setAttribute('transform', 'rotate(' + wobble + ' 330 105)');
        q('waves').setAttribute('opacity', playing ? '.65' : '0');
        q('crack').setAttribute('visibility', stress > 1.3 ? 'visible' : 'hidden');
        if (playing) status(strength > .88 ? 'Hold that pitch…' : strength > .4 ? 'Nearly there…' : 'Change the pitch to make the glass vibrate.');
        if (stress > 2.6) shatter();
      }
      for (const s of shards) {
        if (!s.rest) {
          s.vy += dt * 380; s.x += s.vx * dt; s.y += s.vy * dt; s.angle += s.spin * dt;
          if (s.y >= 140) { s.y = 140; s.vy *= -.25; s.vx *= .55; s.spin *= .5; if (Math.abs(s.vy) < 22) s.rest = true; }
          if (reduced.matches) { s.y = 140; s.rest = true; }
        }
        s.node.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ') rotate(' + s.angle + ')');
      }
      root.dataset.state = broken ? 'broken' : playing ? 'playing' : 'ready';
      if (playing || strength > .001 || shards.some(s => !s.rest)) frame = requestAnimationFrame(tick);
    }
    function wake() { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } }
    function update() { output.textContent = slider.value + ' Hz'; slider.setAttribute('aria-valuetext', slider.value + ' hertz'); if (tone) tone.frequency.setTargetAtTime(Number(slider.value), audio.currentTime, .025); }
    function pause() { playing = false; q('play').textContent = 'Play'; q('play').setAttribute('aria-pressed', 'false'); stopAudio(); wake(); }
    q('play').addEventListener('click', () => {
      if (playing) { pause(); return; }
      if (broken) return;
      playing = true; q('play').textContent = 'Stop'; q('play').setAttribute('aria-pressed', 'true'); startAudio(); wake();
    });
    slider.addEventListener('input', update);
    q('reset').addEventListener('click', () => {
      stopAudio(); cancelAnimationFrame(frame); frame = 0;
      playing = broken = false; strength = stress = phase = 0; shards = [];
      q('shards').replaceChildren(); q('bowl').removeAttribute('transform'); q('bowl').removeAttribute('visibility');
      q('crack').setAttribute('visibility', 'hidden'); q('waves').setAttribute('opacity', 0);
      q('play').disabled = slider.disabled = false; q('play').classList.remove('grey'); q('play').textContent = 'Play'; q('play').setAttribute('aria-pressed', 'false');
      slider.value = 350; update();
      root.dataset.state = 'ready'; status('Change the pitch to make the glass vibrate.');
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else if (strength > .001 || shards.some(s => !s.rest)) wake(); });
    window.addEventListener('pagehide', pause);
    root.dataset.state = 'ready'; update();
  }
  boot(document.getElementById('plugin_resonance'));
})();
