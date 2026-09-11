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
    const toggleBtn = root.querySelector('#metronome-toggle');
    const bpmDisplay = root.querySelector('#metronome-bpm-display');
    const soundCheckbox = root.querySelector('#metronome-sound');
    const speedRadios = root.querySelectorAll('input[name="metronome-speed"]');

    if (!arm || !toggleBtn || !bpmDisplay) {
      return;
    }

    let bpm = 108;
    let isRunning = false;
    let soundEnabled = soundCheckbox ? soundCheckbox.checked : true;
    let animationFrameId = null;
    let startTime = 0;
    let lastBeatIndex = -1;
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

    function updateWeightPosition(currentBpm) {
      if (!weight) return;
      // Map BPM range [50, 168] to weight Y position [30, 80]
      const minBpm = 50;
      const maxBpm = 168;
      const minY = 30;
      const maxY = 80;
      const clampedBpm = Math.max(minBpm, Math.min(maxBpm, currentBpm));
      const ratio = (clampedBpm - minBpm) / (maxBpm - minBpm);
      const targetY = minY + ratio * (maxY - minY);
      weight.setAttribute('y', targetY.toFixed(1));
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

    function setBpm(newBpm) {
      bpm = newBpm;
      bpmDisplay.textContent = bpm + ' BPM';
      updateWeightPosition(bpm);
      syncRadioSelection(bpm);
      if (isRunning) {
        startTime = performance.now() / 1000;
        lastBeatIndex = -1;
      }
    }

    function playClick() {
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

    function animate() {
      if (!isRunning) return;

      const now = performance.now() / 1000;
      const elapsed = now - startTime;
      const beatDuration = 60 / bpm;
      const currentBeatIndex = Math.floor(elapsed / beatDuration);

      if (currentBeatIndex > lastBeatIndex) {
        playClick();
        lastBeatIndex = currentBeatIndex;
      }

      const phase = (elapsed / beatDuration) * Math.PI;
      const maxAngle = 26;
      const angle = maxAngle * Math.sin(phase);

      arm.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 100 105)');
      animationFrameId = requestAnimationFrame(animate);
    }

    function startMetronome() {
      if (isRunning) return;
      isRunning = true;
      toggleBtn.textContent = 'Stop';
      startTime = performance.now() / 1000;
      lastBeatIndex = -1;
      playClick();
      animate();
    }

    function stopMetronome() {
      isRunning = false;
      toggleBtn.textContent = 'Start';
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      arm.setAttribute('transform', 'rotate(0 100 105)');
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
    setBpm(bpm);
  }

  boot(document.getElementById('plugin_metronome'));
})();
