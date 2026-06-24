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
    const label = root.querySelector('label');
    const input = root.querySelector('#sample-input');
    const button = root.querySelector('#sample-submit');
    const result = root.querySelector('#sample-result');

    if (label && settings.label) {
      label.textContent = settings.label;
    }

    if (button && settings.button_text) {
      button.textContent = settings.button_text;
    }

    if (!input || !button || !result) {
      return;
    }

    button.addEventListener('click', function () {
      const value = input.value.trim();

      if (value === '') {
        result.textContent = 'Enter something first.';
        result.className = 'magentatext';
        return;
      }

      result.textContent = 'You entered: ' + value;
      result.className = 'greentext';
    });
  }

  boot(document.getElementById('plugin_sample'));
})();
