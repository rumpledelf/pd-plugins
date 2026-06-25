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
    const rotor = root.querySelector('#spin-rotor');
    const clockwise = root.querySelector('#spin-clockwise');
    const counterclockwise = root.querySelector('#spin-counterclockwise');
    const stop = root.querySelector('#spin-stop');

    if (!rotor || !clockwise || !counterclockwise || !stop) {
      return;
    }

    function setDirection(direction) {
      rotor.classList.remove('spin-clockwise', 'spin-counterclockwise', 'spin-stopped');
      clockwise.classList.remove('grey');
      counterclockwise.classList.remove('grey');
      stop.classList.remove('grey');

      if (direction === 'counterclockwise') {
        rotor.classList.add('spin-counterclockwise');
        clockwise.classList.add('grey');
        return;
      }

      if (direction === 'stop') {
        rotor.classList.add('spin-clockwise', 'spin-stopped');
        clockwise.classList.add('grey');
        counterclockwise.classList.add('grey');
        return;
      }

      rotor.classList.add('spin-clockwise');
      stop.classList.add('grey');
      counterclockwise.classList.add('grey');
    }

    if (settings.default_direction === 'counterclockwise') {
      setDirection('counterclockwise');
    } else {
      setDirection('clockwise');
    }

    clockwise.addEventListener('click', function () {
      setDirection('clockwise');
    });

    counterclockwise.addEventListener('click', function () {
      setDirection('counterclockwise');
    });

    stop.addEventListener('click', function () {
      setDirection('stop');
    });
  }

  boot(document.getElementById('plugin_spin'));
})();
