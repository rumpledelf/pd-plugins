(function () {
  const NOTE_FREQUENCIES = {
    C4: 261.63,
    'C#4': 277.18,
    D4: 293.66,
    'D#4': 311.13,
    E4: 329.63,
    F4: 349.23,
    'F#4': 369.99,
    G4: 392.0,
    'G#4': 415.3,
    A4: 440.0,
    'A#4': 466.16,
    B4: 493.88,
    C5: 523.25
  };

  let audioContext = null;

  function parseSettings(root) {
    try {
      return JSON.parse(root.dataset.pluginSettings || '{}');
    } catch (error) {
      return {};
    }
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    return audioContext;
  }

  function setText(root, selector, value) {
    const node = root.querySelector(selector);
    if (node && value) {
      node.textContent = value;
    }
  }

  function playNote(note, key) {
    const frequency = NOTE_FREQUENCIES[note];
    const context = getAudioContext();

    if (!frequency || !context) {
      return;
    }

    if (context.state === 'suspended') {
      context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.72);

    key.classList.add('is-playing');
    window.setTimeout(() => {
      key.classList.remove('is-playing');
    }, 140);
  }

  function boot(root) {
    if (!root || root.dataset.pluginBooted === 'true') {
      return;
    }

    root.dataset.pluginBooted = 'true';

    const settings = parseSettings(root);
    setText(root, '.piano-title', settings.title);
    setText(root, '.piano-hint', settings.hint);

    root.querySelectorAll('.piano-key').forEach((key) => {
      key.addEventListener('click', () => {
        playNote(key.dataset.note, key);
      });
    });
  }

  boot(document.getElementById('plugin_piano'));
})();
