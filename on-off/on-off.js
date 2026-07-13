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
    const checkbox = root.querySelector('#on-off-switch');
    const container = root.querySelector('.on-off-container');
    const label = root.querySelector('.switch-label');

    if (!checkbox || !container || !label) {
      return;
    }

    function updateState() {
      if (checkbox.checked) {
        container.classList.remove('light-on');
        container.classList.add('light-off');
        label.textContent = 'OFF';
      } else {
        container.classList.remove('light-off');
        container.classList.add('light-on');
        label.textContent = 'ON';
      }
    }

    checkbox.addEventListener('change', updateState);

    // Initial state setup
    updateState();
  }

  boot(document.getElementById('plugin_on-off'));
})();
