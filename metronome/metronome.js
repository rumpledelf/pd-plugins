(function () {
  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const settings = parseSettings(root);
    const arm = root.querySelector('.metronome-arm');
    const weight = root.querySelector('.metronome-weight');
    const pivot = root.querySelector('svg circle');
    const toggleBtn = root.querySelector('#metronome-toggle');
    const bpmDisplay = root.querySelector('#metronome-bpm-display');
    const soundCheckbox = root.querySelector('#metronome-sound');
    const speedRadios = root.querySelectorAll('input[name="metronome-speed"]');
    const reduced = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

    if (!arm || !toggleBtn || !bpmDisplay) {
      return;
    }

    let bpm = 108;
    let isRunning = false;
    let soundEnabled = soundCheckbox ? soundCheckbox.checked : true;
    let animationFrameId = null;
    let startTime = 0;
    let lastBeatIndex = -1;
    let lastTickTime = 0;
    let currentAngle = 0;
    let stoppingFromAngle = 0;
    let stopStartTime = 0;
    let isStopping = false;
    let weightCurrentY = 55;
    let weightFromY = 55;
    let weightTargetY = 55;
    let weightAnimStart = 0;
    let audioCtx = null;

    if (settings.default_bpm) {
      const parsedBpm = parseInt(settings.default_bpm, 10);
      if (!isNaN(parsedBpm) && parsedBpm > 0) {
        bpm = parsedBpm;
      }
    }

    if (settings.sound_enabled !== undefined && soundCheckbox) {
      soundEnabled = Boolean(settings.sound_enabled);
      soundCheckbox.checked = soundEnabled;
    }

    function targetWeightY(currentBpm) {
      const minBpm = 50;
      const maxBpm = 168;
      const minY = 30;
      const maxY = 80;
      const clampedBpm = Math.max(minBpm, Math.min(maxBpm, currentBpm));
      const ratio = (clampedBpm - minBpm) / (maxBpm - minBpm);
      return minY + ratio * (maxY - minY);
    }

    function applyWeightTransform(yVal, pulse) {
      if (!weight) return;
      const w = 14 * (1 + pulse * 0.2);
      const h = 10 * (1 - pulse * 0.12);
      weight.setAttribute('x', (100 - w / 2).toFixed(2));
      weight.setAttribute('y', (yVal - (h - 10) / 2).toFixed(2));
      weight.setAttribute('width', w.toFixed(2));
      weight.setAttribute('height', h.toFixed(2));
      if (pivot) {
        pivot.setAttribute('r', (4 + pulse * 1.3).toFixed(2));
      }
    }

    function updateWeightPosition(currentBpm, immediate) {
      if (!weight) return;
      const nextY = targetWeightY(currentBpm);
      if (immediate || reduced.matches) {
        weightCurrentY = weightFromY = weightTargetY = nextY;
        weightAnimStart = 0;
        applyWeightTransform(nextY, 0);
      } else {
        weightFromY = weightCurrentY;
        weightTargetY = nextY;
        weightAnimStart = performance.now();
        ensureAnimating();
      }
    }

    function syncRadioSelection(currentBpm) {
      let matched = false;
      speedRadios.forEach(function (radio) {
        if (parseInt(radio.value, 10) === currentBpm) {
          radio.checked = true;
          matched = true;
        }
      });
      if (!matched && speedRadios.length > 0) {
        speedRadios[0].checked = true;
      }
    }

    function setBpm(newBpm, immediate) {
      const prevBpm = bpm;
      bpm = newBpm;
      bpmDisplay.textContent = bpm + ' BPM';
      updateWeightPosition(bpm, immediate);
      syncRadioSelection(bpm);
      if (isRunning && prevBpm !== newBpm) {
        const now = performance.now() / 1000;
        const oldBeatDuration = 60 / prevBpm;
        const newBeatDuration = 60 / bpm;
        const currentPhase = ((now - startTime) / oldBeatDuration) * Math.PI;
        startTime = now - (currentPhase / Math.PI) * newBeatDuration;
        lastBeatIndex = Math.floor((now - startTime) / newBeatDuration);
      }
    }

    function playClick() {
      lastTickTime = performance.now();
      if (!soundEnabled) return;
      try {
        if (!audioCtx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            audioCtx = new AudioContext();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
        if (audioCtx) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(900, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.025);
          gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.025);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.025);
        }
      } catch (e) {
        // Tolerates environments without audio support
      }
    }

    function easeOutBack(t) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    function ensureAnimating() {
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    function animate(nowMs) {
      animationFrameId = null;
      if (!root.isConnected) return;
      const now = (nowMs || performance.now()) / 1000;
      const ms = nowMs || performance.now();
      let keepAlive = false;

      if (weightAnimStart > 0) {
        const wt = Math.min(1, (ms - weightAnimStart) / 280);
        const eased = easeOutBack(wt);
        weightCurrentY = weightFromY + (weightTargetY - weightFromY) * eased;
        if (wt < 1) {
          keepAlive = true;
        } else {
          weightCurrentY = weightTargetY;
          weightAnimStart = 0;
        }
      }

      let pulse = 0;
      if (lastTickTime > 0 && !reduced.matches) {
        const pt = (ms - lastTickTime) / 140;
        if (pt < 1) {
          pulse = Math.sin(pt * Math.PI) * (1 - pt * 0.3);
          keepAlive = true;
        } else {
          lastTickTime = 0;
        }
      }
      applyWeightTransform(weightCurrentY, pulse);

      if (isRunning) {
        const elapsed = now - startTime;
        const beatDuration = 60 / bpm;
        const currentBeatIndex = Math.floor(elapsed / beatDuration);

        if (currentBeatIndex > lastBeatIndex) {
          playClick();
          lastBeatIndex = currentBeatIndex;
        }

        const phase = (elapsed / beatDuration) * Math.PI;
        const maxAngle = 26;
        currentAngle = maxAngle * Math.sin(phase);
        arm.setAttribute('transform', 'rotate(' + currentAngle.toFixed(2) + ' 100 105)');
        keepAlive = true;
      } else if (isStopping) {
        const st = reduced.matches ? 1 : Math.min(1, (ms - stopStartTime) / 420);
        if (st < 1) {
          currentAngle = stoppingFromAngle * Math.exp(-6 * st) * Math.cos(st * Math.PI * 2.5);
          arm.setAttribute('transform', 'rotate(' + currentAngle.toFixed(2) + ' 100 105)');
          keepAlive = true;
        } else {
          currentAngle = 0;
          isStopping = false;
          arm.setAttribute('transform', 'rotate(0 100 105)');
        }
      }

      if (keepAlive) {
        animationFrameId = requestAnimationFrame(animate);
      }
    }

    function startMetronome() {
      if (isRunning) return;
      isRunning = true;
      isStopping = false;
      toggleBtn.textContent = 'Stop';
      startTime = performance.now() / 1000;
      lastBeatIndex = 0;
      playClick();
      ensureAnimating();
    }

    function stopMetronome() {
      isRunning = false;
      toggleBtn.textContent = 'Start';
      if (Math.abs(currentAngle) > 0.2 && !reduced.matches) {
        isStopping = true;
        stoppingFromAngle = currentAngle;
        stopStartTime = performance.now();
        ensureAnimating();
      } else {
        isStopping = false;
        currentAngle = 0;
        arm.setAttribute('transform', 'rotate(0 100 105)');
      }
    }

    toggleBtn.addEventListener('click', function () {
      if (isRunning) {
        stopMetronome();
      } else {
        startMetronome();
      }
    });

    if (soundCheckbox) {
      soundCheckbox.addEventListener('change', function () {
        soundEnabled = soundCheckbox.checked;
      });
    }

    speedRadios.forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (radio.checked) {
          const selectedBpm = parseInt(radio.value, 10);
          if (!isNaN(selectedBpm)) {
            setBpm(selectedBpm);
          }
        }
      });
    });

    // Initialize with default or settings BPM
    setBpm(bpm, true);
  }

  boot(document.getElementById('plugin_metronome'));
})();
