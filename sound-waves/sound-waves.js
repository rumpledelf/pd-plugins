(function () {
  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') return;
    root.dataset.pluginBooted = 'true';
    const toggle = root.querySelector('.sound-waves-toggle');
    const pitch = root.querySelector('.sound-waves-pitch');
    const volume = root.querySelector('.sound-waves-volume');
    const curve = root.querySelector('.sound-waves-curve');
    const ripple = root.querySelector('.sound-waves-ripple');
    const picture = root.querySelector('.sound-waves-picture');
    const message = root.querySelector('.sound-waves-message');
    if (!toggle || !pitch || !volume || !curve) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const normalMessage = 'Louder: taller waves. Higher pitch: closer peaks.';
    const noteNames = ['A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯'];
    let audio = null, oscillator = null, gain = null, playing = false, token = 0, frame = 0;
    let frequency = 220, loudness = .25, phase = 0, previous = 0;
    function draw() {
      const amplitude = loudness * 49;
      const cycles = frequency / 110 * 1.5;
      let d = '';
      for (let x = 80; x <= 582; x += 2) {
        const y = 65 - Math.sin((x - 80) / 502 * Math.PI * 2 * cycles - phase) * amplitude;
        d += `${x === 80 ? 'M' : 'L'}${x} ${y.toFixed(2)} `;
      }
      curve.setAttribute('d', d);
      ripple.setAttribute('opacity', playing && loudness > 0 ? String(.35 + loudness * .65) : '.18');
    }
    function update() {
      const step = Number(pitch.value);
      frequency = 110 * Math.pow(2, step / 12); loudness = Number(volume.value) / 100;
      const note = noteNames[step % 12] + (2 + Math.floor((step + 9) / 12));
      root.querySelector('.sound-waves-pitch-value').textContent = `${Math.round(frequency)} Hz · ${note}`;
      root.querySelector('.sound-waves-volume-value').textContent = `${volume.value}%`;
      pitch.setAttribute('aria-valuetext', `${Math.round(frequency)} hertz, ${note}`);
      volume.setAttribute('aria-valuetext', `${volume.value} percent`);
      picture.setAttribute('aria-label', `Sound wave: ${Math.round(frequency)} hertz, ${volume.value} percent loudness. Higher pitch has closer peaks; louder has taller waves.`);
      if (audio && oscillator && gain) {
        oscillator.frequency.setTargetAtTime(frequency, audio.currentTime, .035);
        gain.gain.setTargetAtTime(loudness * .12, audio.currentTime, .035);
      }
      draw();
    }
    function animate(now) {
      frame = 0;
      if (!root.isConnected || document.hidden) { stop(); return; }
      if (!playing) return;
      if (!reduced.matches) phase += Math.min(50, now - previous) / 1000 * 2 * Math.PI * (frequency / 220);
      previous = now; draw(); frame = requestAnimationFrame(animate);
    }
    function stop() {
      token++; playing = false; cancelAnimationFrame(frame); frame = 0;
      toggle.textContent = 'Play tone'; toggle.setAttribute('aria-pressed', 'false');
      const oldAudio = audio, oldGain = gain, oldOscillator = oscillator;
      audio = oscillator = gain = null;
      if (oldAudio) {
        if (oldGain && oldAudio.state === 'running') {
          oldGain.gain.cancelScheduledValues(oldAudio.currentTime);
          oldGain.gain.setTargetAtTime(0, oldAudio.currentTime, .012);
          if (oldOscillator) oldOscillator.stop(oldAudio.currentTime + .07);
          setTimeout(() => oldAudio.close().catch(() => {}), 90);
        } else oldAudio.close().catch(() => {});
      }
      draw();
    }
    async function play() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) { message.textContent = 'Audio is unavailable here. You can still explore the wave.'; return; }
      const current = ++token;
      playing = true; toggle.textContent = 'Stop tone'; toggle.setAttribute('aria-pressed', 'true');
      try {
        audio = new Audio();
        const context = audio;
        await context.resume();
        if (current !== token || !root.isConnected || document.hidden) { if (current === token) stop(); return; }
        oscillator = context.createOscillator(); gain = context.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        gain.gain.value = 0;
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start();
        gain.gain.setTargetAtTime(loudness * .12, context.currentTime, .025);
        message.textContent = normalMessage;
        previous = performance.now(); frame = requestAnimationFrame(animate);
      } catch (error) {
        if (current !== token) return;
        stop(); message.textContent = 'The tone could not start. Try Play tone again.';
      }
    }
    toggle.addEventListener('click', () => playing ? stop() : play());
    pitch.addEventListener('input', update); volume.addEventListener('input', update);
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) stop(); });
    window.addEventListener('pagehide', stop);
    update();
  }
  boot(document.getElementById('plugin_sound-waves'));
})();
